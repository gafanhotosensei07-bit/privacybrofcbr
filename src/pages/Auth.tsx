import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/logo-icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(128, "Senha muito longa"),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
});

const sanitizeErrorMessage = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login")) return "Email ou senha incorretos.";
  if (lower.includes("already registered") || lower.includes("already been registered"))
    return "Este email já está cadastrado. Tente fazer login.";
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos.";
  if (lower.includes("weak password") || lower.includes("password"))
    return "Senha fraca. Use pelo menos 6 caracteres.";
  return "Ocorreu um erro. Tente novamente.";
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Client-side validation
      const schema = isLogin ? loginSchema : signupSchema;
      const parsed = schema.safeParse({ email, password, ...(isLogin ? {} : { displayName }) });
      if (!parsed.success) {
        toast({
          title: "Dados inválidos",
          description: parsed.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: sanitizeErrorMessage(err.message || ""),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img
            src={logoIcon}
            alt="Privacy"
            className="h-16 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="text-xl font-bold text-foreground text-center mb-6">
            {isLogin ? "Entrar" : "Criar conta"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Nome de exibição"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-bold rounded-xl text-white"
              style={{ backgroundColor: "hsl(24, 95%, 53%)" }}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-[hsl(24,95%,53%)] hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
