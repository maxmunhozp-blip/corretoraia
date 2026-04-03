import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, X, Send, Database, Search, RefreshCw, FileText, BarChart3, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou a **Miranda**, sua assistente de IA. Posso buscar clientes, verificar propostas, analisar métricas, responder sobre regras das operadoras e muito mais. Como posso ajudar?",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/miranda-chat`;

const pageSuggestions: Record<string, string[]> = {
  "/dashboard": ["Resumo do dia", "Quais alertas críticos?", "Como estão as vendas?"],
  "/propostas": ["Propostas paradas há mais de 7 dias", "Resumo por operadora", "Quem tem mais pendências?"],
  "/clientes": ["Clientes em risco de cancelamento", "Inadimplentes esta semana", "Clientes sem propostas ativas"],
  "/ranking": ["Quem teve maior queda?", "Meta do mês está ok?", "Ranking da semana"],
  "/base-conhecimento": ["O que temos sobre carência Amil?", "Regras PME SulAmérica", "Tabelas de preço Bradesco"],
  "/alertas": ["Alertas críticos não resolvidos", "Alertas por tipo", "Resumo de inadimplência"],
  "/gestao": ["Resumo executivo do mês", "Performance da equipe", "Indicadores gerais"],
};

const quickActions = [
  { label: "Relatório do dia", icon: FileText, message: "Gere um relatório executivo completo do dia de hoje com propostas, alertas, vendas e métricas." },
  { label: "Ver alertas críticos", icon: AlertTriangle, message: "Liste e analise todos os alertas críticos não resolvidos. Sugira ações para cada um." },
  { label: "Análise de conversão", icon: BarChart3, message: "Faça uma análise de conversão comparando a semana atual com a anterior. Identifique tendências." },
];

/* ── Action indicator ── */
function ActionIndicator({ action }: { action: string }) {
  const iconMap: Record<string, typeof Database> = {
    buscar_cliente: Database,
    buscar_propostas: Database,
    buscar_alertas: Database,
    buscar_conhecimento: Search,
    buscar_metricas: Database,
    buscar_ranking: Database,
    buscar_conversas: Search,
    atualizar_proposta: RefreshCw,
    criar_alerta: RefreshCw,
  };

  const labelMap: Record<string, string> = {
    buscar_cliente: "Buscando dados do cliente...",
    buscar_propostas: "Buscando propostas...",
    buscar_alertas: "Verificando alertas...",
    buscar_conhecimento: "Pesquisando base de conhecimento...",
    buscar_metricas: "Calculando métricas...",
    buscar_ranking: "Analisando ranking...",
    buscar_conversas: "Buscando histórico...",
    atualizar_proposta: "Atualizando proposta...",
    criar_alerta: "Criando alerta...",
  };

  const Icon = iconMap[action] || Database;
  const label = labelMap[action] || "Processando...";

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in px-2 py-1.5 rounded-md bg-muted/50">
      <Icon className="h-3.5 w-3.5 animate-spin-slow" />
      <span>{label}</span>
    </div>
  );
}

/* ── Blinking cursor ── */
function BlinkingCursor() {
  return <span className="inline-block w-[2px] h-[1em] bg-brand animate-blink ml-0.5 align-text-bottom" />;
}

/* ── Stream chat with tool action detection ── */
async function streamChat(
  messages: { role: string; content: string }[],
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  extra?: { usuario_id?: string; contexto_pagina?: string },
) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages,
        usuario_id: extra?.usuario_id,
        contexto_pagina: extra?.contexto_pagina,
      }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError(data.error || "Erro ao conectar com a Miranda");
      return;
    }

    if (!resp.body) {
      onError("Resposta vazia");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* partial JSON */ }
      }
    }

    // Flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch {
    onError("Erro de conexão com a Miranda");
  }
}

/* ── Panel ── */
export function MirandaPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, currentAction]);

  // Get contextual suggestions
  const currentPath = location.pathname;
  const suggestions = pageSuggestions[currentPath] || pageSuggestions["/dashboard"] || [];

  const send = (text: string) => {
    if (!text.trim() || streaming) return;
    setShowSuggestions(false);
    setCurrentAction(null);
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Detect likely tool usage from message content for action indicator
    const lower = text.toLowerCase();
    if (lower.includes("client") || lower.includes("inadimpl")) setCurrentAction("buscar_cliente");
    else if (lower.includes("propost") || lower.includes("pendên")) setCurrentAction("buscar_propostas");
    else if (lower.includes("alert") || lower.includes("crítico")) setCurrentAction("buscar_alertas");
    else if (lower.includes("regra") || lower.includes("carência") || lower.includes("cobertur") || lower.includes("tabela") || lower.includes("conhecimento")) setCurrentAction("buscar_conhecimento");
    else if (lower.includes("métrica") || lower.includes("venda") || lower.includes("conversão") || lower.includes("relatório") || lower.includes("resumo")) setCurrentAction("buscar_metricas");
    else if (lower.includes("ranking") || lower.includes("vendedor") || lower.includes("performance")) setCurrentAction("buscar_ranking");
    else setCurrentAction("buscar_metricas");

    let assistantSoFar = "";

    const apiMessages = newMessages
      .filter((m) => m !== INITIAL_MESSAGE)
      .map((m) => ({ role: m.role, content: m.content }));

    streamChat(
      apiMessages,
      (chunk) => {
        // First chunk arriving means tools are done
        if (!assistantSoFar) setCurrentAction(null);
        assistantSoFar += chunk;
        const current = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
          }
          return [...prev, { role: "assistant", content: current }];
        });
      },
      () => {
        setStreaming(false);
        setCurrentAction(null);
      },
      (errorMsg) => {
        setStreaming(false);
        setCurrentAction(null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${errorMsg}` },
        ]);
      },
      { usuario_id: user?.id, contexto_pagina: currentPath },
    );
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-foreground/20 z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-brand">
          <Sparkles className="h-5 w-5 text-brand-foreground" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-foreground">Miranda</p>
            <p className="text-xs text-brand-foreground/70">Assistente IA · Agente com acesso aos dados</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-brand-foreground/10 transition-colors"
          >
            <X className="h-4 w-4 text-brand-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="flex items-end gap-2 animate-msg-in">
                <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
                  M
                </div>
                <div className="max-w-[85%] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground leading-relaxed">
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {streaming && i === messages.length - 1 && <BlinkingCursor />}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end animate-msg-in">
                <div className="max-w-[85%] rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground leading-relaxed">
                  {msg.content}
                </div>
              </div>
            )
          )}

          {/* Action indicator */}
          {currentAction && streaming && (
            <div className="flex items-end gap-2 animate-msg-in">
              <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
                M
              </div>
              <ActionIndicator action={currentAction} />
            </div>
          )}

          {/* Contextual suggestions */}
          {showSuggestions && (
            <div className="space-y-3 animate-msg-in">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-brand-light hover:border-brand transition-colors duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.message)}
                    className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-light px-3 py-2 text-xs font-medium text-brand hover:bg-brand hover:text-brand-foreground transition-colors duration-200"
                  >
                    <a.icon className="h-3.5 w-3.5" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte para a Miranda..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="h-9 w-9 rounded-md bg-brand flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-40"
          >
            <Send className="h-4 w-4 text-brand-foreground" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Floating Button ── */
export function MirandaFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Miranda — Assistente IA"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-brand shadow-lg flex items-center justify-center hover:bg-brand-hover transition-colors duration-200 animate-miranda-pulse group"
      >
        <Sparkles className="h-6 w-6 text-brand-foreground" />
        <span className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs text-background opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Miranda — Assistente IA
        </span>
      </button>

      <MirandaPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
