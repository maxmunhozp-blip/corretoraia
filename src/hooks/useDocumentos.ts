import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentos(filters: { search: string; categoria: string }) {
  return useQuery({
    queryKey: ["documentos", filters],
    queryFn: async () => {
      let query = supabase
        .from("documentos")
        .select("*, operadoras:operadora_id(nome)")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`titulo.ilike.%${filters.search}%`);
      }
      if (filters.categoria !== "todos") {
        if (filters.categoria === "pesquisas_web") {
          query = query.not("fonte_url", "is", null);
        } else {
          query = query.eq("categoria", filters.categoria);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

interface CreateDocumentoInput {
  titulo: string;
  categoria: string;
  operadora_id?: string;
  descricao?: string;
  tipo_arquivo?: string;
  arquivo_path?: string;
  fonte_url?: string;
  status?: string;
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDocumentoInput) => {
      const { data, error } = await supabase.from("documentos").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useUploadDocumento() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const { error } = await supabase.storage.from("documentos").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documentos").getPublicUrl(path);
      return data.publicUrl;
    },
  });
}
