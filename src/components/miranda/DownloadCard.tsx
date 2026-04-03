import { useState } from "react";
import { FileText, Download, Eye, X, Maximize2 } from "lucide-react";

interface DownloadCardProps {
  filename: string;
  size: number;
  url: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function DownloadCard({ filename, size, url }: DownloadCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="my-2 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
          <FileText className="h-5 w-5 text-brand" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{filename}</p>
          <p className="text-[10px] text-muted-foreground">{formatSize(size)}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-background px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-brand-light"
        >
          <Eye className="h-3.5 w-3.5" />
          Visualizar
        </button>

        <button
          type="button"
          onClick={() => triggerDownload(url, filename)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="relative w-[90vw] max-w-4xl h-[85vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-medium text-foreground truncate">{filename}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => window.open(url, "_blank")}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  title="Abrir em nova aba"
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="flex-1 w-full border-0"
              title={filename}
            />
          </div>
        </div>
      )}
    </>
  );
}
