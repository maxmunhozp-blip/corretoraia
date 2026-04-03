import { useState } from "react";
import { Bed, DollarSign, RotateCcw, MapPin, ShieldCheck, Activity, ChevronDown } from "lucide-react";

const termos = [
  {
    icon: Bed, term: "Acomodação",
    explain: "É o tipo de quarto que você terá se precisar ficar internado no hospital.",
    detail: "Quarto compartilhado (enfermaria): você divide o espaço com outros pacientes — opção mais econômica. Quarto individual (apartamento): um quarto só para você, com mais conforto e privacidade.",
    example: "Se você precisar de cirurgia, o tipo de acomodação define se ficará sozinho ou com outros pacientes no quarto.",
  },
  {
    icon: DollarSign, term: "Coparticipação",
    explain: "É quando você paga uma pequena taxa extra cada vez que usa o plano.",
    detail: "Nos planos sem coparticipação, tudo está incluso — você não paga nada a mais ao ir ao médico, fazer exames ou internar.",
    example: "Em planos com coparticipação, cada consulta pode custar R$ 20 a R$ 50 extras.",
  },
  {
    icon: RotateCcw, term: "Reembolso",
    explain: "Se você pagar por um médico fora da rede, alguns planos devolvem parte desse valor.",
    detail: "Útil quando você já tem um médico de confiança que não é da rede do plano.",
    example: "Você paga R$ 300 em uma consulta particular. Com reembolso, o plano pode devolver até R$ 150.",
  },
  {
    icon: MapPin, term: "Cobertura",
    explain: "Define onde você pode usar o plano — regional ou nacional.",
    detail: "Regional: cobre atendimentos na sua cidade e região. Nacional: pode usar em qualquer lugar do Brasil.",
    example: "Se sua filha estuda em outra cidade, um plano nacional cobre ela lá também.",
  },
  {
    icon: ShieldCheck, term: "Carência",
    explain: "Tempo de espera para usar alguns serviços após contratar o plano.",
    detail: "Urgências geralmente têm carência zero. Cirurgias eletivas podem ter carência de até 300 dias.",
    example: "Precisar de um pronto-socorro? Coberto imediatamente. Cirurgia planejada? Pode haver espera.",
  },
  {
    icon: Activity, term: "Rede Credenciada",
    explain: "São os hospitais, clínicas e médicos parceiros do seu plano.",
    detail: "Dentro da rede, você não paga nada extra. Fora dela, depende se o plano tem reembolso.",
    example: "É como uma lista de restaurantes parceiros de um app — dentro da lista, tudo funciona.",
  },
];

export function SecaoTermos() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Glossário</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Entendendo os termos
          </h2>
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
          <p className="text-sm text-[#71717A]">Explicamos tudo de forma simples para você decidir com confiança</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {termos.map((t, i) => {
            const open = openIdx === i;
            return (
              <button
                key={i}
                onClick={() => setOpenIdx(open ? null : i)}
                className="text-left bg-white border border-[#E4E4E7] rounded-2xl p-6 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#955251]/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5EDEC] flex items-center justify-center shrink-0">
                    <t.icon className="h-5 w-5 text-[#955251]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#18181B]">{t.term}</span>
                      <ChevronDown className={`h-4 w-4 text-[#71717A] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm text-[#3F3F46] leading-relaxed">{t.explain}</p>

                    {open && (
                      <div className="mt-4 pt-4 border-t border-[#E4E4E7] space-y-2">
                        <p className="text-sm text-[#3F3F46] leading-relaxed">{t.detail}</p>
                        <div className="bg-[#FAFAF9] rounded-lg p-3">
                          <p className="text-xs text-[#71717A] italic">💡 {t.example}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
