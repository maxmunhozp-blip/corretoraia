import {
  FileText, UserPlus, CheckCircle, Send, AlertTriangle, LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap: Record<string, LucideIcon> = {
  proposta_criada: FileText,
  status_alterado: CheckCircle,
  cliente_cadastrado: UserPlus,
  documento_enviado: Send,
  alerta_gerado: AlertTriangle,
};

interface Activity {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
  profiles?: { nome: string } | null;
}

export function ActivityFeed({ index, activities }: { index: number; activities: Activity[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Atividade recente</h3>
      <div className="space-y-4">
        {activities.map((ev) => {
          const Icon = iconMap[ev.tipo] || FileText;
          const tempo = formatDistanceToNow(new Date(ev.created_at), { addSuffix: true, locale: ptBR });
          const autor = ev.profiles?.nome;
          return (
            <div key={ev.id} className="flex items-start gap-3">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-surface flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{ev.descricao}</p>
                <span className="text-xs text-muted-foreground">{autor ? `${autor} • ` : ""}{tempo}</span>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
        )}
      </div>
    </div>
  );
}
