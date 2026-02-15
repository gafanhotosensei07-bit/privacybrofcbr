import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Crown, ArrowLeft, CheckCircle, Image, Video, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { models } from "@/data/models";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";

interface ContentItem {
  name: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

const MembersArea = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const model = models.find((m) => m.slug === slug);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      if (!user) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("checkout_attempts")
          .select("id")
          .eq("user_id", user.id)
          .eq("model_name", model?.name || "")
          .eq("payment_status", "approved")
          .limit(1);

        if (error) throw error;
        setHasAccess(data && data.length > 0);
      } catch (err) {
        console.error("Erro ao verificar acesso:", err);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, authLoading, model?.name]);

  // Load content from storage when access is granted
  useEffect(() => {
    if (!hasAccess || !slug) return;
    const loadContent = async () => {
      setLoadingContent(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/model-content?slug=${slug}`,
          {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          }
        );
        const json = await res.json();
        if (json.data) setContent(json.data);
      } catch (err) {
        console.error("Erro ao carregar conteúdo:", err);
      } finally {
        setLoadingContent(false);
      }
    };
    loadContent();
  }, [hasAccess, slug]);

  if (!model) {
    return (
      <div className="min-h-screen bg-[hsl(30,20%,96%)] flex items-center justify-center px-4">
        <Card className="max-w-sm w-full rounded-2xl border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-foreground font-bold">Modelo não encontrada</p>
            <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-[hsl(30,20%,96%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(24,95%,53%)]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <img src={logoIcon} alt="Privacy" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
          </div>
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-[hsl(24,95%,53%)]/10 flex items-center justify-center">
                <Lock className="h-10 w-10 text-[hsl(24,95%,53%)]" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {!user
                    ? "Faça login para acessar o conteúdo exclusivo."
                    : `Assine o plano de ${model.name} para desbloquear o conteúdo exclusivo.`}
                </p>
              </div>
              {!user ? (
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full h-12 font-bold rounded-xl"
                  style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
                >
                  Fazer Login
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/modelo/${model.slug}`)}
                  className="w-full h-12 font-bold rounded-xl"
                  style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
                >
                  Ver Planos de {model.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Merge storage content + static previews as fallback
  const images = content.filter((c) => c.type === "image");
  const videos = content.filter((c) => c.type === "video");
  const fallbackPreviews = content.length === 0 ? (model.previews || []) : [];

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)]">
      {/* Header */}
      <header className="flex items-center gap-3 py-4 px-4 bg-[hsl(24,95%,53%)]">
        <button onClick={() => navigate("/")} className="text-white/90 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-white flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Área de Membros
        </span>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-8">
        {/* Model header */}
        <div className="flex items-center gap-3 py-5">
          <img src={model.avatar} alt={model.name} className="h-14 w-14 rounded-full object-cover border-2 border-[hsl(24,95%,53%)]" />
          <div>
            <p className="font-bold text-foreground flex items-center gap-1">
              {model.name}
              {model.verified && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(24,95%,53%)]">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{model.username} • Membro ativo</p>
          </div>
          <span className="ml-auto text-xs font-bold text-[hsl(142,71%,45%)] bg-[hsl(142,71%,45%)]/10 px-3 py-1.5 rounded-full">
            ✅ Ativo
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-background rounded-xl border border-border/40 p-3 text-center">
            <Image className="h-4 w-4 mx-auto mb-1 text-[hsl(24,95%,53%)]" />
            <p className="text-lg font-bold text-foreground">{images.length || model.stats.photos}</p>
            <p className="text-[10px] text-muted-foreground">Fotos</p>
          </div>
          <div className="bg-background rounded-xl border border-border/40 p-3 text-center">
            <Video className="h-4 w-4 mx-auto mb-1 text-[hsl(24,95%,53%)]" />
            <p className="text-lg font-bold text-foreground">{videos.length || model.stats.videos}</p>
            <p className="text-[10px] text-muted-foreground">Vídeos</p>
          </div>
          <div className="bg-background rounded-xl border border-border/40 p-3 text-center">
            <Crown className="h-4 w-4 mx-auto mb-1 text-[hsl(24,95%,53%)]" />
            <p className="text-lg font-bold text-foreground">{content.length || model.stats.posts}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Loading */}
        {loadingContent && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(24,95%,53%)]" />
          </div>
        )}

        {/* Videos section */}
        {videos.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Vídeos Exclusivos 🎬
            </h2>
            <div className="space-y-3 mb-6">
              {videos.map((v, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background">
                  <video
                    src={v.url}
                    controls
                    preload="metadata"
                    className="w-full aspect-video object-cover"
                    poster=""
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Photos section */}
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Conteúdo Exclusivo 🔥
        </h2>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background">
                <img src={img.url} alt={`Conteúdo ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
              </div>
            ))}
          </div>
        ) : fallbackPreviews.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {fallbackPreviews.map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background">
                <img src={src} alt={`Conteúdo ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
              </div>
            ))}
          </div>
        ) : !loadingContent ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">Conteúdo em breve! 🔜</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default MembersArea;
