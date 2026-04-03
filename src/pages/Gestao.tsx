import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutivos, useCreateExecutivo, useUpdateExecutivo, useDeleteExecutivo, useGestaoStats } from "@/hooks/useGestao";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserPlus, Search, Building2, Users, TrendingUp, DollarSign,
  Mail, Phone, Linkedin, Edit2, Trash2, MoreVertical, Briefcase,
  Crown, UserCheck, BarChart3
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function StatCard({ title, value, icon: Icon, index }: { title: string; value: string | number; icon: any; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="h-11 w-11 rounded-lg bg-brand-light flex items-center justify-center">
        <Icon className="h-5 w-5 text-brand" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ExecutivoCard({ exec, onEdit, onDelete, isAdmin }: { exec: any; onEdit: () => void; onDelete: () => void; isAdmin: boolean }) {
  const initials = exec.nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-lg border border-border bg-card p-5 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-sm">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{exec.nome}</h3>
            <p className="text-sm text-muted-foreground">{exec.cargo}</p>
          </div>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit2 className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Remover</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {exec.empresa && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Building2 className="h-3.5 w-3.5" /> {exec.empresa}
        </div>
      )}
      {exec.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Mail className="h-3.5 w-3.5" /> {exec.email}
        </div>
      )}
      {exec.telefone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Phone className="h-3.5 w-3.5" /> {exec.telefone}
        </div>
      )}
      {exec.linkedin && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Linkedin className="h-3.5 w-3.5" />
          <a href={exec.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">
            LinkedIn
          </a>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Badge variant={exec.tipo === "interno" ? "default" : "secondary"}>
          {exec.tipo === "interno" ? "Interno" : "Externo"}
        </Badge>
        {!exec.ativo && <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}
      </div>
      {exec.observacoes && (
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{exec.observacoes}</p>
      )}
    </div>
  );
}

const emptyForm = { nome: "", cargo: "CEO", empresa: "", email: "", telefone: "", linkedin: "", observacoes: "", tipo: "externo" };

export default function Gestao() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: executivos, isLoading } = useExecutivos(search, tipoFilter);
  const { data: stats, isLoading: statsLoading } = useGestaoStats();
  const createExec = useCreateExecutivo();
  const updateExec = useUpdateExecutivo();
  const deleteExec = useDeleteExecutivo();

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (exec: any) => {
    setForm({ nome: exec.nome, cargo: exec.cargo, empresa: exec.empresa ?? "", email: exec.email ?? "", telefone: exec.telefone ?? "", linkedin: exec.linkedin ?? "", observacoes: exec.observacoes ?? "", tipo: exec.tipo });
    setEditingId(exec.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    if (editingId) {
      await updateExec.mutateAsync({ id: editingId, ...form });
    } else {
      await createExec.mutateAsync(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este executivo?")) {
      await deleteExec.mutateAsync(id);
    }
  };

  return (
    <PageWrapper title="Gestão">
      <Tabs defaultValue="executivos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executivos" className="gap-2"><Crown className="h-4 w-4" />CEOs e Executivos</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2"><Users className="h-4 w-4" />Equipe Interna</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Dashboard Executivo</TabsTrigger>
        </TabsList>

        {/* === CEOs e Executivos === */}
        <TabsContent value="executivos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar executivo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="interno">Internos</SelectItem>
                  <SelectItem value="externo">Externos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNew} className="bg-brand hover:bg-brand/90 text-white gap-2">
              <UserPlus className="h-4 w-4" />Novo Executivo
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                  <Skeleton className="h-3 w-40 mb-1" /><Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : !executivos?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Crown className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum executivo cadastrado</p>
              <p className="text-sm text-muted-foreground/70">Cadastre CEOs e diretores para gerenciá-los</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {executivos.map(exec => (
                <ExecutivoCard key={exec.id} exec={exec} onEdit={() => openEdit(exec)} onDelete={() => handleDelete(exec.id)} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* === Equipe Interna === */}
        <TabsContent value="equipe" className="space-y-4">
          <EquipeTab />
        </TabsContent>

        {/* === Dashboard Executivo === */}
        <TabsContent value="dashboard" className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Executivos" value={stats.totalExecs} icon={Crown} index={0} />
              <StatCard title="Executivos Internos" value={stats.execInternos} icon={UserCheck} index={1} />
              <StatCard title="Executivos Externos" value={stats.execExternos} icon={Briefcase} index={2} />
              <StatCard title="Clientes Ativos" value={stats.clientesAtivos} icon={Users} index={3} />
              <StatCard title="Receita Aprovada" value={`R$ ${stats.receitaTotal.toLocaleString("pt-BR")}`} icon={DollarSign} index={4} />
              <StatCard title="Equipe Ativa" value={stats.equipeAtiva} icon={TrendingUp} index={5} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Novo/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Executivo" : "Novo Executivo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
            </div>
            <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} /></div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || createExec.isPending || updateExec.isPending} className="bg-brand hover:bg-brand/90 text-white">
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function EquipeTab() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["equipe-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
    );
  }

  if (!profiles?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Nenhum membro da equipe</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((p, i) => {
        const initials = p.avatar_iniciais ?? p.nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={p.id} className="rounded-lg border border-border bg-card p-5 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-11 w-11 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{p.nome}</h3>
              <p className="text-sm text-muted-foreground">{p.cargo ?? "Sem cargo"}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={p.role === "admin" ? "default" : "secondary"}>{p.role}</Badge>
                {!p.ativo && <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Need these imports for EquipeTab
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
