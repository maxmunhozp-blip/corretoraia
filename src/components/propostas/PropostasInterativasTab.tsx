import { useState } from "react";
import { usePropostasInterativas, useUpdatePropostaInterativa } from "@/hooks/usePropostasInterativas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Copy, ExternalLink, RefreshCw, Trash2, FileX, Monitor, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getPublicProposalUrl } from "@/lib/publicAppUrl";

const statusStyles: Record<string, string> = {
  ativa: "border-[hsl(1,30%,45%)] text-[hsl(1,30%,45%)]",
  visualizada: "border-blue-500 text-blue-500",
  aceita: "border-green-600 text-green-600",
  expirada: "border-gray-400 text-gray-400",
};

export function PropostasInterativasTab() {
  const { data: propostas, isLoading } = usePropostasInterativas();
  const updateProposta = useUpdatePropostaInterativa();
  const [copyingSlug, setCopyingSlug] = useState<string | null>(null);

  const copyLink = async (slug: string) => {
    try {
      setCopyingSlug(slug);
      await navigator.clipboard.writeText(getPublicProposalUrl(slug));
      toast.success("Link público copiado!");
    } catch {
      toast.error("Erro ao copiar o link público");
    } finally {
      setCopyingSlug(null);
    }
  };

  const openLink = (slug: string) => {
    window.open(getPublicProposalUrl(slug), "_blank", "noopener,noreferrer");
  };

  const renovar = async (id: string) => {
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + 7);
    try {
      await updateProposta.mutateAsync({ id, valida_ate: novaData.toISOString(), status: "ativa" });
      toast.success("Validade renovada por mais 7 dias!");
    } catch {
      toast.error("Erro ao renovar");
    }
  };

  const arquivar = async (id: string) => {
    try {
      await updateProposta.mutateAsync({ id, status: "expirada" });
      toast.success("Proposta arquivada");
    } catch {
      toast.error("Erro ao arquivar");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface hover:bg-surface">
            <TableHead>Cliente</TableHead>
            <TableHead>Formato</TableHead>
            <TableHead>Visualizações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Válida até</TableHead>
            <TableHead>Pública</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : propostas && propostas.length > 0 ? (
            propostas.map((p) => (
              <TableRow key={p.id} className="hover:bg-surface transition-colors">
                <TableCell className="font-medium text-foreground">
                  {p.cliente_nome}
                  {p.cliente_empresa && <span className="text-muted-foreground text-xs block">{p.cliente_empresa}</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {p.formato_padrao === "interativo" ? (
                      <><Monitor className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs">Interativo</span></>
                    ) : (
                      <><FileText className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs">PDF</span></>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{p.visualizacoes}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status] || ""}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.valida_ate ? format(new Date(p.valida_ate), "dd/MM/yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyLink(p.slug)}
                      className="p-1 rounded hover:bg-surface transition-colors"
                      title="Copiar link público"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openLink(p.slug)}
                      className="p-1 rounded hover:bg-surface transition-colors"
                      title="Abrir proposta pública"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {copyingSlug === p.slug && (
                      <span className="text-[11px] text-muted-foreground">Copiado</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openLink(p.slug)}
                      className="p-1 rounded hover:bg-surface transition-colors"
                      title="Abrir proposta"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => renovar(p.id)} className="p-1 rounded hover:bg-surface transition-colors" title="Renovar validade">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => arquivar(p.id)} className="p-1 rounded hover:bg-surface transition-colors" title="Arquivar">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileX className="h-8 w-8" />
                  <p className="text-sm">Nenhuma proposta interativa encontrada.</p>
                  <p className="text-xs">Peça à Miranda para gerar uma proposta interativa.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
