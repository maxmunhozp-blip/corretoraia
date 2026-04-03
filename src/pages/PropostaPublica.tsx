import { useParams } from "react-router-dom";
import { usePropostaBySlug, useRegistrarVisualizacao } from "@/hooks/usePropostasInterativas";
import { useEffect, useState, useRef, useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Clock, TrendingDown, Calendar, Percent, CheckCircle, AlertTriangle,
  MessageCircle, Mail, ChevronRight, Monitor, Shield, Heart
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TABS = ["Resumo", "Comparativo", "Economia", "Planos", "Próximos Passos"] as const;

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function CountUpValue({ target, prefix = "R$ " }: { target: number; prefix?: string }) {
  const val = useCountUp(target, 1500, 200);
  return <>{prefix}{val.toLocaleString("pt-BR")}</>;
}

function useCountdown(targetDate: string | null) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

export default function PropostaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const { data: proposta, isLoading, error } = usePropostaBySlug(slug);
  const registrar = useRegistrarVisualizacao();
  const [activeTab, setActiveTab] = useState(0);
  const [meses, setMeses] = useState([12]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (slug) registrar.mutate(slug);
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setScrollProgress(Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dados = proposta?.dados || {};
  const planoAtual = proposta?.plano_atual || dados.plano_atual || {};
  const alternativas = proposta?.alternativas || dados.alternativas || [];
  const melhorAlt = alternativas[0] || {};

  const valorAtual = Number(planoAtual.valor_mensal) || 8000;
  const valorNovo = Number(melhorAlt.valor_mensal) || 6000;
  const economiaMensal = valorAtual - valorNovo;
  const economiaAnual = economiaMensal * 12;
  const percentEconomia = valorAtual > 0 ? Math.round((economiaMensal / valorAtual) * 100) : 0;

  const countdown = useCountdown(proposta?.valida_ate || null);

  const beneficiarios = dados.beneficiarios || [
    { nome: "Titular", idade: 35, valores: {} },
  ];

  const chartData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months.map((m) => ({
      mes: m,
      "Plano Atual": valorAtual,
      "Melhor Alternativa": valorNovo,
    }));
  }, [valorAtual, valorNovo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-4 w-64 bg-gray-100 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !proposta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Proposta não encontrada</h1>
          <p className="text-gray-500">O link pode ter expirado ou ser inválido.</p>
        </div>
      </div>
    );
  }

  const clienteNome = proposta.cliente_nome;
  const corretoraInfo = dados.corretora || {};
  const whatsappNum = proposta.cliente_telefone || corretoraInfo.telefone || "";
  const whatsappMsg = encodeURIComponent(`Olá! Quero saber mais sobre a proposta ${proposta.slug} para ${clienteNome}`);

  return (
    <div ref={scrollRef} className="min-h-screen bg-white font-sans">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1" style={{ background: `linear-gradient(to right, hsl(1,30%,45%) ${scrollProgress}%, transparent ${scrollProgress}%)` }} />

      {/* Header */}
      <header className="fixed top-1 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(1,30%,45%)] text-white flex items-center justify-center text-sm font-bold">
              {(corretoraInfo.nome || "C")[0]}
            </div>
            <span className="font-semibold text-gray-800 text-sm">{corretoraInfo.nome || "Cora"}</span>
          </div>
          {!countdown.expired && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>Válida por {countdown.days}d {countdown.hours}h</span>
            </div>
          )}
          {countdown.expired && (
            <span className="text-sm text-gray-400">Proposta expirada</span>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-12 px-4" style={{ background: "linear-gradient(180deg, #ffffff 0%, #F5EDEC 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-2">Preparado especialmente para</p>
          <p className="text-gray-600 font-medium mb-6">{clienteNome}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Você pode economizar <span className="text-[hsl(142,72%,29%)]"><CountUpValue target={economiaAnual} /></span> por ano
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Identificamos uma oportunidade de redução de {percentEconomia}% nos seus custos com saúde sem perder cobertura.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: TrendingDown, label: `${formatCurrency(economiaMensal)}/mês a menos`, color: "text-green-600" },
              { icon: Calendar, label: `${formatCurrency(economiaAnual)}/ano economizado`, color: "text-green-600" },
              { icon: Percent, label: `${percentEconomia}% de redução`, color: "text-green-600" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                <b.icon className={`h-4 w-4 ${b.color}`} />
                <span className="text-sm font-medium text-gray-700">{b.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#proximos-passos" className="px-6 py-3 bg-[hsl(1,30%,45%)] text-white rounded-lg font-medium hover:bg-[hsl(1,30%,38%)] transition-colors">
              Quero aproveitar essa oportunidade
            </a>
            <a href="#tabs" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Ver análise completa
            </a>
          </div>
        </div>
      </section>

      {/* Tabs sticky */}
      <nav id="tabs" className="sticky top-[calc(0.25rem+3.5rem)] z-30 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(i);
                document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? "border-[hsl(1,30%,45%)] text-[hsl(1,30%,45%)]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-16">
        {/* ABA 1: RESUMO */}
        <section id="section-0">
          <div className="space-y-6">
            {/* Situação Atual */}
            <div className="border-l-4 border-amber-400 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Situação Atual</h3>
                  <p className="text-gray-600">
                    Hoje você paga <strong>{formatCurrency(valorAtual)}/mês</strong> no {planoAtual.nome || "plano atual"} da {planoAtual.operadora || "operadora atual"}.
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Com {dados.vidas || planoAtual.vidas || "N"} vidas, o custo anual é de <strong>{formatCurrency(valorAtual * 12)}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Nossa Recomendação */}
            <div className="border-l-4 border-[hsl(1,30%,45%)] bg-[#F5EDEC] rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Nossa Recomendação</h3>
                  <p className="text-gray-600">
                    Migrando para o <strong>{melhorAlt.nome || "plano recomendado"}</strong>, você paga <strong>{formatCurrency(valorNovo)}/mês</strong>.
                  </p>
                  <p className="text-green-700 text-sm mt-1 font-medium">
                    Economia imediata de {formatCurrency(economiaMensal)} por mês.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-8">
              {[
                { step: "1", title: "Você aprova a proposta", icon: CheckCircle },
                { step: "2", title: "Cuidamos de toda a migração", icon: Shield },
                { step: "3", title: "Você começa a economizar", icon: Heart },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[hsl(1,30%,45%)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <span className="text-sm text-gray-700">{s.title}</span>
                  {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300 hidden md:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABA 2: COMPARATIVO */}
        <section id="section-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise vida a vida</h2>
          <p className="text-gray-500 mb-6">Comparamos cada beneficiário nos planos disponíveis</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Beneficiário</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Idade</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 bg-amber-50">{planoAtual.nome || "Plano Atual"}</th>
                  {alternativas.map((alt: any, i: number) => (
                    <th key={i} className={`text-right px-4 py-3 font-medium text-gray-600 ${i === 0 ? "bg-green-50" : ""}`}>
                      {alt.nome || `Alternativa ${i + 1}`}
                      {i === 0 && <span className="ml-1 text-xs text-green-600 font-normal">Melhor</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {beneficiarios.map((b: any, i: number) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{b.idade}</td>
                    <td className="px-4 py-3 text-right bg-amber-50/50 text-gray-800">
                      {formatCurrency(Number(b.valores?.atual || b.valor_atual || 0))}
                    </td>
                    {alternativas.map((alt: any, j: number) => {
                      const valAlt = Number(b.valores?.[alt.nome] || b[`valor_alt_${j}`] || 0);
                      const valAtual = Number(b.valores?.atual || b.valor_atual || 0);
                      const diff = valAtual > 0 ? Math.round(((valAtual - valAlt) / valAtual) * 100) : 0;
                      return (
                        <td key={j} className={`px-4 py-3 text-right ${j === 0 ? "bg-green-50/50" : ""}`}>
                          <span className="text-gray-800">{formatCurrency(valAlt)}</span>
                          {diff > 0 && <span className="ml-2 text-xs text-green-600 font-medium">-{diff}%</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-800">TOTAL</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right bg-amber-50 text-gray-800">{formatCurrency(valorAtual)}</td>
                  {alternativas.map((_: any, j: number) => (
                    <td key={j} className={`px-4 py-3 text-right ${j === 0 ? "bg-green-50" : ""}`}>
                      {formatCurrency(Number(alternativas[j]?.valor_mensal || 0))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ABA 3: ECONOMIA */}
        <section id="section-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sua economia projetada</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <label className="text-sm text-gray-500 mb-3 block">Quantos meses você pretende manter o plano?</label>
            <Slider value={meses} onValueChange={setMeses} min={1} max={60} step={1} className="mb-4" />
            <div className="text-center text-sm text-gray-500">{meses[0]} meses</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-400 mb-1">Total no plano atual</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(valorAtual * meses[0])}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-400 mb-1">Total na alternativa</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(valorNovo * meses[0])}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-green-600 mb-1">Sua economia</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(economiaMensal * meses[0])}</p>
              </div>
            </div>
          </div>

          {/* Projeções */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Em 1 ano", m: 12 }, { label: "Em 3 anos", m: 36 }, { label: "Em 5 anos", m: 60 }].map((p) => (
              <div key={p.m} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{p.label}</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(economiaMensal * p.m)}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="Plano Atual" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Melhor Alternativa" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Loss aversion */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">
                A cada mês que você espera para migrar, você perde <strong>{formatCurrency(economiaMensal)}</strong>. Nos próximos 12 meses, isso representa <strong>{formatCurrency(economiaAnual)}</strong> que ficam no seu bolso ou vão embora.
              </p>
            </div>
          </div>
        </section>

        {/* ABA 4: PLANOS */}
        <section id="section-3">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conheça as alternativas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {alternativas.map((alt: any, i: number) => (
              <div key={i} className={`rounded-lg border p-6 ${i === 0 ? "border-[hsl(1,30%,45%)] shadow-md" : "border-gray-200"}`}>
                {i === 0 && (
                  <span className="inline-block text-xs bg-[hsl(1,30%,45%)] text-white px-2 py-0.5 rounded-full mb-3">
                    Recomendado pela Miranda
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5EDEC] text-[hsl(1,30%,45%)] flex items-center justify-center font-bold text-sm">
                    {(alt.operadora || alt.nome || "P")[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{alt.nome || `Alternativa ${i + 1}`}</p>
                    <p className="text-xs text-gray-500">{alt.operadora || ""}</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(Number(alt.valor_mensal || 0))}<span className="text-sm font-normal text-gray-400">/mês</span></p>
                {valorAtual > Number(alt.valor_mensal) && (
                  <span className="inline-block text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-4">
                    Economia de {Math.round(((valorAtual - Number(alt.valor_mensal)) / valorAtual) * 100)}%
                  </span>
                )}
                <ul className="space-y-2 mt-4">
                  {(alt.coberturas || ["Consultas", "Exames", "Internação", "Urgência"]).map((c: string, ci: number) => (
                    <li key={ci} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" /> {c}
                    </li>
                  ))}
                </ul>
                {alt.abrangencia && <p className="text-xs text-gray-400 mt-3">Abrangência: {alt.abrangencia}</p>}
              </div>
            ))}
          </div>

          {/* Plano atual */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-500 text-sm mb-2">Plano Atual</h4>
            <p className="font-semibold text-gray-700">{planoAtual.nome || "Seu plano atual"} — {planoAtual.operadora || ""}</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(valorAtual)}/mês</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">Valores calculados com IOF. Sujeitos a confirmação pela operadora.</p>
        </section>

        {/* ABA 5: PRÓXIMOS PASSOS */}
        <section id="section-4" className="scroll-mt-32">
          <div id="proximos-passos" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pronto para economizar?</h2>

            {/* Countdown */}
            {!countdown.expired && (
              <div className="text-center mb-8">
                <p className="text-sm text-gray-500 mb-3">Esta proposta expira em:</p>
                <div className="inline-flex gap-2">
                  {[
                    { val: countdown.days, label: "dias" },
                    { val: countdown.hours, label: "horas" },
                    { val: countdown.minutes, label: "min" },
                    { val: countdown.seconds, label: "seg" },
                  ].map((u, i) => (
                    <div key={i} className="bg-[hsl(1,30%,45%)] text-white rounded-lg px-4 py-3 min-w-[60px]">
                      <p className="text-2xl font-bold">{String(u.val).padStart(2, "0")}</p>
                      <p className="text-xs opacity-80">{u.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3 steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { n: "1", title: "Você aprova", desc: "Clique no botão abaixo ou nos chame no WhatsApp" },
                { n: "2", title: "Nós cuidamos de tudo", desc: "Nossa equipe gerencia toda a migração com a operadora" },
                { n: "3", title: "Você economiza", desc: "A partir do próximo ciclo, seu bolso já sente a diferença" },
              ].map((s) => (
                <div key={s.n} className="bg-white border border-gray-200 rounded-lg p-5 text-center">
                  <div className="w-8 h-8 rounded-full bg-[hsl(1,30%,45%)] text-white flex items-center justify-center font-bold mx-auto mb-3">{s.n}</div>
                  <p className="font-semibold text-gray-800 mb-1">{s.title}</p>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <a
                href={`https://wa.me/${whatsappNum.replace(/\D/g, "")}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-lg font-semibold text-lg hover:bg-[#1fb855] transition-colors"
              >
                <MessageCircle className="h-5 w-5" /> Falar com um corretor agora
              </a>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[hsl(1,30%,45%)] text-[hsl(1,30%,45%)] rounded-lg font-semibold text-lg hover:bg-[#F5EDEC] transition-colors">
                <Mail className="h-5 w-5" /> Receber por e-mail
              </button>
            </div>

            {/* Social proof */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center mb-8">
              <p className="text-gray-600 italic">
                "Economizamos R$2.400 por mês sem perder nenhuma cobertura. A migração foi simples e a equipe cuidou de tudo."
              </p>
              <p className="text-sm text-gray-400 mt-2">— Maria S., Empresária</p>
            </div>

            {/* Footer */}
            <div className="bg-[hsl(1,30%,45%)] text-white rounded-xl p-8 text-center">
              <p className="text-lg mb-2">
                Essa análise foi preparada exclusivamente para <strong>{clienteNome}</strong> pela <strong>{corretoraInfo.nome || "sua corretora"}</strong>.
              </p>
              <p className="text-sm opacity-80">
                {corretoraInfo.telefone && `${corretoraInfo.telefone} • `}
                {corretoraInfo.email && `${corretoraInfo.email} • `}
                {corretoraInfo.site || ""}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
