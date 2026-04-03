import { useState } from "react";
import { Search } from "lucide-react";
import type { PlanoOfertado } from "@/lib/proposta/types";

interface Props {
  alternativas: PlanoOfertado[];
}

export function SecaoRedeCredenciada({ alternativas }: Props) {
  const [busca, setBusca] = useState("");

  const planosComHospitais = alternativas.filter((a) => a.hospitais && a.hospitais.length > 0);
  if (planosComHospitais.length === 0) return null;

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-[26px] font-bold text-[#18181B] mb-1">Rede credenciada</h2>
      <div className="w-16 h-1 bg-[#955251] rounded-full mb-8" />

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
        <input
          type="text"
          placeholder="Buscar por cidade ou hospital..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#955251]/30"
        />
      </div>

      {planosComHospitais.map((plano, pi) => {
        const filtered = (plano.hospitais || []).filter(
          (h) =>
            h.cidade.toLowerCase().includes(busca.toLowerCase()) ||
            h.nome.toLowerCase().includes(busca.toLowerCase())
        );
        return (
          <div key={pi} className="mb-8">
            <h3 className="text-lg font-semibold text-[#18181B] mb-1">{plano.operadora}</h3>
            <p className="text-sm text-[#71717A] mb-4">
              Com o plano {plano.nome}, você tem acesso a hospitais e clínicas de qualidade na sua região.
            </p>
            <div className="overflow-x-auto rounded-lg border border-[#E4E4E7]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5EDEC]">
                    <th className="text-left px-4 py-3 text-[#955251] font-bold text-xs">CIDADE/REGIÃO</th>
                    <th className="text-left px-4 py-3 text-[#955251] font-bold text-xs">HOSPITAL</th>
                    <th className="text-left px-4 py-3 text-[#955251] font-bold text-xs">O QUE OFERECE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-[#71717A]">Nenhum resultado encontrado</td></tr>
                  ) : (
                    filtered.map((h, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}>
                        <td className="px-4 py-3 text-[#18181B]">{h.cidade}</td>
                        <td className="px-4 py-3 text-[#18181B] font-medium">{h.nome}</td>
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
    </section>
  );
}
