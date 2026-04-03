import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
}

export function PropostaHeader({ corretora }: Props) {
  const mesAno = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="h-14 bg-[#955251] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {corretora.logo_url ? (
            <img src={corretora.logo_url} alt={corretora.nome} className="h-8 max-w-[120px] object-contain" />
          ) : (
            <span className="text-white font-bold text-lg tracking-wide">{corretora.nome || "CORA"}</span>
          )}
        </div>
        <span className="text-white/90 text-[11px]">Proposta Comercial • {mesAno}</span>
      </div>
      <div className="h-1 bg-[#F5EDEC]" />
    </div>
  );
}
