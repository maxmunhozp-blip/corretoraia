import { useState } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import type { PlanoOfertado } from "@/lib/proposta/types";

interface Props {
  alternativas: PlanoOfertado[];
}

export function SecaoRedeCredenciada({ alternativas }: Props) {
  const [busca, setBusca] = useState("");

  const planosComHospitais = alternativas.filter((a) => a.hospitais && a.hospitais.length > 0);
  if (planosComHospitais.length === 0) return null;

  const totalHospitais = planosComHospitais.reduce((acc, p) => acc + (p.hospitais?.length || 0), 0);
  const cidades = new Set(planosComHospitais.flatMap(p => p.hospitais?.map(h => h.cidade) || []));

  return (
    <section className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#955251] font-semibold mb-3">Rede Credenciada</p>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#18181B] tracking-[-0.02em] leading-tight mb-4">
            Onde você será atendido
          </h2>
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-0.5 bg-[#955251]/30" />
            <div className="w-2 h-2 rounded-full bg-[#955251]" />
            <div className="w-12 h-0.5 bg-[#955251]/30" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
          <div className="bg-white rounded-xl border border-[#E4E4E7] p-5 text-center">
            <Building2 className="h-5 w-5 text-[#955251] mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-[#18181B]">{totalHospitais}</p>
            <p className="text-xs text-[#71717A] uppercase tracking-wider">Unidades</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E4E4E7] p-5 text-center">
            <MapPin className="h-5 w-5 text-[#955251] mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-[#18181B]">{cidades.size}</p>
            <p className="text-xs text-[#71717A] uppercase tracking-wider">Cidades</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Buscar por cidade ou hospital..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E4E4E7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#955251]/20 focus:border-[#955251]/40"
          />
        </div>

        {/* Tables */}
        {planosComHospitais.map((plano, pi) => {
          const filtered = (plano.hospitais || []).filter(
            (h) =>
              h.cidade.toLowerCase().includes(busca.toLowerCase()) ||
              h.nome.toLowerCase().includes(busca.toLowerCase())
          );
          return (
            <div key={pi} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#955251] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#18181B]">{plano.operadora}</h3>
                  <p className="text-xs text-[#71717A]">Plano {plano.nome}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAFAF9] border-b border-[#E4E4E7]">
                      <th className="text-left px-6 py-3 text-[#71717A] font-medium text-xs uppercase tracking-wider">Cidade</th>
                      <th className="text-left px-4 py-3 text-[#71717A] font-medium text-xs uppercase tracking-wider">Hospital</th>
                      <th className="text-left px-4 py-3 text-[#71717A] font-medium text-xs uppercase tracking-wider">Serviços</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-[#A1A1AA]">Nenhum resultado encontrado</td></tr>
                    ) : (
                      filtered.map((h, i) => (
                        <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"} border-t border-[#F4F4F5]`}>
                          <td className="px-6 py-3 text-[#18181B] flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#955251] shrink-0" />
                            {h.cidade}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#18181B]">{h.nome}</td>
                          <td className="px-4 py-3 text-[#71717A]">{h.servicos}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
