import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Plus, Pencil, Trash2, Save, X, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Memoria {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface Skill {
  id: string;
  nome: string;
  descricao: string | null;
  conteudo_md: string;
  versao: number;
  ativo: boolean;
  criado_em: string;
}

const TIPO_OPTIONS = [
  { value: "regra", label: "Regra" },
  { value: "contexto", label: "Contexto" },
  { value: "instrucao", label: "Instrução" },
  { value: "personalidade", label: "Personalidade" },
  { value: "outro", label: "Outro" },
];

export default function MirandaConfiguracoes() {
  return (
    <PageWrapper title="Miranda — Configurações">
      <Tabs defaultValue="memorias" className="space-y-4">
        <TabsList className="bg-surface">
          <TabsTrigger value="memorias" className="gap-2">
            <Brain className="h-4 w-4" />
            Memórias
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-2">
            <Zap className="h-4 w-4" />
            Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memorias">
          <MemoriasTab />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

/* ═══════════════════════════════════════════════ */
/*  MEMÓRIAS TAB                                   */
/* ═══════════════════════════════════════════════ */
function MemoriasTab() {
  const { profile } = useAuth();
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ tipo: "regra", titulo: "", conteudo: "" });

  const corretora_id = profile?.corretora_id;

  const fetchMemorias = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("miranda_memoria")
      .select("*")
      .order("atualizado_em", { ascending: false });
    if (data) setMemorias(data as Memoria[]);
    setLoading(false);
  };

  useEffect(() => { fetchMemorias(); }, []);

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("miranda_memoria")
        .update({ tipo: form.tipo, titulo: form.titulo, conteudo: form.conteudo, atualizado_em: new Date().toISOString() })
        .eq("id", editing);
      if (error) { toast.error(error.message); return; }
      toast.success("Memória atualizada");
    } else {
      const { error } = await supabase
        .from("miranda_memoria")
        .insert({ tipo: form.tipo, titulo: form.titulo, conteudo: form.conteudo, corretora_id });
      if (error) { toast.error(error.message); return; }
      toast.success("Memória criada");
    }

    setEditing(null);
    setCreating(false);
    setForm({ tipo: "regra", titulo: "", conteudo: "" });
    fetchMemorias();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta memória?")) return;
    await supabase.from("miranda_memoria").delete().eq("id", id);
    toast.success("Memória excluída");
    fetchMemorias();
  };

  const handleToggle = async (mem: Memoria) => {
    await supabase.from("miranda_memoria").update({ ativo: !mem.ativo, atualizado_em: new Date().toISOString() }).eq("id", mem.id);
    fetchMemorias();
  };

  const startEdit = (mem: Memoria) => {
    setEditing(mem.id);
    setCreating(false);
    setForm({ tipo: mem.tipo, titulo: mem.titulo, conteudo: mem.conteudo });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ tipo: "regra", titulo: "", conteudo: "" });
  };

  const cancel = () => { setEditing(null); setCreating(false); setForm({ tipo: "regra", titulo: "", conteudo: "" }); };

  const filtered = memorias.filter(m =>
    m.titulo.toLowerCase().includes(search.toLowerCase()) ||
    m.conteudo.toLowerCase().includes(search.toLowerCase()) ||
    m.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar memórias..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" /> Nova memória
        </button>
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="rounded-xl border border-brand/20 bg-card p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar memória" : "Nova memória"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              >
                {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Regra de carência Amil"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conteúdo</label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={5}
              placeholder="Conteúdo da memória que a Miranda usará como contexto..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancel} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-surface transition-colors">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12">
          {search ? "Nenhuma memória encontrada" : "Nenhuma memória cadastrada. Crie a primeira!"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mem) => (
            <div
              key={mem.id}
              className={`rounded-xl border bg-card p-4 transition-all ${mem.ativo ? "border-border" : "border-border/50 opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      mem.tipo === "regra" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      mem.tipo === "contexto" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      mem.tipo === "instrucao" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                      mem.tipo === "personalidade" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {mem.tipo}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground truncate">{mem.titulo}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{mem.conteudo}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(mem)} className="p-1.5 rounded-md hover:bg-surface transition-colors" title={mem.ativo ? "Desativar" : "Ativar"}>
                    {mem.ativo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => startEdit(mem)} className="p-1.5 rounded-md hover:bg-surface transition-colors" title="Editar">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(mem.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  SKILLS TAB                                     */
/* ═══════════════════════════════════════════════ */
function SkillsTab() {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", descricao: "", conteudo_md: "" });

  const corretora_id = profile?.corretora_id;

  const fetchSkills = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("miranda_skills")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setSkills(data as Skill[]);
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleSave = async () => {
    if (!form.nome.trim() || !form.conteudo_md.trim()) {
      toast.error("Nome e conteúdo são obrigatórios");
      return;
    }

    if (editing) {
      const skill = skills.find(s => s.id === editing);
      const { error } = await supabase
        .from("miranda_skills")
        .update({ nome: form.nome, descricao: form.descricao || null, conteudo_md: form.conteudo_md, versao: (skill?.versao || 1) + 1 })
        .eq("id", editing);
      if (error) { toast.error(error.message); return; }
      toast.success("Skill atualizada");
    } else {
      const { error } = await supabase
        .from("miranda_skills")
        .insert({ nome: form.nome, descricao: form.descricao || null, conteudo_md: form.conteudo_md, corretora_id });
      if (error) { toast.error(error.message); return; }
      toast.success("Skill criada");
    }

    setEditing(null);
    setCreating(false);
    setForm({ nome: "", descricao: "", conteudo_md: "" });
    fetchSkills();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta skill?")) return;
    await supabase.from("miranda_skills").delete().eq("id", id);
    toast.success("Skill excluída");
    fetchSkills();
  };

  const handleToggle = async (skill: Skill) => {
    await supabase.from("miranda_skills").update({ ativo: !skill.ativo }).eq("id", skill.id);
    fetchSkills();
  };

  const startEdit = (skill: Skill) => {
    setEditing(skill.id);
    setCreating(false);
    setForm({ nome: skill.nome, descricao: skill.descricao || "", conteudo_md: skill.conteudo_md });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ nome: "", descricao: "", conteudo_md: "" });
  };

  const cancel = () => { setEditing(null); setCreating(false); setForm({ nome: "", descricao: "", conteudo_md: "" }); };

  const filtered = skills.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    (s.descricao || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar skills..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" /> Nova skill
        </button>
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="rounded-xl border border-brand/20 bg-card p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Editar skill" : "Nova skill"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Gerar proposta personalizada"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
              <input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Breve descrição da skill"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conteúdo (Markdown)</label>
            <textarea
              value={form.conteudo_md}
              onChange={(e) => setForm({ ...form, conteudo_md: e.target.value })}
              rows={8}
              placeholder="Instruções em Markdown que definem como a Miranda deve executar esta skill..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-brand/20 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancel} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-surface transition-colors">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors">
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12">
          {search ? "Nenhuma skill encontrada" : "Nenhuma skill cadastrada. Crie a primeira!"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((skill) => (
            <div
              key={skill.id}
              className={`rounded-xl border bg-card p-4 transition-all ${skill.ativo ? "border-border" : "border-border/50 opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-brand shrink-0" />
                    <h4 className="text-sm font-semibold text-foreground truncate">{skill.nome}</h4>
                    <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">v{skill.versao}</span>
                  </div>
                  {skill.descricao && (
                    <p className="text-xs text-muted-foreground mb-1">{skill.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 line-clamp-2 font-mono">{skill.conteudo_md.slice(0, 150)}{skill.conteudo_md.length > 150 ? "..." : ""}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(skill)} className="p-1.5 rounded-md hover:bg-surface transition-colors" title={skill.ativo ? "Desativar" : "Ativar"}>
                    {skill.ativo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => startEdit(skill)} className="p-1.5 rounded-md hover:bg-surface transition-colors" title="Editar">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(skill.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
