import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const steps = [
  { label: "Sua corretora", num: 1 },
  { label: "Personalize", num: 2 },
  { label: "Convide sua equipe", num: 3 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const corretora_id = (profile as any)?.corretora_id;

  const [form, setForm] = useState({
    cnpj: "",
    telefone: "",
    cidade: "",
    estado: "",
    nome_fantasia: "",
    site: "",
    convites: [
      { nome: "", email: "" },
      { nome: "", email: "" },
      { nome: "", email: "" },
    ],
  });

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Update corretora
      if (corretora_id) {
        await supabase
          .from("corretoras")
          .update({
            cnpj: form.cnpj || null,
            telefone: form.telefone || null,
            cidade: form.cidade || null,
            estado: form.estado || null,
            site: form.site || null,
            onboarding_completo: true,
          })
          .eq("id", corretora_id);
      }

      // Invite users
      for (const convite of form.convites) {
        if (convite.nome && convite.email) {
          const senha = Math.random().toString(36).slice(-8) + "A1!";
          await supabase.functions.invoke("admin-create-user", {
            body: {
              email: convite.email,
              password: senha,
              nome: convite.nome,
              role: "corretor",
              corretora_id,
            },
          });
        }
      }

      toast.success("Bem-vindo ao Cora! 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConvite = (i: number, field: string, value: string) => {
    const convites = [...form.convites];
    (convites[i] as any)[field] = value;
    setForm({ ...form, convites });
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Activity className="h-8 w-8 text-brand" />
          <span className="text-2xl font-bold">Cora</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step > s.num
                    ? "bg-brand text-white"
                    : step === s.num
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  step >= s.num
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {s.num < 3 && (
                <div className="w-8 h-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Dados da corretora</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={form.cnpj}
                      onChange={(e) =>
                        setForm({ ...form, cnpj: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.telefone}
                      onChange={(e) =>
                        setForm({ ...form, telefone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={form.cidade}
                      onChange={(e) =>
                        setForm({ ...form, cidade: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={form.estado}
                      onChange={(e) =>
                        setForm({ ...form, estado: e.target.value })
                      }
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Personalize</h2>
                <div>
                  <Label>Nome fantasia</Label>
                  <Input
                    value={form.nome_fantasia}
                    onChange={(e) =>
                      setForm({ ...form, nome_fantasia: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Site</Label>
                  <Input
                    value={form.site}
                    onChange={(e) =>
                      setForm({ ...form, site: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Cor de destaque</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="h-10 w-10 rounded-md bg-brand border" />
                    <span className="text-sm text-muted-foreground">
                      Marsala (padrão)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Convide sua equipe</h2>
                <p className="text-sm text-muted-foreground">
                  Adicione até 3 corretores. Você pode pular e convidar depois.
                </p>
                {form.convites.map((c, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={c.nome}
                        onChange={(e) =>
                          updateConvite(i, "nome", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={c.email}
                        onChange={(e) =>
                          updateConvite(i, "email", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-brand hover:bg-brand-hover text-white"
                >
                  Próximo <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm({
                        ...form,
                        convites: [
                          { nome: "", email: "" },
                          { nome: "", email: "" },
                          { nome: "", email: "" },
                        ],
                      });
                      handleFinish();
                    }}
                  >
                    Pular
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-brand hover:bg-brand-hover text-white"
                  >
                    {loading ? "Finalizando..." : "Concluir"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
