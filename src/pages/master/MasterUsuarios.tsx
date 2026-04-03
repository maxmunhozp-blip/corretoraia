import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MasterUsuarios() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState("todos");
  const [filtroCorretora, setFiltroCorretora] = useState("todos");

  const { data: profiles = [] } = useQuery({
    queryKey: ["master-all-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: corretoras = [] } = useQuery({
    queryKey: ["master-corretoras"],
    queryFn: async () => {
      const { data } = await supabase.from("corretoras").select("id, nome");
      return data ?? [];
    },
  });

  const corretoraMap = Object.fromEntries(
    corretoras.map((c: any) => [c.id, c.nome])
  );

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-all-profiles"] });
      toast.success("Usuário atualizado");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-all-profiles"] });
      toast.success("Role atualizado");
    },
  });

  const filtered = profiles.filter((p: any) => {
    const matchBusca =
      !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchRole = filtroRole === "todos" || p.role === filtroRole;
    const matchCorretora =
      filtroCorretora === "todos" ||
      (filtroCorretora === "sem" ? !p.corretora_id : p.corretora_id === filtroCorretora);
    return matchBusca && matchRole && matchCorretora;
  });

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      master: "Master",
      admin_corretora: "Admin",
      corretor: "Corretor",
      vendedor: "Vendedor",
    };
    return map[role] || role;
  };

  return (
    <PageWrapper
      title="Usuários"
      subtitle="Todos os usuários de todas as corretoras"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroRole} onValueChange={setFiltroRole}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="admin_corretora">Admin</SelectItem>
            <SelectItem value="corretor">Corretor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroCorretora} onValueChange={setFiltroCorretora}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Corretora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="sem">Sem corretora</SelectItem>
            {corretoras.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Corretora</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Último acesso</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div>
                        <span className="font-medium">{p.nome}</span>
                        <span className="block text-xs text-muted-foreground">
                          {p.cargo || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-transparent">
                        {roleLabel(p.role)}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {p.corretora_id
                        ? corretoraMap[p.corretora_id] || "—"
                        : "—"}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={`bg-transparent ${
                          p.ativo
                            ? "border-green-500 text-green-600"
                            : "border-red-500 text-red-600"
                        }`}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {p.ultimo_acesso
                        ? format(new Date(p.ultimo_acesso), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
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
                                id: p.id,
                                ativo: !p.ativo,
                              })
                            }
                          >
                            {p.ativo ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          {p.role !== "master" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    id: p.id,
                                    role: "admin_corretora",
                                  })
                                }
                              >
                                Tornar Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    id: p.id,
                                    role: "corretor",
                                  })
                                }
                              >
                                Tornar Corretor
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Nenhum usuário encontrado
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
