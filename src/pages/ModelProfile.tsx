import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Image, Lock, FileText, Search, Plus, MessageCircle, Eye, Users, Zap, Clock } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import VerifiedBadge from "@/components/VerifiedBadge";
import preview1 from "@/assets/preview-1.jpeg";
import preview2 from "@/assets/preview-2.jpeg";
import preview3 from "@/assets/preview-3.jpeg";
import preview4 from "@/assets/preview-4.jpg";
import { models } from "@/data/models";

const ModelProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [showFullBio, setShowFullBio] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const model = models.find((m) => m.slug === slug);

  if (!model) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(30,20%,97%)]">
        <p className="text-foreground">Modelo não encontrada</p>
      </div>
    );
  }

  const previews = model.previews || [preview1, preview2, preview3, preview4];
  const t = model.theme;

  const accentGradient = `linear-gradient(135deg, hsl(${t.accentColor}) 0%, hsl(${t.accentColorEnd}) 100%)`;
  const accentLightGradient = `linear-gradient(135deg, hsl(${t.accentLight}) 0%, hsl(${t.accentLightEnd}) 100%)`;

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      {/* Top promo bar - themed */}
      <header
        className="flex items-center justify-between px-4 py-1"
        style={{ background: accentGradient }}
      >
        <img src={logoIcon} alt="Privacy" className="h-10 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide bg-white/20 px-3 py-1 rounded-full animate-pulse">
          {t.badge}
        </span>
      </header>

      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
          <img
            src={logoIcon}
            alt="Privacy"
            className="h-16 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex-1 flex items-center gap-2 rounded-full border border-border px-4 py-2">
            <input
              type="text"
              placeholder="Pesquise aqui..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Plus className="h-5 w-5 text-muted-foreground" />
          <MessageCircle
            className="h-5 w-5 text-muted-foreground cursor-pointer transition-colors"
            style={{ color: undefined }}
            onClick={() => navigate(`/chat/${slug}`)}
          />
        </div>

        {searchFocused && (
          <div className="absolute left-0 right-0 top-full z-50 bg-background border-b border-border shadow-lg max-h-72 overflow-y-auto">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sugestões
            </p>
            {models
              .filter(
                (m) =>
                  m.slug !== slug &&
                  (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.username.includes(searchQuery.toLowerCase()))
              )
              .map((m) => (
                <button
                  key={m.slug}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocused(false);
                    navigate(`/modelo/${m.slug}`);
                  }}
                >
                  <img src={m.avatar} alt={m.name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.username}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 pb-8">
        {/* Banner + Avatar */}
        <div className="relative">
          <div className="h-40 bg-muted overflow-hidden">
            {model.banner ? (
              <img src={model.banner} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: accentGradient }} />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Avatar with themed ring */}
          <div
            className="absolute -bottom-10 left-4 h-20 w-20 rounded-full p-[3px]"
            style={{ background: accentGradient }}
          >
            <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
              <img src={model.avatar} alt="Avatar" className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Badge on banner */}
          <div
            className="absolute top-3 left-3 text-[10px] font-bold text-white px-2.5 py-1 rounded-full shadow-lg"
            style={{ background: accentGradient }}
          >
            {t.badge}
          </div>

          {/* Stats on banner */}
          <div className="flex items-center gap-3 absolute bottom-2 right-3 text-[11px] text-white/90 font-medium">
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {model.stats.photos}</span>
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {model.stats.videos}</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {model.stats.posts}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {model.stats.likes}</span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-4 pt-14 pb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h2 className="text-base font-bold text-foreground">{model.name}</h2>
            {model.verified && <VerifiedBadge className="h-5 w-5" />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{model.username}</p>

          {/* Online indicator */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Online agora
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Eye className="h-3 w-3" /> {t.onlineCount} vendo agora
            </span>
          </div>

          <p className="text-sm text-foreground leading-relaxed">
            {showFullBio ? model.bio : model.bio.slice(0, 140) + "..."}
          </p>
          <button
            onClick={() => setShowFullBio(!showFullBio)}
            className="text-sm font-medium mt-1 hover:underline"
            style={{ color: `hsl(${t.accentColor})` }}
          >
            {showFullBio ? "Mostrar menos" : "Ler mais"}
          </button>
        </div>

        {/* Tagline banner */}
        <div className="mx-4 mb-4 rounded-xl p-3 text-center" style={{ background: accentLightGradient }}>
          <p className="text-sm font-bold" style={{ color: `hsl(${t.accentColor})` }}>
            {t.tagline}
          </p>
        </div>

        {/* Divider */}
        <div className="border-b border-border mx-4" />

        {/* Assinaturas */}
        <div className="px-4 py-4">
          <h3 className="text-base font-bold text-foreground mb-3">Assinaturas</h3>

          {/* Main plan - themed gradient */}
          <button
            onClick={() => {
              navigate(`/checkout?plan=${encodeURIComponent(model.mainPlan.name)}&price=${model.mainPlan.price.replace(",", ".")}&model=${model.name}`);
            }}
            className="w-full rounded-2xl py-4 px-5 text-left transition-all mb-4 active:scale-[0.97] shadow-md relative overflow-hidden"
            style={{ background: accentGradient }}
          >
            <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white/90 rounded-bl-lg bg-white/20">
              ⭐ RECOMENDADO
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">{model.mainPlan.name}</span>
                <span className="text-[10px] text-white/70">Acesso completo</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white block">R$ {model.mainPlan.price}</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                {t.promoText}
              </span>
            </div>
          </button>

          <p className="text-base font-bold text-foreground mb-3">Promoções</p>
          <div className="space-y-2.5">
            {model.promos.map((promo) => (
              <button
                key={promo.name}
                onClick={() => {
                  navigate(`/checkout?plan=${encodeURIComponent(promo.name)}&price=${promo.price.replace(",", ".")}&model=${model.name}`);
                }}
                className="w-full rounded-xl py-3 px-5 text-left transition-all active:scale-[0.97] border border-border/50"
                style={{ background: accentLightGradient }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-foreground block">
                      {promo.name}
                    </span>
                    {promo.discount && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white mt-0.5 inline-block"
                        style={{ background: `hsl(${t.accentColor})` }}
                      >
                        {promo.discount}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-foreground">
                    R$ {promo.price}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="mx-4 mb-4 rounded-xl bg-background border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" style={{ color: `hsl(${t.accentColor})` }} />
            <span className="text-xs font-bold text-foreground">Assinantes recentes</span>
          </div>
          <div className="space-y-1.5">
            {["João M.", "Carlos S.", "Pedro R."].map((name, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  {name} assinou agora
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {i + 1}min atrás
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border mx-4" />

        {/* Tabs - themed */}
        <div className="flex border-b border-border">
          <button
            className="flex-1 py-3 text-center text-sm font-semibold border-b-2"
            style={{ color: `hsl(${t.accentColor})`, borderColor: `hsl(${t.accentColor})` }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <FileText className="h-4 w-4" /> {model.postCount} Postagens
            </span>
          </button>
          <button className="flex-1 py-3 text-center text-sm font-semibold text-muted-foreground">
            <span className="flex items-center justify-center gap-1.5">
              <Image className="h-4 w-4" /> {model.mediaCount} Mídias
            </span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer group"
              >
                <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {/* Blur overlay on some */}
                {i >= 2 && (
                  <div className="absolute inset-0 backdrop-blur-md bg-black/30 flex flex-col items-center justify-center">
                    <Lock className="h-5 w-5 text-white mb-1" />
                    <span className="text-[10px] font-bold text-white">EXCLUSIVO</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Assine para desbloquear todo o conteúdo 🔥
          </p>
        </div>

        {/* Urgency CTA at bottom */}
        <div className="mx-4 mb-4">
          <button
            onClick={() => {
              navigate(`/checkout?plan=${encodeURIComponent(model.mainPlan.name)}&price=${model.mainPlan.price.replace(",", ".")}&model=${model.name}`);
            }}
            className="w-full rounded-xl py-4 text-center text-base font-bold text-white shadow-lg active:scale-[0.97] transition-transform"
            style={{ background: accentGradient }}
          >
            {t.promoText} POR R$ {model.mainPlan.price}
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" /> {t.onlineCount} pessoas visualizando agora
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelProfile;
