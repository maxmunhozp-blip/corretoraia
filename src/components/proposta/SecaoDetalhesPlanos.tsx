import { useState } from "react";
import { Building2, Globe, Users, DollarSign, RotateCcw, HeartPulse, Clock, Star, Check } from "lucide-react";
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
  { icon: HeartPulse, label: "Med. preventiva", key: "medicina_preventiva" },
  { icon: Clock, label: "Início cobertura", key: "inicio_cobertura" },
];

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function SecaoDetalhesPlanos({ alternativas }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Planos em Detalhe</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Conheça cada opção
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
        </div>

        {/* Tabs */}
        {alternativas.length > 1 && (
          <div className="flex gap-3 mb-8 justify-center flex-wrap">
            {alternativas.map((alt, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  activeTab === i
                    ? "bg-[#955251] text-white border-[#955251] shadow-[0_4px_12px_rgba(149,82,81,0.3)]"
                    : "border-[#E4E4E7] text-[#71717A] hover:border-[#955251]/50"
                }`}
              >
                {alt.recomendado && <Star className="inline h-3.5 w-3.5 mr-1.5" />}
                {alt.nome}
              </button>
            ))}
          </div>
        )}

        {/* Plan cards */}
        {alternativas.map((plano, idx) => (
          <div key={idx} className={idx !== activeTab && alternativas.length > 1 ? "hidden" : ""}>
            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              {/* Plan header */}
              <div className="bg-gradient-to-r from-[#955251] to-[#7a3f3e] p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    {plano.recomendado && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="h-4 w-4 text-[#FCD34D]" />
                        <span className="text-xs uppercase tracking-wider text-white/80">Recomendado</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold">{plano.nome}</h3>
                    <p className="text-white/70">{plano.operadora}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold">{formatCurrency(plano.valor_mensal)}</p>
                    <p className="text-sm text-white/60">por pessoa / mês</p>
                  </div>
                </div>
              </div>

              {/* Features grid */}
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {campos.map((c) => {
                    const val = (plano as any)[c.key];
                    const display = typeof val === "boolean" ? (val ? "Sim" : "Não") : (val || "—");
                    const isBool = typeof val === "boolean";
                    return (
                      <div key={c.key} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F5EDEC] flex items-center justify-center shrink-0">
                          <c.icon className="h-4 w-4 text-[#955251]" />
                        </div>
                        <div>
                          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-wider">{c.label}</p>
                          {isBool ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              {val ? (
                                <><Check className="h-3.5 w-3.5 text-[#16A34A]" /><span className="text-sm font-medium text-[#16A34A]">Sim</span></>
                              ) : (
                                <span className="text-sm font-medium text-[#71717A]">Não</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-[#18181B]">{String(display)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Description */}
                {plano.descricao && (
                  <div className="mt-8 bg-[#FAFAF9] rounded-xl p-6 border border-[#E4E4E7]">
                    <p className="text-sm text-[#3F3F46] leading-relaxed">{plano.descricao}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
