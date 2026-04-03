import { useState } from "react";
import { FileText, ExternalLink, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { getPublicProposalUrl } from "@/lib/publicAppUrl";

interface PropostaCardProps {
  slug: string;
  clienteNome: string;
  linkPublico: string;
  pdfUrl?: string;
  pdfNome?: string;
  economiaMensal?: number;
  economiaPercentual?: number;
}

export function PropostaCard({
  slug,
  clienteNome,
  linkPublico,
  pdfUrl,
  pdfNome,
  economiaMensal,
  economiaPercentual,
}: PropostaCardProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = getPublicProposalUrl(slug, linkPublico);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link público copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar o link público");
    }
  };

  const handleOpen = () => {
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfNome || `Proposta_${slug}.pdf`;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="my-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Proposta gerada para {clienteNome}
            </p>
            <p className="text-xs text-muted-foreground">
              A proposta pública está pronta para abrir e enviar ao cliente.
            </p>
          </div>

          {economiaMensal != null && economiaMensal > 0 && (
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Economia de R$ {economiaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                {economiaPercentual != null && ` (${economiaPercentual.toFixed(1)}%)`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir proposta
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </button>

            {pdfUrl && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Link público da proposta · válido por 7 dias.
          </p>
        </div>
      </div>
    </div>
  );
}
