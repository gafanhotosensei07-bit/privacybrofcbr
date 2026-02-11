import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Image, Search, Plus, MessageCircle, Lock } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import verifiedBadge from "@/assets/verified-badge.jpeg";
import { models } from "@/data/models";

const Home = () => {
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      {/* Top promo bar */}
      <header className="flex items-center justify-between px-4 py-1 bg-[hsl(24,95%,53%)]">
        <img src={logoIcon} alt="Privacy" className="h-10 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide bg-white/20 px-3 py-1 rounded-full">
          ESSA PROMOÇÃO É VÁLIDA ATÉ 11/02/2026
        </span>
      </header>

      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
          <img src={logoIcon} alt="Privacy" className="h-16" />
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
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>

        {searchFocused && (
          <div className="absolute left-0 right-0 top-full z-50 bg-background border-b border-border shadow-lg max-h-72 overflow-y-auto">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sugestões</p>
            {models
              .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.username.includes(searchQuery.toLowerCase()))
              .map((model) => (
                <button
                  key={model.slug}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocused(false);
                    if (model.slug === "estermuniz") {
                      navigate("/modelo/estermuniz");
                    } else {
                      navigate(`/modelo/${model.slug}`);
                    }
                  }}
                >
                  <img src={model.avatar} alt={model.name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.username}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-lg flex-1 pb-8">
        {/* Hero section */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-xl font-bold text-foreground mb-1">🔥 Criadoras em Destaque</h1>
          <p className="text-sm text-muted-foreground">Explore os perfis mais quentes da plataforma</p>
        </div>

        {/* Model Cards */}
        <div className="space-y-4 px-4">
          {models.map((model) => (
            <button
              key={model.slug}
              className="w-full bg-background rounded-2xl overflow-hidden shadow-sm border border-border text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => {
                if (model.slug === "estermuniz") {
                  navigate("/modelo/estermuniz");
                } else {
                  navigate(`/modelo/${model.slug}`);
                }
              }}
            >
              {/* Banner */}
              <div className="relative h-28 bg-muted overflow-hidden">
                {model.banner ? (
                  <img src={model.banner} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                )}
                {/* Stats overlay */}
                <div className="flex items-center gap-3 absolute bottom-2 right-3 text-[10px] text-white/90 font-medium">
                  <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {model.stats.photos}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {model.stats.likes}</span>
                </div>
              </div>

              {/* Info */}
              <div className="relative px-4 pt-8 pb-3">
                {/* Avatar */}
                <div className="absolute -top-8 left-4 h-16 w-16 rounded-full border-3 border-background bg-muted overflow-hidden">
                  {model.avatar ? (
                    <img src={model.avatar} alt={model.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-0.5">
                  <h2 className="text-sm font-bold text-foreground">{model.name}</h2>
                  {model.verified && (
                    <img src={verifiedBadge} alt="Verificado" className="h-4 w-4 object-contain" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{model.username}</p>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{model.bio}</p>
              </div>

              {/* Previews grid */}
              {model.previews && model.previews.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {model.previews.slice(0, 4).map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg bg-muted overflow-hidden">
                        <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                        {i === 3 && model.previews && model.previews.length > 4 && (
                          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">+{model.previews.length - 3}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="px-3 pb-3">
                <div
                  className="w-full rounded-full py-2.5 text-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(90deg, hsl(24,95%,53%) 0%, hsl(30,95%,75%) 100%)" }}
                >
                  ASSINAR POR R$ {model.mainPlan.price}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
