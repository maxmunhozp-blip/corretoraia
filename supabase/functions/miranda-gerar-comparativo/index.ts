import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { arquivo_pdf_base64, mensagem } = await req.json();

    if (!arquivo_pdf_base64) {
      return new Response(JSON.stringify({ error: "PDF não enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const extractionPrompt = `Você é um especialista em análise de planos de saúde com experiência em TODAS as operadoras brasileiras (Bradesco Saúde, SulAmérica, Amil, Unimed, Notre Dame Intermédica, Hapvida, Porto Seguro Saúde, Omint, Medial, Golden Cross, entre outras).

Sua tarefa é analisar este PDF de comparativo de planos e extrair TODOS os dados estruturados, independente do formato ou layout do documento.

Contexto adicional do usuário: ${mensagem || "Gere o relatório comparativo."}

REGRAS DE EXTRAÇÃO:
1. O PDF pode ter QUALQUER formato: tabelas horizontais, verticais, múltiplas páginas, com ou sem IOF, com ou sem consolidação.
2. Identifique QUAL é o plano atual do cliente (geralmente destacado, na primeira coluna, ou indicado como "atual/vigente").
3. Identifique TODOS os beneficiários/vidas com seus nomes, idades e valores por plano.
4. Se o PDF não tiver consolidação explícita, CALCULE a consolidação somando os valores de cada alternativa e comparando com o plano atual.
5. Para valores não disponíveis ou "sob consulta", use 0.
6. Se houver valores com IOF e sem IOF, prefira os valores COM IOF.
7. Extraia a data de referência do documento. Se não encontrar, use a data atual.
8. O título deve refletir o conteúdo (ex: "Comparativo de Planos - Empresa XYZ").
9. Se o PDF tiver informações sobre coparticipação, rede credenciada ou acomodação, inclua no campo observacoes_gerais.

IMPORTANTE: Retorne os dados via a tool/function fornecida. Extraia TODOS os beneficiários e TODAS as alternativas de planos encontrados no documento.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: extractionPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os dados deste relatório comparativo de planos de saúde e retorne via a tool fornecida. Analise cuidadosamente o layout, identifique todas as operadoras, beneficiários e valores." },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${arquivo_pdf_base64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extrair_dados_comparativo",
              description: "Retorna os dados extraídos do comparativo de planos de saúde em formato estruturado",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título do relatório, ex: 'Comparativo de Planos - Empresa ABC'" },
                  plano_atual: {
                    type: "object",
                    properties: {
                      nome: { type: "string", description: "Nome do plano atual" },
                      operadora: { type: "string", description: "Operadora do plano atual" },
                    },
                    required: ["nome", "operadora"],
                  },
                  beneficiarios: {
                    type: "array",
                    description: "Lista de TODOS os beneficiários encontrados no PDF",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        idade: { type: "number" },
                        valor_atual: { type: "number", description: "Valor mensal atual em reais" },
                        alternativas: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              plano: { type: "string" },
                              operadora: { type: "string" },
                              valor: { type: "number", description: "Valor mensal em reais, 0 se não disponível" },
                            },
                            required: ["plano", "operadora", "valor"],
                          },
                        },
                      },
                      required: ["nome", "idade", "valor_atual", "alternativas"],
                    },
                  },
                  consolidacao: {
                    type: "array",
                    description: "Consolidação de economia por alternativa. Se não presente no PDF, calcule somando valores dos beneficiários.",
                    items: {
                      type: "object",
                      properties: {
                        plano: { type: "string" },
                        operadora: { type: "string" },
                        total_iof: { type: "number", description: "Total mensal com IOF" },
                        reducao_mensal: { type: "number", description: "Economia mensal comparada ao plano atual (valor positivo)" },
                        reducao_anual: { type: "number", description: "Economia anual (valor positivo)" },
                        percentual_reducao: { type: "number", description: "Percentual de redução (valor positivo)" },
                      },
                      required: ["plano", "operadora", "total_iof", "reducao_mensal", "reducao_anual", "percentual_reducao"],
                    },
                  },
                  observacoes_gerais: { type: "string", description: "Informações adicionais encontradas no PDF: coparticipação, rede, acomodação, carências, etc." },
                  data_referencia: { type: "string", description: "Data de referência do comparativo (ex: Março/2026)" },
                },
                required: ["titulo", "plano_atual", "beneficiarios", "consolidacao", "data_referencia"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extrair_dados_comparativo" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na sua conta." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao processar PDF com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "IA não conseguiu extrair dados do PDF. Verifique se é um comparativo de planos válido." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("miranda-gerar-comparativo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
