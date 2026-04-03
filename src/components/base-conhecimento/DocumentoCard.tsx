import { useState } from "react";
import { FileText, Globe, Image, MoreVertical, Eye, Download, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDeleteConhecimento } from "@/hooks/useBaseConhecimento";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { DocumentoPreviewModal } from "./DocumentoPreviewModal";

const iconMap: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileText,
  web: Globe,
  imagem: Image,
  outro: FileText,
};

const categoriaLabels: Record<string, string> = {
  regras_comerciais: "Regras Comerciais",
  tabela_preco: "Tabela de Preço",
  rede_credenciada: "Rede Credenciada",
  manual: "Manual",
  pesquisa_web: "Pesquisa Web",
  outro: "Outro",
};

interface DocData {
  id: string;
  titulo: string;
  tipo: string;
  categoria: string;
  status: string;
  created_at: string;
  arquivo_url: string | null;
  fonte_url: string | null;
  erro_mensagem: string | null;
  conteudo_extraido?: string | null;
  descricao?: string | null;
  operadoras?: { nome: string } | null;
}

function triggerDownload(url: string, filename: string) {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => window.open(url, "_blank"));
}

function getSnippet(text: string | null | undefined, query: string, maxLen = 120): string | null {
  if (!text || !query || query.length < 2) return null;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + maxLen - 40);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-brand/20 text-brand font-medium rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function DocumentoCard({ doc, index, searchQuery }: { doc: DocData; index: number; searchQuery?: string }) {
  const Icon = iconMap[doc.tipo || "outro"] || FileText;
  const deleteMut = useDeleteConhecimento();
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewUrl = doc.arquivo_url || doc.fonte_url;

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(doc.id);
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover documento");
    }
  };

  const handleView = () => {
    if (previewUrl || doc.conteudo_extraido) setPreviewOpen(true);
  };

  const handleDownload = () => {
    if (doc.arquivo_url) triggerDownload(doc.arquivo_url, doc.titulo);
  };

  return (
    <>
      <div
        className={`group rounded-lg border border-border bg-card p-4 opacity-0 transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
          doc.status === "processando" ? "animate-pulse" : ""
        }`}
        style={{ animation: `staggerIn 0.4s ease-out ${index * 80}ms forwards` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-md bg-brand-light flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-brand" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(previewUrl || doc.conteudo_extraido) && (
                <DropdownMenuItem onClick={handleView}><Eye className="h-4 w-4 mr-2" /> Visualizar</DropdownMenuItem>
              )}
              {doc.arquivo_url && (
                <DropdownMenuItem onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Baixar</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Remover</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4
          className="text-sm font-medium text-foreground leading-snug mb-2 line-clamp-2 cursor-pointer hover:text-brand transition-colors"
          onClick={handleView}
        >
          {searchQuery ? <HighlightText text={doc.titulo} query={searchQuery} /> : doc.titulo}
        </h4>

        {searchQuery && (() => {
          const snippet = getSnippet(doc.conteudo_extraido, searchQuery);
          if (!snippet) return null;
          return (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-3 bg-muted/50 rounded-md px-2 py-1.5">
              <HighlightText text={snippet} query={searchQuery} />
            </p>
          );
        })()}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(doc.operadoras as any)?.nome && (
            <span className="text-xs text-muted-foreground">{(doc.operadoras as any).nome}</span>
          )}
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {categoriaLabels[doc.categoria] || doc.categoria}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          <div className="flex items-center gap-1.5">
            {doc.status === "indexado" && (
              <>
                <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                <span className="text-[11px] font-medium text-[#16A34A]">Indexado</span>
              </>
            )}
            {doc.status === "processando" && (
              <>
                <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
                <span className="text-[11px] font-medium text-[#D97706]">Processando</span>
              </>
            )}
            {doc.status === "erro" && (
              <>
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-[11px] font-medium text-destructive" title={doc.erro_mensagem || ""}>Erro</span>
              </>
            )}
          </div>
        </div>
      </div>

      <DocumentoPreviewModal doc={doc} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
