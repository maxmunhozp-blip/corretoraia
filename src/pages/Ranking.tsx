import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { Trophy, TrendingUp, TrendingDown, Users, Monitor, Pencil, Plus, X, Save } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { toast } from "sonner";

interface RankingEntry {
  vendedorId: string;
  nome: string;
  vendas: number;
  receitaGerada: number;
  conversao: number;
  propostasAtivas: number;
  pos: number;
}

interface VendedorTV {
  id: string;
  nome: string;
  cargo: string;
  avatar_iniciais: string | null;
  vendas: number;
  receita_gerada: number;
  conversao: number;
  propostas_ativas: number;
  meta_mensal: number;
  ativo: boolean;
}

function useRanking(periodo: string) {
  return useQuery({
    queryKey: ["ranking", periodo],
    queryFn: async () => {
      const now = new Date();
      let desde: Date;
      if (periodo === "trimestre") desde = startOfQuarter(now);
      else if (periodo === "ano") desde = startOfYear(now);
      else desde = startOfMonth(now);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("ativo", true);

      const { data: propostas } = await supabase
        .from("propostas")
        .select("responsavel_id, status, valor_estimado, created_at")
        .gte("created_at", desde.toISOString());

      if (!profiles || !propostas) return [];

      const ranking: RankingEntry[] = profiles.map((p) => {
        const mine = propostas.filter((pr) => pr.responsavel_id === p.id);
        const aprovadas = mine.filter((pr) => pr.status === "aprovada");
        const ativas = mine.filter((pr) => !["cancelada", "aprovada"].includes(pr.status));
        const receita = aprovadas.reduce((sum, pr) => sum + (Number(pr.valor_estimado) || 0), 0);
        const conversao = mine.length > 0 ? Math.round((aprovadas.length / mine.length) * 100) : 0;

        return {
          vendedorId: p.id,
          nome: p.nome,
          vendas: aprovadas.length,
          receitaGerada: receita,
          conversao,
          propostasAtivas: ativas.length,
          pos: 0,
        };
      });

      ranking.sort((a, b) => b.vendas - a.vendas || b.receitaGerada - a.receitaGerada);
      ranking.forEach((r, i) => { r.pos = i + 1; });
      return ranking;
    },
  });
}

function useVendedoresTV() {
  return useQuery({
    queryKey: ["ranking-vendedores-tv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranking_vendedores" as any)
        .select("*")
        .order("vendas", { ascending: false });
      if (error) throw error;
      return data as unknown as VendedorTV[];
    },
  });
}

function TopCard({ v, index }: { v: RankingEntry; index: number }) {
  const vendasAnim = useCountUp(v.vendas, 1000, index * 100);
  const receitaAnim = useCountUp(v.receitaGerada, 1200, index * 100);
  const convAnim = useCountUp(v.conversao, 1000, index * 100);
  const isFirst = v.pos === 1;

  return (
    <div
      className={`rounded-lg border bg-card p-5 flex flex-col gap-3 opacity-0 ${isFirst ? "border-brand" : "border-border"}`}
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground">{v.pos}º</span>
          <p className="text-sm font-semibold text-foreground">{v.nome}</p>
        </div>
        {isFirst && (
          <div className="h-9 w-9 rounded-md bg-brand-light flex items-center justify-center">
            <Trophy className="h-4 w-4 text-brand" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div>
          <p className="text-xs text-muted-foreground">Vendas</p>
          <p className="text-lg font-bold text-foreground">{vendasAnim}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-bold text-foreground">R$ {receitaAnim.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conversão</p>
          <p className="text-lg font-bold text-foreground">{convAnim}%</p>
        </div>
      </div>
    </div>
  );
}

const emptyForm = { nome: "", cargo: "Corretor", vendas: "", receita_gerada: "", conversao: "", propostas_ativas: "", meta_mensal: "", avatar_iniciais: "" };

export default function Ranking() {
  const [periodo, setPeriodo] = useState("mes");
  const { data: ranking, isLoading } = useRanking(periodo);
  const { data: vendedoresTV, isLoading: loadingTV } = useVendedoresTV();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload: any = {
        nome: data.nome.trim(),
        cargo: data.cargo.trim() || "Corretor",
        vendas: parseInt(data.vendas) || 0,
        receita_gerada: parseFloat(data.receita_gerada) || 0,
        conversao: parseInt(data.conversao) || 0,
        propostas_ativas: parseInt(data.propostas_ativas) || 0,
        meta_mensal: parseFloat(data.meta_mensal) || 0,
        avatar_iniciais: data.avatar_iniciais.trim() || data.nome.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      };

      if (data.id) {
        const { error } = await supabase.from("ranking_vendedores" as any).update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ranking_vendedores" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking-vendedores-tv"] });
      toast.success(editingId ? "Vendedor atualizado!" : "Vendedor adicionado!");
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar vendedor"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ranking_vendedores" as any).update({ ativo: false } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking-vendedores-tv"] });
      toast.success("Vendedor desativado");
    },
  });

  const openEdit = (v: VendedorTV) => {
    setEditingId(v.id);
    setForm({
      nome: v.nome,
      cargo: v.cargo,
      vendas: String(v.vendas),
      receita_gerada: String(v.receita_gerada),
      conversao: String(v.conversao),
      propostas_ativas: String(v.propostas_ativas),
      meta_mensal: String(v.meta_mensal),
      avatar_iniciais: v.avatar_iniciais || "",
    });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const pctMeta = (v: VendedorTV) => v.meta_mensal > 0 ? Math.round((v.receita_gerada / v.meta_mensal) * 100) : 0;

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ranking de Vendedores</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/ranking/tv")}
            className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-light px-3 py-2 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
          >
            <Monitor className="h-4 w-4" />
            Modo TV
          </button>
        </div>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList className="mb-4">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar Vendedores (TV)</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <div className="flex justify-end mb-4">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Este mês</SelectItem>
                <SelectItem value="trimestre">Este trimestre</SelectItem>
                <SelectItem value="ano">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : ranking && ranking.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {ranking.slice(0, 3).map((v, i) => (
                  <TopCard key={v.vendedorId} v={v} index={i} />
                ))}
              </div>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface hover:bg-surface">
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Vendas</TableHead>
                      <TableHead>Receita gerada</TableHead>
                      <TableHead>Conversão</TableHead>
                      <TableHead>Propostas ativas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((v, i) => (
                      <TableRow
                        key={v.vendedorId}
                        className="hover:bg-surface transition-colors duration-150 opacity-0"
                        style={{ animation: `staggerIn 0.35s ease-out ${(i + 3) * 60}ms forwards` }}
                      >
                        <TableCell className="font-semibold text-foreground">{v.pos}º</TableCell>
                        <TableCell className="font-medium text-foreground">{v.nome}</TableCell>
                        <TableCell>{v.vendas}</TableCell>
                        <TableCell>R$ {v.receitaGerada.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{v.conversao}%</TableCell>
                        <TableCell>{v.propostasAtivas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 text-border" />
              <p className="text-sm">Nenhum vendedor com dados no período</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gerenciar">
          <div className="flex justify-end mb-4">
            <Button onClick={openNew} className="bg-brand text-brand-foreground hover:bg-brand-hover">
              <Plus className="h-4 w-4 mr-2" /> Novo Vendedor
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-center">Conversão</TableHead>
                  <TableHead className="text-right">Meta Mensal</TableHead>
                  <TableHead className="text-center">% Meta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTV ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : vendedoresTV && vendedoresTV.length > 0 ? (
                  vendedoresTV.map((v, i) => {
                    const pct = pctMeta(v);
                    return (
                      <TableRow
                        key={v.id}
                        className="hover:bg-surface transition-colors opacity-0"
                        style={{ animation: `staggerIn 0.35s ease-out ${i * 60}ms forwards` }}
                      >
                        <TableCell className="font-medium text-foreground">{v.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{v.cargo}</TableCell>
                        <TableCell className="text-center font-semibold">{v.vendas}</TableCell>
                        <TableCell className="text-right">R$ {Number(v.receita_gerada).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-center">{v.conversao}%</TableCell>
                        <TableCell className="text-right">R$ {Number(v.meta_mensal).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            pct >= 100 ? "border-green-500 text-green-600" : pct >= 70 ? "border-yellow-500 text-yellow-600" : "border-red-400 text-red-500"
                          }`}>
                            {pct}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(v)} className="p-1.5 rounded-md hover:bg-surface transition-colors" title="Editar">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(v.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Desativar">
                              <X className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p className="text-sm">Nenhum vendedor cadastrado para o Modo TV.</p>
                        <p className="text-xs">Adicione vendedores para exibir no ranking da TV.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de edição */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Vendedor" : "Novo Vendedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Nome *</Label>
                <Input placeholder="Ex: João Silva" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} />
              </div>
              <div className="grid gap-1.5">
                <Label>Cargo</Label>
                <Input placeholder="Ex: Corretor" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} maxLength={50} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Vendas</Label>
                <Input type="number" min="0" placeholder="0" value={form.vendas} onChange={(e) => setForm({ ...form, vendas: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Receita Gerada (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0" value={form.receita_gerada} onChange={(e) => setForm({ ...form, receita_gerada: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Conversão (%)</Label>
                <Input type="number" min="0" max="100" placeholder="0" value={form.conversao} onChange={(e) => setForm({ ...form, conversao: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Propostas Ativas</Label>
                <Input type="number" min="0" placeholder="0" value={form.propostas_ativas} onChange={(e) => setForm({ ...form, propostas_ativas: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Meta Mensal (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0" value={form.meta_mensal} onChange={(e) => setForm({ ...form, meta_mensal: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Iniciais</Label>
                <Input placeholder="Ex: JS" value={form.avatar_iniciais} onChange={(e) => setForm({ ...form, avatar_iniciais: e.target.value.toUpperCase() })} maxLength={3} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-brand text-brand-foreground hover:bg-brand-hover">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
