import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Heart, Image, MessageSquare, Star, Check, Lock, Search, Plus, MessageCircle } from "lucide-react";
import logoImage from "@/assets/logo.webp";
import profilePhoto from "@/assets/profile-photo.jpeg";
import logoIcon from "@/assets/logo-icon.png";
import bannerImage from "@/assets/banner.jpg";
import verifiedBadge from "@/assets/verified-badge.jpeg";
import preview1 from "@/assets/preview-1.jpeg";
import preview2 from "@/assets/preview-2.jpeg";
import preview3 from "@/assets/preview-3.jpeg";
import preview4 from "@/assets/preview-4.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const mainPlan = {
  name: "60 DIAS",
  price: "14,90",
  bonus: "+ CHAMADA DE VÍDEO COMIGO HOJE!",
};

const promos = [
  {
    name: "3 Meses",
    emoji: "👑",
    price: "21,90",
    badge: "Mais popular",
    badgeEmoji: "🔥",
  },
  {
    name: "1 Ano",
    emoji: "",
    price: "9,90",
    badge: "Melhor oferta",
    badgeEmoji: "",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"main" | number>("main");
  const [bannerUrl, setBannerUrl] = useState<string | null>(bannerImage);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profilePhoto);
  const [showFullBio, setShowFullBio] = useState(false);

  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(URL.createObjectURL(file));
  };

  const bio =
    "Oi, meu amor... sou Ester Muniz 💋 Tenho um lado intenso, atrevido e perigosamente viciante — e hoje eu decidi não esconder mais nada. Aqui você vai encontrar meus vídeos exclusivos, momentos íntimos onde me entrego de corpo e alma. 😏 Cada centímetro do meu corpo é pura tentação e minhas fotos são um convite exclusivo para você explorar seus desejos mais secretos, tudo sem censura! Se você tem coragem de se perder nessa paixão sem limites, vem comigo... Estou te esperando para uma experiência única e irresistível.😈💋";

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-1 bg-[hsl(24,95%,53%)]">
        <img src={logoIcon} alt="Privacy" className="h-14 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide">ESSA PROMOÇÃO É VÁLIDA ATÉ 11/02/2026</span>
      </header>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <img src={logoIcon} alt="Privacy" className="h-20" />
        <div className="flex-1 flex items-center gap-2 rounded-full border border-border px-4 py-2">
          <input
            type="text"
            placeholder="Pesquise aqui..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            readOnly
          />
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Plus className="h-5 w-5 text-muted-foreground" />
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 pb-24">
        {/* Banner + Avatar */}
        <div className="relative">
          <div
            className="h-52 bg-muted cursor-pointer group overflow-hidden"
            onClick={() => bannerRef.current?.click()}
          >
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                <Camera className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setBannerUrl)} />
          </div>

          {/* Avatar */}
          <div
            className="absolute -bottom-12 left-4 h-24 w-24 rounded-full border-4 border-background bg-muted overflow-hidden cursor-pointer group"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setAvatarUrl)} />
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 absolute bottom-2 right-3 text-xs text-background/90 font-medium">
            <span className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> 401</span>
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> 438</span>
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 229K</span>
          </div>
        </div>

        {/* Bio Card */}
        <Card className="mx-3 mt-16 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h2 className="text-lg font-bold text-foreground">Ester Muniz</h2>
              <img src={verifiedBadge} alt="Verificado" className="h-5 w-5 object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">@estermuniz</p>
            <p className="text-sm text-foreground leading-relaxed">
              {showFullBio ? bio : bio.slice(0, 100) + "..."}
            </p>
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="text-sm font-medium text-[hsl(24,95%,53%)] mt-1 hover:underline"
            >
              {showFullBio ? "Mostrar menos" : "Mostrar mais"}
            </button>
          </CardContent>
        </Card>


        {/* Assinaturas */}
        <Card className="mx-3 mt-4 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-foreground mb-3">Assinaturas</h3>

            {/* Header badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-foreground">VEJA TUDO AGORA 🔥🔥</span>
              <span className="bg-[hsl(24,95%,53%)]/10 text-[hsl(24,95%,53%)] text-xs font-bold px-2.5 py-0.5 rounded-full">Promocional</span>
            </div>

            {/* Main plan */}
            <button
              onClick={() => setSelectedPlan("main")}
              className={`w-full rounded-xl p-4 text-left transition-all mb-2 ${
                selectedPlan === "main"
                  ? "bg-[hsl(24,95%,53%)] text-white shadow-lg"
                  : "border-2 border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold">{mainPlan.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold">R$ {mainPlan.price}</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>

            {/* Bonus */}
            <p className="text-sm font-bold text-[hsl(140,60%,40%)] mb-3">{mainPlan.bonus}</p>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-5">
              <span className="flex items-center gap-1">🔒 Pagamento 100% seguro</span>
              <span>·</span>
              <span className="flex items-center gap-1">⚡ Acesso imediato</span>
            </div>

            {/* Promoções */}
            <p className="text-sm font-semibold text-muted-foreground mb-3">Promoções</p>
            <div className="space-y-2">
              {promos.map((promo, i) => (
                <button
                  key={promo.name}
                  onClick={() => setSelectedPlan(i)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    selectedPlan === i
                      ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/5 shadow-md"
                      : "border-border bg-background hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {promo.emoji && <span className="text-base">{promo.emoji}</span>}
                    <span className="text-sm font-bold text-foreground">{promo.name}</span>
                    <span className="bg-[hsl(24,95%,53%)]/10 text-[hsl(24,95%,53%)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {promo.badge}
                    </span>
                    {promo.badgeEmoji && <span className="text-xs">{promo.badgeEmoji}</span>}
                  </div>
                  <span className="text-base font-extrabold text-[hsl(24,95%,53%)]">R$ {promo.price}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prévias */}
        <Card className="mx-3 mt-4 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-5 w-5 text-[hsl(24,95%,53%)]" />
              <h3 className="text-lg font-bold text-foreground">Prévias</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[preview1, preview2, preview3, preview4].map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl bg-gradient-to-br from-muted to-muted-foreground/10 overflow-hidden group cursor-pointer"
                >
                  {src && <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />}
                  {!src && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/30 backdrop-blur-sm">
                      <Lock className="h-5 w-5 text-background mb-1" />
                      <span className="text-[10px] font-semibold text-background">VIP</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Assine para desbloquear todo o conteúdo 🔥
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={() => {
            const price = selectedPlan === "main" ? mainPlan.price : promos[selectedPlan].price;
            const name = selectedPlan === "main" ? mainPlan.name : promos[selectedPlan].name;
            navigate(`/checkout?plan=${encodeURIComponent(name)}&price=${price.replace(",", ".")}`);
          }}
          className="w-full max-w-lg mx-auto block h-12 text-base font-bold rounded-xl"
          style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
        >
          ASSINAR POR R$ {selectedPlan === "main" ? mainPlan.price : promos[selectedPlan].price}
        </Button>
      </div>
    </div>
  );
};

export default Index;
