import { Activity } from "lucide-react";

export function HealthCard({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 opacity-0"
      style={{
        animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Saúde da Empresa</span>
        <div className="h-9 w-9 rounded-md bg-brand-light flex items-center justify-center">
          <Activity className="h-4 w-4 text-brand" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-lg font-semibold text-foreground">Saudável</span>
      </div>
      <span className="text-xs text-muted-foreground">
        Vendas estáveis, sem cancelamentos críticos esta semana
      </span>
    </div>
  );
}
