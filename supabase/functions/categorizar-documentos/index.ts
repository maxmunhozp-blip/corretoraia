import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { arquivos } = await req.json() as {
      arquivos: { nome: string; caminho: string; tipo: string; tamanho: number }[];
    };

    if (!arquivos || !Array.isArray(arquivos) || arquivos.length === 0) {
      return new Response(JSON.stringify({ error: "Lista de arquivos vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fileList = arquivos.map((a, i) => `${i + 1}. Nome: "${a.nome}" | Caminho: "${a.caminho}" | Tipo: ${a.tipo} | Tamanho: ${a.tamanho}`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um classificador de documentos para uma corretora de planos de saúde. Analise os nomes e caminhos dos arquivos e classifique cada um.

Categorias disponíveis:
- regras_comerciais: Regras comerciais, condições gerais, normas de vendas
- tabela_preco: Tabelas de preço, cotações, valores de planos
- rede_credenciada: Rede credenciada, hospitais, clínicas, laboratórios
- manual: Manuais, guias, tutoriais
- contrato: Contratos, aditivos, termos
- treinamento: Material de treinamento, apresentações
- comunicado: Comunicados, informativos, circulares
- formulario: Formulários, declarações, fichas
- relatorio: Relatórios, análises, estudos
- outro: Não se encaixa em nenhuma categoria acima

Tente também identificar a operadora pelo nome do arquivo/caminho. Operadoras comuns: Amil, Bradesco, SulAmérica, Unimed, NotreDame, Porto Seguro, Hapvida, Prevent Senior, Assim, Golden Cross.

Retorne APENAS o JSON.`,
          },
          {
            role: "user",
            content: `Classifique estes ${arquivos.length} arquivos:\n\n${fileList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classificar_arquivos",
              description: "Classifica uma lista de arquivos com categoria e operadora identificada",
              parameters: {
                type: "object",
                properties: {
                  classificacoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        indice: { type: "number", description: "Índice do arquivo (começando em 0)" },
                        categoria: {
                          type: "string",
                          enum: ["regras_comerciais", "tabela_preco", "rede_credenciada", "manual", "contrato", "treinamento", "comunicado", "formulario", "relatorio", "outro"],
                        },
                        operadora_detectada: { type: "string", description: "Nome da operadora detectada ou vazio se não identificada" },
                        titulo_sugerido: { type: "string", description: "Título limpo e descritivo para o documento" },
                      },
                      required: ["indice", "categoria", "titulo_sugerido"],
                    },
                  },
                },
                required: ["classificacoes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classificar_arquivos" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Erro ao classificar documentos");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("IA não retornou classificação");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorizar-documentos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
