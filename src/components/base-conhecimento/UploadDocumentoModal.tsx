import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import { useOperadoras } from "@/hooks/usePropostas";
import { useCreateDocumento, useUploadDocumento } from "@/hooks/useDocumentos";
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

const acceptedTypes = ".pdf,.docx,.xlsx,.png,.jpg,.jpeg";

export function UploadDocumentoModal({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [operadoraId, setOperadoraId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: operadoras } = useOperadoras();
  const createDoc = useCreateDocumento();
  const uploadFile = useUploadDocumento();

  const getFileType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
    if (ext === "xlsx") return "xlsx";
    if (["png", "jpg", "jpeg"].includes(ext || "")) return "imagem";
    return "outro";
  };

  const handleFile = (f: File) => {
    setFile(f);
    if (!titulo) setTitulo(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [titulo]);

  const reset = () => {
    setFile(null); setTitulo(""); setOperadoraId(""); setCategoria(""); setDescricao(""); setProgress(0);
  };

  const handleSave = async () => {
    if (!file || !titulo.trim()) {
      toast.error("Selecione um arquivo e preencha o título");
      return;
    }
    setUploading(true);
    setProgress(20);

    try {
      const path = `${Date.now()}_${file.name}`;
      setProgress(50);
      const publicUrl = await uploadFile.mutateAsync({ file, path });
      setProgress(80);

      await createDoc.mutateAsync({
        titulo,
        categoria: categoria || "outro",
        operadora_id: operadoraId || undefined,
        descricao: descricao || undefined,
        tipo_arquivo: getFileType(file.name),
        arquivo_path: publicUrl,
        status: "processando",
      });

      setProgress(100);
      toast.success("Documento enviado — a Miranda está processando o conteúdo");

      // Simulate processing completion after 3s
      setTimeout(async () => {
        // We won't update here since we'd need the doc id
      }, 3000);

      onOpenChange(false);
      reset();
    } catch {
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Upload de documento</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-brand bg-brand-light" : "border-border hover:border-muted-foreground"
              }`}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, PNG, JPG</p>
              <input
                id="file-input"
                type="file"
                accept={acceptedTypes}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-md border border-border p-3 bg-surface">
                <Upload className="h-5 w-5 text-brand shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setTitulo(""); }}>Trocar</Button>
              </div>

              <div className="grid gap-1.5">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Operadora</Label>
                  <Select value={operadoraId} onValueChange={setOperadoraId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(operadoras || []).map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Descrição (opcional)</Label>
                <Textarea placeholder="Descreva o conteúdo..." rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>

              {uploading && <Progress value={progress} className="h-2 [&>div]:bg-brand" />}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); reset(); }}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!file || uploading} className="bg-brand text-brand-foreground hover:bg-brand-hover">
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
