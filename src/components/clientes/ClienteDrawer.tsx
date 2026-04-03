import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileText, Mail, Phone, Building, Users, Pencil, Save, X } from "lucide-react";
import { useClienteDetail, useClientePropostas, useClienteAlertas, useUpdateCliente } from "@/hooks/useClientes";
import { useOperadoras, useProfiles } from "@/hooks/usePropostas";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const { data: operadoras } = useOperadoras();
  const { data: profiles } = useProfiles();
  const updateCliente = useUpdateCliente();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nome: "", tipo: "PF", empresa: "", email: "", telefone: "",
    operadora_id: "", vidas: 1, valor_mensalidade: 0,
    responsavel_id: "", status: "ativo", observacoes: "",
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || "",
        tipo: cliente.tipo || "PF",
        empresa: cliente.empresa || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        operadora_id: cliente.operadora_id || "",
        vidas: cliente.vidas || 1,
        valor_mensalidade: Number(cliente.valor_mensalidade) || 0,
        responsavel_id: cliente.responsavel_id || "",
        status: cliente.status || "ativo",
        observacoes: cliente.observacoes || "",
      });
    }
    setEditing(false);
  }, [cliente]);

  const handleSave = async () => {
    if (!clienteId || !form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      await updateCliente.mutateAsync({
        id: clienteId,
        nome: form.nome,
        tipo: form.tipo || undefined,
        empresa: form.tipo === "PJ" ? form.empresa || undefined : undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        operadora_id: form.operadora_id || undefined,
        vidas: form.vidas,
        valor_mensalidade: form.valor_mensalidade || undefined,
        responsavel_id: form.responsavel_id || undefined,
        status: form.status,
        observacoes: form.observacoes || undefined,
      });
      toast.success("Cliente atualizado");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar cliente");
    }
  };

  return (
    <Sheet open={!!clienteId} onOpenChange={(open) => { if (!open) { setEditing(false); onClose(); } }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        {isLoading || !cliente ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : editing ? (
          /* ── Edit Mode ── */
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="text-xl">Editar cliente</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">PF</SelectItem>
                      <SelectItem value="PJ">PJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.tipo === "PJ" && (
                <div className="grid gap-1.5">
                  <Label>Empresa</Label>
                  <Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Operadora</Label>
                  <Select value={form.operadora_id} onValueChange={(v) => setForm({ ...form, operadora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(operadoras || []).map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Responsável</Label>
                  <Select value={form.responsavel_id} onValueChange={(v) => setForm({ ...form, responsavel_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(profiles || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Nº de vidas</Label>
                  <Input type="number" min={1} value={form.vidas} onChange={(e) => setForm({ ...form, vidas: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Mensalidade (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.valor_mensalidade} onChange={(e) => setForm({ ...form, valor_mensalidade: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button className="flex-1 bg-brand text-brand-foreground hover:bg-brand-hover" onClick={handleSave} disabled={updateCliente.isPending}>
                  <Save className="h-4 w-4 mr-2" /> {updateCliente.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* ── View Mode ── */
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
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                <div className="space-y-1.5">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{cliente.telefone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

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
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />{cliente.vidas}
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

              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Editar cliente
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
