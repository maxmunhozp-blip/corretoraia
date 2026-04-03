import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientes(filters: { search: string; tipo: string; status: string; operadora: string }) {
  return useQuery({
    queryKey: ["clientes", filters],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("*, operadoras:operadora_id(nome), profiles:responsavel_id(nome)")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,empresa.ilike.%${filters.search}%`);
      }
      if (filters.tipo !== "all") {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.operadora !== "all") {
        query = query.eq("operadora_id", filters.operadora);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useClienteDetail(id: string | null) {
  return useQuery({
    queryKey: ["cliente-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clientes")
        .select("*, operadoras:operadora_id(nome), profiles:responsavel_id(nome)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useClientePropostas(clienteNome: string | null) {
  return useQuery({
    queryKey: ["cliente-propostas", clienteNome],
    queryFn: async () => {
      if (!clienteNome) return [];
      const { data } = await supabase
        .from("propostas")
        .select("id, cliente_nome, status, valor_estimado, vidas, created_at")
        .ilike("cliente_nome", `%${clienteNome}%`)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!clienteNome,
  });
}

export function useClienteAlertas(clienteId: string | null) {
  return useQuery({
    queryKey: ["cliente-alertas", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data } = await supabase
        .from("alertas")
        .select("*")
        .eq("cliente_id", clienteId)
        .eq("resolvido", false)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!clienteId,
  });
}

interface CreateClienteInput {
  nome: string;
  tipo?: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  operadora_id?: string;
  vidas?: number;
  valor_mensalidade?: number;
  responsavel_id?: string;
  status?: string;
  observacoes?: string;
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClienteInput) => {
      const { data, error } = await supabase.from("clientes").insert(input).select().single();
      if (error) throw error;
      await supabase.from("atividades").insert({
        tipo: "cliente_cadastrado",
        descricao: `Novo cliente cadastrado: ${input.nome} (${input.tipo || "PF"})`,
        entidade_tipo: "cliente",
        entidade_id: data.id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CreateClienteInput & { id: string }) => {
      const { data, error } = await supabase.from("clientes").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente-detail"] });
    },
  });
}
