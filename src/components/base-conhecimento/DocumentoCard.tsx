import { FileText, Globe, Image, MoreVertical, Eye, Download, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDeleteConhecimento } from "@/hooks/useBaseConhecimento";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
  operadoras?: { nome: string } | null;
}

export function DocumentoCard({ doc, index }: { doc: DocData; index: number }) {
  const Icon = iconMap[doc.tipo || "outro"] || FileText;
  const deleteMut = useDeleteConhecimento();

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(doc.id);
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover documento");
    }
  };

  const handleView = () => {
    const url = doc.arquivo_url || doc.fonte_url;
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async () => {
    if (doc.arquivo_url) {
      try {
        const response = await fetch(doc.arquivo_url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = doc.titulo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(doc.arquivo_url, "_blank");
      }
    }
  };

  return (
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
            <DropdownMenuItem onClick={handleView}><Eye className="h-4 w-4 mr-2" /> Ver</DropdownMenuItem>
            {doc.arquivo_url && (
              <DropdownMenuItem onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Baixar</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Remover</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="text-sm font-medium text-foreground leading-snug mb-2 line-clamp-2">{doc.titulo}</h4>

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
  );
}
