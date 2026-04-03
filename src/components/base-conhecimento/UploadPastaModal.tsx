import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen, FileText, FileSpreadsheet, Image, File,
  CheckCircle2, XCircle, Loader2, Upload, Sparkles, Tag, PartyPopper,
} from "lucide-react";
import { useCreateConhecimento, useUploadConhecimento, useProcessarConhecimento } from "@/hooks/useBaseConhecimento";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_EXTENSIONS = ["pdf", "docx", "xlsx", "xls", "png", "jpg", "jpeg", "csv", "txt", "doc"];

const CATEGORIA_LABELS: Record<string, string> = {
  regras_comerciais: "Regras Comerciais",
  tabela_preco: "Tabela de Preço",
  rede_credenciada: "Rede Credenciada",
  manual: "Manual",
  contrato: "Contrato",
  treinamento: "Treinamento",
  comunicado: "Comunicado",
  formulario: "Formulário",
  relatorio: "Relatório",
  outro: "Outro",
};

const CATEGORIA_COLORS: Record<string, string> = {
  regras_comerciais: "bg-blue-100 text-blue-800",
  tabela_preco: "bg-green-100 text-green-800",
  rede_credenciada: "bg-purple-100 text-purple-800",
  manual: "bg-amber-100 text-amber-800",
  contrato: "bg-red-100 text-red-800",
  treinamento: "bg-cyan-100 text-cyan-800",
  comunicado: "bg-orange-100 text-orange-800",
  formulario: "bg-indigo-100 text-indigo-800",
  relatorio: "bg-emerald-100 text-emerald-800",
  outro: "bg-muted text-muted-foreground",
};

interface ScannedFile {
  file: File;
  relativePath: string;
  type: string;
  status: "pending" | "categorizing" | "categorized" | "uploading" | "done" | "error";
  error?: string;
  categoria?: string;
  operadora?: string;
  tituloSugerido?: string;
}

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["docx", "doc"].includes(ext)) return "docx";
  if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
  if (["png", "jpg", "jpeg"].includes(ext)) return "imagem";
  if (ext === "txt") return "texto";
  return "outro";
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf": return <FileText className="h-4 w-4 text-red-500" />;
    case "docx": return <FileText className="h-4 w-4 text-blue-500" />;
    case "xlsx": return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    case "imagem": return <Image className="h-4 w-4 text-purple-500" />;
    default: return <File className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPastaModal({ open, onOpenChange }: Props) {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStats, setScanStats] = useState({ folders: 0, files: 0 });
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<"select" | "review" | "uploading" | "done">("select");
  const [showCelebration, setShowCelebration] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const celebrationCanvasRef = useRef<HTMLCanvasElement>(null);

  const createDoc = useCreateConhecimento();
  const uploadFile = useUploadConhecimento();
  const processar = useProcessarConhecimento();

  // Confetti celebration animation
  useEffect(() => {
    if (!showCelebration || !celebrationCanvasRef.current) return;
    const canvas = celebrationCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 500;
    canvas.height = rect?.height || 400;

    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];
    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; rot: number; rv: number; shape: number; opacity: number }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height * 0.6,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 10 - 4,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.3,
        shape: Math.floor(Math.random() * 3),
        opacity: 1,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.vx *= 0.99;
        p.rot += p.rv;
        p.opacity -= 0.006;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2);
        } else if (p.shape === 1) {
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
      else setShowCelebration(false);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [showCelebration]);

  const scanAndCategorize = async (fileList: FileList) => {
    setScanning(true);
    setStep("review");
    const scanned: ScannedFile[] = [];
    const foldersSet = new Set<string>();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (file.name.startsWith(".")) continue;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) continue;
      if (file.size > 50 * 1024 * 1024) continue;

      const relativePath = (file as any).webkitRelativePath || file.name;
      const folder = relativePath.substring(0, relativePath.lastIndexOf("/")) || "/";
      foldersSet.add(folder);
      setScanStats({ folders: foldersSet.size, files: scanned.length + 1 });

      scanned.push({
        file,
        relativePath,
        type: getFileType(file.name),
        status: "categorizing",
      });
    }

    setScanning(false);

    if (scanned.length === 0) {
      toast.error("Nenhum arquivo compatível encontrado na pasta");
      setStep("select");
      return;
    }

    setFiles(scanned);
    setCategorizing(true);
    setStep("review");

    try {
      const arquivos = scanned.map((f) => ({
        nome: f.file.name,
        caminho: f.relativePath,
        tipo: f.type,
        tamanho: f.file.size,
      }));

      const batchSize = 30;
      const allClassifications: any[] = [];

      for (let batchStart = 0; batchStart < arquivos.length; batchStart += batchSize) {
        const batch = arquivos.slice(batchStart, batchStart + batchSize);
        const { data, error } = await supabase.functions.invoke("categorizar-documentos", {
          body: { arquivos: batch },
        });

        if (error) throw new Error(error.message || "Erro ao categorizar");
        if (data?.classificacoes) {
          const adjusted = data.classificacoes.map((c: any) => ({
            ...c,
            indice: c.indice + batchStart,
          }));
          allClassifications.push(...adjusted);
        }
      }

      setFiles((prev) =>
        prev.map((f, i) => {
          const classification = allClassifications.find((c: any) => c.indice === i);
          return {
            ...f,
            status: "categorized" as const,
            categoria: classification?.categoria || "outro",
            operadora: classification?.operadora_detectada || "",
            tituloSugerido: classification?.titulo_sugerido || f.file.name.replace(/\.[^/.]+$/, ""),
          };
        })
      );

      toast.success(`${scanned.length} arquivos categorizados pela IA`);
    } catch (err: any) {
      console.error("Categorization error:", err);
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "categorized" as const,
          categoria: "outro",
          tituloSugerido: f.file.name.replace(/\.[^/.]+$/, ""),
        }))
      );
      toast.error("Erro ao categorizar via IA. Categoria padrão aplicada.");
    } finally {
      setCategorizing(false);
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      scanAndCategorize(e.target.files);
    }
  };

  const readAllEntries = async (dirEntry: any, basePath: string): Promise<File[]> => {
    return new Promise((resolve) => {
      const reader = dirEntry.createReader();
      const allFiles: File[] = [];

      const readBatch = () => {
        reader.readEntries(async (entries: any[]) => {
          if (entries.length === 0) {
            resolve(allFiles);
            return;
          }

          for (const entry of entries) {
            if (entry.isFile) {
              const file: File = await new Promise((res) => entry.file((f: File) => {
                Object.defineProperty(f, "webkitRelativePath", {
                  value: `${basePath}/${entry.name}`,
                  writable: false,
                });
                res(f);
              }));
              allFiles.push(file);
              setScanStats((prev) => ({ ...prev, files: prev.files + 1 }));
            } else if (entry.isDirectory) {
              setScanStats((prev) => ({ ...prev, folders: prev.folders + 1 }));
              const subFiles = await readAllEntries(entry, `${basePath}/${entry.name}`);
              allFiles.push(...subFiles);
            }
          }

          readBatch();
        });
      };
      readBatch();
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setScanning(true);
    setScanStats({ folders: 0, files: 0 });
    setStep("review");

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) { setScanning(false); setStep("select"); return; }

    const allFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const entry = (items[i] as any).webkitGetAsEntry?.();
      if (!entry) {
        const file = items[i].getAsFile();
        if (file) allFiles.push(file);
        continue;
      }

      if (entry.isDirectory) {
        setScanStats((prev) => ({ ...prev, folders: prev.folders + 1 }));
        const dirFiles = await readAllEntries(entry, entry.name);
        allFiles.push(...dirFiles);
      } else if (entry.isFile) {
        const file: File = await new Promise((res) => entry.file((f: File) => res(f)));
        allFiles.push(file);
      }
    }

    setScanning(false);

    if (allFiles.length === 0) {
      toast.error("Nenhum arquivo encontrado na pasta");
      setStep("select");
      return;
    }

    const dt = new DataTransfer();
    allFiles.forEach((f) => dt.items.add(f));
    scanAndCategorize(dt.files);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setFiles([]);
    setProgress(0);
    setStep("select");
    setCategorizing(false);
    setScanning(false);
    setScanStats({ folders: 0, files: 0 });
    setShowCelebration(false);
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleUploadAll = async () => {
    const toUpload = files.filter((f) => f.status === "categorized");
    if (toUpload.length === 0) return;
    setUploading(true);
    setStep("uploading");
    setProgress(0);

    let completed = 0;
    let errors = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status !== "categorized") continue;

      setFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      try {
        const sanitizedName = f.file.name
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_+/g, "_");
        const path = `pasta/${Date.now()}_${sanitizedName}`;
        const publicUrl = await uploadFile.mutateAsync({ file: f.file, path });

        const doc = await createDoc.mutateAsync({
          titulo: f.tituloSugerido || f.file.name.replace(/\.[^/.]+$/, ""),
          tipo: f.type,
          categoria: f.categoria || "outro",
          descricao: `Importado de pasta: ${f.relativePath}${f.operadora ? ` | Operadora detectada: ${f.operadora}` : ""}`,
          arquivo_url: publicUrl,
          status: "processando",
        });

        processar.mutate({ id: doc.id, tipo: f.type, arquivo_url: publicUrl });

        setFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "done" } : item))
        );
        completed++;
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: err.message || "Erro" } : item
          )
        );
        errors++;
      }

      setProgress(Math.round(((completed + errors) / toUpload.length) * 100));
    }

    setUploading(false);
    setStep("done");
    setShowCelebration(true);
    toast.success(
      `Upload concluído: ${completed} arquivo${completed !== 1 ? "s" : ""} enviado${completed !== 1 ? "s" : ""}${errors > 0 ? `, ${errors} erro${errors !== 1 ? "s" : ""}` : ""}`
    );
  };

  const categorizedCount = files.filter((f) => f.status === "categorized").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const byCategoria = files.reduce<Record<string, number>>((acc, f) => {
    if (f.categoria) {
      acc[f.categoria] = (acc[f.categoria] || 0) + 1;
    }
    return acc;
  }, {});

  const byOperadora = files.reduce<Record<string, number>>((acc, f) => {
    if (f.operadora) {
      acc[f.operadora] = (acc[f.operadora] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !uploading && !categorizing) { reset(); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 pr-10">
            <FolderOpen className="h-5 w-5 text-brand" />
            Upload Inteligente de Pasta
            {categorizing && (
              <Badge variant="outline" className="ml-2 text-[10px] animate-pulse border-brand text-brand">
                <Sparkles className="h-3 w-3 mr-1" /> IA Categorizando...
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
          {step === "select" ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => folderInputRef.current?.click()}
              className={`flex h-full min-h-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                dragOver ? "border-brand bg-brand-light" : "border-border hover:border-muted-foreground"
              }`}
            >
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">
                Clique para selecionar uma pasta
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                A IA irá varrer todas as subpastas, identificar e categorizar automaticamente cada documento
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs text-brand font-medium">Categorização automática por IA</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG (máx. 50MB por arquivo)
              </p>
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                {...({ webkitdirectory: "true", directory: "true", multiple: true } as any)}
                onChange={handleFolderSelect}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
              {(scanning || categorizing) && (
                <div className="shrink-0 rounded-lg border border-brand/20 bg-brand-light/50 p-3 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {scanning ? "Varrendo subpastas…" : "IA categorizando arquivos…"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {scanStats.folders > 0 && (
                        <span className="inline-flex items-center gap-1 mr-3">
                          <FolderOpen className="h-3 w-3" />
                          {scanStats.folders} subpasta{scanStats.folders !== 1 ? "s" : ""} varrida{scanStats.folders !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <File className="h-3 w-3" />
                        {scanStats.files || files.length} arquivo{(scanStats.files || files.length) !== 1 ? "s" : ""} encontrado{(scanStats.files || files.length) !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {!categorizing && !scanning && Object.keys(byCategoria).length > 0 && (
                <div className="shrink-0 rounded-lg border border-brand/20 bg-brand-light/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    Classificação da IA
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(byCategoria).map(([cat, count]) => (
                      <span
                        key={cat}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORIA_COLORS[cat] || CATEGORIA_COLORS.outro}`}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {count} {CATEGORIA_LABELS[cat] || cat}
                      </span>
                    ))}
                  </div>
                  {Object.keys(byOperadora).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground mr-1">Operadoras detectadas:</span>
                      {Object.entries(byOperadora).map(([op, count]) => (
                        <span key={op} className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] text-foreground font-medium">
                          {op} ({count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="shrink-0 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 font-medium text-foreground">
                  <File className="h-3.5 w-3.5" />
                  {files.length} arquivos
                </div>
                {doneCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {doneCount} enviados
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {errorCount} erros
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border">
                <div className="divide-y divide-border">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      {f.status === "categorizing" ? (
                        <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" />
                      ) : f.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" />
                      ) : f.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : f.status === "error" ? (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        getFileIcon(f.type)
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {f.tituloSugerido || f.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(f.file.size)}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{f.relativePath}</span>
                        </div>
                        {f.error && <p className="text-[10px] text-red-500 mt-0.5 break-all">{f.error}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {f.categoria && f.status !== "categorizing" && (
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${CATEGORIA_COLORS[f.categoria] || CATEGORIA_COLORS.outro}`}>
                            {CATEGORIA_LABELS[f.categoria] || f.categoria}
                          </span>
                        )}
                        {f.operadora && (
                          <span className="inline-flex items-center rounded-full bg-surface px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            {f.operadora}
                          </span>
                        )}
                      </div>
                      {f.status === "categorized" && !uploading && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {uploading && <Progress value={progress} className="shrink-0 h-2 [&>div]:bg-brand" />}

              {/* Celebration overlay */}
              {step === "done" && (
                <div className="shrink-0 rounded-lg border border-green-200 bg-green-50 p-5 relative overflow-hidden">
                  <canvas ref={celebrationCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                  <div className="relative z-20 flex flex-col items-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
                      <PartyPopper className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-green-800 animate-fade-in">
                      Tudo pronto! 🎉
                    </p>
                    <p className="text-xs text-green-600 animate-fade-in">
                      {doneCount} arquivo{doneCount !== 1 ? "s" : ""} processado{doneCount !== 1 ? "s" : ""} com sucesso
                      {errorCount > 0 && ` · ${errorCount} erro${errorCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {step === "done" ? (
            <Button
              onClick={() => { onOpenChange(false); reset(); }}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => { if (!uploading && !categorizing) { onOpenChange(false); reset(); } }}
                disabled={uploading || categorizing}
              >
                Cancelar
              </Button>
              {step === "review" && !uploading && !categorizing && (
                <Button variant="outline" onClick={reset}>
                  Trocar pasta
                </Button>
              )}
              {step !== "select" && (
                <Button
                  onClick={handleUploadAll}
                  disabled={categorizedCount === 0 || uploading || categorizing}
                  className="bg-brand text-brand-foreground hover:bg-brand-hover"
                >
                  {categorizing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      IA categorizando...
                    </>
                  ) : uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando {doneCount + errorCount + 1}/{files.length}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar {categorizedCount} arquivo{categorizedCount !== 1 ? "s" : ""} categorizados
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
