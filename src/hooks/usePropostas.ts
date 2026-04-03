import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePropostas(filters: { search: string; status: string; responsavel: string }) {
  return useQuery({
    queryKey: ["propostas", filters],
    queryFn: async () => {
      let query = supabase
        .from("propostas")
        .select("*, operadoras:operadora_id(nome), profiles:responsavel_id(nome)")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.ilike("cliente_nome", `%${filters.search}%`);
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.responsavel !== "all") {
        query = query.eq("responsavel_id", filters.responsavel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useOperadoras() {
  return useQuery({
    queryKey: ["operadoras"],
    queryFn: async () => {
      const { data } = await supabase.from("operadoras").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });
}

interface CreatePropostaInput {
  cliente_nome: string;
  empresa?: string;
  operadora_id?: string;
  vidas: number;
  valor_estimado?: number;
  responsavel_id?: string;
  observacoes?: string;
}

export function useCreateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePropostaInput) => {
      const { data, error } = await supabase.from("propostas").insert(input).select().single();
      if (error) throw error;

      // Log activity
      await supabase.from("atividades").insert({
        tipo: "proposta_criada",
        descricao: `Proposta criada para ${input.cliente_nome}${input.vidas ? ` — ${input.vidas} vidas` : ""}`,
        entidade_tipo: "proposta",
        entidade_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}
