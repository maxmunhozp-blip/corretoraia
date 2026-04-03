import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Supabase admin client ── */
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/* ── Build a cache key from search params ── */
function buildCacheKey(nome: string, cnpj?: string): string {
  const normalized = nome.trim().toLowerCase().replace(/\s+/g, " ");
  const cnpjClean = cnpj ? cnpj.replace(/\D/g, "") : "";
  return cnpjClean ? `${normalized}::${cnpjClean}` : normalized;
}

/* ── DuckDuckGo HTML search ── */
async function searchDuckDuckGo(query: string): Promise<{ titulo: string; url: string; descricao: string }[]> {
  try {
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CoraBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    const html = await resp.text();

    const results: { titulo: string; url: string; descricao: string }[] = [];
    const resultBlocks = html.split(/class="result\s/);
    for (let i = 1; i < Math.min(resultBlocks.length, 6); i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/class="result__a"\s+href="([^"]+)"/);
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|span)>/);

      const titulo = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";
      let url = urlMatch ? urlMatch[1] : "";
      if (url.includes("uddg=")) {
        try { url = decodeURIComponent(url.split("uddg=")[1].split("&")[0]); } catch {}
      }
      const descricao = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";

      if (titulo) results.push({ titulo, url, descricao });
    }
    return results;
  } catch (e) {
    console.error("DDG search error:", e);
    return [];
  }
}

/* ── ReceitaWS CNPJ lookup ── */
async function lookupCNPJ(cnpj: string): Promise<Record<string, any> | null> {
  try {
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) return null;
    const resp = await fetch(`https://receitaws.com.br/v1/cnpj/${clean}`, {
      headers: { Accept: "application/json" },
    });
    if (resp.status === 429) { console.warn("ReceitaWS rate limited"); return null; }
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status === "ERROR") return null;
    return data;
  } catch (e) {
    console.error("ReceitaWS error:", e);
    return null;
  }
}

/* ── Fetch site content ── */
async function fetchSiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CoraBot/1.0)" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const html = await resp.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    let content = "";
    if (titleMatch) content += `Título: ${titleMatch[1].trim()}\n`;
    if (metaDescMatch) content += `Descrição: ${metaDescMatch[1].trim()}\n`;
    if (bodyMatch) {
      const bodyText = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      content += bodyText;
    }
    return content.slice(0, 2000);
  } catch {
    return null;
  }
}

/* ── Find official site from search results ── */
function findOfficialSite(results: { url: string }[], nome: string): string | null {
  const skip = ["reclameaqui", "facebook", "instagram", "linkedin", "google", "wikipedia", "youtube", "twitter"];
  const nameParts = nome.toLowerCase().split(/\s+/).filter(p => p.length > 3);

  for (const r of results) {
    try {
      const hostname = new URL(r.url).hostname.toLowerCase();
      if (skip.some(s => hostname.includes(s))) continue;
      if (nameParts.some(p => hostname.includes(p))) return r.url;
    } catch {}
  }
  return null;
}

/* ── Default fallback profile ── */
const DEFAULT_PROFILE = {
  perfil: {
    porte: "pequena",
    setor: "não identificado",
    setor_descricao: "",
    tempo_mercado: "",
    cidade: "",
    estado: "",
    posicionamento: "",
    tom_comunicacao: "semiformal",
    numero_funcionarios_estimado: "",
    contexto_relevante: "Empresa sem dados públicos suficientes",
  },
  personalizacao: {
    frase_abertura_capa: "Sua equipe merece o melhor cuidado.",
    paragrafo_abertura: "Preparamos esta proposta com atenção especial para atender às necessidades da sua empresa.",
    paragrafo_quem_somos: "",
    destaque_principal: "economia",
    argumento_chave: "Planos com excelente cobertura e preço justo para empresas como a sua.",
    cta_personalizado: "Vamos conversar sobre o melhor plano para sua equipe?",
    tom_instrucao: "",
  },
  insights: [
    "Dados públicos limitados — buscar informações diretamente com o cliente",
    "Abordagem consultiva recomendada: fazer perguntas sobre a equipe antes de apresentar",
    "Focar em custo-benefício como argumento principal",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nome, cnpj, cidade, site, force_refresh } = await req.json();
    if (!nome) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAdmin = getSupabaseAdmin();
    const cacheKey = buildCacheKey(nome, cnpj);

    // ── CHECK CACHE (unless force_refresh) ──
    if (!force_refresh) {
      const { data: cached } = await supabaseAdmin
        .from("pesquisa_cliente_cache")
        .select("resultado, criado_em, expira_em")
        .eq("chave_busca", cacheKey)
        .gt("expira_em", new Date().toISOString())
        .order("criado_em", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        console.log(`Cache hit for "${nome}" (key: ${cacheKey})`);
        const result = cached.resultado as Record<string, any>;
        result._from_cache = true;
        result._cached_at = cached.criado_em;
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── STEP 1: DuckDuckGo searches in parallel ──
    const queries = [
      `"${nome}" CNPJ site oficial`,
      `"${nome}" ${cidade || ""} plano saúde empresa funcionários`,
      `"${nome}" sobre missão valores empresa`,
      `"${nome}" LinkedIn OR Instagram`,
    ];

    const ddgResults = await Promise.all(
      queries.map(q => searchDuckDuckGo(q).catch(() => []))
    );
    const allResults = ddgResults.flat();

    // ── STEP 2: CNPJ lookup ──
    let cnpjData: Record<string, any> | null = null;
    let cnpjToLookup = cnpj;

    if (!cnpjToLookup) {
      const allText = allResults.map(r => `${r.titulo} ${r.descricao}`).join(" ");
      const cnpjMatch = allText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
      if (cnpjMatch) cnpjToLookup = cnpjMatch[0];
    }

    if (cnpjToLookup) {
      cnpjData = await lookupCNPJ(cnpjToLookup);
    }

    // ── STEP 3: Fetch official site ──
    let siteUrl = site || findOfficialSite(allResults, nome);
    let siteContent: string | null = null;
    if (siteUrl) {
      siteContent = await fetchSiteContent(siteUrl);
    }

    // ── STEP 4: AI Analysis ──
    const cnpjSummary = cnpjData ? JSON.stringify({
      nome: cnpjData.nome,
      fantasia: cnpjData.fantasia,
      porte: cnpjData.porte,
      cnae: cnpjData.cnae_fiscal_descricao,
      abertura: cnpjData.abertura,
      capital_social: cnpjData.capital_social,
      municipio: cnpjData.municipio,
      uf: cnpjData.uf,
      situacao: cnpjData.situacao,
      socio: cnpjData.qsa?.[0]?.nome,
    }) : "CNPJ não disponível";

    const searchSummary = allResults.slice(0, 12).map(r => `${r.titulo}\n${r.descricao}\n${r.url}`).join("\n---\n");

    const systemPrompt = `Você é um analista de inteligência comercial especializado em vendas B2B de planos de saúde corporativos no Brasil. Analisa perfis de empresas e cria personalização de propostas comerciais.`;

    const userPrompt = `Analise os dados abaixo sobre a empresa "${nome}" e crie um perfil comercial completo para personalizar uma proposta de plano de saúde.

DADOS CNPJ:
${cnpjSummary}

RESULTADOS DE BUSCA:
${searchSummary || "Sem resultados relevantes"}

CONTEÚDO DO SITE:
${siteContent || "Site não acessível"}

CIDADE INFORMADA: ${cidade || "Não informada"}`;

    const toolDef = {
      type: "function" as const,
      function: {
        name: "retornar_perfil_comercial",
        description: "Retorna o perfil comercial completo da empresa para personalização de proposta de plano de saúde",
        parameters: {
          type: "object",
          properties: {
            perfil: {
              type: "object",
              properties: {
                porte: { type: "string", enum: ["micro", "pequena", "media", "grande"] },
                setor: { type: "string" },
                setor_descricao: { type: "string" },
                tempo_mercado: { type: "string" },
                cidade: { type: "string" },
                estado: { type: "string" },
                posicionamento: { type: "string" },
                tom_comunicacao: { type: "string", enum: ["formal", "semiformal", "casual"] },
                numero_funcionarios_estimado: { type: "string" },
                contexto_relevante: { type: "string" },
              },
              required: ["porte", "setor", "tom_comunicacao", "contexto_relevante"],
            },
            personalizacao: {
              type: "object",
              properties: {
                frase_abertura_capa: { type: "string", description: "Máx 8 palavras, impacto emocional" },
                paragrafo_abertura: { type: "string", description: "2-3 linhas, citar o nome da empresa" },
                paragrafo_quem_somos: { type: "string" },
                destaque_principal: { type: "string", enum: ["economia", "cobertura", "rede", "agilidade"] },
                argumento_chave: { type: "string" },
                cta_personalizado: { type: "string" },
                tom_instrucao: { type: "string" },
              },
              required: ["frase_abertura_capa", "paragrafo_abertura", "destaque_principal", "argumento_chave", "cta_personalizado"],
            },
            insights: {
              type: "array",
              items: { type: "string" },
              description: "3-5 dicas práticas para o corretor fechar a venda",
            },
          },
          required: ["perfil", "personalizacao", "insights"],
        },
      },
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: "retornar_perfil_comercial" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      return new Response(JSON.stringify(DEFAULT_PROFILE), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify(DEFAULT_PROFILE), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      result = DEFAULT_PROFILE;
    }

    // Enrich with source info
    result.fontes = [];
    if (cnpjData) result.fontes.push("receitaws");
    if (allResults.length > 0) result.fontes.push("duckduckgo");
    if (siteContent) result.fontes.push("site_oficial");
    result.cnpj_dados = cnpjData ? {
      nome: cnpjData.nome,
      fantasia: cnpjData.fantasia,
      porte: cnpjData.porte,
      abertura: cnpjData.abertura,
      municipio: cnpjData.municipio,
      uf: cnpjData.uf,
      cnae: cnpjData.cnae_fiscal_descricao,
      socio_principal: cnpjData.qsa?.[0]?.nome,
    } : null;
    result.pesquisado_em = new Date().toISOString();

    // ── SAVE TO CACHE ──
    // Extract corretora_id from the JWT if available
    let corretoraId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("corretora_id")
            .eq("id", user.id)
            .single();
          corretoraId = profile?.corretora_id || null;
        }
      } catch (e) {
        console.warn("Could not extract corretora_id for cache:", e);
      }
    }

    await supabaseAdmin.from("pesquisa_cliente_cache").insert({
      chave_busca: cacheKey,
      nome_empresa: nome,
      cnpj: cnpj || cnpjToLookup || null,
      resultado: result,
      corretora_id: corretoraId,
    }).then(({ error }) => {
      if (error) console.warn("Cache insert error:", error.message);
      else console.log(`Cached research for "${nome}" (key: ${cacheKey})`);
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("miranda-pesquisar-cliente error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
