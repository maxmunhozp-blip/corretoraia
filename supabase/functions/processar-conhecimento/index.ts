import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { id, tipo, arquivo_url, busca_web } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let conteudoExtraido = "";
    let fonteUrl = "";

    if (tipo === "web" && busca_web) {
      // Web search via DuckDuckGo HTML (no API key needed)
      const searchResults = await fetchDuckDuckGo(busca_web);
      if (searchResults.length === 0) {
        await updateStatus(supabase, id, "erro", "Nenhum resultado encontrado na busca web");
        return new Response(JSON.stringify({ success: false, error: "No results" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch content from top 3 results
      const contents: string[] = [];
      for (const result of searchResults.slice(0, 3)) {
        try {
          const pageContent = await fetchPageContent(result.url);
          if (pageContent) {
            contents.push(`## Fonte: ${result.title}\nURL: ${result.url}\n\n${pageContent.slice(0, 3000)}`);
          }
        } catch { /* skip failed fetches */ }
      }

      fonteUrl = searchResults.map(r => r.url).join(", ");
      const combinedContent = contents.join("\n\n---\n\n") || "Conteúdo não pôde ser extraído dos resultados.";

      // Send to AI for structuring
      conteudoExtraido = await processWithAI(lovableKey, combinedContent, "web_search", busca_web);

    } else if (arquivo_url) {
      // File upload processing
      let textContent = "";

      try {
        const response = await fetch(arquivo_url);
        if (!response.ok) throw new Error("Failed to download file");

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("text") || contentType.includes("json") || contentType.includes("xml")) {
          textContent = await response.text();
        } else {
          // For binary files (PDF, DOCX, etc.), get raw text representation
          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // Extract readable text from binary
          textContent = extractTextFromBinary(bytes);
        }
      } catch (e) {
        textContent = `Arquivo disponível em: ${arquivo_url}. Tipo: ${tipo}`;
      }

      if (!textContent.trim()) {
        textContent = `Documento do tipo ${tipo} enviado. Título do arquivo disponível para referência.`;
      }

      conteudoExtraido = await processWithAI(lovableKey, textContent.slice(0, 8000), "document", "");

    } else {
      await updateStatus(supabase, id, "erro", "Nenhum arquivo ou busca fornecida");
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the record
    const updateData: Record<string, string> = {
      conteudo_extraido: conteudoExtraido,
      status: "indexado",
    };
    if (fonteUrl) updateData.fonte_url = fonteUrl;

    const { error } = await supabase.from("base_conhecimento").update(updateData).eq("id", id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("processar-conhecimento error:", e);

    // Try to update status to error
    try {
      const { id } = await req.clone().json().catch(() => ({ id: null }));
      if (id) {
        await updateStatus(supabase, id, "erro", e instanceof Error ? e.message : "Erro desconhecido");
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateStatus(supabase: any, id: string, status: string, erroMsg?: string) {
  const data: Record<string, string> = { status };
  if (erroMsg) data.erro_mensagem = erroMsg;
  await supabase.from("base_conhecimento").update(data).eq("id", id);
}

async function fetchDuckDuckGo(query: string): Promise<{ title: string; url: string }[]> {
  try {
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CoraBot/1.0)" },
    });
    const html = await resp.text();

    const results: { title: string; url: string }[] = [];
    const linkRegex = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null && results.length < 5) {
      let url = match[1];
      // DuckDuckGo wraps URLs in redirect
      const udParam = url.match(/uddg=([^&]+)/);
      if (udParam) url = decodeURIComponent(udParam[1]);
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      if (url.startsWith("http") && title) {
        results.push({ title, url });
      }
    }
    return results;
  } catch (e) {
    console.error("DuckDuckGo search failed:", e);
    return [];
  }
}

async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CoraBot/1.0)" },
    });
    clearTimeout(timeout);
    const html = await resp.text();
    // Strip HTML tags, scripts, styles
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    clearTimeout(timeout);
    return "";
  }
}

function extractTextFromBinary(bytes: Uint8Array): string {
  // Extract readable ASCII/UTF-8 strings from binary data
  const text: string[] = [];
  let current = "";
  for (const byte of bytes) {
    if (byte >= 32 && byte < 127) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length > 4) text.push(current);
      current = "";
    }
  }
  if (current.length > 4) text.push(current);
  return text.join(" ").slice(0, 10000);
}

async function processWithAI(apiKey: string, content: string, type: string, query: string): Promise<string> {
  const systemPrompt = type === "web_search"
    ? "Você é um assistente especializado em planos de saúde. Analise os resultados desta pesquisa web e extraia as informações mais relevantes sobre: regras comerciais, coberturas, carências, valores, restrições, diferenciais. Estruture o conteúdo de forma clara e organizada. Este conteúdo será usado pela assistente Miranda para responder dúvidas de corretores de planos de saúde."
    : "Você é um assistente especializado em planos de saúde. Analise este documento e extraia as informações mais importantes em formato estruturado: regras comerciais, coberturas, carências, valores, restrições, diferenciais. Seja detalhado pois este conteúdo será usado pela assistente Miranda para responder dúvidas de corretores.";

  const userMessage = type === "web_search"
    ? `Pesquisa: "${query}"\n\nResultados encontrados:\n\n${content}`
    : `Conteúdo do documento:\n\n${content}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    throw new Error(`AI processing failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Conteúdo processado sem detalhes extraídos.";
}
