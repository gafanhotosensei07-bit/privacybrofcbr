import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Image, Search, Plus, MessageCircle, Flame, Star, TrendingUp, Crown } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import VerifiedBadge from "@/components/VerifiedBadge";
import { models } from "@/data/models";
import { usePageView } from "@/hooks/usePageView";
import BackPromoModal from "@/components/BackPromoModal";
import { useBeforeUnload } from "@/hooks/useBackRedirect";

const Home = () => {
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  usePageView("home", "catalogo");
  useBeforeUnload();

  const goToModel = (slug: string) => navigate(`/modelo/${slug}`);

  // Featured model (first one)
  const featured = models[0];
  const others = models.slice(1);

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      <BackPromoModal
        modelSlug={featured.slug}
        modelName={featured.name}
        originalPrice={featured.mainPlan.price}
      />
      {/* Top promo bar */}
      <header className="flex items-center justify-between px-4 py-1.5 bg-[hsl(24,95%,53%)]">
        <img src={logoIcon} alt="Privacy" className="h-10 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide bg-white/20 px-3 py-1 rounded-full animate-pulse">
          🔥 PROMOÇÃO VÁLIDA ATÉ 11/02/2026
        </span>
      </header>

      {/* Search bar */}
      <div className="relative sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border">
          <img src={logoIcon} alt="Privacy" className="h-14" />
          <div className="flex-1 flex items-center gap-2 rounded-full border border-border px-4 py-2 bg-muted/30 focus-within:border-[hsl(24,95%,53%)] focus-within:ring-1 focus-within:ring-[hsl(24,95%,53%)]/20 transition-all">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquise uma criadora..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>
          <Plus className="h-5 w-5 text-muted-foreground" />
          <MessageCircle className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-[hsl(24,95%,53%)] transition-colors" onClick={() => navigate("/chat")} />
        </div>

        {searchFocused && (
          <div className="absolute left-0 right-0 top-full z-50 bg-background border-b border-border shadow-xl max-h-72 overflow-y-auto animate-fade-in">
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
                    goToModel(model.slug);
                  }}
                >
                  <img src={model.avatar} alt={model.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-[hsl(24,95%,53%)]/20" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.username}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 pb-8">
        {/* Avatars carousel */}
        <div className="px-4 pt-5 pb-2">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {models.map((model, i) => (
              <button
                key={model.slug}
                onClick={() => goToModel(model.slug)}
                className="flex flex-col items-center gap-1 flex-shrink-0 group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-br from-[hsl(24,95%,53%)] to-[hsl(340,80%,55%)]">
                    <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                      {model.avatar ? (
                        <img src={model.avatar} alt={model.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                  {model.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                      <VerifiedBadge className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-16 text-center">{model.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured creator */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-[hsl(24,95%,53%)]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Destaque da Semana</h2>
          </div>
          <button
            className="w-full rounded-2xl overflow-hidden shadow-lg border border-border text-left relative group"
            onClick={() => goToModel(featured.slug)}
          >
            {/* Large banner */}
            <div className="relative h-48 bg-muted overflow-hidden">
              {featured.banner ? (
                <img src={featured.banner} alt="Banner" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[hsl(24,95%,53%)] to-[hsl(340,80%,55%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-end gap-3">
                  <div className="h-14 w-14 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                    <img src={featured.avatar} alt={featured.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white truncate">{featured.name}</h3>
                      {featured.verified && <VerifiedBadge className="h-4 w-4" />}
                    </div>
                    <p className="text-xs text-white/70">{featured.username}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/90 text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Heart className="h-3 w-3" /> {featured.stats.likes}
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-[hsl(24,95%,53%)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                <Flame className="h-3 w-3" /> POPULAR
              </div>
            </div>

            {/* Previews strip */}
            {featured.previews && featured.previews.length > 0 && (
              <div className="flex gap-1 p-2 bg-background">
                {featured.previews.slice(0, 4).map((src, i) => (
                  <div key={i} className="relative flex-1 aspect-square rounded-lg bg-muted overflow-hidden">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="px-3 pb-3 pt-1 bg-background">
              <div
                className="w-full rounded-full py-3 text-center text-sm font-bold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, hsl(24,95%,53%) 0%, hsl(340,80%,55%) 100%)" }}
              >
                🔥 ASSINAR POR R$ {featured.mainPlan.price}
              </div>
            </div>
          </button>
        </div>

        {/* Trending section */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[hsl(24,95%,53%)]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Em Alta</h2>
          </div>
        </div>

        {/* Other model cards */}
        <div className="space-y-3 px-4">
          {others.map((model, i) => (
            <button
              key={model.slug}
              className="w-full bg-background rounded-2xl overflow-hidden shadow-sm border border-border text-left transition-all duration-300 hover:shadow-md hover:border-[hsl(24,95%,53%)]/30 active:scale-[0.98] animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => goToModel(model.slug)}
            >
              <div className="flex gap-0">
                {/* Left: Banner + Avatar */}
                <div className="relative w-28 flex-shrink-0">
                  <div className="h-full bg-muted overflow-hidden">
                    {model.banner ? (
                      <img src={model.banner} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[hsl(24,95%,53%)]/20 to-[hsl(340,80%,55%)]/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                  </div>
                </div>

                {/* Right: Info */}
                <div className="flex-1 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[hsl(24,95%,53%)]/20">
                      {model.avatar ? (
                        <img src={model.avatar} alt={model.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-sm font-bold text-foreground truncate">{model.name}</h3>
                        {model.verified && <VerifiedBadge className="h-3.5 w-3.5 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{model.username}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-2 mt-1.5">{model.bio}</p>

                  {/* Stats + Price */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Image className="h-3 w-3" /> {model.stats.photos}</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {model.stats.likes}</span>
                    </div>
                    <span
                      className="text-[11px] font-bold text-white px-3 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg, hsl(24,95%,53%) 0%, hsl(30,95%,75%) 100%)" }}
                    >
                      R$ {model.mainPlan.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview strip */}
              {model.previews && model.previews.length > 0 && (
                <div className="flex gap-1 px-2 pb-2">
                  {model.previews.slice(0, 4).map((src, j) => (
                    <div key={j} className="relative flex-1 aspect-square rounded-md bg-muted overflow-hidden">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8 px-4">
          <p className="text-xs text-muted-foreground">© 2026 Privacy · Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
