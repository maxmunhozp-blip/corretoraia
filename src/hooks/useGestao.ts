import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useExecutivos(search = "", tipo = "todos", apenasAtivos = true) {
  return useQuery({
    queryKey: ["gestao-executivos", search, tipo, apenasAtivos],
    queryFn: async () => {
      let q = supabase.from("gestao_executivos").select("*").order("nome");
      if (search) q = q.ilike("nome", `%${search}%`);
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      if (apenasAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExecutivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exec: {
      nome: string;
      cargo: string;
      empresa?: string;
      email?: string;
      telefone?: string;
      linkedin?: string;
      observacoes?: string;
      tipo: string;
    }) => {
      const { error } = await supabase.from("gestao_executivos").insert(exec);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-executivos"] });
      toast.success("Executivo cadastrado com sucesso");
    },
    onError: () => toast.error("Erro ao cadastrar executivo"),
  });
}

export function useUpdateExecutivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("gestao_executivos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-executivos"] });
      toast.success("Executivo atualizado");
    },
    onError: () => toast.error("Erro ao atualizar executivo"),
  });
}

export function useDeleteExecutivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gestao_executivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-executivos"] });
      toast.success("Executivo removido");
    },
    onError: () => toast.error("Erro ao remover executivo"),
  });
}

export function useGestaoStats() {
  return useQuery({
    queryKey: ["gestao-stats"],
    queryFn: async () => {
      const [execRes, clientesRes, propostasRes, profilesRes] = await Promise.all([
        supabase.from("gestao_executivos").select("tipo, ativo"),
        supabase.from("clientes").select("status"),
        supabase.from("propostas").select("status, valor_estimado"),
        supabase.from("profiles").select("ativo, cargo"),
      ]);
      
      const execs = execRes.data ?? [];
      const clientes = clientesRes.data ?? [];
      const propostas = propostasRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      const totalExecs = execs.filter(e => e.ativo).length;
      const execInternos = execs.filter(e => e.tipo === "interno" && e.ativo).length;
      const execExternos = execs.filter(e => e.tipo === "externo" && e.ativo).length;
      const clientesAtivos = clientes.filter(c => c.status === "ativo").length;
      const propostasAprovadas = propostas.filter(p => p.status === "aprovada");
      const receitaTotal = propostasAprovadas.reduce((s, p) => s + Number(p.valor_estimado ?? 0), 0);
      const equipeAtiva = profiles.filter(p => p.ativo).length;

      return { totalExecs, execInternos, execExternos, clientesAtivos, receitaTotal, equipeAtiva };
    },
  });
}
