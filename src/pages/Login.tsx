import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos. Tente novamente.");
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div
        className="w-full max-w-[420px] rounded-xl border border-border bg-card p-8 shadow-lg opacity-0"
        style={{ animation: "staggerIn 0.4s ease-out forwards" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-7 w-7 text-brand" />
          <span className="text-2xl font-bold text-foreground">Cora</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Plataforma inteligente para corretoras
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              if (!email) {
                setError("Insira seu email para receber o link de redefinição.");
                return;
              }
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) {
                setError("Erro ao enviar email. Tente novamente.");
              } else {
                setError("");
                alert("Email de redefinição enviado! Verifique sua caixa de entrada.");
              }
            }}
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>
    </div>
  );
}
