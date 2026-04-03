import { FileText, Download } from "lucide-react";

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

export function DownloadCard({ filename, size, url }: DownloadCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light p-3 my-2">
      <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{filename}</p>
        <p className="text-[10px] text-muted-foreground">{formatSize(size)}</p>
      </div>
      <button
        onClick={() => {
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-3 py-2 text-xs font-medium hover:bg-brand-hover transition-colors shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        Baixar PDF
      </button>
    </div>
  );
}
