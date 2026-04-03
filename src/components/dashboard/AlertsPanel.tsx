import { AlertTriangle } from "lucide-react";

const alerts = [
  "Proposta #1038 vence em 2 dias — aguardando documentação do cliente",
  "Cliente Empresa XYZ com 3 parcelas em atraso — risco de cancelamento",
  "Reajuste de 12% na operadora Vida Saúde entra em vigor dia 15",
];

export function AlertsPanel({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Alertas pendentes</h3>
      <div className="space-y-3">
        {alerts.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm text-foreground leading-snug">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
