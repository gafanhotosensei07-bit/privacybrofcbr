import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Heart, Image, MessageSquare, Star, Check, Lock, Search, Plus, MessageCircle } from "lucide-react";
import logoImage from "@/assets/logo.webp";
import profilePhoto from "@/assets/profile-photo.jpeg";
import logoIcon from "@/assets/logo-icon.png";
import bannerImage from "@/assets/banner.jpg";
import preview1 from "@/assets/preview-1.jpeg";
import preview2 from "@/assets/preview-2.jpeg";
import preview3 from "@/assets/preview-3.jpeg";
import preview4 from "@/assets/preview-4.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const plans = [
  {
    name: "Plano Basico",
    emoji: "🔥",
    description: "Fotos e vídeos exclusivos",
    price: "9,90",
    badge: null,
  },
  {
    name: "Plano Premium",
    emoji: "💎",
    description: "Conteúdo completo + Mensagens diretas",
    price: "14,90",
    badge: "MAIS POPULAR",
  },
  {
    name: "Plano VIP",
    emoji: "👑",
    description: "Tudo liberado + Conteúdo personalizado",
    price: "22,90",
    badge: "MELHOR VALOR",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(0);
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
      <header className="flex items-center justify-between px-4 py-2 bg-[hsl(24,95%,53%)]">
        <img src={logoIcon} alt="Privacy" className="h-8 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide">ESSA PROMOÇÃO É VÁLIDA ATÉ 11/02/2026</span>
      </header>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <img src={logoIcon} alt="Privacy" className="h-16" />
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
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">ester muniz</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(24,95%,53%)]">
                <Check className="h-3 w-3 text-background" />
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">@estermunizreal</p>
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


        {/* Plans Card */}
        <Card className="mx-3 mt-4 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-[hsl(24,95%,53%)] fill-[hsl(24,95%,53%)]" />
              <h3 className="text-lg font-bold text-foreground">Escolha seu Plano</h3>
            </div>

            <div className="space-y-3">
              {plans.map((plan, i) => (
                <button
                  key={plan.name}
                  onClick={() => setSelectedPlan(i)}
                  className={`relative w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPlan === i
                      ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/5 shadow-md shadow-[hsl(24,95%,53%)]/10"
                      : "border-border bg-background hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-3 bg-[hsl(24,95%,53%)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedPlan === i
                          ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selectedPlan === i && <div className="h-2 w-2 rounded-full bg-background" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        <span className="mr-1">{plan.emoji}</span>
                        {plan.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[hsl(24,95%,53%)]">R$ {plan.price}</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
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
            const plan = plans[selectedPlan];
            navigate(`/checkout?plan=${encodeURIComponent(plan.name)}&price=${plan.price.replace(",", ".")}`);
          }}
          className="w-full max-w-lg mx-auto block h-12 text-base font-bold rounded-xl"
          style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
        >
          ASSINAR POR R$ {plans[selectedPlan].price}
        </Button>
      </div>
    </div>
  );
};

export default Index;
