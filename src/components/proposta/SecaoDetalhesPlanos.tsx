import { useState } from "react";
import { Building2, Globe, Users, DollarSign, RotateCcw, HeartPulse, Clock } from "lucide-react";
import type { PlanoOfertado } from "@/lib/proposta/types";

interface Props {
  alternativas: PlanoOfertado[];
}

const campos = [
  { icon: Building2, label: "Acomodação", key: "acomodacao" },
  { icon: Globe, label: "Abrangência", key: "abrangencia" },
  { icon: Users, label: "Mínimo de vidas", key: "minimo_vidas" },
  { icon: DollarSign, label: "Coparticipação", key: "coparticipacao" },
  { icon: RotateCcw, label: "Reembolso", key: "reembolso" },
  { icon: HeartPulse, label: "Medicina preventiva", key: "medicina_preventiva" },
  { icon: Clock, label: "Início da cobertura", key: "inicio_cobertura" },
];

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function SecaoDetalhesPlanos({ alternativas }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Detalhes dos planos</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

      {/* Tabs */}
      {alternativas.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {alternativas.map((alt, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                activeTab === i
                  ? "bg-[#955251] text-white border-[#955251]"
                  : "border-[#E4E4E7] text-[#71717A] hover:border-[#955251]"
              }`}
            >
              {alt.nome}
            </button>
          ))}
        </div>
      )}

      {alternativas.map((plano, idx) => (
        <div key={idx} className={idx !== activeTab && alternativas.length > 1 ? "hidden" : ""}>
          {/* Header */}
          <div className="bg-[#F5EDEC] rounded-lg p-5 mb-6">
            <h3 className="text-lg font-bold text-[#955251]">{plano.nome}</h3>
            <p className="text-sm text-[#71717A]">{plano.operadora}</p>
            <p className="text-2xl font-extrabold text-[#18181B] mt-2">
              {formatCurrency(plano.valor_mensal)} <span className="text-sm font-normal text-[#71717A]">/ mês por beneficiário</span>
            </p>
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {campos.map((c) => {
              const val = (plano as any)[c.key];
              const display = typeof val === "boolean" ? (val ? "Sim" : "Não") : (val || "—");
              return (
                <div key={c.key} className="flex items-start gap-3">
                  <c.icon className="h-5 w-5 text-[#955251] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#71717A]">{c.label}</p>
                    <p className="text-sm font-medium text-[#18181B]">{String(display)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Descrição */}
          {plano.descricao && (
            <p className="text-[15px] text-[#3F3F46] leading-[1.7] border-l-4 border-[#955251] bg-[#F5EDEC] rounded-r-lg p-5">
              {plano.descricao}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
