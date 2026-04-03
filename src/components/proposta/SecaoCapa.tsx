import { ChevronDown } from "lucide-react";
import type { CorretoraInfo } from "@/lib/proposta/types";

interface Props {
  corretora: CorretoraInfo;
  clienteNome: string;
  clienteEmpresa?: string;
  validaDias?: number;
  frasePersonalizada?: string;
}

export function SecaoCapa({ corretora, clienteNome, clienteEmpresa, validaDias = 7, frasePersonalizada }: Props) {
  const mesAno = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F5] via-white to-[#F5EDEC]" />
      <div className="absolute top-0 right-0 w-[50vw] h-[60vh] bg-[#955251]/[0.03] rounded-bl-[120px]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-[#955251]/[0.02] rounded-tr-[100px]" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 text-center z-10">
        {/* Logo */}
        <div className="mb-12">
          {corretora.logo_url ? (
            <img src={corretora.logo_url} alt={corretora.nome} className="h-14 max-w-[200px] object-contain mx-auto" />
          ) : (
            <span className="text-2xl font-extrabold text-[#955251] tracking-[0.15em] uppercase">
              {corretora.nome || "CORA"}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-px bg-[#955251]/30" />
          <div className="w-2 h-2 rounded-full bg-[#955251]" />
          <div className="w-16 h-px bg-[#955251]/30" />
        </div>

        {/* Headline */}
        <h1 className="text-[52px] md:text-[68px] font-extrabold text-[#18181B] tracking-[-0.03em] leading-[1.05] mb-6 max-w-3xl">
          {frasePersonalizada || "Proposta Comercial"}
        </h1>

        <p className="text-xl md:text-2xl text-[#71717A] font-light mb-3 max-w-xl">
          Plano de Saúde Empresarial
        </p>

        {/* Client info card */}
        <div className="mt-10 bg-white/80 backdrop-blur border border-[#E4E4E7] rounded-2xl px-10 py-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] max-w-md">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">
            Preparada para
          </p>
          <p className="text-2xl font-bold text-[#18181B] mb-1">{clienteNome}</p>
          {clienteEmpresa && (
            <p className="text-sm text-[#71717A]">{clienteEmpresa}</p>
          )}
          <div className="w-12 h-0.5 bg-[#955251]/30 mx-auto my-4" />
          <p className="text-xs text-[#71717A]">{mesAno} • válida por {validaDias} dias</p>
        </div>
      </div>

      {/* Bottom marsala strip */}
      <div className="relative z-10 bg-[#955251] py-4 text-center">
        <p className="text-white/80 text-xs tracking-[0.15em] uppercase font-medium">
          {corretora.nome} • {corretora.cidade || "Brasil"} • {corretora.telefone || corretora.email || ""}
        </p>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.getElementById("resumo-executivo")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce"
      >
        <ChevronDown className="h-6 w-6 text-[#955251]/50" />
      </button>
    </section>
  );
}
