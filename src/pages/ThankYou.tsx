import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPurchase } from "@/lib/meta-pixel";
import { Card, CardContent } from "@/components/ui/card";
import { models } from "@/data/models";
import logoIcon from "@/assets/logo-icon.png";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Plano";
  const planPrice = searchParams.get("price") || "0";
  const modelName = searchParams.get("model") || "";
  const model = models.find((m) => m.name === modelName);

  useEffect(() => {
    trackPurchase({
      content_name: `${modelName} - ${planName}`,
      value: parseFloat(planPrice),
    });
  }, [modelName, planName, planPrice]);

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoIcon} alt="Privacy" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
        </div>

        {/* Success card */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(160,60%,45%)] p-6 flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Pagamento Confirmado!</h1>
            <p className="text-white/80 text-sm text-center">Sua assinatura foi ativada com sucesso 🎉</p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Model info */}
            {model && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40">
                <img src={model.avatar} alt={model.name} className="h-12 w-12 rounded-full object-cover border-2 border-[hsl(24,95%,53%)]" />
                <div>
                  <p className="font-bold text-foreground flex items-center gap-1">
                    {model.name}
                    {model.verified && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(24,95%,53%)]">
                        <CheckCircle className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{model.username}</p>
                </div>
              </div>
            )}

            {/* Plan details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Detalhes da assinatura</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Plano</span>
                  <span className="text-sm font-bold text-foreground">{planName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <span className="text-sm font-bold text-[hsl(24,95%,53%)]">R$ {parseFloat(planPrice).toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-xs font-bold text-[hsl(142,71%,45%)] bg-[hsl(142,71%,45%)]/10 px-2.5 py-1 rounded-full">✅ Ativo</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Pagamento</span>
                  <span className="text-sm font-bold text-foreground">PIX</span>
                </div>
              </div>
            </div>

            {/* CTA to members area */}
            <Button
              onClick={() => navigate(`/membros/${model?.slug || ""}`)}
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-[hsl(24,95%,53%)]/30 hover:shadow-[hsl(24,95%,53%)]/50 hover:scale-[1.02] transition-all gap-2"
              style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
            >
              <Crown className="h-5 w-5" />
              Acessar Conteúdo Exclusivo
              <ArrowRight className="h-5 w-5" />
            </Button>

            <div className="bg-[hsl(24,95%,53%)]/5 border border-[hsl(24,95%,53%)]/20 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Seu acesso à área de membros está liberado!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYou;
