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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { MoreVertical, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function UsuariosCorretora() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
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

  const corretora_id = (profile as any)?.corretora_id;

  const { data: usuarios = [] } = useQuery({
    queryKey: ["corretora-usuarios", corretora_id],
    queryFn: async () => {
      if (!corretora_id) return [];
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("corretora_id", corretora_id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!corretora_id,
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
  const limiteAtingido = maxUsuarios > 0 && ativos >= maxUsuarios;

  const convidarMutation = useMutation({
    mutationFn: async () => {
      const senha =
        form.senha || Math.random().toString(36).slice(-8) + "A1!";
      const { data, error } = await supabase.functions.invoke(
        "admin-create-user",
        {
          body: {
            email: form.email,
            password: senha,
            nome: form.nome,
            cargo: form.cargo || null,
            role: form.role,
            corretora_id,
          },
        }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return senha;
    },
    onSuccess: (senha) => {
      toast.success(`Usuário convidado. Senha: ${senha}`);
      setOpen(false);
      setForm({ nome: "", email: "", cargo: "", role: "vendedor", senha: "" });
      queryClient.invalidateQueries({
        queryKey: ["corretora-usuarios"],
      });
    },
    onError: (err: any) => {
      toast.error("Erro: " + err.message);
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
    r === "admin_corretora" ? "Administrador" : r === "vendedor" ? "Vendedor" : r === "gerente" ? "Gerente" : r;

  return (
    <PageWrapper
      title="Usuários"
      subtitle="Gerencie os usuários da sua corretora"
    >
      <div className="flex items-center justify-between mb-6">
        <Badge
          variant="outline"
          className="bg-transparent text-sm py-1 px-3"
        >
          {ativos} de {maxUsuarios || "∞"} usuários (plano{" "}
          {corretora?.plano || "—"})
        </Badge>

        <Dialog open={open} onOpenChange={setOpen}>
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
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
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
                {usuarios.map((u: any) => (
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
                ))}
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
