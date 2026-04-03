import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Eye, Pencil, MoreVertical, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";

const planoPrecos: Record<string, number> = {
  starter: 500,
  profissional: 990,
  business: 1790,
  enterprise: 2500,
};

export default function MasterCorretoras() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPlano, setFiltroPlano] = useState("todos");

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    plano: "starter",
    status: "ativo",
    senha: "",
  });

  const { data: corretoras = [], isLoading } = useQuery({
    queryKey: ["master-corretoras"],
    queryFn: async () => {
      const { data } = await supabase
        .from("corretoras")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: userCounts = {} } = useQuery({
    queryKey: ["master-user-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("corretora_id")
        .not("corretora_id", "is", null);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        counts[p.corretora_id] = (counts[p.corretora_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create corretora
      const { data: corretora, error: corrError } = await supabase
        .from("corretoras")
        .insert({
          nome: form.nome,
          cnpj: form.cnpj || null,
          email: form.email,
          telefone: form.telefone || null,
          cidade: form.cidade || null,
          estado: form.estado || null,
          plano: form.plano,
          status: form.status,
          max_usuarios: planoPrecos[form.plano] ? undefined : 3,
        })
        .select()
        .single();

      if (corrError) throw corrError;

      // 2. Create admin user via edge function
      const senha = form.senha || Math.random().toString(36).slice(-8) + "A1!";
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "admin-create-user",
        {
          body: {
            email: form.email,
            password: senha,
            nome: form.nome + " (Admin)",
            cargo: "Administrador",
            role: "admin_corretora",
            corretora_id: corretora.id,
          },
        }
      );

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      return { corretora, senha };
    },
    onSuccess: ({ senha }) => {
      toast.success(
        `Corretora cadastrada. Login: ${form.email} / Senha: ${senha}`
      );
      setOpen(false);
      setForm({
        nome: "",
        cnpj: "",
        email: "",
        telefone: "",
        cidade: "",
        estado: "",
        plano: "starter",
        status: "ativo",
        senha: "",
      });
      queryClient.invalidateQueries({ queryKey: ["master-corretoras"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao cadastrar: " + err.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("corretoras")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-corretoras"] });
      toast.success("Status atualizado");
    },
  });

  const filtered = corretoras.filter((c: any) => {
    const matchBusca =
      !busca ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(busca));
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    const matchPlano = filtroPlano === "todos" || c.plano === filtroPlano;
    return matchBusca && matchStatus && matchPlano;
  });

  const statusBadge = (c: any) => {
    const map: Record<string, string> = {
      ativo: "border-green-500 text-green-600",
      trial: "border-amber-500 text-amber-600",
      suspenso: "border-red-500 text-red-600",
      cancelado: "border-gray-400 text-gray-500",
    };
    let label = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    if (c.status === "ativo" && c.trial_expira_em) {
      const days = differenceInDays(new Date(c.trial_expira_em), new Date());
      if (days > 0 && days <= 14) {
        label = `Trial • ${days}d`;
      }
    }
    return (
      <Badge variant="outline" className={`bg-transparent ${map[c.status] || ""}`}>
        {label}
      </Badge>
    );
  };

  const handleImpersonate = (c: any) => {
    startImpersonation({
      id: c.id,
      nome: c.nome,
      plano: c.plano,
      status: c.status,
    });
    navigate("/dashboard");
  };

  return (
    <PageWrapper
      title="Corretoras"
      subtitle="Gerencie todas as corretoras cadastradas"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPlano} onValueChange={setFiltroPlano}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="profissional">Profissional</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="h-4 w-4 mr-1" /> Cadastrar Corretora
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Corretora</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="col-span-2">
                <Label>Nome da corretora *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
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
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Plano</Label>
                <Select
                  value={form.plano}
                  onValueChange={(v) => setForm({ ...form, plano: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - R$ 500</SelectItem>
                    <SelectItem value="profissional">
                      Profissional - R$ 990
                    </SelectItem>
                    <SelectItem value="business">
                      Business - R$ 1.790
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise - R$ 2.500
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status Inicial</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Senha inicial (deixe vazio para gerar)</Label>
                <Input
                  type="text"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder="Gerada automaticamente"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  !form.nome || !form.email || createMutation.isPending
                }
                className="bg-brand hover:bg-brand-hover text-white"
              >
                {createMutation.isPending ? "Salvando..." : "Cadastrar"}
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
                  <th className="p-4 font-medium">Corretora</th>
                  <th className="p-4 font-medium">CNPJ</th>
                  <th className="p-4 font-medium">Plano</th>
                  <th className="p-4 font-medium">Usuários</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Cadastro</th>
                  <th className="p-4 font-medium text-right">MRR</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium">{c.nome}</td>
                    <td className="p-4 text-muted-foreground">
                      {c.cnpj || "—"}
                    </td>
                    <td className="p-4 capitalize">{c.plano}</td>
                    <td className="p-4">
                      {(userCounts as any)[c.id] || 0} / {c.max_usuarios || "∞"}
                    </td>
                    <td className="p-4">{statusBadge(c)}</td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(c.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="p-4 text-right">
                      R${" "}
                      {(planoPrecos[c.plano] || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Visualizar"
                          onClick={() => handleImpersonate(c)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                            {c.status !== "suspenso" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: c.id,
                                    status: "suspenso",
                                  })
                                }
                              >
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {c.status === "suspenso" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: c.id,
                                    status: "ativo",
                                  })
                                }
                              >
                                Reativar
                              </DropdownMenuItem>
                            )}
                            {c.status !== "cancelado" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: c.id,
                                    status: "cancelado",
                                  })
                                }
                              >
                                Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {isLoading
                        ? "Carregando..."
                        : "Nenhuma corretora encontrada"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
