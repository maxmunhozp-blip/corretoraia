import { CheckCircle, Zap, Globe, HeartPulse } from "lucide-react";

const cards = [
  { icon: CheckCircle, title: "Sem coparticipação", desc: "Você não paga nada extra ao usar consultas, exames ou internações. O plano cobre tudo." },
  { icon: Zap, title: "Ativação rápida", desc: "Seu plano começa a valer no dia seguinte à contratação, sem longos períodos de espera." },
  { icon: Globe, title: "Cobertura ampla", desc: "Oferecemos opções regionais e nacionais, para quem fica na cidade e para quem viaja." },
  { icon: HeartPulse, title: "Medicina preventiva", desc: "Os planos incluem programas para cuidar da sua saúde antes de você adoecer." },
];

export function SecaoPorQueEscolher() {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Por que nos escolher?</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="border border-[#E4E4E7] rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <c.icon className="h-8 w-8 text-[#955251] mb-4" />
            <h3 className="font-semibold text-[#18181B] mb-2">{c.title}</h3>
            <p className="text-sm text-[#71717A] leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
