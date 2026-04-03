import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get the last user message to search knowledge base
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    // Search knowledge base for relevant content
    let knowledgeContext = "";
    if (lastUserMsg.length > 3) {
      const keywords = lastUserMsg.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
      const searchTerms = keywords.map((k: string) => `conteudo_extraido.ilike.%${k}%`);

      const { data: docs } = await supabase
        .from("base_conhecimento")
        .select("titulo, conteudo_extraido, categoria, fonte_url")
        .eq("status", "indexado")
        .or(searchTerms.join(","))
        .limit(3);

      if (docs && docs.length > 0) {
        knowledgeContext = "\n\n--- BASE DE CONHECIMENTO ---\n" +
          docs.map((d: any) => `📄 Documento: ${d.titulo}\nCategoria: ${d.categoria}\n${d.fonte_url ? `Fonte: ${d.fonte_url}\n` : ""}Conteúdo:\n${(d.conteudo_extraido || "").slice(0, 2000)}`).join("\n\n---\n\n");
      }
    }

    // Also fetch some operational data for context
    const [
      { count: propostasAtivas },
      { count: propostasPendentes },
      { data: alertasAtivos },
      { data: clientesRecentes },
    ] = await Promise.all([
      supabase.from("propostas").select("*", { count: "exact", head: true }).not("status", "in", '("cancelada","aprovada")'),
      supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "pendencia"),
      supabase.from("alertas").select("titulo, nivel, descricao").eq("resolvido", false).limit(5),
      supabase.from("clientes").select("nome, status, vidas").order("created_at", { ascending: false }).limit(5),
    ]);

    const operationalContext = `
--- DADOS OPERACIONAIS ---
Propostas ativas: ${propostasAtivas || 0}
Propostas com pendência: ${propostasPendentes || 0}
Alertas não resolvidos: ${alertasAtivos?.map((a: any) => `- [${a.nivel}] ${a.titulo}: ${a.descricao || ""}`).join("\n") || "Nenhum"}
Clientes recentes: ${clientesRecentes?.map((c: any) => `- ${c.nome} (${c.status}, ${c.vidas} vidas)`).join("\n") || "Nenhum"}
`;

    const systemPrompt = `Você é a Miranda, assistente de IA da plataforma Cora para corretoras de planos de saúde.

Suas capacidades:
- Responder dúvidas sobre regras comerciais, carências, coberturas e preços de operadoras
- Consultar dados de propostas, clientes e alertas do sistema
- Buscar informações na base de conhecimento indexada
- Ajudar corretores com tarefas do dia a dia

Regras:
- Seja concisa mas completa
- Use negrito (**texto**) para destacar informações importantes
- Quando usar dados da base de conhecimento, cite a fonte: "De acordo com o documento [título]..."
- Se não souber, diga claramente e sugira alternativas
- Mantenha tom profissional mas amigável
- Responda sempre em português do Brasil

${operationalContext}
${knowledgeContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("miranda-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
