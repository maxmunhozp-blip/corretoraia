import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Plus, Search, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { propostas, vendedores, getVendedorNome, type StatusProposta } from "@/data/mock";

const statusStyles: Record<StatusProposta, string> = {
  Aprovada: "border-[#16A34A] text-[#16A34A]",
  "Em análise": "border-[#955251] text-[#955251]",
  Pendência: "border-[#D97706] text-[#D97706]",
  Cancelada: "border-[#71717A] text-[#71717A]",
  Enviada: "border-[#18181B] text-[#18181B]",
};

const operadorasList = ["Bradesco", "SulAmérica", "Amil", "Unimed", "MedSênior", "Qualicorp"];

export default function Propostas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return propostas.filter((p) => {
      const matchSearch = !search || p.cliente.toLowerCase().includes(search.toLowerCase()) || p.operadora.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchResp = responsavelFilter === "all" || getVendedorNome(p.responsavelId) === responsavelFilter;
      return matchSearch && matchStatus && matchResp;
    });
  }, [search, statusFilter, responsavelFilter]);

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Enviada">Enviada</SelectItem>
            <SelectItem value="Em análise">Em análise</SelectItem>
            <SelectItem value="Pendência">Pendência</SelectItem>
            <SelectItem value="Aprovada">Aprovada</SelectItem>
            <SelectItem value="Cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>
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
            {filtered.map((p, i) => (
              <TableRow
                key={p.id}
                className="hover:bg-surface transition-colors duration-150 opacity-0"
                style={{ animation: `staggerIn 0.35s ease-out ${i * 60}ms forwards` }}
              >
                <TableCell className="font-medium text-foreground">{p.cliente}</TableCell>
                <TableCell>{p.operadora}</TableCell>
                <TableCell>{p.vidas}</TableCell>
                <TableCell>{p.valor}</TableCell>
                <TableCell>{getVendedorNome(p.responsavelId)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status]}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.dataCriacao}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1 rounded hover:bg-surface transition-colors"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                    <button className="p-1 rounded hover:bg-surface transition-colors"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma proposta encontrada.</TableCell>
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
              <Input placeholder="Ex: João da Silva" />
            </div>
            <div className="grid gap-1.5">
              <Label>Empresa</Label>
              <Input placeholder="Ex: Empresa ABC Ltda" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Operadora</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{operadorasList.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Nº de vidas</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Valor estimado</Label>
                <Input placeholder="R$ 0,00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Responsável</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{vendedores.map((v) => (<SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => setModalOpen(false)} className="bg-brand text-brand-foreground hover:bg-brand-hover">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
