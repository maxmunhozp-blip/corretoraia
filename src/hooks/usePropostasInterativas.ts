import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PropostaInterativa {
  id: string;
  slug: string;
  corretora_id: string | null;
  criado_por: string | null;
  cliente_nome: string;
  cliente_empresa: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  dados: any;
  plano_atual: any;
  alternativas: any;
  valida_ate: string | null;
  status: string;
  visualizacoes: number;
  primeira_visualizacao_em: string | null;
  ultima_visualizacao_em: string | null;
  aceita_em: string | null;
  formato_padrao: string;
  created_at: string;
}

export function usePropostasInterativas() {
  return useQuery({
    queryKey: ["propostas-interativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propostas_interativas" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PropostaInterativa[];
    },
  });
}

export function usePropostaBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["proposta-interativa", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("propostas_interativas" as any)
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as unknown as PropostaInterativa;
    },
    enabled: !!slug,
  });
}

export function useCreatePropostaInterativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PropostaInterativa>) => {
      const { data, error } = await supabase
        .from("propostas_interativas" as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PropostaInterativa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas-interativas"] }),
  });
}

export function useUpdatePropostaInterativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropostaInterativa> & { id: string }) => {
      const { data, error } = await supabase
        .from("propostas_interativas" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PropostaInterativa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas-interativas"] }),
  });
}

export function useRegistrarVisualizacao() {
  return useMutation({
    mutationFn: async (slug: string) => {
      // Use RPC or direct update — since public can read, we need anon update
      // We'll use a simple approach: fetch then update via edge function or direct
      const { data: proposta } = await supabase
        .from("propostas_interativas" as any)
        .select("id, visualizacoes, primeira_visualizacao_em")
        .eq("slug", slug)
        .single();
      
      if (!proposta) return;
      const p = proposta as any;
      
      const updates: any = {
        visualizacoes: (p.visualizacoes || 0) + 1,
        ultima_visualizacao_em: new Date().toISOString(),
      };
      if (!p.primeira_visualizacao_em) {
        updates.primeira_visualizacao_em = new Date().toISOString();
        updates.status = "visualizada";
      }
      
      await supabase
        .from("propostas_interativas" as any)
        .update(updates)
        .eq("id", p.id);
    },
  });
}
