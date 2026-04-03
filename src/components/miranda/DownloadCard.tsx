import { FileText, Download, Eye } from "lucide-react";

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
  return (
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
        onClick={() => window.open(url, "_blank")}
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
  );
}
