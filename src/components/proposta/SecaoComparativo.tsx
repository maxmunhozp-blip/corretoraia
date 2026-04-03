import { Check, X } from "lucide-react";
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
    <Check className="h-4 w-4 text-[#16A34A] mx-auto" />
  ) : (
    <X className="h-4 w-4 text-[#71717A] mx-auto" />
  );
}

const caracteristicas: { label: string; hint: string; key: string }[] = [
  { label: "ACOMODAÇÃO", hint: "tipo de quarto no hospital", key: "acomodacao" },
  { label: "COPARTICIPAÇÃO", hint: "paga algo a mais ao usar?", key: "coparticipacao" },
  { label: "REEMBOLSO", hint: "pode ser ressarcido?", key: "reembolso" },
  { label: "COBERTURA", hint: "regional ou nacional?", key: "abrangencia" },
  { label: "MEDICINA PREVENTIVA", hint: "ajuda a prevenir doenças?", key: "medicina_preventiva" },
  { label: "VALOR MENSAL", hint: "por beneficiário", key: "valor_mensal" },
];

export function SecaoComparativo({ alternativas, planoAtual, beneficiarios }: Props) {
  const menorValor = Math.min(...alternativas.map((a) => a.valor_mensal));
  const recIdx = alternativas.findIndex((a) => a.recomendado);

  function getCellValue(plano: PlanoOfertado | PlanoAtual | undefined, key: string): React.ReactNode {
    if (!plano) return "—";
    const val = (plano as any)[key];
    if (key === "valor_mensal") {
      return <span className="font-bold">{formatCurrency(Number(val) || 0)}</span>;
    }
    if (key === "coparticipacao") return <BoolCell value={!!val} />;
    if (key === "reembolso" || key === "medicina_preventiva") return <BoolCell value={!!val} />;
    return val || "—";
  }

  function getValorBg(plano: any, isAtual: boolean) {
    if (isAtual) return "bg-[#FEF3C7]";
    if (plano.valor_mensal === menorValor) return "bg-[#DCFCE7]";
    if (plano.recomendado) return "bg-[#F5EDEC]";
    return "";
  }

  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Comparativo entre os planos</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-2" />
      <p className="text-sm text-[#71717A] mb-4">Analisamos cada detalhe para que você tome a melhor decisão</p>
      <p className="text-[15px] text-[#3F3F46] leading-[1.7] mb-8">
        Abaixo comparamos as opções que selecionamos para o seu perfil. Avalie cada
        característica com calma — estamos aqui para tirar qualquer dúvida.
      </p>

      {/* Tabela de características */}
      <div className="overflow-x-auto rounded-lg border border-[#E4E4E7] mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 bg-[#F5EDEC] text-[#955251] font-bold text-xs">CARACTERÍSTICA</th>
              {planoAtual && (
                <th className="text-center px-4 py-3 bg-[#F5EDEC] text-[#955251] font-bold text-xs">
                  {planoAtual.nome || "Plano Atual"}
                </th>
              )}
              {alternativas.map((alt, i) => (
                <th key={i} className="text-center px-4 py-3 bg-[#955251] text-white font-bold text-xs">
                  {alt.nome}
                  <br />
                  <span className="text-[10px] font-normal text-white/70">{alt.operadora}</span>
                  {(alt.recomendado || i === recIdx) && (
                    <span className="block mt-1 text-[10px] border border-white/50 rounded-full px-2 py-0.5 inline-block">
                      Recomendado
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {caracteristicas.map((c, ri) => (
              <tr key={c.key} className={ri % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}>
                <td className="px-4 py-3 text-[#18181B] font-medium">
                  {c.label}
                  <span className="block text-[11px] text-[#71717A] font-normal">({c.hint})</span>
                </td>
                {planoAtual && (
                  <td className={`px-4 py-3 text-center ${c.key === "valor_mensal" ? getValorBg(planoAtual, true) : ""}`}>
                    {getCellValue(planoAtual, c.key)}
                  </td>
                )}
                {alternativas.map((alt, j) => (
                  <td key={j} className={`px-4 py-3 text-center ${c.key === "valor_mensal" ? getValorBg(alt, false) : ""}`}>
                    {getCellValue(alt, c.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-[#71717A] mb-10">
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[#16A34A]" /> Sim, incluso</span>
        <span className="flex items-center gap-1"><X className="h-3 w-3 text-[#71717A]" /> Não incluso</span>
        <span className="inline-block w-3 h-3 rounded bg-[#DCFCE7]" /> Menor valor
      </div>

      {/* Tabela vida a vida */}
      {beneficiarios && beneficiarios.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-[#18181B] mb-4">Comparativo vida a vida</h3>
          <div className="overflow-x-auto rounded-lg border border-[#E4E4E7] mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5EDEC]">
                  <th className="text-left px-4 py-3 text-[#955251] font-bold text-xs">Beneficiário</th>
                  <th className="text-center px-4 py-3 text-[#955251] font-bold text-xs">Idade</th>
                  {alternativas.map((alt, i) => (
                    <th key={i} className="text-right px-4 py-3 text-[#955251] font-bold text-xs">{alt.nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {beneficiarios.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}>
                    <td className="px-4 py-3 font-medium text-[#18181B]">{b.nome}</td>
                    <td className="px-4 py-3 text-center text-[#71717A]">{b.idade}</td>
                    {alternativas.map((alt, j) => (
                      <td key={j} className="px-4 py-3 text-right text-[#18181B]">
                        {formatCurrency(b.valores?.[alt.nome] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-[#F5EDEC] font-bold">
                  <td className="px-4 py-3 text-[#18181B]">TOTAL</td>
                  <td />
                  {alternativas.map((alt, j) => (
                    <td key={j} className="px-4 py-3 text-right text-[#18181B]">
                      {formatCurrency(alt.valor_mensal)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Economia card */}
      {planoAtual && alternativas.length > 0 && (
        <div className="border-l-4 border-[#955251] bg-[#F5EDEC] rounded-r-lg p-5">
          <p className="text-[15px] text-[#3F3F46] leading-[1.7]">
            Migrando para <strong>{alternativas[recIdx >= 0 ? recIdx : 0]?.nome}</strong>, você economiza{" "}
            <strong className="text-[#16A34A]">
              {formatCurrency((planoAtual.valor_mensal || 0) - (alternativas[recIdx >= 0 ? recIdx : 0]?.valor_mensal || 0))}
            </strong>{" "}
            por mês —{" "}
            <strong className="text-[#16A34A]">
              {formatCurrency(((planoAtual.valor_mensal || 0) - (alternativas[recIdx >= 0 ? recIdx : 0]?.valor_mensal || 0)) * 12)}
            </strong>{" "}
            por ano.
          </p>
        </div>
      )}
    </section>
  );
}
