import { Clock, Phone, Mail, Globe, MessageCircle, ArrowRight } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
  validaAte?: string;
  telefoneContato?: string;
}

const passos = [
  {
    num: "01",
    title: "Dê o sinal verde",
    desc: "Escolha seu plano preferido e nos avise. Cuidamos de toda a documentação.",
  },
  {
    num: "02",
    title: "Deixe com a gente",
    desc: "Nossa equipe acompanha todo o processo com a operadora até a aprovação.",
  },
  {
    num: "03",
    title: "Comece a usar",
    desc: "Seu plano entra em vigor rapidamente. Estamos disponíveis para qualquer dúvida.",
  },
];

export function SecaoProximosPassos({ corretora, validaAte, telefoneContato }: Props) {
  const dataValidade = validaAte
    ? new Date(validaAte).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const whatsappNum = (telefoneContato || corretora.telefone || "").replace(/\D/g, "");

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Próximos Passos</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Como funciona daqui?
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
        </div>

        {/* Steps timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {passos.map((p, i) => (
            <div key={i} className="relative text-center">
              {/* Number */}
              <div className="w-16 h-16 rounded-2xl bg-[#955251] text-white flex items-center justify-center mx-auto mb-5 text-xl font-extrabold shadow-[0_4px_16px_rgba(149,82,81,0.3)]">
                {p.num}
              </div>
              {/* Connector */}
              {i < passos.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)]">
                  <div className="h-px bg-[#E4E4E7] relative">
                    <ArrowRight className="h-3 w-3 text-[#955251] absolute -right-1.5 -top-1.5" />
                  </div>
                </div>
              )}
              <h3 className="text-lg font-bold text-[#18181B] mb-2">{p.title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed max-w-xs mx-auto">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Validity */}
        {dataValidade && (
          <div className="bg-[#FEF3C7]/50 border border-[#FCD34D]/30 rounded-2xl p-6 flex items-center gap-4 mb-10 max-w-2xl mx-auto">
            <Clock className="h-6 w-6 text-[#CA8A04] shrink-0" />
            <div>
              <p className="font-semibold text-[#18181B]">Esta proposta é válida até {dataValidade}</p>
              <p className="text-xs text-[#71717A]">Após essa data, os valores podem ser reajustados pela operadora.</p>
            </div>
          </div>
        )}

        {/* CTA Block */}
        <div className="bg-gradient-to-br from-[#955251] to-[#7a3f3e] rounded-3xl p-10 md:p-14 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-3">
            Pronto para cuidar da sua saúde?
          </h3>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Entre em contato agora e tire todas as suas dúvidas. Sem compromisso, sem pressão.
          </p>

          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a proposta de plano de saúde.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#955251] rounded-xl font-bold text-lg hover:bg-white/90 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)] mb-8"
            >
              <MessageCircle className="h-5 w-5" />
              Falar pelo WhatsApp
            </a>
          )}

          <div className="flex flex-wrap justify-center gap-8 text-sm text-white/60">
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
        </div>

        {/* Footer */}
        <div className="mt-20 text-center pb-8">
          {corretora.logo_url ? (
            <img src={corretora.logo_url} alt={corretora.nome} className="h-10 mx-auto mb-4 object-contain opacity-60" />
          ) : (
            <span className="text-xl font-extrabold text-[#955251]/40 tracking-[0.15em] mb-4 block uppercase">
              {corretora.nome || "CORA"}
            </span>
          )}
          <p className="text-sm text-[#71717A] mb-2">Obrigado pela confiança.</p>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-px bg-[#E4E4E7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#955251]/30" />
            <div className="w-8 h-px bg-[#E4E4E7]" />
          </div>
        </div>
      </div>
    </section>
  );
}
