import { Heart, MapPin, Clock, Award, Users, TrendingUp } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
}

const stats = [
  { icon: Users, value: "500+", label: "Famílias protegidas" },
  { icon: TrendingUp, value: "98%", label: "Clientes satisfeitos" },
  { icon: Award, value: "10+", label: "Anos de experiência" },
];

const diferenciais = [
  {
    icon: Heart,
    title: "Cuidado Real",
    desc: "Trabalhamos para você, não para a operadora. Nosso compromisso é encontrar o plano ideal para sua realidade.",
  },
  {
    icon: MapPin,
    title: "Presença Local",
    desc: "Conhecemos a rede credenciada da sua região em detalhes — cada hospital, clínica e laboratório.",
  },
  {
    icon: Clock,
    title: "Agilidade Total",
    desc: "Do primeiro contato à ativação do plano, cuidamos de tudo com rapidez e sem burocracia.",
  },
];

export function SecaoQuemSomos({ corretora }: Props) {
  const nome = corretora.nome || "nossa corretora";

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Sobre Nós</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Quem cuida da sua saúde
          </h2>
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
          <p className="text-lg text-[#3F3F46] leading-relaxed max-w-2xl mx-auto">
            A <strong className="text-[#955251]">{nome}</strong> é especializada em facilitar sua vida na hora de
            escolher um plano de saúde. Trabalhamos para que você tenha um plano de qualidade,
            com preço justo, que realmente cuide da sua família.
          </p>
        </div>

        {/* Stats bar */}
        <div className="bg-[#955251] rounded-2xl p-8 mb-14 grid grid-cols-3 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <s.icon className="h-5 w-5 text-white/60 mx-auto mb-2" />
              <p className="text-3xl md:text-4xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-xs text-white/70 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Diferenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {diferenciais.map((d, i) => (
            <div key={i} className="relative">
              <div className="w-12 h-12 rounded-xl bg-[#F5EDEC] flex items-center justify-center mb-4">
                <d.icon className="h-6 w-6 text-[#955251]" />
              </div>
              <h3 className="text-lg font-bold text-[#18181B] mb-2">{d.title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="relative bg-[#FAFAF9] rounded-2xl p-8 border border-[#E4E4E7]">
          <div className="absolute -top-4 left-8 text-5xl text-[#955251]/20 font-serif">"</div>
          <p className="text-lg text-[#3F3F46] leading-relaxed italic pl-4">
            Com a {nome}, você tem proteção de verdade, sem surpresas, e com a tranquilidade
            que sua família merece. Estamos ao seu lado em cada etapa.
          </p>
          <div className="mt-4 pl-4">
            <div className="w-10 h-0.5 bg-[#955251]" />
          </div>
        </div>
      </div>
    </section>
  );
}
