import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { acao, corretora_id, ...params } = await req.json();

    if (!acao) {
      return new Response(JSON.stringify({ error: "Ação obrigatória" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (acao) {
      /* ── Ler toda a memória consolidada ── */
      case "ler_memoria": {
        const [{ data: memorias }, { data: skills }] = await Promise.all([
          supabase
            .from("miranda_memoria")
            .select("tipo, titulo, conteudo")
            .eq("ativo", true)
            .or(corretora_id ? `corretora_id.eq.${corretora_id},corretora_id.is.null` : "corretora_id.is.null")
            .order("criado_em", { ascending: true }),
          supabase
            .from("miranda_skills")
            .select("nome, descricao, conteudo_md")
            .eq("ativo", true)
            .or(corretora_id ? `corretora_id.eq.${corretora_id},corretora_id.is.null` : "corretora_id.is.null")
            .order("criado_em", { ascending: true }),
        ]);

        // Build consolidated markdown
        let md = "# Memória da Miranda\n\n";

        if (skills?.length) {
          md += "## Skills\n\n";
          for (const s of skills) {
            md += `### ${s.nome}\n${s.descricao ? `> ${s.descricao}\n\n` : "\n"}${s.conteudo_md}\n\n---\n\n`;
          }
        }

        if (memorias?.length) {
          const byType: Record<string, typeof memorias> = {};
          for (const m of memorias) {
            if (!byType[m.tipo]) byType[m.tipo] = [];
            byType[m.tipo].push(m);
          }

          md += "## Memórias Aprendidas\n\n";
          for (const [tipo, items] of Object.entries(byType)) {
            md += `### ${tipo}\n\n`;
            for (const item of items) {
              md += `**${item.titulo}**: ${item.conteudo}\n\n`;
            }
          }
        }

        return new Response(JSON.stringify({ memoria: md, total_memorias: memorias?.length || 0, total_skills: skills?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ── Salvar nova memória ── */
      case "salvar_memoria": {
        const { tipo, titulo, conteudo } = params;
        if (!tipo || !titulo || !conteudo) {
          return new Response(JSON.stringify({ error: "tipo, titulo e conteudo são obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("miranda_memoria")
          .insert({ corretora_id, tipo, titulo, conteudo })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ sucesso: true, memoria: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ── Atualizar memória existente ── */
      case "atualizar_memoria": {
        const { id, conteudo: novoConteudo, ativo } = params;
        if (!id) {
          return new Response(JSON.stringify({ error: "id obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: Record<string, any> = { atualizado_em: new Date().toISOString() };
        if (novoConteudo !== undefined) updates.conteudo = novoConteudo;
        if (ativo !== undefined) updates.ativo = ativo;

        const { error } = await supabase.from("miranda_memoria").update(updates).eq("id", id);
        if (error) throw error;

        return new Response(JSON.stringify({ sucesso: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ── Atualizar skill ── */
      case "atualizar_skill": {
        const { nome, conteudo_md } = params;
        if (!nome || !conteudo_md) {
          return new Response(JSON.stringify({ error: "nome e conteudo_md obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find and update, or insert if not found for this corretora
        const { data: existing } = await supabase
          .from("miranda_skills")
          .select("id, versao")
          .eq("nome", nome)
          .or(corretora_id ? `corretora_id.eq.${corretora_id}` : "corretora_id.is.null")
          .limit(1)
          .single();

        if (existing) {
          await supabase.from("miranda_skills").update({
            conteudo_md,
            versao: (existing.versao || 1) + 1,
          }).eq("id", existing.id);
        } else {
          await supabase.from("miranda_skills").insert({
            corretora_id,
            nome,
            descricao: params.descricao,
            conteudo_md,
          });
        }

        return new Response(JSON.stringify({ sucesso: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ── Listar memórias ── */
      case "listar_memorias": {
        const { data } = await supabase
          .from("miranda_memoria")
          .select("id, tipo, titulo, conteudo, ativo, criado_em")
          .or(corretora_id ? `corretora_id.eq.${corretora_id},corretora_id.is.null` : "corretora_id.is.null")
          .order("criado_em", { ascending: false })
          .limit(50);

        return new Response(JSON.stringify({ memorias: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${acao}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("miranda-memoria error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
