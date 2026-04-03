import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useOperadoras } from "@/hooks/usePropostas";
import { useCreateDocumento } from "@/hooks/useDocumentos";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const exemplos = [
  "Regras PME SulAmérica 2024",
  "Carência Amil individual",
  "Rede credenciada Bradesco São Paulo",
  "Tabela Unimed empresarial",
];

const categorias = [
  { value: "regras_comerciais", label: "Regras Comerciais" },
  { value: "tabela_preco", label: "Tabela de Preço" },
  { value: "rede_credenciada", label: "Rede Credenciada" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

export function BuscarInternetModal({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [operadoraId, setOperadoraId] = useState("");
  const [categoria, setCategoria] = useState("");

  const { data: operadoras } = useOperadoras();
  const createDoc = useCreateDocumento();

  const reset = () => { setQuery(""); setOperadoraId(""); setCategoria(""); };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Digite o que deseja pesquisar");
      return;
    }
    try {
      await createDoc.mutateAsync({
        titulo: query.trim(),
        categoria: categoria || "outro",
        operadora_id: operadoraId || undefined,
        tipo_arquivo: "web",
        fonte_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        status: "processando",
      });
      toast.success("Pesquisa iniciada — a Miranda está buscando o conteúdo");
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Erro ao iniciar pesquisa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-brand" /> Buscar na internet</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>O que você quer pesquisar?</Label>
            <Textarea
              placeholder="Ex: Regras de carência para plano empresarial Amil..."
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {exemplos.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Operadora (opcional)</Label>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); reset(); }}>Cancelar</Button>
          <Button onClick={handleSearch} disabled={createDoc.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover">
            {createDoc.isPending ? "Pesquisando..." : "Pesquisar e indexar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
