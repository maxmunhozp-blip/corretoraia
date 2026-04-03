import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, FileText, Mail, Phone, Building, Users, Pencil } from "lucide-react";
import { useClienteDetail, useClientePropostas, useClienteAlertas } from "@/hooks/useClientes";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  aprovada: "Aprovada", em_analise: "Em análise", pendencia: "Pendência",
  cancelada: "Cancelada", enviada: "Enviada",
};

const statusColors: Record<string, string> = {
  aprovada: "text-[#16A34A]", em_analise: "text-brand", pendencia: "text-[#D97706]",
  cancelada: "text-muted-foreground", enviada: "text-foreground",
};

interface Props {
  clienteId: string | null;
  onClose: () => void;
}

export function ClienteDrawer({ clienteId, onClose }: Props) {
  const { data: cliente, isLoading } = useClienteDetail(clienteId);
  const { data: propostas } = useClientePropostas(cliente?.nome ?? null);
  const { data: alertas } = useClienteAlertas(clienteId);

  return (
    <Sheet open={!!clienteId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        {isLoading || !cliente ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="text-xl">{cliente.nome}</SheetTitle>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {cliente.tipo || "PF"}
                </span>
                {cliente.empresa && cliente.empresa !== cliente.nome && (
                  <span className="text-sm text-muted-foreground">{cliente.empresa}</span>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5">
              {/* Contact */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                <div className="space-y-1.5">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{cliente.telefone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Plan details */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Plano</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Operadora</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      {(cliente.operadoras as any)?.nome || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vidas</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {cliente.vidas}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mensalidade</p>
                    <p className="text-sm font-medium text-foreground">
                      {cliente.valor_mensalidade ? `R$ ${Number(cliente.valor_mensalidade).toLocaleString("pt-BR")}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize text-foreground">{cliente.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="text-sm font-medium text-foreground">{(cliente.profiles as any)?.nome || "—"}</p>
                  </div>
                </div>
              </div>

              {cliente.observacoes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                    <p className="text-sm text-foreground">{cliente.observacoes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Propostas */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Propostas do cliente
                </h4>
                {propostas && propostas.length > 0 ? (
                  <div className="space-y-2">
                    {propostas.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {p.valor_estimado ? `R$ ${Number(p.valor_estimado).toLocaleString("pt-BR")}` : "—"} • {p.vidas} vidas
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <span className={`text-xs font-medium ${statusColors[p.status] || ""}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma proposta encontrada.</p>
                )}
              </div>

              <Separator />

              {/* Alertas */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Alertas ativos
                </h4>
                {alertas && alertas.length > 0 ? (
                  <div className="space-y-2">
                    {alertas.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="text-sm text-foreground">{a.titulo}</p>
                          {a.descricao && <p className="text-xs text-muted-foreground">{a.descricao}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>
                )}
              </div>

              <Separator />

              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Pencil className="h-4 w-4 mr-2" /> Editar cliente
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
