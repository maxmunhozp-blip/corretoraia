import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { UserPlus, Search, Eye, Pencil, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientes } from "@/hooks/useClientes";
import { useOperadoras } from "@/hooks/usePropostas";
import { format } from "date-fns";
import { NovoClienteModal } from "@/components/clientes/NovoClienteModal";
import { ClienteDrawer } from "@/components/clientes/ClienteDrawer";

const statusStyles: Record<string, string> = {
  ativo: "border-[#16A34A] text-[#16A34A]",
  inativo: "border-[#D97706] text-[#D97706]",
  cancelado: "border-[#71717A] text-[#71717A]",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  cancelado: "Cancelado",
};

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [operadoraFilter, setOperadoraFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const { data: clientes, isLoading } = useClientes({
    search,
    tipo: tipoFilter,
    status: statusFilter,
    operadora: operadoraFilter,
  });
  const { data: operadoras } = useOperadoras();

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand-hover">
          <UserPlus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={operadoraFilter} onValueChange={setOperadoraFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Operadora" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(operadoras || []).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Vidas</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : clientes && clientes.length > 0 ? (
              clientes.map((c, i) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-surface transition-colors duration-150 opacity-0"
                  style={{ animation: `staggerIn 0.35s ease-out ${i * 60}ms forwards` }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{c.nome}</p>
                      {c.empresa && c.empresa !== c.nome && (
                        <p className="text-xs text-muted-foreground">{c.empresa}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {c.tipo || "PF"}
                    </span>
                  </TableCell>
                  <TableCell>{(c.operadoras as any)?.nome || "—"}</TableCell>
                  <TableCell>{c.vidas}</TableCell>
                  <TableCell>
                    {c.valor_mensalidade ? `R$ ${Number(c.valor_mensalidade).toLocaleString("pt-BR")}` : "—"}
                  </TableCell>
                  <TableCell>{(c.profiles as any)?.nome || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] || ""}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedClienteId(c.id)}
                        className="p-1 rounded hover:bg-surface transition-colors"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-surface transition-colors">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm">Nenhum cliente encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <NovoClienteModal open={modalOpen} onOpenChange={setModalOpen} />
      <ClienteDrawer clienteId={selectedClienteId} onClose={() => setSelectedClienteId(null)} />
    </PageWrapper>
  );
}
