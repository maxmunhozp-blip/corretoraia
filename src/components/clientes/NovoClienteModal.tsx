import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperadoras, useProfiles } from "@/hooks/usePropostas";
import { useCreateCliente } from "@/hooks/useClientes";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialForm = {
  nome: "", tipo: "PF", empresa: "", email: "", telefone: "",
  operadora_id: "", vidas: "", valor_mensalidade: "", responsavel_id: "",
  status: "ativo", observacoes: "",
};

export function NovoClienteModal({ open, onOpenChange }: Props) {
  const [form, setForm] = useState(initialForm);
  const { data: operadoras } = useOperadoras();
  const { data: profiles } = useProfiles();
  const createCliente = useCreateCliente();

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      await createCliente.mutateAsync({
        nome: form.nome,
        tipo: form.tipo || undefined,
        empresa: form.tipo === "PJ" ? form.empresa || undefined : undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        operadora_id: form.operadora_id || undefined,
        vidas: parseInt(form.vidas) || 1,
        valor_mensalidade: parseFloat(form.valor_mensalidade) || undefined,
        responsavel_id: form.responsavel_id || undefined,
        status: form.status,
        observacoes: form.observacoes || undefined,
      });
      toast.success("Cliente cadastrado com sucesso!");
      onOpenChange(false);
      setForm(initialForm);
    } catch {
      toast.error("Erro ao cadastrar cliente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome completo *</Label>
            <Input placeholder="Ex: João da Silva" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.tipo === "PJ" && (
            <div className="grid gap-1.5">
              <Label>Empresa</Label>
              <Input placeholder="Ex: Empresa ABC Ltda" value={form.empresa} onChange={(e) => set("empresa", e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Operadora</Label>
              <Select value={form.operadora_id} onValueChange={(v) => set("operadora_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(operadoras || []).map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Nº de vidas</Label>
              <Input type="number" placeholder="1" value={form.vidas} onChange={(e) => set("vidas", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Valor mensalidade</Label>
              <Input placeholder="R$ 0,00" value={form.valor_mensalidade} onChange={(e) => set("valor_mensalidade", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Responsável</Label>
              <Select value={form.responsavel_id} onValueChange={(v) => set("responsavel_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(profiles || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Textarea placeholder="Informações adicionais..." rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); setForm(initialForm); }}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createCliente.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover">
            {createCliente.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
