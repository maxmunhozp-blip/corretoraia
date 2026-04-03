import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { alertas, type NivelAlerta, type TipoAlerta } from "@/data/mock";

const borderColors: Record<NivelAlerta, string> = {
  alto: "border-l-[#955251]",
  medio: "border-l-[#D97706]",
  baixo: "border-l-border",
};

const filterMap: Record<string, TipoAlerta[]> = {
  all: [],
  inadimplencia: ["Inadimplência"],
  cancelamento: ["Cancelamento"],
  proposta: ["Proposta parada"],
};

export default function Alertas() {
  const [filtro, setFiltro] = useState("all");

  const filtered = useMemo(() => {
    if (filtro === "all") return alertas;
    const tipos = filterMap[filtro] || [];
    return alertas.filter((a) => tipos.includes(a.tipo));
  }, [filtro]);

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="inadimplencia">Inadimplência</SelectItem>
            <SelectItem value="cancelamento">Cancelamento</SelectItem>
            <SelectItem value="proposta">Proposta parada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((a, i) => {
          const Icon = a.nivel === "baixo" ? Info : AlertTriangle;
          const isAlto = a.nivel === "alto";
          return (
            <div
              key={a.id}
              className={`rounded-lg border border-border bg-card p-4 border-l-4 ${borderColors[a.nivel]} flex items-start gap-4 opacity-0`}
              style={{ animation: `staggerIn 0.4s ease-out ${i * 80}ms forwards${isAlto ? ", alertPulse 3s ease-in-out infinite" : ""}` }}
            >
              <div className="mt-0.5"><Icon className="h-5 w-5 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{a.tipo}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground capitalize">{a.nivel}</span>
                </div>
                <p className="text-sm text-foreground mb-1">{a.descricao}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{a.cliente}</span></span>
                  <span className="text-xs text-muted-foreground">{a.tempo}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-xs text-muted-foreground hover:text-foreground">Ver cliente</Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum alerta encontrado.</div>
        )}
      </div>
    </PageWrapper>
  );
}
