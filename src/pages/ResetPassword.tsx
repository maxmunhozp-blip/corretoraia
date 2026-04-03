import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Erro ao redefinir senha. Tente novamente.");
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
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-7 w-7 text-brand" />
          <span className="text-2xl font-bold text-foreground">Cora</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Defina sua nova senha
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder="Confirme a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-9" required />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand-hover">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
