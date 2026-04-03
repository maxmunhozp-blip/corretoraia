import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeFilters {
  search: string;
  categoria: string;
}

export function useBaseConhecimento(filters: KnowledgeFilters) {
  return useQuery({
    queryKey: ["base_conhecimento", filters],
    queryFn: async () => {
      let query = supabase
        .from("base_conhecimento" as any)
        .select("*, operadoras:operadora_id(nome), conteudo_extraido, descricao")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,conteudo_extraido.ilike.%${filters.search}%`);
      }
      if (filters.categoria !== "todos") {
        if (filters.categoria === "pesquisas_web") {
          query = query.eq("tipo", "web");
        } else {
          query = query.eq("categoria", filters.categoria);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: (query) => {
      // Poll every 3s if any items are still processing
      const data = query.state.data;
      if (data && data.some((d: any) => d.status === "processando")) return 3000;
      return false;
    },
  });
}

interface CreateKnowledgeInput {
  titulo: string;
  tipo: string;
  categoria: string;
  operadora_id?: string;
  descricao?: string;
  arquivo_url?: string;
  fonte_url?: string;
  status?: string;
  adicionado_por?: string;
}

export function useCreateConhecimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateKnowledgeInput) => {
      const { data, error } = await supabase
        .from("base_conhecimento" as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["base_conhecimento"] });
    },
  });
}

export function useDeleteConhecimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("base_conhecimento" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["base_conhecimento"] });
    },
  });
}

export function useUploadConhecimento() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const { error } = await supabase.storage.from("conhecimento").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("conhecimento").getPublicUrl(path);
      return data.publicUrl;
    },
  });
}

export function useProcessarConhecimento() {
  return useMutation({
    mutationFn: async (params: { id: string; tipo: string; arquivo_url?: string; busca_web?: string }) => {
      const { data, error } = await supabase.functions.invoke("processar-conhecimento", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
}
