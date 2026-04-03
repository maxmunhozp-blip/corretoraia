import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SETORES = ["administrativo", "financeiro", "vendas", "marketing", "relacionamento", "pos_venda"] as const;
const PRIORIDADES = ["baixa", "media", "alta", "urgente"] as const;
const STATUS_LIST = ["solicitado", "em_analise", "em_desenvolvimento", "concluido", "cancelado"] as const;

export type Setor = typeof SETORES[number];
export type Prioridade = typeof PRIORIDADES[number];
export type StatusSolicitacao = typeof STATUS_LIST[number];

export { SETORES, PRIORIDADES, STATUS_LIST };

export function useSolicitacoes(filters: { setor: string; status: string; search: string }) {
  return useQuery({
    queryKey: ["solicitacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("solicitacoes" as any)
        .select("*, profiles:autor_id(nome, avatar_iniciais)")
        .order("created_at", { ascending: false });

      if (filters.setor !== "all") query = query.eq("setor", filters.setor);
      if (filters.status !== "all") query = query.eq("status", filters.status);
      if (filters.search) query = query.ilike("titulo", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useSolicitacaoVotos(solicitacaoId: string | null) {
  return useQuery({
    queryKey: ["solicitacao-votos", solicitacaoId],
    queryFn: async () => {
      if (!solicitacaoId) return [];
      const { data } = await supabase
        .from("solicitacao_votos" as any)
        .select("*, profiles:user_id(nome)")
        .eq("solicitacao_id", solicitacaoId);
      return (data || []) as any[];
    },
    enabled: !!solicitacaoId,
  });
}

export function useSolicitacaoComentarios(solicitacaoId: string | null) {
  return useQuery({
    queryKey: ["solicitacao-comentarios", solicitacaoId],
    queryFn: async () => {
      if (!solicitacaoId) return [];
      const { data } = await supabase
        .from("solicitacao_comentarios" as any)
        .select("*, profiles:autor_id(nome, avatar_iniciais)")
        .eq("solicitacao_id", solicitacaoId)
        .order("created_at", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!solicitacaoId,
  });
}

export function useVoteCounts() {
  return useQuery({
    queryKey: ["vote-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("solicitacao_votos" as any)
        .select("solicitacao_id, user_id");
      const counts: Record<string, number> = {};
      const userVotes: Record<string, boolean> = {};
      (data || []).forEach((v: any) => {
        counts[v.solicitacao_id] = (counts[v.solicitacao_id] || 0) + 1;
      });
      return { counts, allVotes: data || [] };
    },
  });
}

interface CreateSolicitacaoInput {
  titulo: string;
  descricao: string;
  setor: string;
  prioridade: string;
}

export function useCreateSolicitacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateSolicitacaoInput) => {
      const { data, error } = await supabase
        .from("solicitacoes" as any)
        .insert({ ...input, autor_id: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    },
  });
}

export function useUpdateSolicitacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("solicitacoes" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    },
  });
}

export function useToggleVoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      if (!user) throw new Error("Not authenticated");
      // Check if already voted
      const { data: existing } = await supabase
        .from("solicitacao_votos" as any)
        .select("id")
        .eq("solicitacao_id", solicitacaoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("solicitacao_votos" as any).delete().eq("id", (existing as any).id);
      } else {
        await supabase.from("solicitacao_votos" as any).insert({ solicitacao_id: solicitacaoId, user_id: user.id } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vote-counts"] });
      queryClient.invalidateQueries({ queryKey: ["solicitacao-votos"] });
    },
  });
}

export function useAddComentario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ solicitacaoId, conteudo }: { solicitacaoId: string; conteudo: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("solicitacao_comentarios" as any)
        .insert({ solicitacao_id: solicitacaoId, autor_id: user.id, conteudo } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["solicitacao-comentarios", vars.solicitacaoId] });
    },
  });
}
