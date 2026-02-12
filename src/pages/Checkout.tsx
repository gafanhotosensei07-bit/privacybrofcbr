import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Copy, CheckCircle, Loader2, AlertCircle, Shield, Clock, Sparkles, User, Mail, Flame, Gift, Zap, Users, Eye, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import profilePhoto from "@/assets/profile-photo.jpeg";
import { models } from "@/data/models";

const SIGMAPAY_BASE = "https://qpnojbfmthfkorggbqkd.supabase.co/functions/v1";
const API_TOKEN = "C4Jv1h6JTzYZA1RNEjVSHfVBVp9EpBTl0izjwhy3KHz7tLjusTdlDsZZGS3q";

type Step = "form" | "loading" | "pix" | "success" | "error";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Plano Basico";
  const planPrice = parseFloat(searchParams.get("price") || "9.90");
  const modelName = searchParams.get("model") || "";
  const model = models.find((m) => m.name === modelName);
  const [orderBumps, setOrderBumps] = useState<Record<string, boolean>>({});
  const [viewerCount] = useState(() => Math.floor(Math.random() * 20) + 12);

  const orderBumpOptions: Record<string, { id: string; icon: React.ReactNode; title: string; description: string; price: number; oldPrice?: number }[]> = {
    "Plano Basico": [
      { id: "pack-fotos", icon: <Flame className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "📸 Pack de 10 fotos extras", description: "Fotos exclusivas que não estão no plano básico", price: 4.90, oldPrice: 9.90 },
      { id: "acesso-antecipado", icon: <Zap className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "⚡ Acesso antecipado", description: "Veja o conteúdo novo 24h antes de todos", price: 3.90 },
    ],
    "Plano Premium": [
      { id: "video-chamada", icon: <Gift className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "🎁 Videochamada exclusiva (5 min)", description: "Uma chamada especial e personalizada comigo", price: 19.90, oldPrice: 39.90 },
      { id: "pack-videos", icon: <Flame className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "🔥 Pack de 5 vídeos especiais", description: "Conteúdo premium que vai te deixar sem fôlego", price: 9.90, oldPrice: 14.90 },
    ],
    "Plano VIP": [
      { id: "conteudo-sob-demanda", icon: <Sparkles className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "✨ Conteúdo sob demanda", description: "Peça exatamente o que quiser — eu faço pra você", price: 29.90, oldPrice: 49.90 },
      { id: "grupo-vip", icon: <Gift className="h-5 w-5 text-[hsl(24,95%,53%)]" />, title: "👑 Acesso ao grupo VIP secreto", description: "Conteúdo diário exclusivo + bastidores + interação", price: 7.90 },
    ],
  };

  const currentBumps = orderBumpOptions[planName] || orderBumpOptions["Plano Basico"];
  const bumpTotal = Object.entries(orderBumps)
    .filter(([, v]) => v)
    .reduce((sum, [id]) => {
      const bump = currentBumps.find(b => b.id === id);
      return sum + (bump?.price || 0);
    }, 0);
  const totalPrice = planPrice + bumpTotal;

  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ name: "", email: "" });
  const [pixCode, setPixCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);
  const [errorMsg, setErrorMsg] = useState("");
  const statusInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerInterval.current) clearInterval(timerInterval.current);
          if (statusInterval.current) clearInterval(statusInterval.current);
          setErrorMsg("Tempo expirado. Tente novamente.");
          setStep("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkStatus = async (id: string) => {
    try {
      const res = await fetch(`${SIGMAPAY_BASE}/sigmapay-check-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id, apiToken: API_TOKEN }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "approved") {
          if (statusInterval.current) clearInterval(statusInterval.current);
          if (timerInterval.current) clearInterval(timerInterval.current);
          setStep("success");
        } else if (data.status === "rejected") {
          if (statusInterval.current) clearInterval(statusInterval.current);
          if (timerInterval.current) clearInterval(timerInterval.current);
          setErrorMsg("Pagamento não aprovado. Tente novamente.");
          setStep("error");
        }
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setStep("loading");

    try {
      const res = await fetch(`${SIGMAPAY_BASE}/sigmapay-create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: API_TOKEN,
          amount: planPrice,
          productTitle: planName,
          externalReference: "s6uprylj6m",
          customerName: form.name,
          customerEmail: form.email,
          customerDocument: "",
          customerPhone: "",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao criar pagamento");
      }

      setPaymentId(data.id);
      const pix = data.copyPaste || "";
      let qr = "";
      if (data.qrCode && data.qrCode.startsWith("data:")) {
        qr = data.qrCode;
      } else if (pix) {
        qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pix)}`;
      }
      setPixCode(pix);
      setQrCodeUrl(qr);
      setStep("pix");
      startTimer();
      statusInterval.current = setInterval(() => checkStatus(data.id), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao gerar PIX. Tente novamente.");
      setStep("error");
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode).then(() => {
      toast.success("Código PIX copiado!");
    });
  };

  const testimonials = [
    { name: "Lucas M.", text: "Melhor investimento que fiz! Conteúdo incrível 🔥", rating: 5 },
    { name: "Pedro H.", text: "Vale cada centavo, recomendo demais!", rating: 5 },
    { name: "Rafael S.", text: "Assinei o VIP e não me arrependo nem um pouco 👑", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 py-4 px-4 bg-[hsl(24,95%,53%)]">
        <button onClick={() => navigate("/")} className="text-white/90 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-white">Checkout</span>
      </header>

      {/* Urgency banner */}
      <div className="bg-foreground text-background text-center py-2 px-4 text-xs font-semibold tracking-wide animate-fade-in flex items-center justify-center gap-2">
        <Eye className="h-3.5 w-3.5" />
        <span>{viewerCount} pessoas estão vendo esta página agora</span>
        <span className="inline-block h-2 w-2 rounded-full bg-[hsl(142,71%,45%)] animate-pulse" />
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-8">
        {/* Creator mini profile */}
        <div className="flex items-center gap-3 py-4 animate-fade-in">
          <img src={model?.avatar || profilePhoto} alt={model?.name || "Criadora"} className="h-12 w-12 rounded-full object-cover border-2 border-[hsl(24,95%,53%)]" />
          <div>
            <p className="text-sm font-bold text-foreground flex items-center gap-1">
              {model?.name || "ester muniz"}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(24,95%,53%)]">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Criadora verificada • {model?.stats.likes || "254.6K"} curtidas</p>
          </div>
        </div>

        {/* Plan summary card */}
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-[hsl(24,95%,53%)]/10 to-[hsl(24,95%,53%)]/5 border border-[hsl(24,95%,53%)]/20 p-5 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-foreground text-lg">{planName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Assinatura mensal • PIX</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-[hsl(24,95%,53%)]">
                R$ {planPrice.toFixed(2).replace(".", ",")}
              </span>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[hsl(24,95%,53%)]/10">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>+2.400 assinantes</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>98% de satisfação</span>
            </div>
          </div>
        </div>

        {/* Order Bumps */}
        {step === "form" && (
          <div className="mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 px-1">
              <Flame className="h-4 w-4 text-[hsl(24,95%,53%)]" />
              <p className="text-sm font-bold text-foreground">🔥 Oferta especial — só hoje:</p>
            </div>
            {currentBumps.map((bump) => (
              <button
                key={bump.id}
                onClick={() => setOrderBumps(prev => ({ ...prev, [bump.id]: !prev[bump.id] }))}
                className={`w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  orderBumps[bump.id]
                    ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/5 shadow-md shadow-[hsl(24,95%,53%)]/10"
                    : "border-border bg-background hover:border-muted-foreground/30 hover:shadow-sm"
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  orderBumps[bump.id]
                    ? "border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]"
                    : "border-muted-foreground/40"
                }`}>
                  {orderBumps[bump.id] && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{bump.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{bump.description}</p>
                </div>
                <div className="text-right shrink-0">
                  {bump.oldPrice && (
                    <span className="text-xs text-muted-foreground line-through block">R$ {bump.oldPrice.toFixed(2).replace(".", ",")}</span>
                  )}
                  <span className="text-sm font-bold text-[hsl(24,95%,53%)]">+ R$ {bump.price.toFixed(2).replace(".", ",")}</span>
                </div>
              </button>
            ))}
            {bumpTotal > 0 && (
              <div className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-[hsl(24,95%,53%)]/5 border border-[hsl(24,95%,53%)]/15">
                <span className="text-sm font-semibold text-foreground">💰 Total com extras:</span>
                <span className="text-lg font-extrabold text-[hsl(24,95%,53%)]">R$ {totalPrice.toFixed(2).replace(".", ",")}/mês</span>
              </div>
            )}
          </div>
        )}

        {/* Form step */}
        {step === "form" && (
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground">Complete sua assinatura</h3>
                  <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para gerar o PIX</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60 focus:border-[hsl(24,95%,53%)] focus:ring-[hsl(24,95%,53%)]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60 focus:border-[hsl(24,95%,53%)] focus:ring-[hsl(24,95%,53%)]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-[hsl(24,95%,53%)]/30 hover:shadow-[hsl(24,95%,53%)]/50 hover:scale-[1.02] transition-all"
                  style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  PAGAR COM PIX — R$ {totalPrice.toFixed(2).replace(".", ",")}
                </Button>

                {/* Guarantee */}
                <div className="bg-[hsl(142,71%,45%)]/5 border border-[hsl(142,71%,45%)]/20 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-[hsl(142,71%,45%)]">✅ Garantia de 7 dias — cancele quando quiser</p>
                </div>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Pagamento seguro</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Aprovação instantânea</span>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground text-center uppercase tracking-wider">O que dizem os assinantes</p>
              {testimonials.map((t, i) => (
                <div key={i} className="bg-background rounded-xl border border-border p-3.5 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-[hsl(24,95%,53%)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[hsl(24,95%,53%)]">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{t.name}</p>
                      <div className="flex">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <span key={j} className="text-[10px]">⭐</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <Card className="shadow-xl border-0 rounded-2xl animate-fade-in">
            <CardContent className="p-14 flex flex-col items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-[hsl(24,95%,53%)]/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(24,95%,53%)]" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-bold text-lg">Gerando código PIX...</p>
                <p className="text-sm text-muted-foreground mt-1">Aguarde um instante</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PIX display */}
        {step === "pix" && (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden animate-fade-in">
            <CardContent className="p-0">
              {/* Timer header */}
              <div className="bg-[hsl(24,95%,53%)] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Aguardando pagamento</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/20 text-white backdrop-blur-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-3xl font-extrabold text-foreground">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white rounded-2xl shadow-inner border border-border/40">
                      <img src={qrCodeUrl} alt="QR Code PIX" className="w-44 h-44" />
                    </div>
                  </div>
                )}

                {/* PIX code */}
                <div className="bg-muted/60 rounded-xl p-4 border border-border/40">
                  <p className="text-[11px] text-muted-foreground break-all text-center leading-relaxed font-mono">
                    {pixCode}
                  </p>
                </div>

                {/* Copy button */}
                <Button
                  onClick={copyPix}
                  className="w-full h-14 text-base font-bold rounded-xl gap-2 shadow-lg shadow-[hsl(24,95%,53%)]/30"
                  style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
                >
                  <Copy className="h-5 w-5" />
                  Copiar código PIX
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Após o pagamento, a confirmação será automática ✅
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card className="shadow-xl border-0 rounded-2xl animate-fade-in">
            <CardContent className="p-12 flex flex-col items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-[hsl(142,71%,45%)]/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-[hsl(142,71%,45%)]" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground">Pagamento Confirmado!</h3>
                <p className="text-muted-foreground mt-2">
                  Obrigado pela sua assinatura. Seu acesso foi liberado! 🎉
                </p>
              </div>
              <Button
                onClick={() => navigate("/")}
                className="rounded-xl h-12 px-8 mt-2"
                style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
              >
                Voltar ao perfil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {step === "error" && (
          <Card className="shadow-xl border-0 rounded-2xl animate-fade-in">
            <CardContent className="p-12 flex flex-col items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground">Erro no pagamento</h3>
                <p className="text-muted-foreground mt-2">{errorMsg}</p>
              </div>
              <Button
                onClick={() => { setStep("form"); setErrorMsg(""); setTimeLeft(900); }}
                className="rounded-xl h-12 px-8 mt-2"
                style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;
