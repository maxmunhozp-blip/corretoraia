import { useState } from "react";
import { FileText, ExternalLink, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
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
    <div
      className="my-2 rounded-lg p-4"
      style={{
        borderLeft: "4px solid #955251",
        background: "#F5EDEC",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 shrink-0" style={{ color: "#955251" }} />
        <span className="text-sm font-bold text-foreground">
          Proposta gerada para {clienteNome}
        </span>
      </div>

      {/* Economy badge */}
      {economiaMensal != null && economiaMensal > 0 && (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-semibold">
            Economia de R$ {economiaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
            {economiaPercentual != null && ` (${economiaPercentual.toFixed(1)}%)`}
          </span>
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-[#955251]/20 my-2" />

      {/* Link */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: "#71717A" }} />
        <span className="text-muted-foreground whitespace-nowrap">Link do dashboard:</span>
        <a
          href={linkPublico}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-[#955251] underline hover:text-[#7a3f3e]"
        >
          {linkPublico}
        </a>
        <button
          onClick={handleCopy}
          className="shrink-0 p-1 rounded hover:bg-[#955251]/10 transition-colors"
          title="Copiar link"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: "#71717A" }} />
          )}
        </button>
      </div>

      {/* PDF download */}
      {pdfUrl && (
        <div className="flex items-center gap-2 text-xs mb-2">
          <Download className="h-3.5 w-3.5 shrink-0" style={{ color: "#71717A" }} />
          <span className="text-muted-foreground truncate">{pdfNome || `Proposta_${slug}.pdf`}</span>
          <button
            onClick={handleDownloadPdf}
            className="shrink-0 px-3 py-1 rounded-md text-white text-xs font-medium transition-colors hover:opacity-90"
            style={{ background: "#955251" }}
          >
            Baixar PDF
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground mt-2">
        Válida por 7 dias · Link copiável para enviar ao cliente
      </p>
    </div>
  );
}
