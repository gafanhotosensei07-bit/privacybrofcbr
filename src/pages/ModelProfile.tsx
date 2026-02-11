import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Image, Lock, FileText, Search, Plus, MessageCircle } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import verifiedBadge from "@/assets/verified-badge.jpeg";
import preview1 from "@/assets/preview-1.jpeg";
import preview2 from "@/assets/preview-2.jpeg";
import preview3 from "@/assets/preview-3.jpeg";
import preview4 from "@/assets/preview-4.jpg";
import { Button } from "@/components/ui/button";
import { models } from "@/data/models";

const ModelProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"main" | number>("main");
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
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
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

      <div className="mx-auto w-full max-w-lg flex-1 pb-24">
        {/* Banner + Avatar */}
        <div className="relative">
          <div className="h-36 bg-muted overflow-hidden">
            {model.banner ? (
              <img src={model.banner} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-full border-3 border-background bg-muted overflow-hidden">
            <img src={model.avatar} alt="Avatar" className="h-full w-full object-cover" />
          </div>

          {/* Stats on banner */}
          <div className="flex items-center gap-4 absolute bottom-2 right-3 text-[11px] text-background/90 font-medium">
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {model.stats.photos}</span>
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> {model.stats.videos}</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {model.stats.posts}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {model.stats.likes}</span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h2 className="text-base font-bold text-foreground">{model.name}</h2>
            {model.verified && (
              <img src={verifiedBadge} alt="Verificado" className="h-5 w-5 object-contain" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{model.username}</p>
          <p className="text-sm text-foreground leading-relaxed">
            {showFullBio ? model.bio : model.bio.slice(0, 140) + "..."}
          </p>
          <button
            onClick={() => setShowFullBio(!showFullBio)}
            className="text-sm font-medium text-[hsl(24,95%,53%)] mt-1 hover:underline"
          >
            {showFullBio ? "Mostrar menos" : "Ler mais"}
          </button>
        </div>

        {/* Divider */}
        <div className="border-b border-border mx-4" />

        {/* Assinaturas */}
        <div className="px-4 py-4">
          <h3 className="text-base font-bold text-foreground mb-3">Assinaturas</h3>

          <button
            onClick={() => setSelectedPlan("main")}
            className="w-full rounded-full py-3 px-5 text-left transition-all mb-5"
            style={{
              background: selectedPlan === "main"
                ? "linear-gradient(90deg, hsl(24,95%,53%) 0%, hsl(30,95%,75%) 100%)"
                : "linear-gradient(90deg, hsl(24,95%,80%) 0%, hsl(30,95%,90%) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${selectedPlan === "main" ? "text-white" : "text-foreground"}`}>
                {model.mainPlan.name}
              </span>
              <span className={`text-base font-bold ${selectedPlan === "main" ? "text-white" : "text-foreground"}`}>
                R$ {model.mainPlan.price}
              </span>
            </div>
          </button>

          <p className="text-base font-bold text-foreground mb-3">Promoções</p>
          <div className="space-y-2.5">
            {model.promos.map((promo, i) => (
              <button
                key={promo.name}
                onClick={() => setSelectedPlan(i)}
                className="w-full rounded-full py-3 px-5 text-left transition-all"
                style={{
                  background: selectedPlan === i
                    ? "linear-gradient(90deg, hsl(24,95%,53%) 0%, hsl(30,95%,75%) 100%)"
                    : "linear-gradient(90deg, hsl(24,95%,80%) 0%, hsl(30,95%,90%) 100%)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${selectedPlan === i ? "text-white" : "text-foreground"}`}>
                    {promo.name}{promo.discount ? ` (${promo.discount})` : ""}
                  </span>
                  <span className={`text-base font-bold ${selectedPlan === i ? "text-white" : "text-foreground"}`}>
                    R$ {promo.price}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border mx-4" />

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button className="flex-1 py-3 text-center text-sm font-semibold text-[hsl(24,95%,53%)] border-b-2 border-[hsl(24,95%,53%)]">
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
                className="relative aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer"
              >
                <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Assine para desbloquear todo o conteúdo 🔥
          </p>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={() => {
            const price = selectedPlan === "main" ? model.mainPlan.price : model.promos[selectedPlan as number].price;
            const name = selectedPlan === "main" ? model.mainPlan.name : model.promos[selectedPlan as number].name;
            navigate(`/checkout?plan=${encodeURIComponent(name)}&price=${price.replace(",", ".")}&model=${model.name}`);
          }}
          className="w-full max-w-lg mx-auto block h-12 text-base font-bold rounded-xl"
          style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
        >
          ASSINAR POR R$ {selectedPlan === "main" ? model.mainPlan.price : model.promos[selectedPlan as number].price}
        </Button>
      </div>
    </div>
  );
};

export default ModelProfile;
