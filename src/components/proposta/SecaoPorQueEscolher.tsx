import { CheckCircle, Zap, Globe, HeartPulse, ShieldCheck, Headphones } from "lucide-react";

const cards = [
  {
    icon: CheckCircle,
    title: "Zero coparticipação",
    desc: "Você não paga nada extra ao usar consultas, exames ou internações.",
    stat: "100%",
    statLabel: "coberto",
  },
  {
    icon: Zap,
    title: "Ativação rápida",
    desc: "Seu plano começa a valer no dia seguinte à contratação.",
    stat: "24h",
    statLabel: "para ativar",
  },
  {
    icon: Globe,
    title: "Cobertura flexível",
    desc: "Opções regionais e nacionais para quem fica na cidade ou viaja.",
    stat: "2",
    statLabel: "modalidades",
  },
  {
    icon: HeartPulse,
    title: "Medicina preventiva",
    desc: "Programas para cuidar da sua saúde antes de você adoecer.",
    stat: "∞",
    statLabel: "prevenção",
  },
  {
    icon: ShieldCheck,
    title: "Sem carência",
    desc: "Urgências e emergências cobertas desde o primeiro dia.",
    stat: "0",
    statLabel: "dias carência",
  },
  {
    icon: Headphones,
    title: "Suporte dedicado",
    desc: "Corretor exclusivo para acompanhar você durante toda a vigência.",
    stat: "1:1",
    statLabel: "atendimento",
  },
];

export function SecaoPorQueEscolher() {
  return (
    <section className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Diferenciais</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Por que nos escolher?
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E4E4E7] p-6 hover:shadow-[0_8px_32px_rgba(149,82,81,0.08)] transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#F5EDEC] flex items-center justify-center group-hover:bg-[#955251] transition-colors">
                  <c.icon className="h-5 w-5 text-[#955251] group-hover:text-white transition-colors" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#955251]">{c.stat}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#71717A]">{c.statLabel}</p>
                </div>
              </div>
              <h3 className="font-bold text-[#18181B] mb-2">{c.title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
