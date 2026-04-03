import { useState } from "react";
import { FileText, Download, Eye, Mail, Loader2, Check } from "lucide-react";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [preview, setPreview] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendEmail = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setSending(true);
    try {
      // Fetch the blob from the URL
      const resp = await fetch(url);
      const blob = await resp.blob();

      // Upload to storage
      const path = `envios/${Date.now()}_${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("relatorios")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("relatorios")
        .getPublicUrl(path);

      const downloadUrl = publicData.publicUrl;
      const subject = encodeURIComponent(`Proposta: ${filename}`);
      const body = encodeURIComponent(
        `Olá,\n\nSegue o link para download da proposta:\n\n${downloadUrl}\n\nAtenciosamente,\nEquipe Cora`
      );

      window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`, "_self");

      setSent(true);
      toast.success("Cliente de e-mail aberto com o link do PDF");
      setTimeout(() => {
        setShowEmailInput(false);
        setSent(false);
        setEmail("");
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao preparar e-mail");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="my-2 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <FileText className="h-5 w-5 text-brand" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{filename}</p>
            <p className="text-[10px] text-muted-foreground">{formatSize(size)}</p>
          </div>

          <button
            type="button"
            onClick={() => setPreview(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-background px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-brand-light"
          >
            <Eye className="h-3.5 w-3.5" />
            Visualizar
          </button>

          <button
            type="button"
            onClick={() => setShowEmailInput(!showEmailInput)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showEmailInput
                ? "border-brand bg-brand text-brand-foreground"
                : "border-brand/30 bg-background text-brand hover:bg-brand-light"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            E-mail
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

        {showEmailInput && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
            <input
              type="email"
              placeholder="E-mail do cliente..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || sent}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : sent ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {sent ? "Enviado!" : "Enviar"}
            </button>
          </div>
        )}
      </div>

      <PdfPreviewModal url={url} filename={filename} open={preview} onClose={() => setPreview(false)} />
    </>
  );
}
