import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Flame, Clock, ShieldCheck } from "lucide-react";
import { useBackRedirect } from "@/hooks/useBackRedirect";
import logoIcon from "@/assets/logo-icon.png";

interface BackPromoModalProps {
  /** Model slug to redirect to checkout */
  modelSlug?: string;
  modelName?: string;
  /** Discount text to show */
  discountText?: string;
  /** Price to display */
  originalPrice?: string;
  promoPrice?: string;
}

const BackPromoModal = ({
  modelSlug,
  modelName = "sua criadora favorita",
  discountText = "50% OFF",
  originalPrice = "29,90",
  promoPrice = "14,90",
}: BackPromoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    setIsOpen(true);
  }, []);

  useBackRedirect(handleBack);

  if (!isOpen) return null;

  const handleAccept = () => {
    setIsOpen(false);
    if (modelSlug) {
      navigate(`/checkout?modelo=${modelSlug}&promo=back50`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scale-in bg-background border border-border">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header gradient */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, hsl(24,95%,53%) 0%, hsl(340,80%,55%) 100%)",
          }}
        >
          <img src={logoIcon} alt="Privacy" className="h-10 mx-auto mb-3 brightness-0 invert" />
          <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Clock className="h-3 w-3" /> OFERTA POR TEMPO LIMITADO
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">
            ESPERA! 🔥
          </h2>
          <p className="text-white/90 text-sm mt-2 leading-relaxed">
            Não perca acesso exclusivo a <strong>{modelName}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Discount badge */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-muted-foreground line-through text-lg">
              R$ {originalPrice}
            </span>
            <span className="text-3xl font-black text-[hsl(24,95%,53%)]">
              R$ {promoPrice}
            </span>
            <span className="bg-[hsl(340,80%,55%)] text-white text-xs font-bold px-2 py-1 rounded-full">
              {discountText}
            </span>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Flame className="h-4 w-4 text-[hsl(24,95%,53%)] flex-shrink-0" />
              <span>Conteúdo exclusivo e sem censura</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <ShieldCheck className="h-4 w-4 text-[hsl(24,95%,53%)] flex-shrink-0" />
              <span>Acesso imediato e seguro</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Clock className="h-4 w-4 text-[hsl(24,95%,53%)] flex-shrink-0" />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAccept}
            className="w-full rounded-full py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, hsl(24,95%,53%) 0%, hsl(340,80%,55%) 100%)",
            }}
          >
            🔥 QUERO APROVEITAR AGORA
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackPromoModal;
