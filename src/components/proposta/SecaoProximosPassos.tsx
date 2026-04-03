import { Clock, Phone, Mail, Globe } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
  validaAte?: string;
  telefoneContato?: string;
}

const passos = [
  { num: "1", title: "Você nos dá o sinal verde", desc: "Basta nos informar qual plano deseja. Cuidamos de toda a documentação." },
  { num: "2", title: "Cuidamos de tudo", desc: "Nossa equipe acompanha todo o processo com a operadora até a aprovação." },
  { num: "3", title: "Você começa a usar", desc: "Seu plano entra em vigor rapidamente. Estamos sempre disponíveis para dúvidas." },
];

export function SecaoProximosPassos({ corretora, validaAte, telefoneContato }: Props) {
  const dataValidade = validaAte
    ? new Date(validaAte).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const whatsappNum = (telefoneContato || corretora.telefone || "").replace(/\D/g, "");

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Próximos passos</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

      {/* 3 passos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {passos.map((p) => (
          <div key={p.num} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#955251] text-white flex items-center justify-center font-bold text-lg shrink-0">
              {p.num}
            </div>
            <div>
              <h3 className="font-semibold text-[#18181B] mb-1">{p.title}</h3>
              <p className="text-sm text-[#71717A]">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Validade */}
      {dataValidade && (
        <div className="bg-[#F5EDEC] border border-[#E4E4E7] rounded-lg p-5 flex items-center gap-3 mb-8">
          <Clock className="h-5 w-5 text-[#955251] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#18181B]">Esta proposta é válida até {dataValidade}</p>
            <p className="text-xs text-[#71717A]">Após essa data, os valores podem ser reajustados pela operadora.</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-[#955251] text-white rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-2">Pronto para cuidar da sua saúde?</h3>
        <p className="text-white/80 mb-6">Entre em contato agora e tire todas as suas dúvidas sem compromisso.</p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          {corretora.telefone && (
            <span className="flex items-center gap-2"><Phone className="h-4 w-4" />{corretora.telefone}</span>
          )}
          {corretora.email && (
            <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{corretora.email}</span>
          )}
          {corretora.site && (
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" />{corretora.site}</span>
          )}
        </div>
        {whatsappNum && (
          <a
            href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a proposta de plano de saúde.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 px-8 py-3 bg-white text-[#955251] rounded-lg font-semibold hover:bg-white/90 transition-colors animate-pulse"
          >
            Falar pelo WhatsApp
          </a>
        )}
      </div>

      {/* Encerramento */}
      <div className="mt-16 text-center py-12">
        {corretora.logo_url ? (
          <img src={corretora.logo_url} alt={corretora.nome} className="h-12 mx-auto mb-4 object-contain" />
        ) : (
          <span className="text-2xl font-extrabold text-[#955251] mb-4 block">{corretora.nome || "CORA"}</span>
        )}
        <p className="text-lg text-[#18181B] font-medium mb-4">Obrigado pela confiança.</p>
        <div className="w-12 h-1 bg-[#955251] rounded-full mx-auto mb-4" />
        <div className="text-xs text-[#71717A] space-y-0.5">
          {corretora.telefone && <p>{corretora.telefone}</p>}
          {corretora.email && <p>{corretora.email}</p>}
          {corretora.site && <p>{corretora.site}</p>}
        </div>
      </div>
    </section>
  );
}
