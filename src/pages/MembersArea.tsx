import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Crown, ArrowLeft, CheckCircle, Image, Video, Loader2, Play, Star, Sparkles, Eye, Zap, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { models } from "@/data/models";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";
import VerifiedBadge from "@/components/VerifiedBadge";

interface ContentItem {
  name: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

interface SubscriptionInfo {
  plan_name: string;
  expires_at: string | null;
  created_at: string;
}

const MembersArea = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "photos" | "videos">("all");

  const model = models.find((m) => m.slug === slug);
  const otherModels = models.filter((m) => m.slug !== slug);

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
          .select("id, plan_name, expires_at, created_at")
          .eq("user_id", user.id)
          .eq("model_name", model?.name || "")
          .eq("payment_status", "approved")
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const sub = data[0];
          // Check if expired
          if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
            setHasAccess(false);
            setSubscription({ plan_name: sub.plan_name, expires_at: sub.expires_at, created_at: sub.created_at });
          } else {
            setHasAccess(true);
            setSubscription({ plan_name: sub.plan_name, expires_at: sub.expires_at, created_at: sub.created_at });
          }
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error("Erro ao verificar acesso:", err);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, authLoading, model?.name]);

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

  const t = model.theme;
  const accentGradient = `linear-gradient(135deg, hsl(${t.accentColor}) 0%, hsl(${t.accentColorEnd}) 100%)`;

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-[hsl(30,20%,96%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: `hsl(${t.accentColor})` }} />
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
              <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ background: `hsl(${t.accentColor} / 0.1)` }}>
                {subscription?.expires_at && new Date(subscription.expires_at) < new Date()
                  ? <AlertTriangle className="h-10 w-10" style={{ color: `hsl(${t.accentColor})` }} />
                  : <Lock className="h-10 w-10" style={{ color: `hsl(${t.accentColor})` }} />}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {subscription?.expires_at && new Date(subscription.expires_at) < new Date()
                    ? "Assinatura Expirada"
                    : "Acesso Restrito"}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {!user
                    ? "Faça login para acessar o conteúdo exclusivo."
                    : subscription?.expires_at && new Date(subscription.expires_at) < new Date()
                    ? `Sua assinatura do plano "${subscription.plan_name}" expirou em ${new Date(subscription.expires_at).toLocaleDateString("pt-BR")}. Renove para continuar acessando!`
                    : `Assine o plano de ${model.name} para desbloquear o conteúdo exclusivo.`}
                </p>
              </div>
              {!user ? (
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full h-12 font-bold rounded-xl text-white"
                  style={{ background: accentGradient }}
                >
                  Fazer Login
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/modelo/${model.slug}`)}
                  className="w-full h-12 font-bold rounded-xl text-white"
                  style={{ background: accentGradient }}
                >
                  {subscription?.expires_at && new Date(subscription.expires_at) < new Date()
                    ? `Renovar Assinatura de ${model.name}`
                    : `Ver Planos de ${model.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const images = content.filter((c) => c.type === "image");
  const videos = content.filter((c) => c.type === "video");
  const fallbackPreviews = content.length === 0 ? (model.previews || []) : [];

  const filteredContent = activeTab === "photos" ? images
    : activeTab === "videos" ? videos
    : content;

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)]">
      {/* Header with gradient */}
      <header className="relative" style={{ background: accentGradient }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/")} className="text-white/90 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white">Área VIP</span>
          </div>
          <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">
            ✅ Ativo
          </span>
        </div>
        {/* Subscription info bar */}
        {subscription && (
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-white/80 text-[11px]" style={{ background: `hsl(${t.accentColorEnd})` }}>
            <Clock className="h-3 w-3" />
            <span>
              Plano: <strong>{subscription.plan_name}</strong>
              {subscription.expires_at && (
                <> · Expira em: <strong>{new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</strong></>
              )}
            </span>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-lg">
        {/* Model header card */}
        <div className="mx-4 -mt-0 bg-background rounded-b-2xl shadow-lg border border-border/30 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="h-16 w-16 rounded-full p-[2px] shrink-0" style={{ background: accentGradient }}>
              <img src={model.avatar} alt={model.name} className="h-full w-full rounded-full object-cover border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-base">
                {model.name}
                {model.verified && <VerifiedBadge className="h-4 w-4" />}
              </p>
              <p className="text-xs text-muted-foreground">{model.username}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-600 font-semibold">Online agora</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/chat/${slug}`)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0"
              style={{ background: accentGradient }}
            >
              💬 Chat
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 border-t border-border/30">
            <div className="flex flex-col items-center py-3">
              <div className="flex items-center gap-1">
                <Image className="h-3.5 w-3.5" style={{ color: `hsl(${t.accentColor})` }} />
                <span className="text-sm font-bold text-foreground">{images.length || model.stats.photos}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Fotos</span>
            </div>
            <div className="flex flex-col items-center py-3 border-x border-border/30">
              <div className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" style={{ color: `hsl(${t.accentColor})` }} />
                <span className="text-sm font-bold text-foreground">{videos.length || model.stats.videos}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Vídeos</span>
            </div>
            <div className="flex flex-col items-center py-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" style={{ color: `hsl(${t.accentColor})` }} />
                <span className="text-sm font-bold text-foreground">{content.length || model.stats.posts}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Posts</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-4 bg-background rounded-xl border border-border/30 p-1">
          {(["all", "photos", "videos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab ? "text-white shadow-sm" : "text-muted-foreground"
              }`}
              style={activeTab === tab ? { background: accentGradient } : {}}
            >
              {tab === "all" ? "Tudo" : tab === "photos" ? "📸 Fotos" : "🎬 Vídeos"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loadingContent && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: `hsl(${t.accentColor})` }} />
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4">
          {/* Videos */}
          {(activeTab === "all" || activeTab === "videos") && videos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" style={{ color: `hsl(${t.accentColor})` }} />
                Vídeos Exclusivos
              </h2>
              <div className="space-y-3">
                {videos.map((v, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background">
                    <video
                      src={v.url}
                      controls
                      preload="metadata"
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {(activeTab === "all" || activeTab === "photos") && (
            <>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" style={{ color: `hsl(${t.accentColor})` }} />
                Conteúdo Exclusivo
              </h2>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background group">
                      <img src={img.url} alt={`Conteúdo ${i + 1}`} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              ) : fallbackPreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {fallbackPreviews.map((src, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background group">
                      <img src={src} alt={`Conteúdo ${i + 1}`} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              ) : !loadingContent ? (
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${t.accentColor})` }} />
                    <p className="text-muted-foreground text-sm">Conteúdo novo em breve! 🔜</p>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>

        {/* Upsell Section */}
        {otherModels.length > 0 && (
          <div className="px-4 pb-8">
            <div className="border-t border-border/40 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5" style={{ color: `hsl(${t.accentColor})` }} />
                <h2 className="text-base font-bold text-foreground">Você também vai amar 🔥</h2>
              </div>

              <div className="space-y-3">
                {otherModels.map((m) => {
                  const mGradient = `linear-gradient(135deg, hsl(${m.theme.accentColor}) 0%, hsl(${m.theme.accentColorEnd}) 100%)`;
                  return (
                    <div
                      key={m.slug}
                      className="bg-background rounded-2xl border border-border/40 shadow-sm overflow-hidden"
                    >
                      {/* Mini banner */}
                      <div className="h-20 relative overflow-hidden">
                        <img src={m.banner} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full p-[2px]" style={{ background: mGradient }}>
                            <img src={m.avatar} alt={m.name} className="h-full w-full rounded-full object-cover border border-background" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold flex items-center gap-1">
                              {m.name}
                              {m.verified && <CheckCircle className="h-3 w-3 text-white" />}
                            </p>
                            <p className="text-white/70 text-[10px]">{m.username}</p>
                          </div>
                        </div>
                        <span
                          className="absolute top-2 right-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full"
                          style={{ background: mGradient }}
                        >
                          {m.theme.badge}
                        </span>
                      </div>

                      {/* Preview images */}
                      <div className="flex gap-1 px-3 pt-3">
                        {(m.previews || []).slice(0, 3).map((src, i) => (
                          <div key={i} className="flex-1 aspect-square rounded-lg overflow-hidden relative">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                              <Lock className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {m.stats.photos} fotos · {m.stats.videos} vídeos
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            A partir de R$ {m.promos[0]?.price || m.mainPlan.price}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/modelo/${m.slug}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                          style={{ background: mGradient }}
                        >
                          {m.theme.promoText}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersArea;
