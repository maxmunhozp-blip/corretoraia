import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, AlertCircle, Loader2, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { UserCard } from "@/components/usuarios/UserCard";

export default function UsuariosCorretora() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cargo: "",
    role: "vendedor",
    senha: "",
  });

  if (profile?.role !== "admin_corretora" && profile?.role !== "master") {
    return <Navigate to="/dashboard" replace />;
  }

  const isMaster = profile?.role === "master";
  const corretora_id = (profile as any)?.corretora_id;

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["corretora-usuarios", corretora_id, isMaster],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMaster && corretora_id) {
        query = query.eq("corretora_id", corretora_id);
      }

      const { data: profiles } = await query;
      if (!profiles?.length) return [];

      // Fetch emails from auth via edge function
      const userIds = profiles.map((p: any) => p.id);
      const { data: emailData } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "list-emails", user_ids: userIds },
      });

      const emailMap = emailData?.emails || {};
      return profiles.map((p: any) => ({ ...p, email: emailMap[p.id] || null }));
    },
    enabled: isMaster || !!corretora_id,
  });

  const { data: corretora } = useQuery({
    queryKey: ["minha-corretora", corretora_id],
    queryFn: async () => {
      if (!corretora_id) return null;
      const { data } = await supabase
        .from("corretoras")
        .select("*")
        .eq("id", corretora_id)
        .single();
      return data;
    },
    enabled: !!corretora_id,
  });

  const maxUsuarios = corretora?.max_usuarios ?? 3;
  const ativos = usuarios.filter((u: any) => u.ativo).length;
  const limiteAtingido = isMaster ? false : maxUsuarios > 0 && ativos >= maxUsuarios;

  const filteredUsuarios = usuarios.filter((u: any) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    return (
      u.nome?.toLowerCase().includes(term) ||
      u.cargo?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const convidarMutation = useMutation({
    mutationFn: async () => {
      const senha = form.senha || Math.random().toString(36).slice(-8) + "A1!";
      setEmailError("");

      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: form.email,
          password: senha,
          nome: form.nome,
          cargo: form.cargo || null,
          role: form.role,
          corretora_id,
        },
      });

      if (error) {
        let msg = "Erro ao convidar usuário";
        try {
          const parsed = JSON.parse(error.message);
          msg = parsed.error || msg;
        } catch {
          msg = error.message || msg;
        }
        setEmailError(msg);
        return null;
      }

      if (data?.error) {
        setEmailError(typeof data.error === "string" ? data.error : "Erro ao convidar usuário");
        return null;
      }

      return { senha };
    },
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Usuário ${form.nome} convidado com sucesso!`);
      setOpen(false);
      setEmailError("");
      setForm({ nome: "", email: "", cargo: "", role: "vendedor", senha: "" });
      queryClient.invalidateQueries({ queryKey: ["corretora-usuarios"] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["corretora-usuarios"] });
  };

  return (
    <PageWrapper title="Usuários" subtitle="Gestão completa de usuários, acessos e permissões">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          {!isMaster && (
            <Badge variant="outline" className="bg-transparent text-xs py-1 px-2 shrink-0 whitespace-nowrap">
              {ativos}/{maxUsuarios || "∞"} usuários
            </Badge>
          )}
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEmailError(""); }}>
          <DialogTrigger asChild>
            <Button
              className="bg-brand hover:bg-brand-hover text-white"
              disabled={limiteAtingido}
            >
              <UserPlus className="h-4 w-4 mr-1" /> Convidar usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para convidar um novo usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome completo *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(""); }}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Corretor Sênior"
                />
              </div>
              <div>
                <Label>Permissão</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_corretora">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Senha inicial</Label>
                <Input
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder="Gerada automaticamente"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => convidarMutation.mutate()}
                disabled={!form.nome || !form.email || convidarMutation.isPending}
                className="bg-brand hover:bg-brand-hover text-white"
              >
                {convidarMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {convidarMutation.isPending ? "Convidando..." : "Convidar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              {busca ? "Nenhum usuário encontrado para essa busca" : "Nenhum usuário cadastrado"}
            </p>
            {!busca && (
              <Button
                size="sm"
                className="mt-4 bg-brand hover:bg-brand-hover text-white"
                onClick={() => setOpen(true)}
                disabled={limiteAtingido}
              >
                <UserPlus className="h-3 w-3 mr-1" /> Convidar primeiro usuário
              </Button>
            )}
          </div>
        ) : (
          filteredUsuarios.map((u: any) => (
            <UserCard
              key={u.id}
              usuario={u}
              isCurrentUser={u.id === user?.id}
              isMaster={isMaster}
              onUpdated={handleRefresh}
            />
          ))
        )}
      </div>

      {limiteAtingido && (
        <div className="mt-6 rounded-lg border border-brand bg-brand-light p-6">
          <p className="text-sm">
            Você está usando <strong>{ativos} de {maxUsuarios}</strong> usuários do plano{" "}
            <strong className="capitalize">{corretora?.plano}</strong>. Faça upgrade para adicionar mais.
          </p>
          <Button className="mt-3 bg-brand hover:bg-brand-hover text-white" size="sm">
            Ver planos
          </Button>
        </div>
      )}
    </PageWrapper>
  );
}
