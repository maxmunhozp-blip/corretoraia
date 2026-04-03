import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreVertical, UserPlus, AlertCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function UsuariosCorretora() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
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

  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ["corretora-usuarios", corretora_id, isMaster],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMaster && corretora_id) {
        query = query.eq("corretora_id", corretora_id);
      }

      const { data } = await query;
      return data ?? [];
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
  const limiteAtingido = !isMaster && maxUsuarios > 0 && ativos >= maxUsuarios;

  const convidarMutation = useMutation({
    mutationFn: async () => {
      const senha =
        form.senha || Math.random().toString(36).slice(-8) + "A1!";

      setEmailError("");

      try {
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
          let mensagem = "Erro ao convidar usuário";
          try {
            const parsed = JSON.parse(error.message);
            mensagem = parsed.error || mensagem;
          } catch {
            try {
              if (typeof error.context?.json === "function") {
                const parsed = await error.context.json();
                mensagem = parsed?.error || error.message || mensagem;
              } else {
                mensagem = error.message || mensagem;
              }
            } catch {
              mensagem = error.message || mensagem;
            }
          }

          setEmailError(
            mensagem.includes("já está cadastrado")
              ? "Este e-mail já está em uso. Tente outro endereço."
              : mensagem
          );
          return null;
        }

        if (data?.error) {
          const mensagem = typeof data.error === "string" ? data.error : "Erro ao convidar usuário";
          setEmailError(
            mensagem.includes("já está cadastrado")
              ? "Este e-mail já está em uso. Tente outro endereço."
              : mensagem
          );
          return null;
        }

        return { senha };
      } catch {
        setEmailError("Erro inesperado. Tente novamente.");
        return null;
      }
    },
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Usuário ${form.nome} convidado com sucesso!`);
      setOpen(false);
      setEmailError("");
      setForm({ nome: "", email: "", cargo: "", role: "vendedor", senha: "" });
      queryClient.invalidateQueries({
        queryKey: ["corretora-usuarios", corretora_id],
      });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corretora-usuarios"] });
      toast.success("Atualizado");
    },
  });

  const roleLabel = (r: string) =>
    r === "admin_corretora" ? "Administrador" : r === "vendedor" ? "Vendedor" : r === "gerente" ? "Gerente" : r === "master" ? "Master" : r;

  return (
    <PageWrapper
      title="Usuários"
      subtitle="Gerencie os usuários da sua corretora"
    >
      <div className="flex items-center justify-between mb-6 gap-4">
        {!isMaster && (
          <Badge
            variant="outline"
            className="bg-transparent text-sm py-1 px-3 shrink-0"
          >
            {ativos} de {maxUsuarios || "∞"} usuários (plano{" "}
            {corretora?.plano || "—"})
          </Badge>
        )}
        {isMaster && <div />}

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEmailError(""); }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DialogTrigger asChild>
                  <Button
                    className="bg-brand hover:bg-brand-hover text-white"
                    disabled={limiteAtingido}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Convidar usuário
                  </Button>
                </DialogTrigger>
              </span>
            </TooltipTrigger>
            {limiteAtingido && (
              <TooltipContent>
                Faça upgrade do plano para adicionar mais usuários
              </TooltipContent>
            )}
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para convidar um novo usuário para a corretora.
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
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_corretora">
                      Administrador
                    </SelectItem>
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
                disabled={
                  !form.nome || !form.email || convidarMutation.isPending
                }
                className="bg-brand hover:bg-brand-hover text-white"
              >
                {convidarMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {convidarMutation.isPending ? "Convidando..." : "Convidar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Cargo</th>
                  <th className="p-4 font-medium">Permissão</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsuarios ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b">
                        <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-8 ml-auto" /></td>
                      </tr>
                    ))}
                  </>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">Nenhum usuário encontrado</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Convide o primeiro usuário para começar</p>
                      <Button
                        size="sm"
                        className="mt-4 bg-brand hover:bg-brand-hover text-white"
                        onClick={() => setOpen(true)}
                        disabled={limiteAtingido}
                      >
                        <UserPlus className="h-3 w-3 mr-1" /> Convidar primeiro usuário
                      </Button>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u: any) => (
                    <tr
                      key={u.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-4 font-medium">{u.nome}</td>
                      <td className="p-4 text-muted-foreground">
                        {u.cargo || "—"}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-transparent">
                          {roleLabel(u.role)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`bg-transparent ${
                            u.ativo
                              ? "border-green-500 text-green-600"
                              : "border-red-500 text-red-600"
                          }`}
                        >
                          {u.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {u.id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleAtivoMutation.mutate({
                                    id: u.id,
                                    ativo: !u.ativo,
                                  })
                                }
                              >
                                {u.ativo ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {limiteAtingido && (
        <Card className="mt-6 border-brand bg-brand-light">
          <CardContent className="p-6">
            <p className="text-sm">
              Você está usando{" "}
              <strong>
                {ativos} de {maxUsuarios}
              </strong>{" "}
              usuários do plano{" "}
              <strong className="capitalize">{corretora?.plano}</strong>. Faça
              upgrade para adicionar mais.
            </p>
            <Button className="mt-3 bg-brand hover:bg-brand-hover text-white" size="sm">
              Ver planos
            </Button>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
