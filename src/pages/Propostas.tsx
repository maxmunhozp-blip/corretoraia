import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Plus, Search, Eye, Pencil, FileX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropostas, useOperadoras, useProfiles, useCreateProposta } from "@/hooks/usePropostas";
import { toast } from "sonner";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  aprovada: "border-[#16A34A] text-[#16A34A]",
  em_analise: "border-[#955251] text-[#955251]",
  pendencia: "border-[#D97706] text-[#D97706]",
  cancelada: "border-[#71717A] text-[#71717A]",
  enviada: "border-[#18181B] text-[#18181B]",
};

const statusLabels: Record<string, string> = {
  aprovada: "Aprovada",
  em_analise: "Em análise",
  pendencia: "Pendência",
  cancelada: "Cancelada",
  enviada: "Enviada",
};

export default function Propostas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: propostas, isLoading } = usePropostas({ search, status: statusFilter, responsavel: responsavelFilter });
  const { data: operadoras } = useOperadoras();
  const { data: profiles } = useProfiles();
  const createProposta = useCreateProposta();

  // Form state
  const [form, setForm] = useState({ cliente_nome: "", empresa: "", operadora_id: "", vidas: "", valor_estimado: "", responsavel_id: "", observacoes: "" });

  const resetForm = () => setForm({ cliente_nome: "", empresa: "", operadora_id: "", vidas: "", valor_estimado: "", responsavel_id: "", observacoes: "" });

  const handleSave = async () => {
    if (!form.cliente_nome.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    try {
      await createProposta.mutateAsync({
        cliente_nome: form.cliente_nome,
        empresa: form.empresa || undefined,
        operadora_id: form.operadora_id || undefined,
        vidas: parseInt(form.vidas) || 1,
        valor_estimado: parseFloat(form.valor_estimado) || undefined,
        responsavel_id: form.responsavel_id || undefined,
        observacoes: form.observacoes || undefined,
      });
      toast.success("Proposta criada com sucesso!");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao criar proposta");
    }
  };

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-2" /> Nova Proposta
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="pendencia">Pendência</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(profiles || []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead>Cliente</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Vidas</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : propostas && propostas.length > 0 ? (
              propostas.map((p, i) => (
                <TableRow key={p.id} className="hover:bg-surface transition-colors duration-150 opacity-0"
                  style={{ animation: `staggerIn 0.35s ease-out ${i * 60}ms forwards` }}>
                  <TableCell className="font-medium text-foreground">{p.cliente_nome}</TableCell>
                  <TableCell>{(p.operadoras as any)?.nome || "—"}</TableCell>
                  <TableCell>{p.vidas}</TableCell>
                  <TableCell>{p.valor_estimado ? `R$ ${Number(p.valor_estimado).toLocaleString("pt-BR")}` : "—"}</TableCell>
                  <TableCell>{(p.profiles as any)?.nome || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status] || ""}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 rounded hover:bg-surface transition-colors"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-surface transition-colors"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileX className="h-8 w-8" />
                    <p className="text-sm">Nenhuma proposta encontrada.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome do cliente</Label>
              <Input placeholder="Ex: João da Silva" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Empresa</Label>
              <Input placeholder="Ex: Empresa ABC Ltda" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
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
                <Label>Nº de vidas</Label>
                <Input type="number" placeholder="0" value={form.vidas} onChange={(e) => setForm({ ...form, vidas: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Valor estimado</Label>
                <Input placeholder="R$ 0,00" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
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
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais..." rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createProposta.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover">
              {createProposta.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
