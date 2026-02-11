import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Heart, Image, MessageSquare, Lock, FileText, Search, Plus, MessageCircle } from "lucide-react";
import profilePhoto from "@/assets/profile-photo.jpeg";
import logoIcon from "@/assets/logo-icon.png";
import bannerImage from "@/assets/banner.jpg";
import verifiedBadge from "@/assets/verified-badge.jpeg";
import preview1 from "@/assets/preview-1.jpeg";
import preview2 from "@/assets/preview-2.jpeg";
import preview3 from "@/assets/preview-3.jpeg";
import preview4 from "@/assets/preview-4.jpg";
import { Button } from "@/components/ui/button";

const mainPlan = {
  name: "1 mês",
  price: "14,90",
  bonus: "+ CHAMADA DE VÍDEO COMIGO HOJE!",
};

const promos = [
  {
    name: "3 meses",
    discount: "9% off",
    price: "21,90",
  },
  {
    name: "1 Ano",
    discount: "21% off",
    price: "9,90",
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
    "Sou muito safadinha e tenho 22 aninhos. PRINCESINHA +18 🥇 Sexo EXPLÍCITO 😈 Aqui você vai conhecer o meu jeito de menina e o meu lado safada. Aqui você encontrará vídeos de sexo, vídeos com amiguinhas, muito anal, vídeos solos e packs personalizados, totalmente sem CENSURA. Estou aqui para te fazer feliz todos os dias 🔥 Respondo rapidamente no Chat 💋";

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      {/* Top promo bar */}
      <header className="flex items-center justify-between px-4 py-1 bg-[hsl(24,95%,53%)]">
        <img src={logoIcon} alt="Privacy" className="h-10 brightness-0 invert" />
        <span className="text-xs font-bold text-white tracking-wide bg-white/20 px-3 py-1 rounded-full">ESSA PROMOÇÃO É VÁLIDA ATÉ 11/02/2026</span>
      </header>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <img src={logoIcon} alt="Privacy" className="h-16" />
        <div className="flex-1 flex items-center gap-2 rounded-full border border-border px-4 py-2">
          <input
            type="text"
            placeholder="Pesquise aqui..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            
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
            className="h-36 bg-muted cursor-pointer overflow-hidden"
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
            className="absolute -bottom-10 left-4 h-20 w-20 rounded-full border-3 border-background bg-muted overflow-hidden cursor-pointer"
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

          {/* Stats on banner */}
          <div className="flex items-center gap-4 absolute bottom-2 right-3 text-[11px] text-background/90 font-medium">
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> 711</span>
            <span className="flex items-center gap-1"><Image className="h-3 w-3" /> 619</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> 54</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> 254.6K</span>
          </div>
        </div>

        {/* Bio Section - no card, direct on background */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h2 className="text-base font-bold text-foreground">Ester Muniz</h2>
            <img src={verifiedBadge} alt="Verificado" className="h-5 w-5 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">@estermuniz</p>
          <p className="text-sm text-foreground leading-relaxed">
            {showFullBio ? bio : bio.slice(0, 140) + "..."}
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

          {/* Main plan - orange gradient pill */}
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
              <span className={`text-sm font-bold ${selectedPlan === "main" ? "text-white" : "text-foreground"}`}>{mainPlan.name}</span>
              <span className={`text-base font-bold ${selectedPlan === "main" ? "text-white" : "text-foreground"}`}>R$ {mainPlan.price}</span>
            </div>
          </button>

          {/* Promoções */}
          <p className="text-base font-bold text-foreground mb-3">Promoções</p>
          <div className="space-y-2.5">
            {promos.map((promo, i) => (
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
                    {promo.name} ({promo.discount})
                  </span>
                  <span className={`text-base font-bold ${selectedPlan === i ? "text-white" : "text-foreground"}`}>R$ {promo.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border mx-4" />

        {/* Tabs - Postagens / Mídias */}
        <div className="flex border-b border-border">
          <button className="flex-1 py-3 text-center text-sm font-semibold text-[hsl(24,95%,53%)] border-b-2 border-[hsl(24,95%,53%)]">
            <span className="flex items-center justify-center gap-1.5">
              <FileText className="h-4 w-4" /> 502 Postagens
            </span>
          </button>
          <button className="flex-1 py-3 text-center text-sm font-semibold text-muted-foreground">
            <span className="flex items-center justify-center gap-1.5">
              <Image className="h-4 w-4" /> 354 Mídias
            </span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {[preview1, preview2, preview3, preview4].map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer"
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
        </div>
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