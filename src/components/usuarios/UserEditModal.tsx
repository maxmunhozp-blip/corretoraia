import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, KeyRound, LayoutDashboard, FileText, Users, Trophy, Bell, BookOpen, Lock, Code2, Building2, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ALL_MENUS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "propostas", label: "Propostas", icon: FileText },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "ranking", label: "Ranking", icon: Trophy },
  { key: "alertas", label: "Alertas", icon: Bell },
  { key: "base-conhecimento", label: "Base de Conhecimento", icon: BookOpen },
  { key: "acessos", label: "Acessos", icon: Lock },
  { key: "desenvolvimento", label: "Desenvolvimento", icon: Code2 },
  { key: "gestao", label: "Gestão", icon: Building2 },
  { key: "miranda", label: "Miranda IA", icon: Sparkles },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: any;
  isMaster: boolean;
  onSaved: () => void;
}

export function UserEditModal({ open, onOpenChange, usuario, isMaster, onSaved }: UserEditModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    cargo: usuario?.cargo || "",
    role: usuario?.role || "vendedor",
    ativo: usuario?.ativo ?? true,
  });
  const [novaSenha, setNovaSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [menuPermissions, setMenuPermissions] = useState<Record<string, boolean>>({});
  const [savingMenus, setSavingMenus] = useState(false);

  // Load existing menu permissions
  const { data: existingPermissions } = useQuery({
    queryKey: ["user-menu-permissions", usuario?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_menu_permissions")
        .select("menu_key, enabled")
        .eq("user_id", usuario.id);
      return data ?? [];
    },
    enabled: !!usuario?.id && open,
  });

  useEffect(() => {
    const perms: Record<string, boolean> = {};
    ALL_MENUS.forEach((m) => {
      perms[m.key] = true; // default all enabled
    });
    if (existingPermissions) {
      existingPermissions.forEach((p: any) => {
        perms[p.menu_key] = p.enabled;
      });
    }
    setMenuPermissions(perms);
  }, [existingPermissions]);

  const handleToggleMenu = (key: string) => {
    setMenuPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const initials = form.nome
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const { error } = await supabase
        .from("profiles")
        .update({
          nome: form.nome,
          cargo: form.cargo || null,
          role: form.role,
          ativo: form.ativo,
          avatar_iniciais: initials,
        })
        .eq("id", usuario.id);

      if (error) throw error;

      // Save menu permissions — upsert each
      const upserts = ALL_MENUS.map((m) => ({
        user_id: usuario.id,
        menu_key: m.key,
        enabled: menuPermissions[m.key] ?? true,
      }));

      const { error: permError } = await supabase
        .from("user_menu_permissions")
        .upsert(upserts, { onConflict: "user_id,menu_key" });

      if (permError) {
        console.error("Erro ao salvar permissões de menu:", permError);
        toast.error("Perfil salvo, mas houve erro nas permissões de menu");
      } else {
        toast.success("Usuário atualizado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["user-menu-permissions", usuario.id] });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          action: "reset-password",
          user_id: usuario.id,
          password: novaSenha,
        },
      });

      if (error) {
        toast.error("Erro ao redefinir senha");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Senha redefinida com sucesso!");
      setNovaSenha("");
    } catch {
      toast.error("Erro inesperado ao redefinir senha");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Gerencie todos os dados, permissões e acesso de <strong>{usuario?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Dados pessoais */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dados pessoais</h3>
            {usuario?.email && (
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                📧 {usuario.email}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome completo</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Corretor Sênior"
                />
              </div>
            </div>
          </div>

          {/* Permissão */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Permissão</h3>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isMaster && <SelectItem value="master">Master</SelectItem>}
                <SelectItem value="admin_corretora">Administrador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <span className="text-sm text-muted-foreground">
                {form.ativo ? "Ativo — pode acessar o sistema" : "Inativo — acesso bloqueado"}
              </span>
            </div>
          </div>

          {/* Acesso aos menus */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground">Acesso aos menus</h3>
            <p className="text-xs text-muted-foreground">Controle quais seções do sistema este usuário pode acessar.</p>
            <div className="space-y-1">
              {ALL_MENUS.map((menu) => {
                const Icon = menu.icon;
                const enabled = menuPermissions[menu.key] ?? true;
                return (
                  <div
                    key={menu.key}
                    className={`flex items-center justify-between rounded-md px-3 py-2.5 transition-colors ${
                      enabled ? "bg-muted/30" : "bg-muted/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{menu.label}</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => handleToggleMenu(menu.key)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redefinir senha */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Redefinir senha
            </h3>
            <div className="flex gap-2">
              <Input
                type="text"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleResetPassword}
                disabled={resettingPassword || !novaSenha}
              >
                {resettingPassword && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Redefinir
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.nome || saving}
            className="bg-brand hover:bg-brand-hover text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
