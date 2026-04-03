import { useParams } from "react-router-dom";
import { usePropostaBySlug, useRegistrarVisualizacao } from "@/hooks/usePropostasInterativas";
import { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { PropostaHeader } from "@/components/proposta/PropostaHeader";
import { SecaoCapa } from "@/components/proposta/SecaoCapa";
import { SecaoResumoExecutivo } from "@/components/proposta/SecaoResumoExecutivo";
import { SecaoQuemSomos } from "@/components/proposta/SecaoQuemSomos";
import { SecaoPorQueEscolher } from "@/components/proposta/SecaoPorQueEscolher";
import { SecaoTermos } from "@/components/proposta/SecaoTermos";
import { SecaoComparativo } from "@/components/proposta/SecaoComparativo";
import { SecaoDetalhesPlanos } from "@/components/proposta/SecaoDetalhesPlanos";
import { SecaoRedeCredenciada } from "@/components/proposta/SecaoRedeCredenciada";
import { SecaoProximosPassos } from "@/components/proposta/SecaoProximosPassos";
import type { PropostaCompleta, PlanoOfertado, CorretoraInfo } from "@/lib/proposta/types";

const SECTION_IDS = ["capa", "resumo-executivo", "quem-somos", "por-que", "termos", "comparativo", "detalhes", "rede", "proximos-passos"];
const SECTION_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function parsePropostaData(proposta: any): PropostaCompleta {
  const dados = proposta?.dados || {};
  const corretora: CorretoraInfo = dados.corretora || { nome: "Cora", email: "" };
  const alternativas: PlanoOfertado[] = (proposta?.alternativas || dados.alternativas || []).map((a: any) => ({
    nome: a.nome || "Plano",
    operadora: a.operadora || "",
    valor_mensal: Number(a.valor_mensal) || 0,
    acomodacao: a.acomodacao || "Apartamento",
    abrangencia: a.abrangencia || "Regional",
    coparticipacao: !!a.coparticipacao,
    reembolso: !!a.reembolso,
    medicina_preventiva: a.medicina_preventiva !== false,
    minimo_vidas: a.minimo_vidas,
    inicio_cobertura: a.inicio_cobertura || "1 dia após contratação",
    recomendado: !!a.recomendado,
    descricao: a.descricao,
    hospitais: a.hospitais || [],
  }));

  return {
    cliente_nome: proposta?.cliente_nome || "Cliente",
    cliente_empresa: proposta?.cliente_empresa,
    cliente_telefone: proposta?.cliente_telefone,
    vidas: dados.vidas,
    valida_ate: proposta?.valida_ate,
    corretora,
    plano_atual: proposta?.plano_atual || dados.plano_atual,
    alternativas,
    beneficiarios: dados.beneficiarios,
  };
}

export default function PropostaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const { data: proposta, isLoading, error } = usePropostaBySlug(slug);
  const registrar = useRegistrarVisualizacao();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [showFloating, setShowFloating] = useState(false);
  const [dismissedFloating, setDismissedFloating] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (slug) registrar.mutate(slug);
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setScrollProgress(Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100));

      const offsets = sectionRefs.current.map((el) => el?.getBoundingClientRect().top ?? Infinity);
      const idx = offsets.findIndex((t, i) => {
        const next = offsets[i + 1] ?? Infinity;
        return t <= 200 && next > 200;
      });
      if (idx >= 0) setActiveSection(idx);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissedFloating) setShowFloating(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [dismissedFloating]);

  const setSectionRef = useCallback((idx: number) => (el: HTMLElement | null) => {
    sectionRefs.current[idx] = el;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-[#F5EDEC] rounded mx-auto mb-4" />
          <div className="h-4 w-64 bg-[#F8F8F8] rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !proposta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#18181B] mb-2">Proposta não encontrada</h1>
          <p className="text-[#71717A]">O link pode ter expirado ou ser inválido.</p>
        </div>
      </div>
    );
  }

  const data = parsePropostaData(proposta);
  const validaDias = data.valida_ate
    ? Math.max(0, Math.ceil((new Date(data.valida_ate).getTime() - Date.now()) / 86400000))
    : 7;

  const whatsappNum = (data.cliente_telefone || data.corretora.telefone || "").replace(/\D/g, "");
  const minutesViewing = Math.floor((Date.now() - startTime.current) / 60000);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 z-50 h-0.5 transition-all duration-150"
        style={{ width: `${scrollProgress}%`, background: "#955251" }}
      />

      {/* Sticky nav dots */}
      <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        {SECTION_LABELS.map((label, i) => {
          const active = i === activeSection;
          const visited = i <= activeSection;
          return (
            <button
              key={i}
              onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`w-3 h-3 rounded-full transition-all ${
                active
                  ? "bg-[#955251] scale-125 shadow-[0_0_8px_rgba(149,82,81,0.4)]"
                  : visited
                  ? "bg-[#955251]/40"
                  : "bg-[#E4E4E7]"
              }`}
              title={`Seção ${label}`}
            />
          );
        })}
      </nav>

      {/* Sticky header */}
      <div className="sticky top-0 z-30">
        <PropostaHeader corretora={data.corretora} />
      </div>

      {/* Sections */}
      <div ref={setSectionRef(0)} id="capa">
        <SecaoCapa
          corretora={data.corretora}
          clienteNome={data.cliente_nome}
          clienteEmpresa={data.cliente_empresa}
          validaDias={validaDias}
        />
      </div>

      <div ref={setSectionRef(1)} id="resumo-executivo">
        <SecaoResumoExecutivo
          alternativas={data.alternativas}
          planoAtual={data.plano_atual}
          vidas={data.vidas}
          clienteNome={data.cliente_nome}
        />
      </div>

      <div ref={setSectionRef(2)} id="quem-somos">
        <SecaoQuemSomos corretora={data.corretora} />
      </div>

      <div ref={setSectionRef(3)} id="por-que">
        <SecaoPorQueEscolher />
      </div>

      <div ref={setSectionRef(4)} id="termos">
        <SecaoTermos />
      </div>

      <div ref={setSectionRef(5)} id="comparativo">
        <SecaoComparativo
          alternativas={data.alternativas}
          planoAtual={data.plano_atual}
          beneficiarios={data.beneficiarios}
        />
      </div>

      <div ref={setSectionRef(6)} id="detalhes">
        <SecaoDetalhesPlanos alternativas={data.alternativas} />
      </div>

      <div ref={setSectionRef(7)} id="rede">
        <SecaoRedeCredenciada alternativas={data.alternativas} />
      </div>

      <div ref={setSectionRef(8)} id="proximos-passos">
        <SecaoProximosPassos
          corretora={data.corretora}
          validaAte={data.valida_ate}
          telefoneContato={data.corretora.telefone}
        />
      </div>

      {/* Floating CTA */}
      {showFloating && !dismissedFloating && whatsappNum && (
        <div className="fixed bottom-6 left-6 z-50 bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-w-xs animate-fade-in">
          <button
            onClick={() => { setDismissedFloating(true); setShowFloating(false); }}
            className="absolute top-3 right-3 text-[#A1A1AA] hover:text-[#18181B]"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm text-[#18181B] mb-3">
            Você está analisando esta proposta há {Math.max(1, minutesViewing)} minuto{minutesViewing !== 1 ? "s" : ""}. Alguma dúvida?
          </p>
          <a
            href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre a proposta.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#955251] text-white rounded-xl text-sm font-semibold hover:bg-[#7a3f3e] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Falar com corretor
          </a>
        </div>
      )}
    </div>
  );
}
