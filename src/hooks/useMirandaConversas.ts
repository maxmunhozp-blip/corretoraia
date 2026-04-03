import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversa {
  id: string;
  titulo: string;
  created_at: string;
  updated_at: string;
}

export interface Mensagem {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
}

export function useMirandaConversas() {
  const { user } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all conversations
  const fetchConversas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("miranda_conversas")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversas(data as Conversa[]);
  }, [user]);

  useEffect(() => {
    fetchConversas();
  }, [fetchConversas]);

  // Load messages for a conversation
  const carregarMensagens = useCallback(async (conversaId: string) => {
    setConversaAtiva(conversaId);
    setLoading(true);
    const { data } = await supabase
      .from("miranda_mensagens")
      .select("*")
      .eq("conversa_id", conversaId)
      .order("created_at", { ascending: true });
    if (data) setMensagens(data as Mensagem[]);
    setLoading(false);
  }, []);

  // Create new conversation
  const novaConversa = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("miranda_conversas")
      .insert({ user_id: user.id, titulo: "Nova conversa" })
      .select()
      .single();
    if (data) {
      setConversas((prev) => [data as Conversa, ...prev]);
      setConversaAtiva(data.id);
      setMensagens([]);
      return data.id as string;
    }
    return null;
  }, [user]);

  // Delete conversation
  const deletarConversa = useCallback(async (id: string) => {
    await supabase.from("miranda_conversas").delete().eq("id", id);
    setConversas((prev) => prev.filter((c) => c.id !== id));
    if (conversaAtiva === id) {
      setConversaAtiva(null);
      setMensagens([]);
    }
  }, [conversaAtiva]);

  // Save a message
  const salvarMensagem = useCallback(async (conversaId: string, role: string, content: string) => {
    const { data } = await supabase
      .from("miranda_mensagens")
      .insert({ conversa_id: conversaId, role, content })
      .select()
      .single();
    if (data) setMensagens((prev) => [...prev, data as Mensagem]);
    return data;
  }, []);

  // Update conversation title
  const atualizarTitulo = useCallback(async (conversaId: string, titulo: string) => {
    await supabase
      .from("miranda_conversas")
      .update({ titulo, updated_at: new Date().toISOString() })
      .eq("id", conversaId);
    setConversas((prev) =>
      prev.map((c) => (c.id === conversaId ? { ...c, titulo } : c))
    );
  }, []);

  // Update last message in state (for streaming)
  const atualizarUltimaMensagem = useCallback((content: string) => {
    setMensagens((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
      }
      return [...prev, { id: crypto.randomUUID(), role: "assistant", content, created_at: new Date().toISOString() }];
    });
  }, []);

  return {
    conversas,
    conversaAtiva,
    mensagens,
    loading,
    setConversaAtiva,
    fetchConversas,
    carregarMensagens,
    novaConversa,
    deletarConversa,
    salvarMensagem,
    atualizarTitulo,
    atualizarUltimaMensagem,
    setMensagens,
  };
}
