import { TrendingDown, Users, Shield, Star, ArrowRight } from "lucide-react";
import type { PlanoOfertado, PlanoAtual } from "@/lib/proposta/types";

interface Props {
  alternativas: PlanoOfertado[];
  planoAtual?: PlanoAtual;
  vidas?: number;
  clienteNome: string;
}

function KpiBlock({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 text-center ${accent ? "bg-[#955251] text-white" : "bg-white border border-[#E4E4E7]"}`}>
      <Icon className={`h-6 w-6 mx-auto mb-3 ${accent ? "text-white/80" : "text-[#955251]"}`} />
      <p className={`text-3xl md:text-4xl font-extrabold mb-1 ${accent ? "text-white" : "text-[#18181B]"}`}>{value}</p>
      <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${accent ? "text-white/70" : "text-[#71717A]"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/60" : "text-[#71717A]"}`}>{sub}</p>}
    </div>
  );
}

export function SecaoResumoExecutivo({ alternativas, planoAtual, vidas, clienteNome }: Props) {
  const melhorPlano = alternativas.find(a => a.recomendado) || alternativas[0];
  const menorValor = Math.min(...alternativas.map(a => a.valor_mensal));
  const maiorValor = Math.max(...alternativas.map(a => a.valor_mensal));
  const economiaAnual = planoAtual
    ? ((planoAtual.valor_mensal - (melhorPlano?.valor_mensal || 0)) * 12)
    : 0;
  const economiaMensal = planoAtual
    ? (planoAtual.valor_mensal - (melhorPlano?.valor_mensal || 0))
    : 0;

  const formatCurrency = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <section id="resumo-executivo" className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Resumo Executivo</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Visão geral da sua proposta
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <KpiBlock
            icon={Users}
            label="Vidas cobertas"
            value={String(vidas || alternativas[0]?.minimo_vidas || "—")}
            sub="beneficiários"
          />
          <KpiBlock
            icon={Shield}
            label="Opções"
            value={String(alternativas.length)}
            sub="planos analisados"
          />
          <KpiBlock
            icon={Star}
            label="Valor a partir de"
            value={formatCurrency(menorValor)}
            sub="por pessoa/mês"
          />
          {economiaAnual > 0 ? (
            <KpiBlock
              icon={TrendingDown}
              label="Economia anual"
              value={formatCurrency(economiaAnual)}
              sub={`${formatCurrency(economiaMensal)}/mês`}
              accent
            />
          ) : (
            <KpiBlock
              icon={TrendingDown}
              label="Até"
              value={formatCurrency(maiorValor)}
              sub="por pessoa/mês"
            />
          )}
        </div>

        {/* Recommendation highlight */}
        {melhorPlano && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-[#CA8A04]" />
                  <span className="text-xs uppercase tracking-[0.15em] font-semibold text-[#CA8A04]">Recomendação</span>
                </div>
                <h3 className="text-xl font-bold text-[#18181B] mb-1">
                  {melhorPlano.nome} — {melhorPlano.operadora}
                </h3>
                <p className="text-sm text-[#71717A] leading-relaxed max-w-lg">
                  {melhorPlano.descricao ||
                    `Selecionamos este plano como a melhor opção para ${clienteNome}, considerando cobertura, rede credenciada e custo-benefício.`}
                </p>
              </div>
              <div className="text-center md:text-right shrink-0">
                <p className="text-4xl font-extrabold text-[#955251]">{formatCurrency(melhorPlano.valor_mensal)}</p>
                <p className="text-xs text-[#71717A]">por pessoa / mês</p>
              </div>
            </div>

            {/* Plano atual vs recomendado */}
            {planoAtual && economiaMensal > 0 && (
              <div className="mt-6 pt-6 border-t border-[#E4E4E7]">
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <div className="bg-[#FEF3C7] rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-[#71717A] mb-0.5">Plano atual</p>
                    <p className="font-bold text-[#18181B]">{formatCurrency(planoAtual.valor_mensal)}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#16A34A]" />
                  <div className="bg-[#DCFCE7] rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-[#71717A] mb-0.5">Nossa recomendação</p>
                    <p className="font-bold text-[#16A34A]">{formatCurrency(melhorPlano.valor_mensal)}</p>
                  </div>
                  <div className="bg-[#955251] text-white rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-white/70 mb-0.5">Você economiza</p>
                    <p className="font-bold">{formatCurrency(economiaMensal)}/mês</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
