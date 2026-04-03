import { Heart, MapPin, Clock } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
}

const diferenciais = [
  { icon: Heart, title: "Cuidado Real", desc: "Trabalhamos para você, não para a operadora" },
  { icon: MapPin, title: "Presença Local", desc: "Conhecemos a rede credenciada da sua região" },
  { icon: Clock, title: "Agilidade", desc: "Seu plano começa a valer rapidamente" },
];

export function SecaoQuemSomos({ corretora }: Props) {
  const nome = corretora.nome || "nossa corretora";

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Quem somos</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

      <p className="text-[15px] text-[#3F3F46] leading-[1.7] mb-10 max-w-3xl">
        A <strong>{nome}</strong> é uma empresa especializada em facilitar sua vida na hora de
        escolher um plano de saúde. Trabalhamos para que você tenha um plano de qualidade,
        com preço justo, que realmente cuide da sua família.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {diferenciais.map((d, i) => (
          <div key={i} className="text-center">
            <d.icon className="h-8 w-8 text-[#955251] mx-auto mb-3" />
            <h3 className="font-semibold text-[#18181B] mb-1">{d.title}</h3>
            <p className="text-sm text-[#71717A]">{d.desc}</p>
          </div>
        ))}
      </div>

      <div className="border-l-4 border-[#955251] bg-[#F5EDEC] rounded-r-lg p-5">
        <p className="text-[15px] text-[#3F3F46] leading-[1.7] italic">
          Com a {nome}, você tem proteção de verdade, sem surpresas, e com a tranquilidade
          que sua família merece.
        </p>
      </div>
    </section>
  );
}
