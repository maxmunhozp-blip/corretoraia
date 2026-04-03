import { useState } from "react";
import { FileText, Globe, Image as ImageIcon, Download, X, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

function getFileExtension(url: string | null): string {
  if (!url) return "";
  const path = url.split("?")[0];
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return ext;
}

function isPdf(url: string | null): boolean {
  return getFileExtension(url) === "pdf";
}

function isImage(url: string | null): boolean {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(getFileExtension(url));
}

function isWeb(tipo: string): boolean {
  return tipo === "web";
}

interface Props {
  doc: DocData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentoPreviewModal({ doc, open, onOpenChange }: Props) {
  const previewUrl = doc.arquivo_url || doc.fonte_url;
  const pdfUrl = isPdf(doc.arquivo_url) ? doc.arquivo_url : null;
  const imgUrl = isImage(doc.arquivo_url) ? doc.arquivo_url : null;
  const webUrl = isWeb(doc.tipo) ? doc.fonte_url : null;
  const conteudo = doc.conteudo_extraido || doc.descricao || null;

  const hasVisualPreview = pdfUrl || imgUrl || webUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
              <FileText className="h-4.5 w-4.5 text-brand" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate max-w-[500px]">
                {doc.titulo}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground">
                  {categoriaLabels[doc.categoria] || doc.categoria}
                </span>
                {(doc.operadoras as any)?.nome && (
                  <>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {(doc.operadoras as any).nome}
                    </span>
                  </>
                )}
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {previewUrl && !webUrl && (
              <Button
                size="sm"
                onClick={() => triggerDownload(previewUrl!, doc.titulo)}
                className="bg-brand text-brand-foreground hover:bg-brand-hover h-8 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Baixar
              </Button>
            )}
            {webUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(webUrl, "_blank")}
                className="h-8 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir fonte
              </Button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main preview */}
          <div className="flex-1 bg-muted/50 flex items-center justify-center overflow-hidden relative">
            {pdfUrl ? (
              <object
                data={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Não foi possível exibir o PDF no navegador
                  </p>
                  <Button
                    size="sm"
                    onClick={() => triggerDownload(pdfUrl, doc.titulo)}
                    className="bg-brand text-brand-foreground hover:bg-brand-hover"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar PDF
                  </Button>
                </div>
              </object>
            ) : imgUrl ? (
              <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                <img
                  src={imgUrl}
                  alt={doc.titulo}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : webUrl ? (
              <iframe
                src={webUrl}
                className="w-full h-full border-0"
                title={doc.titulo}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : conteudo ? (
              <div className="w-full h-full overflow-auto p-8">
                <div className="max-w-3xl mx-auto bg-card rounded-xl border border-border p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{doc.titulo}</h2>
                  <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {conteudo}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <FileText className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Preview não disponível para este documento
                </p>
                {doc.arquivo_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerDownload(doc.arquivo_url!, doc.titulo)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar arquivo
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Side panel with content summary */}
          {conteudo && hasVisualPreview && (
            <div className="w-[320px] border-l border-border bg-card overflow-y-auto shrink-0 hidden lg:block">
              <div className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Resumo do conteúdo
                </h4>
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-[40]">
                  {conteudo.slice(0, 3000)}
                  {conteudo.length > 3000 && (
                    <span className="text-muted-foreground"> [...]</span>
                  )}
                </div>
              </div>

              {/* Doc info */}
              <div className="border-t border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Informações
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Categoria</dt>
                    <dd className="font-medium text-foreground">
                      {categoriaLabels[doc.categoria] || doc.categoria}
                    </dd>
                  </div>
                  {(doc.operadoras as any)?.nome && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Operadora</dt>
                      <dd className="font-medium text-foreground">
                        {(doc.operadoras as any).nome}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd className="font-medium text-foreground uppercase">
                      {doc.tipo}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium text-foreground capitalize">
                      {doc.status}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Adicionado</dt>
                    <dd className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(doc.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
