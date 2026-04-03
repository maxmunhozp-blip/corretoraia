import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function MinhaCorretora() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const corretora_id = profile?.corretora_id;

  const { data: corretora, isLoading } = useQuery({
    queryKey: ["minha-corretora", corretora_id],
    queryFn: async () => {
      if (!corretora_id) return null;
      const { data } = await supabase
        .from("corretoras")
        .select("*")
        .eq("id", corretora_id)
        .single();
      return data;
    },
    enabled: !!corretora_id,
  });

  if (profile?.role !== "admin_corretora" && profile?.role !== "master") {
    return <Navigate to="/dashboard" replace />;
  }

  const formValue = (key: string) =>
    form[key] !== undefined ? form[key] : (corretora as any)?.[key] ?? "";

  const handleSave = async () => {
    if (!corretora_id || Object.keys(form).length === 0) return;
    setSaving(true);
    const { error } = await supabase
      .from("corretoras")
      .update(form)
      .eq("id", corretora_id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar dados");
    } else {
      toast.success("Dados atualizados com sucesso");
      setForm({});
      queryClient.invalidateQueries({ queryKey: ["minha-corretora"] });
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Minha Corretora">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Minha Corretora" subtitle="Dados da sua corretora">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-brand" />
              Informações da Corretora
              <Badge variant="outline" className="ml-auto capitalize">
                {corretora?.plano || "starter"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Corretora</Label>
                <Input
                  value={formValue("nome")}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formValue("cnpj")}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formValue("email")}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formValue("telefone")}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formValue("cidade")}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formValue("estado")}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 col-span-full">
                <Label>Site</Label>
                <Input
                  value={formValue("site")}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || Object.keys(form).length === 0}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
