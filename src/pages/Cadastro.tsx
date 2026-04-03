import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const planos = [
  {
    slug: "starter",
    nome: "Starter",
    preco: 500,
    max_usuarios: 3,
    max_propostas: 50,
    recursos: ["Dashboard", "Propostas", "Clientes", "Miranda básica"],
  },
  {
    slug: "profissional",
    nome: "Profissional",
    preco: 990,
    max_usuarios: 8,
    max_propostas: 200,
    popular: true,
    recursos: [
      "Tudo do Starter",
      "Ranking",
      "Alertas",
      "Relatórios PDF",
      "Base de conhecimento",
    ],
  },
  {
    slug: "business",
    nome: "Business",
    preco: 1790,
    max_usuarios: 20,
    max_propostas: null,
    recursos: [
      "Tudo do Profissional",
      "Miranda 2.0",
      "WhatsApp automático",
      "API de integrações",
    ],
  },
  {
    slug: "enterprise",
    nome: "Enterprise",
    preco: 2500,
    max_usuarios: null,
    max_propostas: null,
    recursos: [
      "Tudo do Business",
      "White-label",
      "Suporte prioritário",
      "Onboarding dedicado",
      "SLA garantido",
    ],
  },
];

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoParam = searchParams.get("plano");

  const [step, setStep] = useState<"plano" | "dados">(planoParam ? "dados" : "plano");
  const [selectedPlano, setSelectedPlano] = useState(planoParam || "profissional");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nomeCorretora: "",
    cnpj: "",
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const handleSelectPlano = (slug: string) => {
    setSelectedPlano(slug);
    setStep("dados");
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;

    const calc = (slice: string, weights: number[]) =>
      weights.reduce((sum, w, i) => sum + parseInt(slice[i]) * w, 0);

    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let rest = calc(digits, w1) % 11;
    const d1 = rest < 2 ? 0 : 11 - rest;
    if (parseInt(digits[12]) !== d1) return false;

    rest = calc(digits, w2) % 11;
    const d2 = rest < 2 ? 0 : 11 - rest;
    if (parseInt(digits[13]) !== d2) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.senha || !form.nome || !form.nomeCorretora) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.cnpj && !validarCNPJ(form.cnpj)) {
      toast.error("CNPJ inválido. Verifique os dígitos.");
      return;
    }
    const whatsDigits = form.telefone.replace(/\D/g, "");
    if (whatsDigits.length < 10) {
      toast.error("Informe um número de WhatsApp válido");
      return;
    }
    if (form.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: form.nome,
            nome_corretora: form.nomeCorretora,
            cnpj: form.cnpj ? form.cnpj.replace(/\D/g, "") : undefined,
            telefone: form.telefone,
            plano: selectedPlano,
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso! Bem-vindo ao Cora 🎉");
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const planoAtual = planos.find((p) => p.slug === selectedPlano);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Cora</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Já tenho conta</Button>
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        {step === "plano" ? (
          /* ─── Step 1: Seleção de Plano ─── */
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Escolha seu plano
              </h1>
              <p className="text-muted-foreground text-lg">
                14 dias grátis em qualquer plano. Sem cartão de crédito.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {planos.map((plano) => (
                <div
                  key={plano.slug}
                  className={`relative rounded-xl border-2 p-6 flex flex-col transition-all cursor-pointer hover:shadow-lg ${
                    plano.popular
                      ? "border-primary shadow-md"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => handleSelectPlano(plano.slug)}
                >
                  {plano.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Mais popular
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
                  <div className="mt-3 mb-5">
                    <span className="text-3xl font-bold text-foreground">
                      R$ {plano.preco.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {plano.max_usuarios ? `Até ${plano.max_usuarios} usuários` : "Usuários ilimitados"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {plano.max_propostas ? `${plano.max_propostas} propostas/mês` : "Propostas ilimitadas"}
                  </p>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plano.recursos.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={plano.popular ? "" : ""}
                    variant={plano.popular ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlano(plano.slug);
                    }}
                  >
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Step 2: Formulário de Cadastro ─── */
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setStep("plano")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar aos planos
            </button>

            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Crie sua conta</h2>
                {planoAtual && (
                  <p className="text-muted-foreground mt-1">
                    Plano{" "}
                    <span className="font-medium text-primary">{planoAtual.nome}</span>{" "}
                    — 14 dias grátis
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCorretora">Nome da Corretora *</Label>
                  <Input
                    id="nomeCorretora"
                    placeholder="Ex: Corretora ABC"
                    value={form.nomeCorretora}
                    onChange={(e) => setForm({ ...form, nomeCorretora: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Seu nome completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: João Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">WhatsApp *</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: formatWhatsApp(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta grátis"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{" "}
                  <span className="underline cursor-pointer">Termos de Uso</span> e{" "}
                  <span className="underline cursor-pointer">Política de Privacidade</span>.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
