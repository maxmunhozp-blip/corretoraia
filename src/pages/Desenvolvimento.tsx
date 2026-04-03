import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Plus, Search, LayoutGrid, List, ThumbsUp, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useSolicitacoes, useCreateSolicitacao, useUpdateSolicitacaoStatus,
  useToggleVoto, useVoteCounts, useAddComentario, useSolicitacaoComentarios,
  SETORES, PRIORIDADES, STATUS_LIST,
  type StatusSolicitacao,
} from "@/hooks/useSolicitacoes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const setorLabels: Record<string, string> = {
  administrativo: "Administrativo", financeiro: "Financeiro", vendas: "Vendas",
  marketing: "Marketing", relacionamento: "Relacionamento", pos_venda: "Pós Venda",
};
const prioridadeLabels: Record<string, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente",
};
const statusLabels: Record<string, string> = {
  solicitado: "Solicitado", em_analise: "Em análise",
  em_desenvolvimento: "Em desenvolvimento", concluido: "Concluído", cancelado: "Cancelado",
};
const prioridadeColors: Record<string, string> = {
  baixa: "border-border text-muted-foreground",
  media: "border-[#D97706] text-[#D97706]",
  alta: "border-brand text-brand",
  urgente: "border-destructive text-destructive",
};
const statusKanbanColors: Record<string, string> = {
  solicitado: "bg-muted-foreground",
  em_analise: "bg-[#D97706]",
  em_desenvolvimento: "bg-brand",
  concluido: "bg-[#16A34A]",
};
const kanbanStatuses: StatusSolicitacao[] = ["solicitado", "em_analise", "em_desenvolvimento", "concluido"];

export default function Desenvolvimento() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: solicitacoes, isLoading } = useSolicitacoes({ setor: filtroSetor, status: filtroStatus, search });
  const { data: votesData } = useVoteCounts();
  const createSol = useCreateSolicitacao();
  const updateStatus = useUpdateSolicitacaoStatus();
  const toggleVoto = useToggleVoto();
  const { user, profile } = useAuth();

  // New request form
  const [form, setForm] = useState({ titulo: "", descricao: "", setor: "", prioridade: "media" });

  const handleCreate = async () => {
    if (!form.titulo.trim() || !form.descricao.trim() || !form.setor) {
      toast.error("Preencha título, descrição e setor");
      return;
    }
    try {
      await createSol.mutateAsync(form);
      toast.success("Solicitação criada com sucesso");
      setModalOpen(false);
      setForm({ titulo: "", descricao: "", setor: "", prioridade: "media" });
    } catch {
      toast.error("Erro ao criar solicitação");
    }
  };

  const isAdmin = profile?.role === "admin";
  const voteCounts = votesData?.counts || {};
  const userVoted = (id: string) => (votesData?.allVotes || []).some((v: any) => v.solicitacao_id === id && v.user_id === user?.id);

  const detailItem = solicitacoes?.find((s) => s.id === detailId);

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Desenvolvimento</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-2 text-sm transition-colors ${view === "kanban" ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 text-sm transition-colors ${view === "table" ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setModalOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand-hover">
            <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar solicitação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroSetor} onValueChange={setFiltroSetor}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {SETORES.map((s) => <SelectItem key={s} value={s}>{setorLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        {view === "table" && (
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : view === "kanban" ? (
        /* ── Kanban View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanStatuses.map((status) => {
            const items = (solicitacoes || []).filter((s) => s.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusKanbanColors[status]}`} />
                  <span className="text-sm font-semibold text-foreground">{statusLabels[status]}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => setDetailId(s.id)}
                      className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all opacity-0"
                      style={{ animation: `staggerIn 0.3s ease-out ${i * 60}ms forwards` }}
                    >
                      <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">{s.titulo}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-muted-foreground">{setorLabels[s.setor] || s.setor}</span>
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${prioridadeColors[s.prioridade] || ""}`}>
                          {prioridadeLabels[s.prioridade] || s.prioridade}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px]">{(s.profiles as any)?.nome || "—"}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVoto.mutate(s.id); }}
                            className={`flex items-center gap-0.5 text-[11px] transition-colors ${userVoted(s.id) ? "text-brand font-semibold" : "hover:text-brand"}`}
                          >
                            <ThumbsUp className="h-3 w-3" /> {voteCounts[s.id] || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface">
                <TableHead>Solicitação</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votos</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(solicitacoes || []).map((s, i) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-surface cursor-pointer transition-colors opacity-0"
                  style={{ animation: `staggerIn 0.35s ease-out ${i * 50}ms forwards` }}
                  onClick={() => setDetailId(s.id)}
                >
                  <TableCell className="font-medium text-foreground max-w-[250px] truncate">{s.titulo}</TableCell>
                  <TableCell className="text-sm">{setorLabels[s.setor] || s.setor}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${prioridadeColors[s.prioridade] || ""}`}>
                      {prioridadeLabels[s.prioridade] || s.prioridade}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${statusKanbanColors[s.status] || "bg-muted-foreground"}`} />
                      <span className="text-sm">{statusLabels[s.status] || s.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVoto.mutate(s.id); }}
                      className={`flex items-center gap-1 text-sm ${userVoted(s.id) ? "text-brand font-semibold" : "text-muted-foreground hover:text-brand"}`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> {voteCounts[s.id] || 0}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{(s.profiles as any)?.nome || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
              {(!solicitacoes || solicitacoes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Request Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nova Solicitação</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input placeholder="Resumo da funcionalidade..." value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição *</Label>
              <Textarea placeholder="Descreva detalhadamente a funcionalidade que precisa..." rows={4} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Setor *</Label>
                <Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {SETORES.map((s) => <SelectItem key={s} value={s}>{setorLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{prioridadeLabels[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createSol.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover">
              {createSol.isPending ? "Criando..." : "Criar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          isAdmin={isAdmin}
          isAuthor={detailItem.autor_id === user?.id}
          onClose={() => setDetailId(null)}
          onStatusChange={(status) => {
            updateStatus.mutate({ id: detailItem.id, status });
            toast.success(`Status alterado para "${statusLabels[status]}"`);
          }}
          voteCount={voteCounts[detailItem.id] || 0}
          hasVoted={userVoted(detailItem.id)}
          onToggleVote={() => toggleVoto.mutate(detailItem.id)}
        />
      )}
    </PageWrapper>
  );
}

/* ── Detail Drawer ── */
function DetailDrawer({
  item, isAdmin, isAuthor, onClose, onStatusChange,
  voteCount, hasVoted, onToggleVote,
}: {
  item: any; isAdmin: boolean; isAuthor: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  voteCount: number; hasVoted: boolean; onToggleVote: () => void;
}) {
  const [comment, setComment] = useState("");
  const { data: comentarios } = useSolicitacaoComentarios(item.id);
  const addComment = useAddComentario();

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({ solicitacaoId: item.id, conteudo: comment.trim() });
      setComment("");
    } catch {
      toast.error("Erro ao comentar");
    }
  };

  const canChangeStatus = isAdmin || isAuthor;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[440px] max-w-full z-[70] bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${prioridadeColors[item.prioridade] || ""}`}>
              {prioridadeLabels[item.prioridade]}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{item.titulo}</h2>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{setorLabels[item.setor]}</span>
            <span>•</span>
            <span>{(item.profiles as any)?.nome || "—"}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{item.descricao}</p>
          </div>

          {/* Status control */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
            {canChangeStatus ? (
              <Select value={item.status} onValueChange={onStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusKanbanColors[item.status] || "bg-muted-foreground"}`} />
                <span className="text-sm">{statusLabels[item.status]}</span>
              </div>
            )}
          </div>

          {/* Vote */}
          <div>
            <button
              onClick={onToggleVote}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                hasVoted ? "border-brand bg-brand-light text-brand font-semibold" : "border-border text-muted-foreground hover:border-brand hover:text-brand"
              }`}
            >
              <ThumbsUp className="h-4 w-4" /> {hasVoted ? "Votado" : "Votar"} · {voteCount}
            </button>
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Comentários ({(comentarios || []).length})
            </h4>
            <div className="space-y-3 mb-4">
              {(comentarios || []).map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-brand-light flex items-center justify-center text-[10px] font-semibold text-brand">
                    {(c.profiles as any)?.avatar_iniciais || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{(c.profiles as any)?.nome || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{c.conteudo}</p>
                  </div>
                </div>
              ))}
              {(!comentarios || comentarios.length === 0) && (
                <p className="text-xs text-muted-foreground">Nenhum comentário ainda</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="text-sm"
              />
              <Button size="sm" onClick={handleComment} disabled={!comment.trim() || addComment.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover shrink-0">
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
