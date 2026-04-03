import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Palette,
  Globe,
  Settings,
  Shield,
  Save,
  Loader2,
  Building2,
  Mail,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
} from "lucide-react";

/* ─── Types ─── */
interface Corretora {
  id: string;
  nome: string;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  dominio_customizado: string | null;
  email_remetente: string | null;
  logo_url: string | null;
  plano: string | null;
  status: string | null;
}

interface ConfigGlobal {
  id: string;
  chave: string;
  valor: string | null;
  categoria: string;
  descricao: string | null;
}

interface Template {
  id: string;
  tipo: string;
  nome: string;
  assunto: string | null;
  conteudo: string;
  variaveis: string[];
  categoria: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_VARIAVEIS = [
  { key: "{{cliente_nome}}", label: "Nome do cliente" },
  { key: "{{empresa}}", label: "Empresa" },
  { key: "{{corretora_nome}}", label: "Nome da corretora" },
  { key: "{{corretor_nome}}", label: "Nome do corretor" },
  { key: "{{plano_nome}}", label: "Nome do plano" },
  { key: "{{valor}}", label: "Valor" },
  { key: "{{vidas}}", label: "Nº de vidas" },
  { key: "{{vigencia}}", label: "Vigência" },
  { key: "{{link_proposta}}", label: "Link da proposta" },
  { key: "{{data_atual}}", label: "Data atual" },
];

const TEMPLATE_CATEGORIAS_EMAIL = ["boas_vindas", "proposta_enviada", "proposta_aceita", "lembrete", "aniversario", "geral"];
const TEMPLATE_CATEGORIAS_PROPOSTA = ["capa", "resumo_executivo", "comparativo", "quem_somos", "termos", "geral"];

const emptyTemplate: Omit<Template, "id" | "created_at" | "updated_at"> = {
  tipo: "email",
  nome: "",
  assunto: "",
  conteudo: "",
  variaveis: [],
  categoria: "geral",
  ativo: true,
};

/* ─── Component ─── */
export default function MasterConfiguracoes() {
  const [corretoras, setCorretoras] = useState<Corretora[]>([]);
  const [selectedCorretora, setSelectedCorretora] = useState<string>("");
  const [whiteLabel, setWhiteLabel] = useState({
    cor_primaria: "#955251",
    cor_secundaria: "#7a3f3e",
    dominio_customizado: "",
    email_remetente: "",
  });
  const [configs, setConfigs] = useState<ConfigGlobal[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCorretoras, setLoadingCorretoras] = useState(true);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateFilter, setTemplateFilter] = useState<"todos" | "email" | "proposta">("todos");
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  /* ─── Fetch corretoras ─── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("corretoras")
        .select("id, nome, cor_primaria, cor_secundaria, dominio_customizado, email_remetente, logo_url, plano, status")
        .order("nome");
      if (data) setCorretoras(data as unknown as Corretora[]);
      setLoadingCorretoras(false);
    })();
  }, []);

  /* ─── Fetch global configs ─── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("configuracoes_globais")
        .select("*")
        .order("categoria");
      if (data) setConfigs(data as unknown as ConfigGlobal[]);
      setLoadingConfigs(false);
    })();
  }, []);

  /* ─── Fetch templates ─── */
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const { data } = await supabase
      .from("templates")
      .select("*")
      .order("tipo")
      .order("categoria")
      .order("nome");
    if (data) setTemplates(data as unknown as Template[]);
    setLoadingTemplates(false);
  };

  /* ─── Select corretora → fill form ─── */
  useEffect(() => {
    const c = corretoras.find((c) => c.id === selectedCorretora);
    if (c) {
      setWhiteLabel({
        cor_primaria: c.cor_primaria || "#955251",
        cor_secundaria: c.cor_secundaria || "#7a3f3e",
        dominio_customizado: c.dominio_customizado || "",
        email_remetente: c.email_remetente || "",
      });
    }
  }, [selectedCorretora, corretoras]);

  /* ─── Save white-label ─── */
  const saveWhiteLabel = async () => {
    if (!selectedCorretora) return;
    setSaving(true);
    const { error } = await supabase
      .from("corretoras")
      .update({
        cor_primaria: whiteLabel.cor_primaria,
        cor_secundaria: whiteLabel.cor_secundaria,
        dominio_customizado: whiteLabel.dominio_customizado || null,
        email_remetente: whiteLabel.email_remetente || null,
      })
      .eq("id", selectedCorretora);
    setSaving(false);
    if (error) toast.error("Erro ao salvar personalizações");
    else {
      toast.success("Personalizações salvas com sucesso");
      setCorretoras((prev) =>
        prev.map((c) =>
          c.id === selectedCorretora ? { ...c, ...whiteLabel } : c
        )
      );
    }
  };

  /* ─── Update single global config ─── */
  const updateConfig = async (chave: string, valor: string) => {
    const { error } = await supabase
      .from("configuracoes_globais")
      .update({ valor, updated_at: new Date().toISOString() })
      .eq("chave", chave);
    if (error) toast.error("Erro ao salvar configuração");
    else {
      toast.success("Configuração atualizada");
      setConfigs((prev) =>
        prev.map((c) => (c.chave === chave ? { ...c, valor } : c))
      );
    }
  };

  const getConfigValue = (chave: string) =>
    configs.find((c) => c.chave === chave)?.valor ?? "";

  /* ─── Template CRUD ─── */
  const openNewTemplate = (tipo: string = "email") => {
    setEditingTemplate({ ...emptyTemplate, tipo });
    setTemplateModal(true);
  };

  const openEditTemplate = (t: Template) => {
    setEditingTemplate({ ...t });
    setTemplateModal(true);
  };

  const saveTemplate = async () => {
    if (!editingTemplate?.nome || !editingTemplate.conteudo) {
      toast.error("Nome e conteúdo são obrigatórios");
      return;
    }
    setSavingTemplate(true);

    const payload = {
      tipo: editingTemplate.tipo || "email",
      nome: editingTemplate.nome,
      assunto: editingTemplate.assunto || null,
      conteudo: editingTemplate.conteudo,
      variaveis: editingTemplate.variaveis || [],
      categoria: editingTemplate.categoria || "geral",
      ativo: editingTemplate.ativo ?? true,
    };

    let error;
    if (editingTemplate.id) {
      ({ error } = await supabase.from("templates").update(payload).eq("id", editingTemplate.id));
    } else {
      ({ error } = await supabase.from("templates").insert(payload));
    }

    setSavingTemplate(false);
    if (error) {
      toast.error("Erro ao salvar template");
    } else {
      toast.success(editingTemplate.id ? "Template atualizado" : "Template criado");
      setTemplateModal(false);
      setEditingTemplate(null);
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir template");
    else {
      toast.success("Template excluído");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const duplicateTemplate = async (t: Template) => {
    const payload = {
      tipo: t.tipo,
      nome: `${t.nome} (cópia)`,
      assunto: t.assunto,
      conteudo: t.conteudo,
      variaveis: t.variaveis,
      categoria: t.categoria,
      ativo: false,
    };
    const { error } = await supabase.from("templates").insert(payload);
    if (error) toast.error("Erro ao duplicar");
    else {
      toast.success("Template duplicado");
      fetchTemplates();
    }
  };

  const previewTemplate = (t: Template) => {
    let html = t.conteudo;
    const sampleData: Record<string, string> = {
      "{{cliente_nome}}": "João Silva",
      "{{empresa}}": "Empresa Exemplo LTDA",
      "{{corretora_nome}}": "Minha Corretora",
      "{{corretor_nome}}": "Maria Santos",
      "{{plano_nome}}": "Plano Premium",
      "{{valor}}": "R$ 1.500,00",
      "{{vidas}}": "50",
      "{{vigencia}}": "01/01/2027 a 31/12/2027",
      "{{link_proposta}}": "https://app.example.com/p/abc123",
      "{{data_atual}}": new Date().toLocaleDateString("pt-BR"),
    };
    Object.entries(sampleData).forEach(([key, val]) => {
      html = html.replaceAll(key, `<strong style="color:#955251">${val}</strong>`);
    });
    setPreviewContent(html);
    setPreviewModal(true);
  };

  const filteredTemplates = templates.filter(
    (t) => templateFilter === "todos" || t.tipo === templateFilter
  );

  const categorias = editingTemplate?.tipo === "proposta" ? TEMPLATE_CATEGORIAS_PROPOSTA : TEMPLATE_CATEGORIAS_EMAIL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações Master</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie personalizações, white-label, templates e configurações globais do sistema.
        </p>
      </div>

      <Tabs defaultValue="whitelabel" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="whitelabel" className="gap-2">
            <Palette className="h-4 w-4" />
            White-label
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="integrações" className="gap-2">
            <Globe className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* ───────── WHITE-LABEL ───────── */}
        <TabsContent value="whitelabel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand" />
                Personalização por Corretora
              </CardTitle>
              <CardDescription>
                Defina cores, domínio e email remetente para cada corretora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de corretora */}
              <div className="space-y-2">
                <Label>Selecionar Corretora</Label>
                {loadingCorretoras ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <Select value={selectedCorretora} onValueChange={setSelectedCorretora}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma corretora" />
                    </SelectTrigger>
                    <SelectContent>
                      {corretoras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.nome}
                            <Badge variant="outline" className="text-[10px]">
                              {c.plano ?? "starter"}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedCorretora && (
                <>
                  {/* Cores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={whiteLabel.cor_primaria}
                          onChange={(e) =>
                            setWhiteLabel({ ...whiteLabel, cor_primaria: e.target.value })
                          }
                          className="h-10 w-14 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={whiteLabel.cor_primaria}
                          onChange={(e) =>
                            setWhiteLabel({ ...whiteLabel, cor_primaria: e.target.value })
                          }
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={whiteLabel.cor_secundaria}
                          onChange={(e) =>
                            setWhiteLabel({ ...whiteLabel, cor_secundaria: e.target.value })
                          }
                          className="h-10 w-14 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={whiteLabel.cor_secundaria}
                          onChange={(e) =>
                            setWhiteLabel({ ...whiteLabel, cor_secundaria: e.target.value })
                          }
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Preview</p>
                    <div className="flex gap-3 items-center">
                      <div
                        className="h-10 w-24 rounded-md flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: whiteLabel.cor_primaria }}
                      >
                        Botão
                      </div>
                      <div
                        className="h-10 w-24 rounded-md flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: whiteLabel.cor_secundaria }}
                      >
                        Secundário
                      </div>
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: whiteLabel.cor_primaria, opacity: 0.3 }} />
                    </div>
                  </div>

                  {/* Domínio */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Domínio Customizado
                    </Label>
                    <Input
                      placeholder="app.minhaCorretora.com.br"
                      value={whiteLabel.dominio_customizado}
                      onChange={(e) =>
                        setWhiteLabel({ ...whiteLabel, dominio_customizado: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      O domínio deve apontar para o IP do servidor via DNS (registro A).
                    </p>
                  </div>

                  {/* Email remetente */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Remetente
                    </Label>
                    <Input
                      type="email"
                      placeholder="contato@minhaCorretora.com.br"
                      value={whiteLabel.email_remetente}
                      onChange={(e) =>
                        setWhiteLabel({ ...whiteLabel, email_remetente: e.target.value })
                      }
                    />
                  </div>

                  <Button onClick={saveWhiteLabel} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand-hover">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Personalizações
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────── TEMPLATES ───────── */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand" />
                    Templates de Email e Proposta
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie modelos reutilizáveis para emails e seções de propostas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openNewTemplate("proposta")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Proposta
                  </Button>
                  <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand-hover" onClick={() => openNewTemplate("email")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter */}
              <div className="flex gap-2">
                {(["todos", "email", "proposta"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={templateFilter === f ? "default" : "outline"}
                    className={templateFilter === f ? "bg-brand text-brand-foreground hover:bg-brand-hover" : ""}
                    onClick={() => setTemplateFilter(f)}
                  >
                    {f === "todos" ? "Todos" : f === "email" ? "📧 Email" : "📄 Proposta"}
                  </Button>
                ))}
              </div>

              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum template encontrado</p>
                  <p className="text-xs mt-1">Crie o primeiro template clicando nos botões acima</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-border p-4 space-y-3 hover:border-brand/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{t.tipo === "email" ? "📧" : "📄"}</span>
                            <h4 className="font-medium text-sm">{t.nome}</h4>
                          </div>
                          {t.assunto && (
                            <p className="text-xs text-muted-foreground">Assunto: {t.assunto}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={t.ativo ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-muted-foreground"}
                          >
                            {t.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {t.categoria}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {t.conteudo.length} caracteres
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t.conteudo.replace(/[#*_[\]]/g, "").substring(0, 120)}...
                      </p>

                      <div className="flex gap-1 pt-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => previewTemplate(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditTemplate(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => duplicateTemplate(t)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir este template?")) deleteTemplate(t.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────── GLOBAL SYSTEM ───────── */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Controle global do comportamento da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingConfigs ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <>
                  {/* Modo manutenção */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-sm">Modo Manutenção</p>
                      <p className="text-xs text-muted-foreground">
                        Exibe tela de manutenção para todas as corretoras
                      </p>
                    </div>
                    <Switch
                      checked={getConfigValue("modo_manutencao") === "true"}
                      onCheckedChange={(v) => updateConfig("modo_manutencao", v ? "true" : "false")}
                    />
                  </div>

                  {/* Permitir cadastro */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-sm">Permitir Novos Cadastros</p>
                      <p className="text-xs text-muted-foreground">
                        Habilita a página de cadastro para novas corretoras
                      </p>
                    </div>
                    <Switch
                      checked={getConfigValue("permitir_cadastro") === "true"}
                      onCheckedChange={(v) => updateConfig("permitir_cadastro", v ? "true" : "false")}
                    />
                  </div>

                  {/* Banner global */}
                  <div className="space-y-2">
                    <Label>Banner Global</Label>
                    <Textarea
                      placeholder="Mensagem exibida para todos os usuários (deixe vazio para desativar)"
                      value={getConfigValue("banner_global")}
                      onChange={(e) =>
                        setConfigs((prev) =>
                          prev.map((c) =>
                            c.chave === "banner_global" ? { ...c, valor: e.target.value } : c
                          )
                        )
                      }
                      rows={3}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateConfig("banner_global", getConfigValue("banner_global"))}
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Salvar Banner
                    </Button>
                  </div>

                  {/* Max upload */}
                  <div className="space-y-2">
                    <Label>Tamanho Máximo de Upload (MB)</Label>
                    <Input
                      type="number"
                      value={getConfigValue("max_upload_mb")}
                      onChange={(e) =>
                        setConfigs((prev) =>
                          prev.map((c) =>
                            c.chave === "max_upload_mb" ? { ...c, valor: e.target.value } : c
                          )
                        )
                      }
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateConfig("max_upload_mb", getConfigValue("max_upload_mb"))}
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Salvar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────── INTEGRATIONS ───────── */}
        <TabsContent value="integrações" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações e API Keys</CardTitle>
              <CardDescription>Gerencie chaves de API e integrações de terceiros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">API de IA (Miranda)</p>
                  <p className="text-xs text-muted-foreground">Configurado via Lovable Cloud</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
              </div>
              <div className="rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Envio de Emails</p>
                  <p className="text-xs text-muted-foreground">SMTP ou serviço de email transacional</p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">Não configurado</Badge>
              </div>
              <div className="rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">WhatsApp API</p>
                  <p className="text-xs text-muted-foreground">Integração com API do WhatsApp Business</p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">Não configurado</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Para configurar novas integrações, entre em contato com o suporte técnico.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────── SECURITY ───────── */}
        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança e Acessos</CardTitle>
              <CardDescription>Configurações de segurança global da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-sm">Autenticação 2FA</p>
                  <p className="text-xs text-muted-foreground">
                    Exigir autenticação em dois fatores para administradores
                  </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">Em breve</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-sm">Log de Acessos</p>
                  <p className="text-xs text-muted-foreground">
                    Registrar todos os acessos e ações de administradores
                  </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">Em breve</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-sm">Política de Senhas</p>
                  <p className="text-xs text-muted-foreground">
                    Definir requisitos mínimos para senhas dos usuários
                  </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">Em breve</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ───────── TEMPLATE EDIT MODAL ───────── */}
      <Dialog open={templateModal} onOpenChange={setTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editingTemplate.tipo}
                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, tipo: v, categoria: "geral" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="proposta">📄 Proposta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editingTemplate.categoria || "geral"}
                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Template</Label>
                <Input
                  value={editingTemplate.nome || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, nome: e.target.value })}
                  placeholder="Ex: Email de boas-vindas ao cliente"
                />
              </div>

              {editingTemplate.tipo === "email" && (
                <div className="space-y-2">
                  <Label>Assunto do Email</Label>
                  <Input
                    value={editingTemplate.assunto || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, assunto: e.target.value })}
                    placeholder="Ex: Sua proposta de plano de saúde está pronta!"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Conteúdo (suporta Markdown)</Label>
                <Textarea
                  value={editingTemplate.conteudo || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, conteudo: e.target.value })}
                  placeholder="Escreva o conteúdo do template aqui..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* Variáveis disponíveis */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Variáveis disponíveis (clique para inserir)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIAVEIS.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded border border-border hover:bg-brand-light hover:border-brand/30 transition-colors font-mono"
                      title={v.label}
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          conteudo: (editingTemplate.conteudo || "") + v.key,
                        })
                      }
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={editingTemplate.ativo ?? true}
                  onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, ativo: v })}
                />
                <Label className="text-sm">Template ativo</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
              onClick={saveTemplate}
              disabled={savingTemplate}
            >
              {savingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────── PREVIEW MODAL ───────── */}
      <Dialog open={previewModal} onOpenChange={setPreviewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview do Template
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-border p-4 bg-surface">
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: previewContent.replace(/\n/g, "<br/>") }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            As variáveis estão preenchidas com dados de exemplo para visualização.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}