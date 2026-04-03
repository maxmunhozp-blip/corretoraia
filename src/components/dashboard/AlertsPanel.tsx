import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  titulo: string;
  descricao: string | null;
  nivel: string;
  created_at: string;
  clientes?: { nome: string } | null;
}

export function AlertsPanel({ index, alerts }: { index: number; alerts: Alert[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Alertas pendentes</h3>
      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{a.descricao || a.titulo}</p>
              <span className="text-xs text-muted-foreground">
                {a.clientes?.nome || "—"} • {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta pendente.</p>
        )}
      </div>
    </div>
  );
}
