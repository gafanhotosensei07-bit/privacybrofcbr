import { useState } from "react";
import { Shield, Check, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const plans = [
  {
    name: "Básico",
    price: "9,90",
    description: "Proteção essencial para seus dados pessoais",
    features: [
      "Monitoramento de dados pessoais",
      "Alertas de vazamento por e-mail",
      "Relatório mensal de privacidade",
      "Suporte por e-mail",
    ],
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "14,90",
    description: "Segurança avançada e controle total",
    features: [
      "Tudo do plano Básico",
      "Remoção automática de dados",
      "Alertas em tempo real",
      "Relatório semanal detalhado",
      "VPN integrada",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "22,90",
    description: "Máxima proteção para toda a família",
    features: [
      "Tudo do plano Profissional",
      "Proteção para até 5 pessoas",
      "Seguro contra roubo de identidade",
      "Consultoria de privacidade dedicada",
      "Navegador seguro exclusivo",
      "Gerenciador de senhas",
      "Suporte 24/7 por chat e telefone",
    ],
    highlighted: false,
  },
];

const Index = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleSelect = (planName: string) => {
    setSelectedPlan(planName);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Proteja sua Privacidade
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Escolha o plano ideal para manter seus dados seguros e ter controle total sobre sua privacidade online.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col transition-shadow hover:shadow-lg ${
                plan.highlighted
                  ? "border-2 border-primary shadow-md"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Star className="h-3 w-3" /> Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col pt-2">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ {plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelect(plan.name)}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  Assinar {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Todos os planos possuem garantia de 7 dias. Cancele a qualquer momento.
        </p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Assinatura</DialogTitle>
            <DialogDescription>
              Você selecionou o plano <strong>{selectedPlan}</strong>. 
              Em breve a integração de pagamento estará disponível.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowDialog(false)} className="w-full mt-2">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
