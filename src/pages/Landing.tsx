import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Sparkles,
  Bell,
  Trophy,
  BookOpen,
  Check,
  ArrowRight,
  Quote,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInView, useAnimatedCounter } from "@/hooks/useLandingAnimations";

/* ─── Helper: section that fades in on scroll ─── */
function FadeSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

/* ─── Animated counter ─── */
function Counter({
  end,
  suffix = "",
  label,
}: {
  end: number;
  suffix?: string;
  label: string;
}) {
  const { ref, inView } = useInView(0.3);
  const value = useAnimatedCounter(end, 1200, true, inView);
  return (
    <div ref={ref} className="text-center">
      <span className="text-4xl md:text-5xl font-bold text-foreground">
        {value}
        {suffix}
      </span>
      <p className="text-sm text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

/* ─── Plan data ─── */
const planos = [
  {
    nome: "Starter",
    slug: "starter",
    preco: 500,
    usuarios: "3 usuários",
    propostas: "50 propostas/mês",
    destaque: false,
    recursos: [
      "Dashboard executivo",
      "Gestão de propostas",
      "Gestão de clientes",
      "Miranda IA básica",
    ],
  },
  {
    nome: "Profissional",
    slug: "profissional",
    preco: 990,
    usuarios: "8 usuários",
    propostas: "200 propostas/mês",
    destaque: true,
    recursos: [
      "Tudo do Starter",
      "Ranking de equipe",
      "Alertas inteligentes",
      "Relatórios em PDF",
      "Base de conhecimento",
    ],
  },
  {
    nome: "Business",
    slug: "business",
    preco: 1790,
    usuarios: "20 usuários",
    propostas: "Propostas ilimitadas",
    destaque: false,
    recursos: [
      "Tudo do Profissional",
      "Miranda 2.0 avançada",
      "WhatsApp automático",
      "API de integrações",
    ],
  },
  {
    nome: "Enterprise",
    slug: "enterprise",
    preco: 2500,
    usuarios: "Ilimitado",
    propostas: "Tudo ilimitado",
    destaque: false,
    recursos: [
      "Tudo do Business",
      "White-label",
      "Suporte prioritário",
      "Onboarding dedicado",
      "SLA garantido",
    ],
  },
];

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard executivo",
    desc: "Veja as métricas que importam em tempo real",
  },
  {
    icon: FileText,
    title: "Gestão de propostas",
    desc: "Do envio à aprovação, tudo rastreado automaticamente",
  },
  {
    icon: Sparkles,
    title: "Miranda IA",
    desc: "Sua assistente que busca dados, gera relatórios e responde dúvidas",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    desc: "Seja avisado antes que o cliente cancele ou fique inadimplente",
  },
  {
    icon: Trophy,
    title: "Ranking de equipe",
    desc: "Engaje sua equipe com performance transparente",
  },
  {
    icon: BookOpen,
    title: "Base de conhecimento",
    desc: "Suba PDFs das operadoras e deixe a Miranda consultar",
  },
];

const depoimentos = [
  {
    texto:
      "A Miranda identificou uma economia de 38% para um cliente que estava prestes a cancelar. Salvou a conta e gerou upsell.",
    nome: "Renata Oliveira",
    cargo: "Diretora Comercial",
    empresa: "Corretora Vitallis",
  },
  {
    texto:
      "Antes levávamos 3 dias para montar um comparativo. Agora a Miranda faz em 30 segundos com um PDF muito mais profissional.",
    nome: "Marcos Andrade",
    cargo: "Corretor Sênior",
    empresa: "Grupo Saúde+",
  },
  {
    texto:
      "O ranking transformou a cultura da equipe. Todo mundo quer aparecer no topo — vendas cresceram 40% no primeiro mês.",
    nome: "Carolina Bastos",
    cargo: "Gerente de Operações",
    empresa: "BeneStar Corretora",
  },
];

/* ─── MAIN COMPONENT ─── */
export default function Landing() {
  const [anual, setAnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand" />
            <span className="text-xl font-bold">Cora</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("funcionalidades")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollTo("planos")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </button>
            <button
              onClick={() => scrollTo("contato")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contato
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="outline"
                className="border-brand text-brand hover:bg-brand-light"
              >
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button className="bg-brand hover:bg-brand-hover text-white">
                Teste grátis 14 dias
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            <button
              onClick={() => scrollTo("funcionalidades")}
              className="block text-sm text-muted-foreground"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollTo("planos")}
              className="block text-sm text-muted-foreground"
            >
              Planos
            </button>
            <button
              onClick={() => scrollTo("contato")}
              className="block text-sm text-muted-foreground"
            >
              Contato
            </button>
            <div className="flex gap-2 pt-2">
              <Link to="/cadastro" className="flex-1">
                <Button variant="outline" className="w-full border-brand text-brand">
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro" className="flex-1">
                <Button className="w-full bg-brand hover:bg-brand-hover text-white">
                  Teste grátis
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 bg-brand-light border-brand/20 text-brand px-4 py-1.5 text-xs font-medium"
          >
            Plataforma com IA para Corretoras
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
            Sua corretora operando com{" "}
            <span className="text-brand">inteligência artificial</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Gerencie propostas, clientes e a performance da sua equipe em um só
            lugar. Com a Miranda, sua IA, respondendo em tempo real.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="bg-brand hover:bg-brand-hover text-white px-8 text-base"
              >
                Começar agora — grátis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground px-8 text-base"
              onClick={() => scrollTo("funcionalidades")}
            >
              Ver demonstração
            </Button>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 relative">
            <div className="bg-card rounded-xl border border-border shadow-2xl shadow-brand/5 overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground ml-2">
                  app.cora.com.br/dashboard
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Propostas ativas", val: "127" },
                    { label: "Clientes", val: "1.842" },
                    { label: "Economia identificada", val: "R$ 284k" },
                    { label: "Taxa de conversão", val: "68%" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-lg border border-border p-4"
                    >
                      <span className="text-xs text-muted-foreground">
                        {kpi.label}
                      </span>
                      <span className="block text-2xl font-bold mt-1">
                        {kpi.val}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-32 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    Gráfico de desempenho mensal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NÚMEROS ─── */}
      <FadeSection className="bg-surface py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={48} suffix="%" label="Redução média de custo identificada" />
          <Counter end={3} suffix="x" label="Mais rápido para fechar proposta" />
          <Counter end={100} suffix="%" label="Visibilidade da sua operação" />
          <div className="text-center">
            <span className="text-4xl md:text-5xl font-bold text-foreground">
              24/7
            </span>
            <p className="text-sm text-muted-foreground mt-2">
              Miranda disponível sempre
            </p>
          </div>
        </div>
      </FadeSection>

      {/* ─── FUNCIONALIDADES ─── */}
      <FadeSection
        id="funcionalidades"
        className="py-20 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            Tudo que sua corretora precisa
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:shadow-brand/5 transition-shadow duration-300"
              >
                <div className="h-11 w-11 rounded-lg bg-brand-light flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ─── MIRANDA EM DESTAQUE ─── */}
      <FadeSection className="bg-surface py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Conheça a Miranda, sua IA
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Uma assistente inteligente treinada para corretoras de planos de
              saúde. Ela sabe tudo sobre suas operadoras, clientes e propostas.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Busca clientes e propostas por nome",
                "Gera relatórios comparativos em PDF",
                "Responde sobre regras das operadoras",
                "Analisa documentos que você enviar",
                "Disponível 24 horas, 7 dias por semana",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat mockup */}
          <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold">Miranda IA</span>
                <span className="block text-xs text-muted-foreground">
                  Online agora
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-end">
                <div className="bg-brand text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">
                    Gere um comparativo para o cliente Empresa Dix
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">
                    Encontrei 3 beneficiários na Empresa Dix. A maior economia
                    projetada é de <strong>R$ 3.641/mês (48,5%)</strong>{" "}
                    migrando para o plano Black da Amil. Gerando o relatório em
                    PDF...
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium">
                      Relatório_Comparativo.pdf
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ─── PLANOS ─── */}
      <FadeSection id="planos" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            Planos que crescem com você
          </h2>
          <p className="text-muted-foreground text-center mt-3">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>

          {/* Toggle mensal/anual */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span
              className={`text-sm font-medium ${
                !anual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Mensal
            </span>
            <button
              onClick={() => setAnual(!anual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                anual ? "bg-brand" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  anual ? "translate-x-6" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                anual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Anual
            </span>
            {anual && (
              <Badge className="bg-brand text-white border-0 text-[10px]">
                -20%
              </Badge>
            )}
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map((p) => {
              const preco = anual
                ? Math.round(p.preco * 0.8)
                : p.preco;
              return (
                <div
                  key={p.slug}
                  className={`rounded-xl border bg-card p-6 flex flex-col relative ${
                    p.destaque
                      ? "border-brand border-2 shadow-lg shadow-brand/10"
                      : "border-border"
                  }`}
                >
                  {p.destaque && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-brand text-white border-0 px-3 py-1 text-xs">
                        Mais popular
                      </Badge>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{p.nome}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">
                      R$ {preco.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.usuarios} · {p.propostas}
                  </p>

                  <ul className="mt-6 space-y-3 flex-1">
                    {p.recursos.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/cadastro" className="mt-6">
                    <Button
                      className={`w-full ${
                        p.destaque
                          ? "bg-brand hover:bg-brand-hover text-white"
                          : "bg-transparent border border-brand text-brand hover:bg-brand-light"
                      }`}
                    >
                      Começar grátis
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ─── DEPOIMENTOS ─── */}
      <FadeSection className="bg-surface py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            O que nossos clientes dizem
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((d, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6"
              >
                <Quote className="h-6 w-6 text-brand/30 mb-4" />
                <p className="text-sm leading-relaxed text-foreground">
                  "{d.texto}"
                </p>
                <div className="mt-6 border-t border-border pt-4">
                  <span className="text-sm font-semibold">{d.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {d.cargo}, {d.empresa}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ─── CTA FINAL ─── */}
      <section
        id="contato"
        className="bg-brand py-20 px-4 sm:px-6"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Pronto para transformar sua corretora?
          </h2>
          <p className="text-white/80 mt-4 text-lg">
            Comece agora, grátis por 14 dias. Sem cartão de crédito.
          </p>
          <Link to="/cadastro" className="inline-block mt-8">
            <Button
              size="lg"
              className="bg-white text-brand hover:bg-white/90 px-8 text-base font-semibold"
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand" />
            <span className="font-bold">Cora</span>
            <span className="text-xs text-muted-foreground ml-2">
              Plataforma inteligente para corretoras
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => scrollTo("funcionalidades")} className="hover:text-foreground transition-colors">
              Funcionalidades
            </button>
            <button onClick={() => scrollTo("planos")} className="hover:text-foreground transition-colors">
              Planos
            </button>
            <button onClick={() => scrollTo("contato")} className="hover:text-foreground transition-colors">
              Contato
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            © 2026 Cora. Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
