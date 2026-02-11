import { useState, useRef } from "react";
import { Camera, Heart, Image, MessageSquare, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const plans = [
  {
    name: "Plano Basico",
    description: "Fotos e vídeos exclusivos",
    price: "9,90",
    selected: true,
  },
  {
    name: "Plano Premium",
    description: "Conteúdo completo + Mensagens diretas",
    price: "14,90",
    selected: false,
  },
  {
    name: "Plano VIP",
    description: "Tudo liberado + Conteúdo personalizado",
    price: "22,90",
    selected: false,
  },
];

const Index = () => {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);

  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(URL.createObjectURL(file));
  };

  const bio =
    "Oi, meu amor... sou sua criadora de conteúdo favorita 🧡 Tenho um lado intenso, atrevido e perigosamente viciante — e hoje eu decidi não esconder mais nada.";

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-center py-4 bg-[hsl(24,95%,53%)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background font-bold text-[hsl(24,95%,53%)] text-lg">
            P
          </div>
          <span className="text-xl font-bold text-background tracking-tight">privacy</span>
        </div>
      </header>

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
              <h2 className="text-lg font-bold text-foreground">Seu Nome</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(24,95%,53%)]">
                <Check className="h-3 w-3 text-background" />
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">@seunome</p>
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
                  className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${
                    selectedPlan === i
                      ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/5"
                      : "border-border bg-background hover:border-muted-foreground/30"
                  }`}
                >
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
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
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
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
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
