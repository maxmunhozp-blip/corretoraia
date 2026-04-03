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
import {
  Palette,
  Globe,
  Settings,
  Shield,
  Save,
  Loader2,
  Building2,
  Mail,
  RefreshCw,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações Master</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie personalizações, white-label e configurações globais do sistema.
        </p>
      </div>

      <Tabs defaultValue="whitelabel" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="whitelabel" className="gap-2">
            <Palette className="h-4 w-4" />
            White-label
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
    </div>
  );
}
