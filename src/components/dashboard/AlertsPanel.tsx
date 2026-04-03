import { AlertTriangle } from "lucide-react";
import { alertas } from "@/data/mock";

const highAlerts = alertas.filter((a) => a.nivel === "alto" || a.nivel === "medio").slice(0, 3);

export function AlertsPanel({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Alertas pendentes</h3>
      <div className="space-y-3">
        {highAlerts.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{a.descricao}</p>
              <span className="text-xs text-muted-foreground">{a.cliente} • {a.tempo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
