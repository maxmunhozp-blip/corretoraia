import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function getLatestUserMessage(messages: { role: string; content: string }[] = []) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  return latestUserMessage?.content || "";
}

function getForcedToolChoice(latestUserMessage: string) {
  const text = normalizeText(latestUserMessage);
  const hasPdfIntent =
    ["download", "baixar", "pdf", "preview", "visualizar", "botao"].some((term) => text.includes(term)) ||
    [
      "gere a proposta",
      "gerar proposta",
      "crie a proposta",
      "criar proposta",
      "me de a proposta",
      "me dê a proposta",
      "gere o relatorio",
      "gere o relatório",
    ].some((term) => text.includes(term));

  const hasPropostaInterativaIntent = [
    "criar proposta interativa",
    "proposta interativa",
    "gerar link",
    "link da proposta",
    "enviar proposta",
    "montar proposta",
    "crie a proposta para",
    "crie uma proposta para",
    "gere a proposta para",
    "gere uma proposta para",
    "criar proposta para",
    "gerar proposta para",
    "pode criar",
    "confirmo",
    "pode montar",
    "faz a proposta",
    "manda a proposta",
    "gera a proposta",
    "cria a proposta",
    "crie e",
    "gere e",
    "monta a proposta",
  ].some((term) => text.includes(term));

  if (hasPropostaInterativaIntent) {
    return { type: "function", function: { name: "criar_proposta_interativa" } };
  }

  if (!hasPdfIntent) return null;

  if (text.includes("relatorio executivo") || text.includes("relatorio do dia") || text.includes("relatório") || text.includes("relatorio")) {
    return { type: "function", function: { name: "gerar_relatorio_executivo" } };
  }

  return { type: "function", function: { name: "gerar_proposta_pdf" } };
}

function compactObject(value: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
  );
}

function parseCurrency(value?: string) {
  if (!value) return undefined;
  const match = value.match(/-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|-?\d+(?:,\d{2})?/);
  if (!match) return undefined;
  const normalized = match[0].replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractProposalContext(messages: { role: string; content: string }[] = []) {
  const lines = messages
    .flatMap((message) => message.content.replace(/\*\*/g, "").split("\n"))
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter((line) => line && !line.startsWith("```") && !line.startsWith("{"));

  const getLineValue = (prefixes: string[]) => {
    const matched = lines.filter((line) =>
      prefixes.some((prefix) => normalizeText(line).startsWith(normalizeText(prefix)))
    );
    const lastLine = matched[matched.length - 1];
    if (!lastLine || !lastLine.includes(":")) return undefined;
    return lastLine.split(":").slice(1).join(":").trim();
  };

  const subtitle = getLineValue(["Subtítulo"]);
  const subtitleParts = subtitle ? subtitle.split(/\s+[—-]\s+/) : [];
  const subtitleTail = subtitleParts[1] || "";
  const subtitlePlanParts = subtitleTail
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  const clienteNome = getLineValue(["Empresa", "Cliente", "Cliente / Empresa"]) || subtitleParts[0]?.trim();
  const vidasText = getLineValue(["Vidas", "Vidas simuladas"]);
  const vidas = vidasText ? Number((vidasText.match(/\d+/) || [])[0]) : undefined;
  const valorEstimado = parseCurrency(
    getLineValue(["Proposta Bradesco (simulação)", "Proposta Bradesco", "Valor mensal proposto (total)", "Valor proposto"])
  );
  const valorAtual = parseCurrency(getLineValue(["Custo atual (SulAmérica)", "Custo atual", "Valor atual"]));
  const acomodacao = getLineValue(["Acomodação", "Acomodacao"]);
  const odontologico = getLineValue(["Odontológico", "Odontologico"]);
  const compraCarencia = getLineValue(["Compra de carência", "Compra de carencia"]);
  const produto = getLineValue(["Produto"]) || subtitlePlanParts[1];
  const operadora = getLineValue(["Operadora"]) || subtitlePlanParts[0];
  const idades =
    getLineValue(["Idades", "Beneficiários", "Beneficiarios"]) ||
    vidasText?.match(/idades?\s*:\s*([^)]+)/i)?.[1]?.trim();
  const economiaSource = getLineValue(["Economia estimada", "Economia mensal"]);
  const economia = parseCurrency(economiaSource);
  const percentualFromEconomia = economiaSource?.match(/~?\s*(-?\d+(?:[.,]\d+)?)\s*%/);
  const percentualEconomiaText = getLineValue(["Percentual de economia", "Redução percentual", "% economia"]) || percentualFromEconomia?.[1];
  const percentualMatch = percentualEconomiaText?.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  const percentualEconomia = percentualMatch ? Number(percentualMatch[0]) : undefined;

  const observacoes = [
    compraCarencia,
    acomodacao ? `Acomodação: ${acomodacao}` : null,
    odontologico ? `Odontológico: ${odontologico}` : null,
  ].filter(Boolean).join(" • ");

  return compactObject({
    __pdf_type: "proposta",
    cliente_nome: clienteNome,
    empresa: clienteNome,
    vidas,
    valor_estimado: valorEstimado,
    valor_atual: valorAtual,
    economia_mensal: economia,
    percentual_economia: percentualEconomia,
    operadora,
    produto,
    acomodacao,
    odontologico,
    compra_carencia: compraCarencia,
    idades,
    observacoes: observacoes || undefined,
    status: "simulada",
    created_at: new Date().toISOString(),
  });
}

function streamTextAsSse(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunkSize = 8;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        const sseChunk = `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: chunk } }] })}\n\n`;
        controller.enqueue(encoder.encode(sseChunk));
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

function formatCurrencyForMessage(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildPdfAssistantMessage(payload: Record<string, any>) {
  if (payload.__pdf_type === "relatorio_executivo") {
    const bullets = [
      payload.periodo ? `- **Período:** ${payload.periodo}` : null,
      payload.propostas_total !== undefined ? `- **Propostas analisadas:** ${payload.propostas_total}` : null,
      payload.propostas_aprovadas !== undefined ? `- **Aprovadas:** ${payload.propostas_aprovadas}` : null,
      payload.taxa_conversao !== undefined ? `- **Conversão:** ${payload.taxa_conversao}%` : null,
      formatCurrencyForMessage(payload.valor_total_aprovado)
        ? `- **Valor total aprovado:** ${formatCurrencyForMessage(payload.valor_total_aprovado)}`
        : null,
    ].filter(Boolean).join("\n");

    return [
      "Preparando o PDF do relatório executivo para visualização e download.",
      "",
      "```generate_pdf",
      JSON.stringify(payload),
      "```",
      "",
      "Resumo dos dados principais",
      bullets,
    ].filter(Boolean).join("\n");
  }

  const operatorProduct = payload.operadora && payload.produto && String(payload.operadora).includes(String(payload.produto))
    ? String(payload.operadora)
    : [payload.operadora, payload.produto].filter(Boolean).join(" — ");

  const bullets = [
    payload.cliente_nome || payload.empresa ? `- **Cliente / Empresa:** ${payload.empresa || payload.cliente_nome}` : null,
    operatorProduct ? `- **Operadora / Produto:** ${operatorProduct}` : null,
    payload.vidas !== undefined ? `- **Vidas:** ${payload.vidas}${payload.idades ? ` (idades: ${payload.idades})` : ""}` : null,
    formatCurrencyForMessage(payload.valor_atual) ? `- **Valor atual:** ${formatCurrencyForMessage(payload.valor_atual)}` : null,
    formatCurrencyForMessage(payload.valor_estimado) ? `- **Valor proposto:** ${formatCurrencyForMessage(payload.valor_estimado)}` : null,
    formatCurrencyForMessage(payload.economia_mensal) ? `- **Economia mensal:** ${formatCurrencyForMessage(payload.economia_mensal)}` : null,
    payload.status ? `- **Status:** ${payload.status}` : null,
  ].filter(Boolean).join("\n");

  return [
    "Preparando o PDF da proposta para visualização e download.",
    "",
    "```generate_pdf",
    JSON.stringify(payload),
    "```",
    "",
    "Resumo dos dados principais",
    bullets,
  ].filter(Boolean).join("\n");
}

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_cliente",
      description: "Busca dados completos de um cliente incluindo propostas ativas, alertas e histórico",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do cliente para buscar" },
          incluir_propostas: { type: "boolean", description: "Incluir propostas do cliente" },
          incluir_alertas: { type: "boolean", description: "Incluir alertas do cliente" },
        },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_propostas",
      description: "Lista propostas com filtros. Use para relatórios e análises comerciais",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: enviada, em_analise, aprovada, cancelada, pendencia" },
          responsavel_nome: { type: "string", description: "Nome do responsável" },
          operadora: { type: "string", description: "Nome da operadora" },
          periodo_dias: { type: "number", description: "Propostas dos últimos N dias" },
          limit: { type: "number", description: "Número máximo de resultados" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_alertas",
      description: "Retorna alertas ativos do sistema por nível e tipo",
      parameters: {
        type: "object",
        properties: {
          nivel: { type: "string", description: "Filtrar por nível: alto, medio, baixo" },
          tipo: { type: "string", description: "Filtrar por tipo: inadimplencia, cancelamento, renovacao, etc" },
          resolvido: { type: "boolean", description: "Filtrar por status de resolução" },
          limit: { type: "number", description: "Número máximo de resultados" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_conhecimento",
      description: "Pesquisa na base de conhecimento indexada — use para responder dúvidas sobre regras, coberturas, carências e tabelas das operadoras",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca" },
          operadora: { type: "string", description: "Filtrar por operadora" },
          categoria: { type: "string", description: "Filtrar por categoria: regras_comerciais, tabela_preco, rede_credenciada, manual" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_metricas",
      description: "Retorna KPIs e métricas da empresa em tempo real",
      parameters: {
        type: "object",
        properties: {
          periodo: { type: "string", description: "Período: mes_atual, semana, trimestre, ano" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_ranking",
      description: "Retorna performance detalhada dos vendedores",
      parameters: {
        type: "object",
        properties: {
          periodo_dias: { type: "number", description: "Período em dias para calcular" },
          limit: { type: "number", description: "Número de vendedores" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_conversas",
      description: "Busca histórico de conversas e interações com um cliente específico",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente" },
        },
        required: ["cliente_nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_proposta",
      description: "Atualiza o status de uma proposta. Use quando o usuário pedir explicitamente",
      parameters: {
        type: "object",
        properties: {
          proposta_id: { type: "string", description: "ID da proposta" },
          novo_status: { type: "string", description: "Novo status: enviada, em_analise, aprovada, cancelada, pendencia" },
          observacao: { type: "string", description: "Observação sobre a atualização" },
        },
        required: ["proposta_id", "novo_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "gerar_proposta_pdf",
      description: "Busca dados de uma proposta e retorna dados estruturados para gerar PDF da proposta. Use quando o usuário pedir para gerar, criar ou baixar PDF de uma proposta específica.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente da proposta" },
          proposta_id: { type: "string", description: "ID da proposta (se souber)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "gerar_relatorio_executivo",
      description: "Coleta métricas, propostas, alertas e ranking para gerar um relatório executivo em PDF. Use quando o usuário pedir relatório executivo, relatório do dia/semana/mês, ou relatório geral.",
      parameters: {
        type: "object",
        properties: {
          periodo: { type: "string", description: "Período: mes_atual, semana, trimestre, ano" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_alerta",
      description: "Registra um novo alerta no sistema",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", description: "Tipo do alerta: inadimplencia, cancelamento, renovacao, vencimento" },
          nivel: { type: "string", description: "Nível: alto, medio, baixo" },
          titulo: { type: "string", description: "Título do alerta" },
          descricao: { type: "string", description: "Descrição detalhada" },
          cliente_nome: { type: "string", description: "Nome do cliente relacionado (opcional)" },
        },
        required: ["tipo", "nivel", "titulo", "descricao"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pesquisar_perfil_cliente",
      description: "Pesquisa dados públicos de uma empresa na internet (DuckDuckGo, ReceitaWS, site oficial) e usa IA para criar um perfil comercial personalizado para propostas de plano de saúde. Use quando o usuário pedir para pesquisar um cliente, personalizar proposta, ou quando mencionar CNPJ/empresa para gerar proposta personalizada.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome da empresa/cliente" },
          cnpj: { type: "string", description: "CNPJ da empresa (opcional)" },
          cidade: { type: "string", description: "Cidade da empresa (opcional)" },
          site: { type: "string", description: "URL do site oficial (opcional)" },
        },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_proposta_interativa",
      description: "Cria uma proposta interativa real no sistema com link público compartilhável. Use quando o usuário pedir para criar proposta, gerar link de proposta, ou enviar proposta para um cliente. Requer dados do cliente, plano atual e alternativas.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente" },
          cliente_empresa: { type: "string", description: "Nome da empresa do cliente" },
          cliente_email: { type: "string", description: "E-mail do cliente" },
          cliente_telefone: { type: "string", description: "Telefone do cliente" },
          vidas: { type: "number", description: "Número de vidas/beneficiários" },
          plano_atual: {
            type: "object",
            description: "Plano atual do cliente",
            properties: {
              nome: { type: "string" },
              operadora: { type: "string" },
              valor_mensal: { type: "number" },
              acomodacao: { type: "string" },
              abrangencia: { type: "string" },
              coparticipacao: { type: "boolean" },
              vidas: { type: "number" },
            },
          },
          alternativas: {
            type: "array",
            description: "Array de planos alternativos propostos",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                operadora: { type: "string" },
                valor_mensal: { type: "number" },
                acomodacao: { type: "string" },
                abrangencia: { type: "string" },
                coparticipacao: { type: "boolean" },
                reembolso: { type: "boolean" },
                recomendado: { type: "boolean" },
                descricao: { type: "string" },
              },
            },
          },
          beneficiarios: {
            type: "array",
            description: "Lista de beneficiários com nome, idade e valores por plano",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                idade: { type: "number" },
                valores: { type: "object" },
              },
            },
          },
        },
        required: ["cliente_nome", "alternativas"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "salvar_memoria",
      description: "Salva uma nova memória/aprendizado da Miranda. Use quando o usuário der feedback positivo ou negativo sobre algo (design, tom, layout, etc), quando aprender uma preferência da corretora, ou quando quiser registrar algo para lembrar depois.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", description: "Tipo: preferencia_design, feedback_positivo, feedback_negativo, cor, tipografia, layout, tom_escrita, geral" },
          titulo: { type: "string", description: "Título curto da memória (ex: 'Prefere tabelas sem borda')" },
          conteudo: { type: "string", description: "Descrição detalhada da memória" },
        },
        required: ["tipo", "titulo", "conteudo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ler_memoria",
      description: "Lê todas as memórias e skills da Miranda para a corretora atual. Use para consultar preferências de design, tom de escrita, feedbacks anteriores.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// Tool implementations
async function executeTool(name: string, args: any, supabase: any, messages: { role: string; content: string }[] = [], extra?: { corretoraId?: string | null; corretoraData?: Record<string, any> | null; usuario_id?: string }): Promise<string> {
  const corretoraId = extra?.corretoraId;
  const corretoraData = extra?.corretoraData;
  const usuario_id = extra?.usuario_id;
  try {
    switch (name) {
      case "buscar_cliente": {
        const { nome, incluir_propostas = true, incluir_alertas = true } = args;
        const { data: clientes } = await supabase
          .from("clientes")
          .select("*, operadoras(nome)")
          .ilike("nome", `%${nome}%`)
          .limit(5);

        if (!clientes?.length) return JSON.stringify({ resultado: "Nenhum cliente encontrado com esse nome" });

        const result: any = { clientes };

        if (incluir_propostas) {
          const nomes = clientes.map((c: any) => c.nome);
          const { data: propostas } = await supabase
            .from("propostas")
            .select("*, operadoras(nome)")
            .in("cliente_nome", nomes)
            .order("created_at", { ascending: false })
            .limit(10);
          result.propostas = propostas || [];
        }

        if (incluir_alertas) {
          const ids = clientes.map((c: any) => c.id);
          const { data: alertas } = await supabase
            .from("alertas")
            .select("*")
            .in("cliente_id", ids)
            .eq("resolvido", false)
            .limit(10);
          result.alertas = alertas || [];
        }

        return JSON.stringify(result);
      }

      case "buscar_propostas": {
        const { status, responsavel_nome, operadora, periodo_dias, limit = 20 } = args;
        let q = supabase
          .from("propostas")
          .select("*, operadoras(nome), profiles!propostas_responsavel_id_fkey(nome)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status) q = q.eq("status", status);
        if (periodo_dias) {
          const since = new Date();
          since.setDate(since.getDate() - periodo_dias);
          q = q.gte("created_at", since.toISOString());
        }

        const { data: propostas } = await q;

        // Filter by responsavel name or operadora name in JS (joined fields)
        let filtered = propostas || [];
        if (responsavel_nome) {
          filtered = filtered.filter((p: any) =>
            p.profiles?.nome?.toLowerCase().includes(responsavel_nome.toLowerCase())
          );
        }
        if (operadora) {
          filtered = filtered.filter((p: any) =>
            p.operadoras?.nome?.toLowerCase().includes(operadora.toLowerCase())
          );
        }

        return JSON.stringify({
          total: filtered.length,
          propostas: filtered.map((p: any) => ({
            id: p.id,
            cliente: p.cliente_nome,
            empresa: p.empresa,
            status: p.status,
            valor: p.valor_estimado,
            vidas: p.vidas,
            operadora: p.operadoras?.nome,
            responsavel: p.profiles?.nome,
            data: p.created_at,
          })),
        });
      }

      case "buscar_alertas": {
        const { nivel, tipo, resolvido = false, limit = 20 } = args;
        let q = supabase
          .from("alertas")
          .select("*, clientes(nome)")
          .eq("resolvido", resolvido)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (nivel) q = q.eq("nivel", nivel);
        if (tipo) q = q.eq("tipo", tipo);

        const { data } = await q;
        return JSON.stringify({
          total: data?.length || 0,
          alertas: (data || []).map((a: any) => ({
            id: a.id,
            titulo: a.titulo,
            descricao: a.descricao,
            tipo: a.tipo,
            nivel: a.nivel,
            cliente: a.clientes?.nome,
            data: a.created_at,
          })),
        });
      }

      case "buscar_conhecimento": {
        const { query, operadora, categoria } = args;
        const keywords = query.split(/\s+/).filter((w: string) => w.length > 2).slice(0, 5);
        if (!keywords.length) return JSON.stringify({ resultado: "Termo de busca muito curto" });

        let q = supabase
          .from("base_conhecimento")
          .select("titulo, conteudo_extraido, categoria, fonte_url, operadoras:operadora_id(nome)")
          .eq("status", "indexado")
          .limit(3);

        const orFilters = keywords.map((k: string) => `conteudo_extraido.ilike.%${k}%`);
        q = q.or(orFilters.join(","));
        if (categoria) q = q.eq("categoria", categoria);

        const { data } = await q;

        // Filter by operadora name in JS
        let filtered = data || [];
        if (operadora) {
          filtered = filtered.filter((d: any) =>
            d.operadoras?.nome?.toLowerCase().includes(operadora.toLowerCase())
          );
        }

        if (!filtered.length) return JSON.stringify({ resultado: "Nenhum documento encontrado na base de conhecimento para essa busca" });

        return JSON.stringify({
          documentos: filtered.map((d: any) => ({
            titulo: d.titulo,
            categoria: d.categoria,
            operadora: d.operadoras?.nome,
            fonte: d.fonte_url,
            conteudo: (d.conteudo_extraido || "").slice(0, 3000),
          })),
        });
      }

      case "buscar_metricas": {
        const { periodo = "mes_atual" } = args;
        const now = new Date();
        let since: Date;
        switch (periodo) {
          case "semana": since = new Date(now.getTime() - 7 * 86400000); break;
          case "trimestre": since = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
          case "ano": since = new Date(now.getFullYear(), 0, 1); break;
          default: since = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const [
          { data: allPropostas },
          { data: alertasAtivos },
        ] = await Promise.all([
          supabase.from("propostas").select("status, valor_estimado, responsavel_id").gte("created_at", since.toISOString()),
          supabase.from("alertas").select("nivel").eq("resolvido", false),
        ]);

        const props = allPropostas || [];
        const aprovadas = props.filter((p: any) => p.status === "aprovada");
        const total = props.length;

        // Top vendedores
        const vendedorMap: Record<string, { count: number; valor: number }> = {};
        for (const p of aprovadas) {
          if (p.responsavel_id) {
            if (!vendedorMap[p.responsavel_id]) vendedorMap[p.responsavel_id] = { count: 0, valor: 0 };
            vendedorMap[p.responsavel_id].count++;
            vendedorMap[p.responsavel_id].valor += Number(p.valor_estimado || 0);
          }
        }
        const topIds = Object.entries(vendedorMap).sort((a, b) => b[1].valor - a[1].valor).slice(0, 3);
        let topVendedores: any[] = [];
        if (topIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", topIds.map(t => t[0]));
          topVendedores = topIds.map(([id, stats]) => ({
            nome: profiles?.find((p: any) => p.id === id)?.nome || "Desconhecido",
            vendas: stats.count,
            valor_total: stats.valor,
          }));
        }

        const alertas = alertasAtivos || [];
        return JSON.stringify({
          periodo,
          propostas_total: total,
          propostas_aprovadas: aprovadas.length,
          taxa_conversao: total > 0 ? Math.round((aprovadas.length / total) * 100) : 0,
          valor_total_aprovado: aprovadas.reduce((s: number, p: any) => s + Number(p.valor_estimado || 0), 0),
          ticket_medio: aprovadas.length > 0
            ? Math.round(aprovadas.reduce((s: number, p: any) => s + Number(p.valor_estimado || 0), 0) / aprovadas.length)
            : 0,
          alertas_nao_resolvidos: {
            total: alertas.length,
            alto: alertas.filter((a: any) => a.nivel === "alto").length,
            medio: alertas.filter((a: any) => a.nivel === "medio").length,
            baixo: alertas.filter((a: any) => a.nivel === "baixo").length,
          },
          top_vendedores: topVendedores,
        });
      }

      case "buscar_ranking": {
        const { periodo_dias = 30, limit = 10 } = args;
        const since = new Date();
        since.setDate(since.getDate() - periodo_dias);

        const { data: propostas } = await supabase
          .from("propostas")
          .select("responsavel_id, status, valor_estimado")
          .gte("created_at", since.toISOString());

        const map: Record<string, { total: number; aprovadas: number; valor: number }> = {};
        for (const p of (propostas || [])) {
          if (!p.responsavel_id) continue;
          if (!map[p.responsavel_id]) map[p.responsavel_id] = { total: 0, aprovadas: 0, valor: 0 };
          map[p.responsavel_id].total++;
          if (p.status === "aprovada") {
            map[p.responsavel_id].aprovadas++;
            map[p.responsavel_id].valor += Number(p.valor_estimado || 0);
          }
        }

        const sorted = Object.entries(map).sort((a, b) => b[1].valor - a[1].valor).slice(0, limit);
        const ids = sorted.map(s => s[0]);
        const { data: profiles } = await supabase.from("profiles").select("id, nome, cargo").in("id", ids);

        return JSON.stringify({
          periodo_dias,
          ranking: sorted.map(([id, stats], i) => ({
            posicao: i + 1,
            nome: profiles?.find((p: any) => p.id === id)?.nome || "Desconhecido",
            cargo: profiles?.find((p: any) => p.id === id)?.cargo,
            propostas_total: stats.total,
            propostas_aprovadas: stats.aprovadas,
            taxa_conversao: stats.total > 0 ? Math.round((stats.aprovadas / stats.total) * 100) : 0,
            valor_total: stats.valor,
          })),
        });
      }

      case "buscar_conversas": {
        const { cliente_nome } = args;
        const { data: atividades } = await supabase
          .from("atividades")
          .select("*, profiles:autor_id(nome)")
          .or(`descricao.ilike.%${cliente_nome}%,entidade_tipo.eq.cliente`)
          .order("created_at", { ascending: false })
          .limit(20);

        return JSON.stringify({
          total: atividades?.length || 0,
          atividades: (atividades || []).map((a: any) => ({
            tipo: a.tipo,
            descricao: a.descricao,
            autor: a.profiles?.nome,
            data: a.created_at,
          })),
        });
      }

      case "atualizar_proposta": {
        const { proposta_id, novo_status, observacao } = args;
        const { error } = await supabase
          .from("propostas")
          .update({ status: novo_status, observacoes: observacao || null })
          .eq("id", proposta_id);

        if (error) return JSON.stringify({ erro: error.message });

        // Log activity
        await supabase.from("atividades").insert({
          tipo: "status_alterado",
          descricao: `Status da proposta alterado para "${novo_status}" pela Miranda${observacao ? `: ${observacao}` : ""}`,
          entidade_id: proposta_id,
          entidade_tipo: "proposta",
        });

        return JSON.stringify({ sucesso: true, mensagem: `Proposta atualizada para "${novo_status}"` });
      }

      case "criar_alerta": {
        const { tipo, nivel, titulo, descricao, cliente_nome } = args;
        let cliente_id = null;
        if (cliente_nome) {
          const { data } = await supabase
            .from("clientes")
            .select("id")
            .ilike("nome", `%${cliente_nome}%`)
            .limit(1)
            .single();
          cliente_id = data?.id || null;
        }

        const { error } = await supabase.from("alertas").insert({
          tipo,
          nivel,
          titulo,
          descricao,
          cliente_id,
        });

        if (error) return JSON.stringify({ erro: error.message });
        return JSON.stringify({ sucesso: true, mensagem: `Alerta "${titulo}" criado com sucesso` });
      }

      case "pesquisar_perfil_cliente": {
        const { nome, cnpj, cidade, site } = args;
        // Return a special marker that the frontend renders as a PesquisaClienteCard
        return JSON.stringify({
          __pesquisa_cliente: true,
          nome,
          cnpj: cnpj || undefined,
          cidade: cidade || undefined,
          site: site || undefined,
        });
      }

      case "gerar_proposta_pdf": {
        const conversationProposal = extractProposalContext(messages);
        const explicitArgs = compactObject({
          cliente_nome: args.cliente_nome,
          empresa: args.empresa,
          vidas: args.vidas,
          valor_estimado: args.valor_estimado,
          valor_atual: args.valor_atual,
          economia_mensal: args.economia_mensal,
          percentual_economia: args.percentual_economia,
          operadora: args.operadora,
          produto: args.produto,
          acomodacao: args.acomodacao,
          odontologico: args.odontologico,
          compra_carencia: args.compra_carencia,
          idades: args.idades,
          status: args.status,
          responsavel: args.responsavel,
          observacoes: args.observacoes,
          created_at: args.created_at,
        });

        const lookupName = args.cliente_nome || args.empresa || conversationProposal.cliente_nome || conversationProposal.empresa;
        let data = null;

        if (args.proposta_id || lookupName) {
          let q = supabase
            .from("propostas")
            .select("*, operadoras(nome), profiles!propostas_responsavel_id_fkey(nome)")
            .order("created_at", { ascending: false })
            .limit(1);

          if (args.proposta_id) q = q.eq("id", args.proposta_id);
          else if (lookupName) q = q.or(`cliente_nome.ilike.%${lookupName}%,empresa.ilike.%${lookupName}%`);

          const response = await q;
          data = response.data;
        }

        const corretoraInfo = corretoraData ? {
          nome: corretoraData.nome,
          telefone: corretoraData.telefone,
          email: corretoraData.email,
          site: corretoraData.site,
          cidade: corretoraData.cidade,
          estado: corretoraData.estado,
          cor_primaria: corretoraData.cor_primaria,
          cor_secundaria: corretoraData.cor_secundaria,
        } : undefined;

        if (data?.length) {
          const p = data[0];
          const propostaData = {
            __pdf_type: "proposta",
            ...conversationProposal,
            cliente_nome: p.cliente_nome,
            empresa: p.empresa,
            vidas: p.vidas,
            valor_estimado: p.valor_estimado,
            operadora: p.operadoras?.nome,
            status: p.status,
            responsavel: p.profiles?.nome,
            observacoes: p.observacoes,
            created_at: p.created_at,
            corretora_nome: corretoraData?.nome,
            corretora_cnpj: corretoraData?.cnpj,
            corretora_telefone: corretoraData?.telefone,
            corretora_email: corretoraData?.email,
            corretora: corretoraInfo,
            ...explicitArgs,
          };
          return JSON.stringify(propostaData);
        }

        const contextualProposal = {
          __pdf_type: "proposta",
          ...conversationProposal,
          ...explicitArgs,
          cliente_nome: explicitArgs.cliente_nome || conversationProposal.cliente_nome || explicitArgs.empresa || conversationProposal.empresa,
          empresa: explicitArgs.empresa || conversationProposal.empresa || explicitArgs.cliente_nome || conversationProposal.cliente_nome,
          status: explicitArgs.status || conversationProposal.status || "simulada",
          created_at: explicitArgs.created_at || conversationProposal.created_at || new Date().toISOString(),
          corretora_nome: corretoraData?.nome,
          corretora: corretoraInfo,
        };

        if (!contextualProposal.cliente_nome) {
          return JSON.stringify({ erro: "Proposta não encontrada e não consegui extrair dados suficientes da conversa para gerar o PDF" });
        }

        return JSON.stringify(contextualProposal);
      }

      case "gerar_relatorio_executivo": {
        const { periodo = "mes_atual" } = args;
        const now = new Date();
        let since: Date;
        switch (periodo) {
          case "semana": since = new Date(now.getTime() - 7 * 86400000); break;
          case "trimestre": since = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
          case "ano": since = new Date(now.getFullYear(), 0, 1); break;
          default: since = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const [
          { data: allPropostas },
          { data: alertasAtivos },
        ] = await Promise.all([
          supabase.from("propostas").select("status, valor_estimado, responsavel_id").gte("created_at", since.toISOString()),
          supabase.from("alertas").select("nivel").eq("resolvido", false),
        ]);

        const props = allPropostas || [];
        const aprovadas = props.filter((p: any) => p.status === "aprovada");

        // Status distribution
        const statusMap: Record<string, number> = {};
        for (const p of props) {
          statusMap[p.status] = (statusMap[p.status] || 0) + 1;
        }

        // Top vendedores
        const vendedorMap: Record<string, { count: number; valor: number }> = {};
        for (const p of aprovadas) {
          if (p.responsavel_id) {
            if (!vendedorMap[p.responsavel_id]) vendedorMap[p.responsavel_id] = { count: 0, valor: 0 };
            vendedorMap[p.responsavel_id].count++;
            vendedorMap[p.responsavel_id].valor += Number(p.valor_estimado || 0);
          }
        }
        const topIds = Object.entries(vendedorMap).sort((a, b) => b[1].valor - a[1].valor).slice(0, 5);
        let topVendedores: any[] = [];
        if (topIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", topIds.map(t => t[0]));
          topVendedores = topIds.map(([id, stats]) => ({
            nome: profiles?.find((p: any) => p.id === id)?.nome || "Desconhecido",
            vendas: stats.count,
            valor_total: stats.valor,
          }));
        }

        const alertas = alertasAtivos || [];
        const periodoLabel = periodo === "semana" ? "Última Semana" : periodo === "trimestre" ? "Trimestre" : periodo === "ano" ? "Ano" : "Mês Atual";

        return JSON.stringify({
          __pdf_type: "relatorio_executivo",
          periodo: periodoLabel,
          propostas_total: props.length,
          propostas_aprovadas: aprovadas.length,
          taxa_conversao: props.length > 0 ? Math.round((aprovadas.length / props.length) * 100) : 0,
          valor_total_aprovado: aprovadas.reduce((s: number, p: any) => s + Number(p.valor_estimado || 0), 0),
          ticket_medio: aprovadas.length > 0
            ? Math.round(aprovadas.reduce((s: number, p: any) => s + Number(p.valor_estimado || 0), 0) / aprovadas.length)
            : 0,
          alertas: {
            total: alertas.length,
            alto: alertas.filter((a: any) => a.nivel === "alto").length,
            medio: alertas.filter((a: any) => a.nivel === "medio").length,
            baixo: alertas.filter((a: any) => a.nivel === "baixo").length,
          },
          top_vendedores: topVendedores,
          propostas_por_status: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        });
      }

      case "criar_proposta_interativa": {
        const {
          cliente_nome, cliente_empresa, cliente_email, cliente_telefone,
          vidas, plano_atual, alternativas = [], beneficiarios,
        } = args;

        if (!cliente_nome || !alternativas.length) {
          return JSON.stringify({ erro: "Dados insuficientes. Preciso do nome do cliente e pelo menos uma alternativa de plano." });
        }

        // Get corretora data
        let corretora: Record<string, any> = {};
        if (corretoraData) {
          corretora = {
            nome: corretoraData.nome,
            telefone: corretoraData.telefone,
            email: corretoraData.email,
            site: corretoraData.site,
            cidade: corretoraData.cidade,
            estado: corretoraData.estado,
            cor_primaria: corretoraData.cor_primaria,
            cor_secundaria: corretoraData.cor_secundaria,
            logo_url: corretoraData.logo_url,
          };
        }

        // Build dados object
        const dadosProposta = compactObject({
          corretora,
          vidas,
          beneficiarios,
          plano_atual: plano_atual || undefined,
          alternativas,
        });

        // Insert into propostas_interativas (slug is auto-generated by trigger when omitted)
        const insertPayload: Record<string, any> = {
          cliente_nome,
          cliente_empresa: cliente_empresa || null,
          cliente_email: cliente_email || null,
          cliente_telefone: cliente_telefone || null,
          dados: dadosProposta,
          plano_atual: plano_atual || null,
          alternativas: alternativas,
          status: "ativa",
          formato_padrao: "interativo",
        };
        if (corretoraId) insertPayload.corretora_id = corretoraId;
        if (usuario_id) insertPayload.criado_por = usuario_id;

        const { data: inserted, error: insertError } = await supabase
          .from("propostas_interativas")
          .insert(insertPayload)
          .select("id, slug")
          .single();

        if (insertError) {
          console.error("Insert proposta error:", insertError);
          return JSON.stringify({ erro: `Erro ao criar proposta: ${insertError.message}` });
        }

        const slug = inserted.slug;
        const link = `/p/${slug}`;

        // Calculate economy
        const planoAtualValor = plano_atual?.valor_mensal || 0;
        const melhorAlternativa = alternativas.reduce((best: any, alt: any) =>
          (alt.valor_mensal || 0) < (best?.valor_mensal || Infinity) ? alt : best, alternativas[0]);
        const economiaMensal = planoAtualValor > 0 ? planoAtualValor - (melhorAlternativa?.valor_mensal || 0) : 0;
        const economiaPercentual = planoAtualValor > 0 ? (economiaMensal / planoAtualValor) * 100 : 0;

        // Build embedded PDF payload so both PDF + interactive are always available
        const embeddedPdf: Record<string, any> = {
          __pdf_type: "proposta",
          cliente_nome,
          empresa: cliente_empresa || cliente_nome,
          vidas: vidas || alternativas.length,
          valor_estimado: melhorAlternativa?.valor_mensal || 0,
          valor_atual: planoAtualValor || undefined,
          economia_mensal: economiaMensal > 0 ? economiaMensal : undefined,
          operadora: melhorAlternativa?.operadora || melhorAlternativa?.nome || "—",
          produto: melhorAlternativa?.nome || "—",
          acomodacao: melhorAlternativa?.acomodacao || "Apartamento",
          observacoes: (alternativas as any[]).map((a: any) => a.nome || a.operadora).join(" • "),
          status: "simulada",
          created_at: new Date().toISOString(),
        };

        return JSON.stringify({
          __proposta_criada: true,
          slug,
          link,
          id: inserted.id,
          cliente_nome,
          economia_mensal: economiaMensal > 0 ? economiaMensal : undefined,
          economia_percentual: economiaPercentual > 0 ? Number(economiaPercentual.toFixed(2)) : undefined,
          __embedded_pdf: embeddedPdf,
        });
      }

      case "salvar_memoria": {
        const { tipo, titulo, conteudo } = args;
        // We need corretoraId from the calling context — pass via extra args
        const { error } = await supabase
          .from("miranda_memoria")
          .insert({ tipo, titulo, conteudo });
        if (error) return JSON.stringify({ erro: error.message });
        return JSON.stringify({ sucesso: true, mensagem: `Memória "${titulo}" salva com sucesso` });
      }

      case "ler_memoria": {
        const [{ data: skills }, { data: memorias }] = await Promise.all([
          supabase.from("miranda_skills").select("nome, conteudo_md").eq("ativo", true).limit(10),
          supabase.from("miranda_memoria").select("tipo, titulo, conteudo").eq("ativo", true).order("criado_em", { ascending: false }).limit(30),
        ]);

        let md = "";
        if (skills?.length) {
          for (const s of skills) md += `## Skill: ${s.nome}\n${s.conteudo_md}\n\n`;
        }
        if (memorias?.length) {
          md += "## Memórias\n";
          for (const m of memorias) md += `- [${m.tipo}] **${m.titulo}**: ${m.conteudo}\n`;
        }
        return JSON.stringify({ memoria: md || "Nenhuma memória registrada ainda." });
      }

      default:
        return JSON.stringify({ erro: `Tool "${name}" não implementada` });
    }
  } catch (e) {
    console.error(`Tool ${name} error:`, e);
    return JSON.stringify({ erro: `Erro ao executar ${name}: ${e instanceof Error ? e.message : "desconhecido"}` });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, usuario_id, contexto_pagina } = await req.json();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user profile, context counts, and memory in parallel
    let userName = "Usuário";
    let userCargo = "";
    let corretoraId: string | null = null;
    let memoriaContexto = "";
    let corretoraData: Record<string, any> | null = null;

    const profilePromise = usuario_id
      ? supabase.from("profiles").select("nome, cargo, role, corretora_id").eq("id", usuario_id).single()
      : Promise.resolve({ data: null });
    const propostasPromise = supabase.from("propostas").select("*", { count: "exact", head: true }).not("status", "in", '("cancelada","aprovada")');
    const alertasPromise = supabase.from("alertas").select("*", { count: "exact", head: true }).eq("resolvido", false);

    const [profileResult, { count: propostasAtivas }, { count: alertasNaoResolvidos }] = await Promise.all([
      profilePromise,
      propostasPromise,
      alertasPromise,
    ]);

    if (profileResult.data) {
      userName = profileResult.data.nome;
      userCargo = profileResult.data.cargo || "";
      corretoraId = profileResult.data.corretora_id;

      // Fetch corretora data for brand colors
      if (corretoraId) {
        const { data: corr } = await supabase
          .from("corretoras")
          .select("nome, cnpj, telefone, email, site, cidade, estado, cor_primaria, cor_secundaria, logo_url")
          .eq("id", corretoraId)
          .single();
        if (corr) corretoraData = corr;
      }
    }

    // Load memory (skills + memorias)
    try {
      const [{ data: skills }, { data: memorias }] = await Promise.all([
        supabase
          .from("miranda_skills")
          .select("nome, conteudo_md")
          .eq("ativo", true)
          .or(corretoraId ? `corretora_id.eq.${corretoraId},corretora_id.is.null` : "corretora_id.is.null"),
        supabase
          .from("miranda_memoria")
          .select("tipo, titulo, conteudo")
          .eq("ativo", true)
          .or(corretoraId ? `corretora_id.eq.${corretoraId},corretora_id.is.null` : "corretora_id.is.null")
          .order("criado_em", { ascending: false })
          .limit(30),
      ]);

      if (skills?.length || memorias?.length) {
        memoriaContexto = "\n\n--- MEMÓRIA DA MIRANDA ---\n";
        if (skills?.length) {
          for (const s of skills) {
            memoriaContexto += `\n## Skill: ${s.nome}\n${s.conteudo_md}\n`;
          }
        }
        if (memorias?.length) {
          memoriaContexto += "\n## Memórias aprendidas\n";
          for (const m of memorias) {
            memoriaContexto += `- [${m.tipo}] **${m.titulo}**: ${m.conteudo}\n`;
          }
        }
      }
    } catch (e) {
      console.error("Error loading memory:", e);
    }

    const now = new Date();
    const systemPrompt = `Você é a Miranda, assistente de inteligência artificial da Cora — plataforma para corretoras de planos de saúde.

Você tem acesso completo aos dados da empresa e age como agente inteligente para auxiliar diretores, gerentes e corretores.

Suas responsabilidades:
- Buscar e analisar dados reais da empresa (propostas, clientes, alertas, métricas)
- Responder dúvidas sobre regras das operadoras com base na base de conhecimento
- Identificar riscos, oportunidades e sugerir ações concretas
- Auxiliar em vendas respondendo dúvidas técnicas sobre planos
- Monitorar inadimplência e cancelamentos
- Gerar insights e relatórios sob demanda

Regras de comportamento:
- SEMPRE busque dados reais antes de responder — nunca invente números
- Cite a fonte quando usar a base de conhecimento: "De acordo com o documento [título]..."
- Seja direta e objetiva — os usuários são profissionais ocupados
- Quando identificar um problema, sugira uma ação específica
- Se não encontrar dados suficientes, diga claramente o que não conseguiu encontrar
- Responda sempre em português brasileiro
- Use **negrito** para destacar informações importantes
- Use listas com marcadores quando listar itens

GRÁFICOS INLINE:
Quando apresentar dados comparativos, tendências ou distribuições, inclua um bloco de gráfico usando EXATAMENTE este formato:

\`\`\`chart
{"tipo":"bar","titulo":"Título do Gráfico","dados":[{"nome":"Item1","valor":10},{"nome":"Item2","valor":20}],"label_valor":"Vendas"}
\`\`\`

Regras para gráficos:
- "tipo" pode ser: "bar", "line", "pie" ou "area"
- "dados" é um array com objetos contendo "nome" e "valor" (e opcionalmente "valor2" para comparativos)
- Se usar "valor2", adicione "label_valor2" no objeto raiz
- Use gráficos de barras para comparativos entre categorias
- Use linhas para tendências ao longo do tempo
- Use pizza para distribuições percentuais
- Use área para evolução acumulada
- SEMPRE baseie os valores nos dados reais consultados — NUNCA invente números
- O JSON deve estar em UMA ÚNICA LINHA dentro do bloco chart

GERAÇÃO DE PDFs:
Quando os dados retornados de uma tool tiverem o campo "__pdf_type", você DEVE incluir o JSON completo dos dados retornados em um bloco especial para o frontend gerar o PDF:

\`\`\`generate_pdf
{...o JSON completo retornado pela tool, incluindo __pdf_type, em UMA ÚNICA LINHA...}
\`\`\`

Regras para PDFs:
- SEMPRE inclua o bloco generate_pdf quando receber dados com __pdf_type
- O JSON deve estar em UMA ÚNICA LINHA dentro do bloco
- Adicione uma mensagem contextual antes do bloco (ex: "Preparando seu relatório..." ou "Gerando PDF da proposta...")
- Depois do bloco, adicione um resumo dos dados principais encontrados
- Se a tool retornar erro, informe o usuário sem o bloco generate_pdf

REGRA CRÍTICA — BOTÃO DE DOWNLOAD:
- Quando o usuário pedir "botão de download", "baixar PDF", "me dê o PDF", "download da proposta", "gerar PDF" ou qualquer variação, você DEVE chamar a tool correspondente (gerar_proposta_pdf ou gerar_relatorio_executivo) para obter os dados reais.
- NUNCA descreva um botão de download em texto. O botão de download SÓ aparece quando você inclui o bloco \`\`\`generate_pdf\`\`\` com os dados reais.
- NUNCA invente links, caminhos de arquivo ou URLs. O frontend gera o PDF localmente a partir dos dados do bloco generate_pdf.
- Se o usuário mencionar uma proposta específica, use gerar_proposta_pdf com o nome do cliente. Se pedir relatório, use gerar_relatorio_executivo.

CRIAÇÃO DE PROPOSTA INTERATIVA:
- Quando o usuário pedir para "criar proposta", "gerar proposta interativa", "enviar proposta para o cliente", "montar proposta", use a tool criar_proposta_interativa.
- Esta tool cria um registro REAL no banco de dados com um link público compartilhável (/p/slug).
- Passe TODOS os dados disponíveis: cliente_nome, plano_atual, alternativas com valores reais, beneficiários.
- NUNCA descreva o link em texto — o frontend renderiza automaticamente um card com o link e botões.
- SEMPRE que tiver dados suficientes (nome do cliente + pelo menos uma alternativa), use esta tool em vez de apenas descrever o que faria.
- Se o usuário disser "crie", "confirmo", "pode criar", "faz a proposta" ou qualquer variação de confirmação, CHAME a tool imediatamente com os dados disponíveis no contexto — NÃO PEÇA MAIS INFORMAÇÕES.

REGRA CRÍTICA — LINK SEMPRE VISÍVEL:
- Toda vez que uma proposta interativa for criada OU já existir no contexto da conversa (mencionada por slug ou /p/SLUG), você DEVE emitir o bloco abaixo ao FINAL da sua resposta, mesmo que já tenha descrito o que fez:

\`\`\`proposta_criada
{"slug":"SLUG_AQUI","link":"/p/SLUG_AQUI","cliente_nome":"NOME_DO_CLIENTE"}
\`\`\`

- NUNCA mencione o link apenas em texto corrido. Sempre use o bloco acima.
- Isso é obrigatório — sem esse bloco, o usuário não vê o botão de acesso à proposta.

PESQUISA DE PERFIL DE CLIENTE:
Quando os dados retornados de uma tool tiverem o campo "__pesquisa_cliente", você DEVE incluir o JSON em um bloco especial:

\`\`\`pesquisa_cliente
{"nome":"Nome da Empresa","cnpj":"XX.XXX.XXX/XXXX-XX","cidade":"São Paulo"}
\`\`\`

Regras para pesquisa de perfil:
- Use a tool pesquisar_perfil_cliente quando o usuário pedir para pesquisar uma empresa, personalizar proposta, ou mencionar "pesquisar cliente", "perfil da empresa", "personalizar proposta"
- SEMPRE inclua o bloco pesquisa_cliente quando receber dados com __pesquisa_cliente
- Antes do bloco, diga algo como "Vou pesquisar o perfil da empresa para personalizar a proposta..."
- Depois do bloco, explique brevemente o que será feito com os dados encontrados

MEMÓRIA E APRENDIZADO:
- Você tem acesso a memórias persistentes e skills que definem suas preferências de design, tom de escrita e feedbacks anteriores
- SEMPRE consulte sua memória (já carregada no contexto abaixo) antes de gerar propostas, PDFs ou layouts
- Quando o usuário elogiar ou criticar algo que você fez, use a tool salvar_memoria para registrar
- Tipos de memória: preferencia_design, feedback_positivo, feedback_negativo, cor, tipografia, layout, tom_escrita, geral
- Exemplo: se o usuário disser "ficou ótimo esse layout", salve como feedback_positivo
- Exemplo: se disser "não gostei da cor", salve como feedback_negativo
${memoriaContexto}

--- CONTEXTO ATUAL ---
Data e hora: ${now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
Usuário logado: ${userName}${userCargo ? ` (${userCargo})` : ""}
Página atual: ${contexto_pagina || "não informada"}
Propostas ativas: ${propostasAtivas || 0}
Alertas não resolvidos: ${alertasNaoResolvidos || 0}`;

    // Agentic loop: call AI with tools (non-streaming), execute tools, then stream final answer
    const initialMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    const latestUserMessage = getLatestUserMessage(messages);
    const forcedToolChoice = getForcedToolChoice(latestUserMessage);

    // Step 1: Non-streaming call to determine if tools are needed
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: initialMessages,
        tools,
        stream: false,
        ...(forcedToolChoice ? { tool_choice: forcedToolChoice } : {}),
      }),
    });

    if (!toolResponse.ok) {
      if (toolResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (toolResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await toolResponse.text();
      console.error("AI gateway error:", toolResponse.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toolData = await toolResponse.json();
    const toolChoice = toolData.choices?.[0];
    const toolMessage = toolChoice?.message;

    // Step 2: If tool calls exist, execute them and collect results
    let toolResultsContext = "";
    let pdfPayload: Record<string, any> | null = null;
    let pesquisaPayload: Record<string, any> | null = null;
    let propostaCriadaPayload: Record<string, any> | null = null;

    if (toolMessage?.tool_calls?.length) {
      const results: string[] = [];

      for (const toolCall of toolMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch { /* empty args */ }

        console.log(`Executing tool: ${fnName}`, fnArgs);
        const result = await executeTool(fnName, fnArgs, supabase, messages, { corretoraId, corretoraData, usuario_id });
        console.log(`Tool result length: ${result.length}`);
        results.push(`[Resultado de ${fnName}]: ${result}`);

        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult?.__pdf_type) {
            pdfPayload = parsedResult;
          }
          if (parsedResult?.__pesquisa_cliente) {
            pesquisaPayload = parsedResult;
          }
          if (parsedResult?.__proposta_criada) {
            propostaCriadaPayload = parsedResult;
          }
        } catch {
          // ignore non-json tool outputs
        }
      }

      toolResultsContext = "\n\n--- DADOS CONSULTADOS ---\n" + results.join("\n\n");
      console.log(`Tool results context length: ${toolResultsContext.length}`);
    }

    if (propostaCriadaPayload) {
      const p = propostaCriadaPayload;
      const baseUrl = Deno.env.get("SITE_URL") || "";
      const fullLink = baseUrl ? `${baseUrl}/p/${p.slug}` : `/p/${p.slug}`;
      const propostaJson = JSON.stringify({
        slug: p.slug,
        link: fullLink,
        cliente_nome: p.cliente_nome,
        economia_mensal: p.economia_mensal,
        economia_percentual: p.economia_percentual,
      });

      const economiaPart = p.economia_mensal > 0
        ? `\n\n💰 **Economia projetada:** R$ ${Number(p.economia_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês (${Number(p.economia_percentual).toFixed(1)}%)`
        : "";

      // Always include a PDF block — use the explicit pdfPayload if available, otherwise the embedded one from the proposal
      const effectivePdf = pdfPayload || p.__embedded_pdf || null;
      let pdfBlock = "";
      if (effectivePdf) {
        pdfBlock = `\n\n\`\`\`generate_pdf\n${JSON.stringify(effectivePdf)}\n\`\`\``;
      }

      const msg = `✅ **Proposta criada com sucesso para ${p.cliente_nome}!**${economiaPart}\n\nO link da proposta interativa está pronto para envio ao cliente.\n\n\`\`\`proposta_criada\n${propostaJson}\n\`\`\`${pdfBlock}`;
      return streamTextAsSse(msg);
    }

    if (pdfPayload) {
      return streamTextAsSse(buildPdfAssistantMessage(pdfPayload));
    }

    if (pesquisaPayload) {
      const { nome, cnpj, cidade, site } = pesquisaPayload;
      const pesquisaJson = JSON.stringify(compactObject({ nome, cnpj, cidade, site }));
      const msg = `Vou pesquisar o perfil da empresa **${nome}** para personalizar a proposta.\n\n\`\`\`pesquisa_cliente\n${pesquisaJson}\n\`\`\`\n\nAssim que a pesquisa terminar, usarei os dados encontrados para criar uma proposta personalizada com linguagem e argumentos sob medida.`;
      return streamTextAsSse(msg);
    }

    // Step 3: Stream final response with tool results injected into context
    const finalMessages: any[] = [
      { role: "system", content: systemPrompt + toolResultsContext },
      ...messages,
    ];

    // If the model already gave a direct answer (no tools), include context hint
    if (!toolResultsContext && !toolMessage?.tool_calls?.length && toolMessage?.content) {
      // Direct answer — stream it as SSE
      const content = toolMessage.content;
      return streamTextAsSse(content);
    }

    // Stream the final AI response with tool data in context
    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!finalResponse.ok) {
      const fallback = toolMessage?.content || "Desculpe, não consegui processar sua solicitação.";
      return streamTextAsSse(fallback);
    }

    return new Response(finalResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("miranda-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
