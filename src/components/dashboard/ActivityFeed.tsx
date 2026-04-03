import {
  FileText,
  UserPlus,
  CheckCircle,
  Send,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";
import { atividadeRecente, type TipoEvento } from "@/data/mock";

const iconMap: Record<TipoEvento, LucideIcon> = {
  proposta_criada: FileText,
  status_alterado: CheckCircle,
  cliente_cadastrado: UserPlus,
  documento_enviado: Send,
  alerta_gerado: AlertTriangle,
};

export function ActivityFeed({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Atividade recente</h3>
      <div className="space-y-4">
        {atividadeRecente.slice(0, 6).map((ev, i) => {
          const Icon = iconMap[ev.tipo];
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-surface flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{ev.descricao}</p>
                <span className="text-xs text-muted-foreground">{ev.vendedor} • {ev.hora}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
