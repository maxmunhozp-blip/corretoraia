import { FileText, Download, Eye, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function DownloadCard({ filename, size, url }: DownloadCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light p-3 my-2">
        <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{filename}</p>
          <p className="text-[10px] text-muted-foreground">{formatSize(size)}</p>
        </div>
        <button
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-background text-brand px-3 py-2 text-xs font-medium hover:bg-brand-light transition-colors shrink-0"
        >
          <Eye className="h-3.5 w-3.5" />
          Visualizar
        </button>
        <button
          onClick={() => triggerDownload(url, filename)}
          className="flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 py-2 text-xs font-medium hover:bg-brand-hover transition-colors shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar
        </button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-foreground truncate">{filename}</span>
              <span className="text-xs text-muted-foreground">({formatSize(size)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerDownload(url, filename)}
                className="flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 py-2 text-xs font-medium hover:bg-brand-hover transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar PDF
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-md hover:bg-surface transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-muted">
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={`Preview: ${filename}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
