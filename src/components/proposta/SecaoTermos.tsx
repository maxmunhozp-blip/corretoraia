import { useState } from "react";
import { Bed, DollarSign, RotateCcw, MapPin, ShieldCheck, Activity, ChevronDown } from "lucide-react";

const termos = [
  {
    icon: Bed, term: "ACOMODAÇÃO",
    explain: "É o tipo de quarto que você terá se precisar ficar internado no hospital.",
    detail: "Quarto compartilhado (enfermaria): você divide o espaço com outros pacientes — opção mais econômica. Quarto individual (apartamento): um quarto só para você, com mais conforto e privacidade.",
    example: "Se você precisar de cirurgia, o tipo de acomodação define se ficará sozinho ou com outros pacientes no quarto.",
  },
  {
    icon: DollarSign, term: "COPARTICIPAÇÃO",
    explain: "É quando você paga uma pequena taxa extra cada vez que usa o plano.",
    detail: "Nos planos sem coparticipação, tudo está incluso — você não paga nada a mais ao ir ao médico, fazer exames ou internar.",
    example: "Em planos com coparticipação, cada consulta pode custar R$ 20 a R$ 50 extras. Nos planos que apresentamos, isso não existe.",
  },
  {
    icon: RotateCcw, term: "REEMBOLSO",
    explain: "Se você pagar por um médico fora da rede credenciada, alguns planos devolvem parte desse valor.",
    detail: "Útil quando você já tem um médico de confiança que não é da rede do plano.",
    example: "Você paga R$ 300 em uma consulta particular. Com reembolso, o plano pode devolver até R$ 150.",
  },
  {
    icon: MapPin, term: "COBERTURA",
    explain: "Define onde você pode usar o plano.",
    detail: "Regional: cobre atendimentos na sua cidade e região. Nacional: pode usar em qualquer lugar do Brasil — ideal para quem viaja ou tem filhos em outras cidades.",
    example: "Se sua filha estuda em outra cidade, um plano nacional cobre ela lá também.",
  },
  {
    icon: ShieldCheck, term: "CARÊNCIA",
    explain: "É o tempo que você precisa esperar para usar alguns serviços após contratar o plano.",
    detail: "Urgências e emergências geralmente têm carência zero. Cirurgias eletivas e partos podem ter carência de até 300 dias.",
    example: "Se você contratar hoje e precisar de uma cirurgia planejada amanhã, pode haver carência. Mas um pronto-socorro é coberto imediatamente.",
  },
  {
    icon: Activity, term: "REDE CREDENCIADA",
    explain: "São os hospitais, clínicas e médicos parceiros do seu plano.",
    detail: "Dentro da rede, você não paga nada extra. Fora dela, depende se o plano tem reembolso.",
    example: "É como uma lista de restaurantes parceiros de um delivery: dentro da lista, tudo funciona perfeitamente.",
  },
];

export function SecaoTermos() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Entendendo os termos</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-2" />
      <p className="text-sm text-[#71717A] mb-8">Explicamos tudo de forma simples para você decidir com confiança</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {termos.map((t, i) => {
          const open = openIdx === i;
          return (
            <button
              key={i}
              onClick={() => setOpenIdx(open ? null : i)}
              className="text-left border border-[#E4E4E7] rounded-lg p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <t.icon className="h-6 w-6 text-[#955251] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#955251] text-sm tracking-wide">{t.term}</span>
                    <ChevronDown className={`h-4 w-4 text-[#71717A] transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                  <span className="text-xs text-[#71717A]"> (o que significa?)</span>
                  <p className="text-sm text-[#3F3F46] mt-2 leading-relaxed">{t.explain}</p>

                  {open && (
                    <div className="mt-3 animate-fade-in">
                      <p className="text-sm text-[#3F3F46] leading-relaxed">{t.detail}</p>
                      <p className="text-xs text-[#71717A] italic mt-2">Exemplo: {t.example}</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
