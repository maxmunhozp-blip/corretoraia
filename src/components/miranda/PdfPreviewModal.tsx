import { useState, useEffect, useRef, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfPreviewModalProps {
  url: string;
  filename: string;
  open: boolean;
  onClose: () => void;
}

export function PdfPreviewModal({ url, filename, open, onClose }: PdfPreviewModalProps) {
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function render() {
      setLoading(true);
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const canvases: HTMLCanvasElement[] = [];
        const thumbUrls: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);

          // Main canvas (scale 2 for quality)
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          canvases.push(canvas);

          // Thumbnail (scale 0.3)
          const tvp = page.getViewport({ scale: 0.3 });
          const tc = document.createElement("canvas");
          tc.width = tvp.width;
          tc.height = tvp.height;
          const tctx = tc.getContext("2d")!;
          await page.render({ canvasContext: tctx, viewport: tvp }).promise;
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
  }, [url, open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight" || e.key === "ArrowDown") setSelected(s => Math.min(s + 1, pages.length - 1));
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
  }, [open, pages.length, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [selected]);

  if (!open) return null;

  const currentCanvas = pages[selected];

  return (
    <div className="fixed inset-0 z-[9999] flex bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[95vw] max-h-[95vh] m-auto rounded-xl overflow-hidden bg-background shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar - Thumbnails */}
        <div className="w-[140px] shrink-0 border-r border-border bg-muted/50 flex flex-col">
          <div className="p-2 border-b border-border">
            <p className="text-[10px] font-medium text-muted-foreground text-center">
              {pages.length} página{pages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {thumbs.map((thumb, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                  i === selected
                    ? "border-brand shadow-md ring-2 ring-brand/20"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <img src={thumb} alt={`Página ${i + 1}`} className="w-full" />
                <p className={`text-[9px] py-0.5 text-center ${
                  i === selected ? "text-brand font-bold" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate text-foreground">{filename}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {selected + 1} / {pages.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSelected(s => Math.max(s - 1, 0))} disabled={selected === 0}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setSelected(s => Math.min(s + 1, pages.length - 1))} disabled={selected === pages.length - 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 text-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-md hover:bg-muted text-foreground">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-md hover:bg-muted text-foreground">
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <a href={url} download={filename}
                className="p-1.5 rounded-md hover:bg-muted text-foreground">
                <Download className="h-4 w-4" />
              </a>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-destructive/10 text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div ref={mainRef} className="flex-1 overflow-auto bg-muted/20 flex items-start justify-center p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 mt-20">
                <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Renderizando PDF...</p>
              </div>
            ) : currentCanvas ? (
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
                  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-20">Nenhuma página encontrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
