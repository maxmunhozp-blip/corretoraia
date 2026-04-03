import { useState, useEffect } from "react";
import { FileText, Download, Eye, Loader2 } from "lucide-react";
import { DownloadCard } from "./DownloadCard";
import { format } from "date-fns";
import type { GeneratePdfData } from "@/components/MirandaChart";

interface PdfGeneratorCardProps {
  data: GeneratePdfData;
}

export function PdfGeneratorCard({ data }: PdfGeneratorCardProps) {
  const [download, setDownload] = useState<{ filename: string; size: number; url: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      setGenerating(true);
      try {
        let blob: Blob;
        let filename: string;
        const dateStr = format(new Date(), "ddMMyyyy_HHmm");

        if (data.__pdf_type === "proposta") {
          const { gerarPropostaPdf } = await import("@/lib/gerarPropostaPdf");
          blob = gerarPropostaPdf(data as any);
          const clientName = (data.cliente_nome || "Cliente").replace(/\s+/g, "_");
          filename = `Proposta_${clientName}_${dateStr}.pdf`;
        } else if (data.__pdf_type === "relatorio_executivo") {
          const { gerarRelatorioExecutivo } = await import("@/lib/gerarRelatorioExecutivo");
          blob = gerarRelatorioExecutivo({ ...data, usuario: data.usuario || "Miranda" } as any);
          filename = `Relatorio_Executivo_${dateStr}.pdf`;
        } else {
          throw new Error(`Tipo de PDF desconhecido: ${data.__pdf_type}`);
        }

        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        setDownload({ filename, size: blob.size, url });
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erro ao gerar PDF");
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [data]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 my-2 text-sm text-destructive">
        ⚠️ {error}
      </div>
    );
  }

  if (generating || !download) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light p-3 my-2">
        <Loader2 className="h-5 w-5 text-brand animate-spin" />
        <span className="text-sm text-foreground">Gerando PDF...</span>
      </div>
    );
  }

  return <DownloadCard filename={download.filename} size={download.size} url={download.url} />;
}
