import {
  FileText,
  UserPlus,
  CheckCircle,
  PhoneCall,
  Send,
} from "lucide-react";

const events = [
  { icon: FileText, text: "Nova proposta criada para Empresa ABC", time: "Há 12 min" },
  { icon: UserPlus, text: "Cliente João Silva cadastrado", time: "Há 34 min" },
  { icon: CheckCircle, text: "Proposta #1042 aprovada pela operadora", time: "Há 1h" },
  { icon: PhoneCall, text: "Follow-up agendado com Maria Souza", time: "Há 2h" },
  { icon: Send, text: "Cotação enviada para Tech Solutions", time: "Há 3h" },
];

export function ActivityFeed({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Atividade recente</h3>
      <div className="space-y-4">
        {events.map((ev, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-surface flex items-center justify-center">
              <ev.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{ev.text}</p>
              <span className="text-xs text-muted-foreground">{ev.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
