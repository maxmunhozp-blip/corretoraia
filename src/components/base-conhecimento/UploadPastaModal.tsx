import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, FileText, FileSpreadsheet, Image, File, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import { useOperadoras } from "@/hooks/usePropostas";
import { useCreateConhecimento, useUploadConhecimento, useProcessarConhecimento } from "@/hooks/useBaseConhecimento";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categorias = [
  { value: "regras_comerciais", label: "Regras Comerciais" },
  { value: "tabela_preco", label: "Tabela de Preço" },
  { value: "rede_credenciada", label: "Rede Credenciada" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

const ACCEPTED_EXTENSIONS = ["pdf", "docx", "xlsx", "xls", "png", "jpg", "jpeg", "csv", "txt", "doc"];

interface ScannedFile {
  file: File;
  relativePath: string;
  type: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
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
  const [operadoraId, setOperadoraId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const { data: operadoras } = useOperadoras();
  const createDoc = useCreateConhecimento();
  const uploadFile = useUploadConhecimento();
  const processar = useProcessarConhecimento();

  const scanFiles = (fileList: FileList) => {
    const scanned: ScannedFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      // Skip hidden files and unsupported types
      if (file.name.startsWith(".")) continue;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) continue;
      // Skip very large files (>50MB)
      if (file.size > 50 * 1024 * 1024) continue;

      const relativePath = (file as any).webkitRelativePath || file.name;
      scanned.push({
        file,
        relativePath,
        type: getFileType(file.name),
        status: "pending",
      });
    }
    setFiles(scanned);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      scanFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      scanFiles(e.dataTransfer.files);
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setFiles([]);
    setOperadoraId("");
    setCategoria("");
    setProgress(0);
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);

    let completed = 0;
    let errors = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      try {
        const path = `pasta/${Date.now()}_${f.file.name}`;
        const publicUrl = await uploadFile.mutateAsync({ file: f.file, path });

        const titulo = f.file.name.replace(/\.[^/.]+$/, "");
        const doc = await createDoc.mutateAsync({
          titulo,
          tipo: f.type,
          categoria: categoria || "outro",
          operadora_id: operadoraId || undefined,
          descricao: `Importado de pasta: ${f.relativePath}`,
          arquivo_url: publicUrl,
          status: "processando",
        });

        // Trigger AI processing
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

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    toast.success(
      `Upload concluído: ${completed} arquivo${completed !== 1 ? "s" : ""} enviado${completed !== 1 ? "s" : ""}${errors > 0 ? `, ${errors} erro${errors !== 1 ? "s" : ""}` : ""}`
    );
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const byType = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !uploading) { reset(); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand" />
            Upload de Pasta Completa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {files.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => folderInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-brand bg-brand-light" : "border-border hover:border-muted-foreground"
              }`}
            >
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">
                Clique para selecionar uma pasta
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                O sistema irá varrer todas as subpastas e encontrar documentos compatíveis
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
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
            <>
              {/* Summary */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 font-medium text-foreground">
                  <File className="h-3.5 w-3.5" />
                  {files.length} arquivos encontrados
                </div>
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-muted-foreground">
                    {getFileIcon(type)}
                    {count} {type.toUpperCase()}
                  </div>
                ))}
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

              {/* Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Operadora (aplicar a todos)</Label>
                  <Select value={operadoraId} onValueChange={setOperadoraId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      {(operadoras || []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Categoria (aplicar a todos)</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Outro" /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File list */}
              <ScrollArea className="flex-1 max-h-[300px] border border-border rounded-lg">
                <div className="divide-y divide-border">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      {f.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" />
                      ) : f.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : f.status === "error" ? (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        getFileIcon(f.type)
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{f.relativePath}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSize(f.file.size)}
                          {f.error && <span className="text-red-500 ml-2">{f.error}</span>}
                        </p>
                      </div>
                      {f.status === "pending" && !uploading && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {uploading && <Progress value={progress} className="h-2 [&>div]:bg-brand" />}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => { if (!uploading) { onOpenChange(false); reset(); } }}
            disabled={uploading}
          >
            {uploading ? "Processando..." : "Cancelar"}
          </Button>
          {files.length > 0 && !uploading && doneCount !== files.length && (
            <Button variant="outline" onClick={() => { reset(); }}>
              Trocar pasta
            </Button>
          )}
          <Button
            onClick={handleUploadAll}
            disabled={files.length === 0 || uploading || pendingCount === 0}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando {doneCount + errorCount + 1}/{files.length}...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar {pendingCount} arquivo{pendingCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
