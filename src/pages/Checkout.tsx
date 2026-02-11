import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Copy, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const SIGMAPAY_BASE = "https://qpnojbfmthfkorggbqkd.supabase.co/functions/v1";
const API_TOKEN = "C4Jv1h6JTzYZA1RNEjVSHfVBVp9EpBTl0izjwhy3KHz7tLjusTdlDsZZGS3q";

type Step = "form" | "loading" | "pix" | "success" | "error";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Plano Basico";
  const planPrice = parseFloat(searchParams.get("price") || "9.90");

  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ name: "", email: "" });
  const [pixCode, setPixCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15 min
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

  return (
    <div className="min-h-screen bg-[hsl(30,20%,96%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 py-4 px-4 bg-[hsl(24,95%,53%)]">
        <button onClick={() => navigate("/")} className="text-background">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-background">Checkout</span>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 p-4">
        {/* Plan summary */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-foreground">{planName}</p>
              <p className="text-sm text-muted-foreground">Assinatura mensal</p>
            </div>
            <span className="text-xl font-bold text-[hsl(24,95%,53%)]">
              R$ {planPrice.toFixed(2).replace(".", ",")}
            </span>
          </CardContent>
        </Card>

        {/* Form step */}
        {step === "form" && (
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Seus dados</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base font-bold rounded-xl"
                style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
              >
                PAGAR COM PIX
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {step === "loading" && (
          <Card className="shadow-sm">
            <CardContent className="p-10 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[hsl(24,95%,53%)]" />
              <p className="text-foreground font-medium">Gerando código PIX...</p>
            </CardContent>
          </Card>
        )}

        {/* PIX display */}
        {step === "pix" && (
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Pague com PIX</h3>
                <span className="px-2 py-1 rounded text-sm font-medium bg-destructive text-destructive-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center py-4">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 rounded-lg" />
                </div>
              )}

              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground break-all text-center leading-relaxed">
                  {pixCode}
                </p>
              </div>

              <Button
                onClick={copyPix}
                className="w-full h-12 text-base font-bold rounded-xl gap-2"
                style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
              >
                <Copy className="h-4 w-4" />
                Copiar código PIX
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Após o pagamento, a confirmação será automática ✅
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card className="shadow-sm">
            <CardContent className="p-10 flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-[hsl(var(--success))]" />
              <h3 className="text-xl font-bold text-foreground">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground text-center">
                Obrigado pela sua assinatura. Seu acesso foi liberado!
              </p>
              <Button
                onClick={() => navigate("/")}
                className="rounded-xl"
                style={{ backgroundColor: "hsl(24, 95%, 53%)", color: "white" }}
              >
                Voltar ao perfil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {step === "error" && (
          <Card className="shadow-sm">
            <CardContent className="p-10 flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <h3 className="text-xl font-bold text-foreground">Erro no pagamento</h3>
              <p className="text-muted-foreground text-center">{errorMsg}</p>
              <Button
                onClick={() => { setStep("form"); setErrorMsg(""); }}
                className="rounded-xl"
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
