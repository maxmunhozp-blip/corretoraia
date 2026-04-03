import { Shield } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
  clienteNome: string;
  validaDias?: number;
}

export function SecaoCapa({ corretora, clienteNome, validaDias = 7 }: Props) {
  const hoje = new Date();
  const cidade = corretora.cidade || "Brasília";
  const dataFormatada = `${cidade}, ${hoje.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`;

  const bullets = [
    "Análise personalizada da sua situação",
    "Comparativo entre as melhores opções do mercado",
    "Explicação simples de todos os termos",
  ];

  return (
    <section className="min-h-[80vh] flex flex-col">
      {/* Bloco superior */}
      <div className="flex-[6] bg-[#F8F8F8] flex flex-col items-center justify-center px-8 py-12 text-center">
        {corretora.logo_url ? (
          <img src={corretora.logo_url} alt={corretora.nome} className="h-16 max-w-[180px] object-contain mb-6" />
        ) : (
          <span className="text-3xl font-extrabold text-[#955251] tracking-wide mb-6">{corretora.nome || "CORA"}</span>
        )}

        <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

        <h1 className="text-[40px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
          Proposta de Plano de Saúde
        </h1>
        <p className="text-lg font-semibold text-[#71717A] mb-2">
          Preparada exclusivamente para <span className="text-[#18181B]">{clienteNome}</span>
        </p>
        <p className="text-sm text-[#71717A]">{dataFormatada}</p>
      </div>

      {/* Bloco inferior */}
      <div className="flex-[4] bg-[#955251] flex flex-col items-center justify-center px-8 py-10 text-center">
        <div className="max-w-lg space-y-4 mb-6">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-white/90">
              <Shield className="h-5 w-5 shrink-0 text-white/80" />
              <span className="text-sm text-left">{b}</span>
            </div>
          ))}
        </div>
        <p className="text-white/60 text-xs">Esta proposta é válida por {validaDias} dias</p>
      </div>
    </section>
  );
}
