import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Globe, Image as ImageIcon, Download, X, ExternalLink, Mail, Send, CheckCircle2, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

/* ── Image Viewer with Zoom/Pan ── */
function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom(z => Math.min(5, z + 0.25));
  const zoomOut = () => setZoom(z => Math.max(0.25, z - 0.25));
  const rotate = () => setRotation(r => (r + 90) % 360);
  const resetView = () => { setZoom(1); setRotation(0); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(0.25, z - e.deltaY * 0.001)));
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur border border-border px-2 py-1 shadow-lg">
        <button onClick={zoomOut} className="p-1.5 rounded-md hover:bg-muted text-foreground" title="Diminuir zoom">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-1.5 rounded-md hover:bg-muted text-foreground" title="Aumentar zoom">
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <button onClick={rotate} className="p-1.5 rounded-md hover:bg-muted text-foreground" title="Girar">
          <RotateCw className="h-4 w-4" />
        </button>
        <button onClick={resetView} className="p-1.5 rounded-md hover:bg-muted text-foreground" title="Resetar">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt}
          className="transition-transform duration-150 select-none"
          draggable={false}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
            maxWidth: zoom <= 1 ? "100%" : "none",
            maxHeight: zoom <= 1 ? "100%" : "none",
          }}
        />
      </div>
    </div>
  );
}

/* ── PDF Viewer with Thumbnails ── */
function PdfPageViewer({ url, title }: { url: string; title: string }) {
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      setLoading(true);
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const canvases: HTMLCanvasElement[] = [];
        const thumbUrls: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
          canvases.push(canvas);
          const tvp = page.getViewport({ scale: 0.3 });
          const tc = document.createElement("canvas");
          tc.width = tvp.width;
          tc.height = tvp.height;
          await page.render({ canvasContext: tc.getContext("2d")!, viewport: tvp }).promise;
          thumbUrls.push(tc.toDataURL());
        }
        if (!cancelled) {
          setPages(canvases);
          setThumbs(thumbUrls);
          setSelected(0);
          setZoom(1);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [selected]);

  const currentCanvas = pages[selected];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Renderizando PDF...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full">
      {/* Thumbnails */}
      {thumbs.length > 1 && (
        <div className="w-[120px] shrink-0 border-r border-border bg-muted/30 overflow-y-auto p-2 space-y-2">
          {thumbs.map((thumb, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                i === selected ? "border-brand shadow-md ring-2 ring-brand/20" : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <img src={thumb} alt={`Página ${i + 1}`} className="w-full" />
              <p className={`text-[9px] py-0.5 text-center ${i === selected ? "text-brand font-bold" : "text-muted-foreground"}`}>{i + 1}</p>
            </button>
          ))}
        </div>
      )}

      {/* Main view */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls */}
        <div className="flex items-center justify-center gap-1 px-3 py-1.5 border-b border-border bg-card/50 shrink-0">
          <button onClick={() => setSelected(s => Math.max(s - 1, 0))} disabled={selected === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-muted-foreground mx-1">{selected + 1} / {pages.length}</span>
          <button onClick={() => setSelected(s => Math.min(s + 1, pages.length - 1))} disabled={selected === pages.length - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"><ChevronRight className="h-4 w-4" /></button>
          <div className="w-px h-4 bg-border mx-2" />
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 rounded hover:bg-muted text-foreground"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 rounded hover:bg-muted text-foreground"><ZoomIn className="h-4 w-4" /></button>
        </div>

        {/* Canvas */}
        <div ref={mainRef} className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/20">
          {currentCanvas ? (
            <canvas
              ref={node => {
                if (!node || !currentCanvas) return;
                node.width = currentCanvas.width;
                node.height = currentCanvas.height;
                const ctx = node.getContext("2d");
                if (ctx) ctx.drawImage(currentCanvas, 0, 0);
              }}
              style={{
                maxWidth: "100%",
                height: "auto",
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                borderRadius: "4px",
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-10">Nenhuma página</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  doc: DocData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentoPreviewModal({ doc, open, onOpenChange }: Props) {
  const [emailTo, setEmailTo] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

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
              <>
                <Popover open={emailOpen} onOpenChange={(v) => { setEmailOpen(v); if (!v) { setEmailSent(false); setEmailTo(""); } }}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs border-brand text-brand hover:bg-brand-light">
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      Enviar por email
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3" align="end">
                    {emailSent ? (
                      <div className="flex flex-col items-center gap-2 py-2 animate-fade-in">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-sm font-medium text-foreground">Email preparado!</p>
                        <p className="text-[11px] text-muted-foreground text-center">O cliente de email foi aberto com o relatório anexado.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">Enviar relatório</p>
                          <p className="text-[10px] text-muted-foreground">Informe o email do destinatário</p>
                        </div>
                        <Input
                          placeholder="email@exemplo.com"
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          className="h-8 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && emailTo.trim()) {
                              const subject = encodeURIComponent(`Relatório: ${doc.titulo}`);
                              const body = encodeURIComponent(
                                `Olá,\n\nSegue o relatório "${doc.titulo}" para sua análise.\n\nAcesse o documento: ${previewUrl}\n\nAtenciosamente.`
                              );
                              window.open(`mailto:${emailTo.trim()}?subject=${subject}&body=${body}`, "_self");
                              setEmailSent(true);
                              toast.success("Cliente de email aberto");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-brand text-brand-foreground hover:bg-brand-hover"
                          disabled={!emailTo.trim() || !emailTo.includes("@")}
                          onClick={() => {
                            const subject = encodeURIComponent(`Relatório: ${doc.titulo}`);
                            const body = encodeURIComponent(
                              `Olá,\n\nSegue o relatório "${doc.titulo}" para sua análise.\n\nAcesse o documento: ${previewUrl}\n\nAtenciosamente.`
                            );
                            window.open(`mailto:${emailTo.trim()}?subject=${subject}&body=${body}`, "_self");
                            setEmailSent(true);
                            toast.success("Cliente de email aberto");
                          }}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          Enviar
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  onClick={() => triggerDownload(previewUrl!, doc.titulo)}
                  className="bg-brand text-brand-foreground hover:bg-brand-hover h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Baixar
                </Button>
              </>
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
