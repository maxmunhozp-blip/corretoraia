import { FileText, X } from "lucide-react";

interface PdfUploadPreviewProps {
  file: File;
  onRemove: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUploadPreview({ file, onRemove }: PdfUploadPreviewProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 mb-2">
      <div className="h-8 w-8 rounded bg-brand/10 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
      </div>
      <button onClick={onRemove} className="p-1 rounded hover:bg-background transition-colors">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export function PdfUploadBubble({ filename, size }: { filename: string; size: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 mb-1">
      <FileText className="h-4 w-4 text-brand shrink-0" />
      <div>
        <p className="text-xs font-medium text-foreground">{filename}</p>
        <p className="text-[10px] text-muted-foreground">{size}</p>
      </div>
    </div>
  );
}
