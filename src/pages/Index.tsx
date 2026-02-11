import { useState, useRef, useCallback } from "react";
import { Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SignatureCanvas from "@/components/SignatureCanvas";

const PRIVACY_TEXT = [
  { title: "1. Introdução", content: "Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais. Ao utilizar nossos serviços, você concorda com as práticas descritas neste documento." },
  { title: "2. Coleta de Dados", content: "Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e dados de identificação. Também podemos coletar dados automaticamente, como endereço IP, tipo de navegador e páginas acessadas." },
  { title: "3. Uso dos Dados", content: "Utilizamos seus dados para fornecer e melhorar nossos serviços, personalizar sua experiência, enviar comunicações relevantes e cumprir obrigações legais. Seus dados nunca serão vendidos a terceiros." },
  { title: "4. Armazenamento e Segurança", content: "Seus dados são armazenados em servidores seguros com criptografia de ponta a ponta. Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração ou destruição." },
  { title: "5. Compartilhamento", content: "Podemos compartilhar seus dados com parceiros de confiança apenas quando necessário para a prestação dos serviços, mediante acordo de confidencialidade, ou quando exigido por lei." },
  { title: "6. Seus Direitos", content: "Você tem o direito de acessar, corrigir, excluir ou portar seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através dos canais disponibilizados." },
  { title: "7. Cookies", content: "Utilizamos cookies e tecnologias semelhantes para melhorar a navegação, analisar o tráfego do site e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador." },
  { title: "8. Alterações", content: "Reservamo-nos o direito de atualizar esta política periodicamente. Quaisquer alterações significativas serão comunicadas por e-mail ou através de aviso em nosso site." },
];

const Index = () => {
  const [fullName, setFullName] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const canSign = hasSignature && agreed && fullName.trim().length > 2;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const progress = Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100));
    setReadProgress(progress);
  }, []);

  const handleSign = () => {
    const date = new Date();
    setSignedAt(date);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Assinatura de Privacidade</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{now.toLocaleDateString("pt-BR")} — {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </header>

        {/* Document */}
        <Card>
          <div className="px-6 pt-4 pb-1">
            <Progress value={readProgress} className="h-1.5" />
            <p className="mt-1 text-[11px] text-muted-foreground text-right">{readProgress}% lido</p>
          </div>
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[340px] overflow-y-auto px-6 pb-6 space-y-5"
            >
              {PRIVACY_TEXT.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{section.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signature area */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                placeholder="Digite seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <SignatureCanvas onSignatureChange={setHasSignature} />

            <div className="flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="agree" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
                Li e concordo com os termos da política de privacidade
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSign}
                disabled={!canSign}
                className="flex-1"
                style={canSign ? { backgroundColor: "hsl(142, 71%, 45%)", color: "white" } : undefined}
              >
                Assinar Documento
              </Button>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}>
                <Shield className="h-4 w-4 text-white" />
              </span>
              Documento Assinado!
            </DialogTitle>
            <DialogDescription>
              O documento de política de privacidade foi assinado com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signatário</span>
              <span className="font-medium text-foreground">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data/Hora</span>
              <span className="font-medium text-foreground">
                {signedAt?.toLocaleDateString("pt-BR")} às {signedAt?.toLocaleTimeString("pt-BR")}
              </span>
            </div>
          </div>
          <Button onClick={() => setShowSuccess(false)} className="w-full mt-2">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
