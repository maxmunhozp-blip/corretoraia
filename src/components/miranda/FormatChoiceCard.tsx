import { Monitor, FileText } from "lucide-react";

interface FormatChoiceCardProps {
  onChoose: (format: "interativo" | "pdf" | "ambos") => void;
}

export function FormatChoiceCard({ onChoose }: FormatChoiceCardProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Dados coletados! Qual formato prefere?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChoose("interativo")}
          className="relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-brand bg-card transition-colors text-left"
        >
          <span className="absolute top-2 right-2 text-[10px] bg-brand text-brand-foreground px-1.5 py-0.5 rounded-full">Recomendado</span>
          <Monitor className="h-8 w-8 text-brand" />
          <span className="font-semibold text-sm text-foreground">Dashboard Interativo</span>
          <span className="text-xs text-muted-foreground text-center">Link público com abas, animações e gatilhos de conversão</span>
        </button>
        <button
          onClick={() => onChoose("pdf")}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-brand bg-card transition-colors text-left"
        >
          <FileText className="h-8 w-8 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">PDF Profissional</span>
          <span className="text-xs text-muted-foreground text-center">Documento para download e impressão</span>
        </button>
      </div>
      <button
        onClick={() => onChoose("ambos")}
        className="w-full py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand-light transition-colors"
      >
        Gerar os dois
      </button>
    </div>
  );
}
