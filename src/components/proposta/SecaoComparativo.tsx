import { Check, X, Star } from "lucide-react";
import type { PlanoOfertado, PlanoAtual, Beneficiario } from "@/lib/proposta/types";

interface Props {
  alternativas: PlanoOfertado[];
  planoAtual?: PlanoAtual;
  beneficiarios?: Beneficiario[];
}

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function BoolCell({ value }: { value: boolean | undefined }) {
  return value ? (
    <div className="flex items-center justify-center"><Check className="h-4 w-4 text-[#16A34A]" /></div>
  ) : (
    <div className="flex items-center justify-center"><X className="h-4 w-4 text-[#D4D4D8]" /></div>
  );
}

const caracteristicas: { label: string; hint: string; key: string }[] = [
  { label: "Acomodação", hint: "tipo de quarto no hospital", key: "acomodacao" },
  { label: "Coparticipação", hint: "paga algo a mais ao usar?", key: "coparticipacao" },
  { label: "Reembolso", hint: "pode ser ressarcido?", key: "reembolso" },
  { label: "Cobertura", hint: "regional ou nacional?", key: "abrangencia" },
  { label: "Med. Preventiva", hint: "programas de prevenção", key: "medicina_preventiva" },
  { label: "Valor mensal", hint: "por beneficiário", key: "valor_mensal" },
];

export function SecaoComparativo({ alternativas, planoAtual, beneficiarios }: Props) {
  const menorValor = Math.min(...alternativas.map((a) => a.valor_mensal));
  const recIdx = alternativas.findIndex((a) => a.recomendado);

  function getCellValue(plano: PlanoOfertado | PlanoAtual | undefined, key: string): React.ReactNode {
    if (!plano) return "—";
    const val = (plano as any)[key];
    if (key === "valor_mensal") {
      const isLowest = (plano as any).valor_mensal === menorValor;
      return (
        <span className={`text-lg font-extrabold ${isLowest ? "text-[#16A34A]" : "text-[#18181B]"}`}>
          {formatCurrency(Number(val) || 0)}
        </span>
      );
    }
    if (key === "coparticipacao") return <BoolCell value={!!val} />;
    if (key === "reembolso" || key === "medicina_preventiva") return <BoolCell value={!!val} />;
    return <span className="font-medium text-[#18181B]">{val || "—"}</span>;
  }

  return (
    <section className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Análise Comparativa</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Compare e escolha
          </h2>
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
          <p className="text-sm text-[#71717A] max-w-lg mx-auto">
            Analisamos cada detalhe para que você tome a melhor decisão com total transparência.
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-6 py-5 bg-[#FAFAF9] text-[#71717A] font-medium text-xs uppercase tracking-wider w-48" />
                  {planoAtual && (
                    <th className="text-center px-4 py-5 bg-[#FEF3C7]/50">
                      <p className="text-xs text-[#71717A] uppercase tracking-wider mb-1">Atual</p>
                      <p className="font-bold text-[#18181B]">{planoAtual.nome || "Plano Atual"}</p>
                    </th>
                  )}
                  {alternativas.map((alt, i) => {
                    const isRec = alt.recomendado || i === recIdx;
                    return (
                      <th key={i} className={`text-center px-4 py-5 ${isRec ? "bg-[#955251]" : "bg-[#F5EDEC]"}`}>
                        {isRec && (
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Star className="h-3 w-3 text-white" />
                            <span className="text-[10px] text-white/80 uppercase tracking-wider">Recomendado</span>
                          </div>
                        )}
                        <p className={`font-bold ${isRec ? "text-white" : "text-[#955251]"}`}>{alt.nome}</p>
                        <p className={`text-xs ${isRec ? "text-white/70" : "text-[#71717A]"}`}>{alt.operadora}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {caracteristicas.map((c, ri) => (
                  <tr key={c.key} className={`${ri % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"} border-t border-[#F4F4F5]`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#18181B] text-sm">{c.label}</p>
                      <p className="text-[11px] text-[#A1A1AA]">{c.hint}</p>
                    </td>
                    {planoAtual && (
                      <td className="px-4 py-4 text-center">{getCellValue(planoAtual, c.key)}</td>
                    )}
                    {alternativas.map((alt, j) => (
                      <td key={j} className="px-4 py-4 text-center">{getCellValue(alt, c.key)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 text-xs text-[#71717A] justify-center mb-12">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#16A34A]" /> Sim, incluso</span>
          <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5 text-[#D4D4D8]" /> Não incluso</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-[#DCFCE7]" /> Menor valor</span>
        </div>

        {/* Vida a vida */}
        {beneficiarios && beneficiarios.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="px-6 py-4 bg-[#FAFAF9] border-b border-[#E4E4E7]">
              <h3 className="font-bold text-[#18181B]">Valores por beneficiário</h3>
              <p className="text-xs text-[#71717A]">Detalhamento individual dos valores mensais</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F4F4F5]">
                    <th className="text-left px-6 py-3 text-[#71717A] font-medium text-xs uppercase tracking-wider">Beneficiário</th>
                    <th className="text-center px-4 py-3 text-[#71717A] font-medium text-xs uppercase tracking-wider">Idade</th>
                    {alternativas.map((alt, i) => (
                      <th key={i} className="text-right px-4 py-3 text-[#955251] font-bold text-xs uppercase tracking-wider">{alt.nome}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {beneficiarios.map((b, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"} border-t border-[#F4F4F5]`}>
                      <td className="px-6 py-3 font-medium text-[#18181B]">{b.nome}</td>
                      <td className="px-4 py-3 text-center text-[#71717A]">{b.idade}</td>
                      {alternativas.map((alt, j) => (
                        <td key={j} className="px-4 py-3 text-right font-medium text-[#18181B]">
                          {formatCurrency(b.valores?.[alt.nome] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-[#F5EDEC] font-bold border-t border-[#E4E4E7]">
                    <td className="px-6 py-3 text-[#955251]">TOTAL</td>
                    <td />
                    {alternativas.map((alt, j) => (
                      <td key={j} className="px-4 py-3 text-right text-[#955251]">
                        {formatCurrency(alt.valor_mensal)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Economia card */}
        {planoAtual && alternativas.length > 0 && (
          <div className="mt-8 bg-[#955251] rounded-2xl p-8 text-center text-white">
            <p className="text-sm text-white/70 mb-2">Economia estimada ao migrar</p>
            <p className="text-4xl font-extrabold mb-1">
              {formatCurrency(((planoAtual.valor_mensal || 0) - (alternativas[recIdx >= 0 ? recIdx : 0]?.valor_mensal || 0)) * 12)}
            </p>
            <p className="text-white/60 text-sm">por ano</p>
          </div>
        )}
      </div>
    </section>
  );
}
