import { useState, useEffect } from "react";
import { Building2, Search, Globe, Brain, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PesquisaData {
  nome: string;
  cnpj?: string;
  cidade?: string;
  site?: string;
}

interface PerfilResult {
  perfil: {
    porte: string;
    setor: string;
    setor_descricao?: string;
    tempo_mercado?: string;
    cidade?: string;
    estado?: string;
    posicionamento?: string;
    tom_comunicacao: string;
    numero_funcionarios_estimado?: string;
    contexto_relevante: string;
  };
  personalizacao: {
    frase_abertura_capa: string;
    paragrafo_abertura: string;
    paragrafo_quem_somos?: string;
    destaque_principal: string;
    argumento_chave: string;
    cta_personalizado: string;
    tom_instrucao?: string;
  };
  insights: string[];
  fontes?: string[];
  cnpj_dados?: Record<string, any> | null;
  pesquisado_em?: string;
}

interface PesquisaClienteCardProps {
  data: PesquisaData;
  onResult?: (result: PerfilResult) => void;
}

const porteLabels: Record<string, string> = {
  micro: "Microempresa",
  pequena: "Pequena empresa",
  media: "Média empresa",
  grande: "Grande empresa",
};

const tomLabels: Record<string, string> = {
  formal: "Formal",
  semiformal: "Semiformal",
  casual: "Casual",
};

const destaqueLabels: Record<string, string> = {
  economia: "💰 Economia",
  cobertura: "🛡️ Cobertura",
  rede: "🏥 Rede Credenciada",
  agilidade: "⚡ Agilidade",
};

type Stage = "buscando" | "cnpj" | "site" | "analisando" | "concluido" | "erro";

export function PesquisaClienteCard({ data, onResult }: PesquisaClienteCardProps) {
  const [stage, setStage] = useState<Stage>("buscando");
  const [result, setResult] = useState<PerfilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Simulate progress stages
      setStage("buscando");
      const timer1 = setTimeout(() => { if (!cancelled) setStage("cnpj"); }, 1500);
      const timer2 = setTimeout(() => { if (!cancelled) setStage("site"); }, 3000);
      const timer3 = setTimeout(() => { if (!cancelled) setStage("analisando"); }, 4500);

      try {
        const { data: resp, error: err } = await supabase.functions.invoke("miranda-pesquisar-cliente", {
          body: { nome: data.nome, cnpj: data.cnpj, cidade: data.cidade, site: data.site },
        });

        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (cancelled) return;

        if (err) throw new Error(err.message);
        if (resp?.error) throw new Error(resp.error);

        setResult(resp);
        setStage("concluido");
        onResult?.(resp);
      } catch (e: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        if (!cancelled) {
          setError(e.message || "Erro na pesquisa");
          setStage("erro");
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [data.nome]);

  if (stage === "erro") {
    return (
      <div className="my-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Falha na pesquisa: {error}</span>
        </div>
      </div>
    );
  }

  if (stage !== "concluido" || !result) {
    return (
      <div className="my-2 rounded-xl border border-brand/20 bg-brand-light p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold text-foreground">Pesquisando perfil do cliente...</span>
        </div>
        <div className="space-y-2">
          <ProgressStep
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Buscando dados públicos..."
            done={stage !== "buscando"}
            active={stage === "buscando"}
          />
          <ProgressStep
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Consultando CNPJ..."
            done={["site", "analisando"].includes(stage)}
            active={stage === "cnpj"}
          />
          <ProgressStep
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Analisando site oficial..."
            done={stage === "analisando"}
            active={stage === "site"}
          />
          <ProgressStep
            icon={<Brain className="h-3.5 w-3.5" />}
            label="Analisando com IA..."
            done={false}
            active={stage === "analisando"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-brand/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-brand/5 px-4 py-3 border-b border-brand/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Perfil identificado</p>
            <p className="text-[10px] text-muted-foreground">
              Fontes: {result.fontes?.join(", ") || "IA"}
              {(result as any)._from_cache && (
                <span className="ml-1 text-brand"> • cache</span>
              )}
            </p>
          </div>
          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <InfoRow label="Empresa" value={data.nome} />
          <InfoRow label="Porte" value={porteLabels[result.perfil.porte] || result.perfil.porte} />
          <InfoRow label="Setor" value={result.perfil.setor} />
          {result.perfil.tempo_mercado && <InfoRow label="No mercado" value={result.perfil.tempo_mercado} />}
          {result.perfil.cidade && <InfoRow label="Cidade" value={`${result.perfil.cidade}${result.perfil.estado ? ` - ${result.perfil.estado}` : ""}`} />}
          <InfoRow label="Tom" value={tomLabels[result.perfil.tom_comunicacao] || result.perfil.tom_comunicacao} />
          {result.perfil.numero_funcionarios_estimado && (
            <InfoRow label="Funcionários" value={result.perfil.numero_funcionarios_estimado} />
          )}
        </div>

        {/* AI strategy note */}
        <div className="mt-2 rounded-lg bg-brand-light px-3 py-2">
          <div className="flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 text-brand mt-0.5 shrink-0" />
            <div className="text-[11px] text-foreground">
              <span className="font-medium">Estratégia: </span>
              {destaqueLabels[result.personalizacao.destaque_principal] || result.personalizacao.destaque_principal}
              {" — "}
              {result.personalizacao.argumento_chave}
            </div>
          </div>
        </div>

        {/* Insights (collapsible, only for broker) */}
        {result.insights?.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className="flex items-center gap-1 text-[11px] text-brand hover:underline"
            >
              {showInsights ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showInsights ? "Ocultar" : "Ver"} dicas do corretor ({result.insights.length})
            </button>
            {showInsights && (
              <ul className="mt-1.5 space-y-1 pl-4">
                {result.insights.map((tip, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground list-disc">{tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressStep({ icon, label, done, active }: { icon: React.ReactNode; label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-opacity ${done ? "text-green-600" : active ? "text-foreground" : "text-muted-foreground/50"}`}>
      {done ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      ) : active ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
      ) : (
        <span className="h-3.5 w-3.5 flex items-center justify-center">{icon}</span>
      )}
      <span>{label}</span>
      {done && <span className="text-[10px] text-green-600">✓</span>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
