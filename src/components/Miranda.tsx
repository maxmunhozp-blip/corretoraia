import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Database, Search, RefreshCw, FileText, BarChart3, AlertTriangle, Plus, MessageSquare, Trash2, ChevronLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMirandaConversas, type Mensagem } from "@/hooks/useMirandaConversas";
import { supabase } from "@/integrations/supabase/client";
import { MirandaMarkdown } from "./MirandaMarkdown";
import { MirandaChart, parseMessageWithCharts } from "./MirandaChart";
import { DownloadCard } from "./miranda/DownloadCard";
import { PdfGeneratorCard } from "./miranda/PdfGeneratorCard";
import { PesquisaClienteCard } from "./miranda/PesquisaClienteCard";
import { PropostaCard } from "./miranda/PropostaCard";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const INITIAL_MESSAGE: Mensagem = {
  id: "initial",
  role: "assistant",
  content:
    "Olá! Sou a **Miranda**, sua assistente de IA. Posso buscar clientes, verificar propostas, analisar métricas, responder sobre regras das operadoras e muito mais. Como posso ajudar?",
  created_at: new Date().toISOString(),
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
  const labelMap: Record<string, string[]> = {
    buscar_cliente: [
      "Vasculhando o histórico do cliente...",
      "Mergulhando nos dados do cliente...",
    ],
    buscar_propostas: [
      "Garimpando propostas no sistema...",
      "Rastreando o pipeline comercial...",
    ],
    buscar_alertas: [
      "Escaneando o radar de alertas...",
      "Passando um pente fino nos alertas...",
    ],
    buscar_conhecimento: [
      "Consultando a biblioteca de operadoras...",
      "Folheando manuais e tabelas...",
    ],
    buscar_metricas: [
      "Cozinhando os números...",
      "Destilando os KPIs da operação...",
    ],
    buscar_ranking: [
      "Preparando o pódio dos vendedores...",
      "Compilando a corrida de vendas...",
    ],
  };

  const options = labelMap[action];
  const label = options
    ? options[Math.floor(Math.random() * options.length)]
    : "Trabalhando nisso...";

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in px-2 py-1.5 rounded-md bg-muted/50">
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function BlinkingCursor() {
  return <span className="inline-block w-[2px] h-[1em] bg-brand animate-blink ml-0.5 align-text-bottom" />;
}

/* ── Stream chat ── */
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
      body: JSON.stringify({ messages, usuario_id: extra?.usuario_id, contexto_pagina: extra?.contexto_pagina }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError(data.error || "Erro ao conectar com a Miranda");
      return;
    }
    if (!resp.body) { onError("Resposta vazia"); return; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const content = JSON.parse(json).choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {}
      }
    }
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const json = raw.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const content = JSON.parse(json).choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {}
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
  const { user } = useAuth();
  const {
    conversas, conversaAtiva, mensagens, loading,
    carregarMensagens, novaConversa, deletarConversa,
    salvarMensagem, atualizarTitulo, atualizarUltimaMensagem, setMensagens,
    setConversaAtiva,
  } = useMirandaConversas();

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [pesquisaResult, setPesquisaResult] = useState<Record<string, any> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      // Instant scroll on first load / conversation switch
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, streaming, currentAction]);

  // Reset suggestions when conversation changes
  useEffect(() => {
    if (!conversaAtiva) setShowSuggestions(true);
    else if (mensagens.length > 0) setShowSuggestions(false);
  }, [conversaAtiva, mensagens.length]);

  const currentPath = location.pathname;
  const suggestions = pageSuggestions[currentPath] || pageSuggestions["/dashboard"] || [];

  const detectAction = (text: string) => {
    const l = text.toLowerCase();
    if (l.includes("client") || l.includes("inadimpl")) return "buscar_cliente";
    if (l.includes("propost") || l.includes("pendên")) return "buscar_propostas";
    if (l.includes("alert") || l.includes("crítico")) return "buscar_alertas";
    if (l.includes("regra") || l.includes("conhecimento") || l.includes("carência")) return "buscar_conhecimento";
    if (l.includes("ranking") || l.includes("vendedor")) return "buscar_ranking";
    return "buscar_metricas";
  };

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setShowSuggestions(false);
    setShowHistory(false);
    setCurrentAction(detectAction(text.trim()));
    setStreaming(true);

    let activeConversaId = conversaAtiva;
    if (!activeConversaId) {
      activeConversaId = await novaConversa();
      if (!activeConversaId) { setStreaming(false); return; }
    }

    await salvarMensagem(activeConversaId, "user", text.trim());
    setInput("");

    // Auto-title on first user message
    if (mensagens.filter((m) => m.role === "user").length === 0) {
      const title = text.trim().length > 50 ? text.trim().slice(0, 47) + "..." : text.trim();
      atualizarTitulo(activeConversaId, title);
    }

    const apiMessages = [...mensagens, { id: "", role: "user" as const, content: text.trim(), created_at: "" }]
      .map((m) => ({ role: m.role, content: m.content }));

    let assistantSoFar = "";
    const cId = activeConversaId;

    streamChat(
      apiMessages,
      (chunk) => {
        if (!assistantSoFar) setCurrentAction(null);
        assistantSoFar += chunk;
        atualizarUltimaMensagem(assistantSoFar);
      },
      async () => {
        setStreaming(false);
        setCurrentAction(null);
        if (assistantSoFar && cId) {
          await supabase.from("miranda_mensagens").insert({ conversa_id: cId, role: "assistant", content: assistantSoFar });

          // Auto-rename: update title based on latest context every 3 user messages
          const userMsgCount = mensagens.filter((m) => m.role === "user").length + 1;
          if (userMsgCount >= 2 && userMsgCount % 2 === 0) {
            // Use the last user message + first line of assistant response to build a better title
            const lastUserMsg = text.trim();
            const firstLine = assistantSoFar.replace(/[#*`]/g, "").split("\n").find((l: string) => l.trim().length > 5)?.trim() || "";
            const combined = firstLine || lastUserMsg;
            const newTitle = combined.length > 50 ? combined.slice(0, 47) + "..." : combined;
            if (newTitle) atualizarTitulo(cId, newTitle);
          }
        }
      },
      (errorMsg) => {
        setStreaming(false);
        setCurrentAction(null);
        atualizarUltimaMensagem(`⚠️ ${errorMsg}`);
      },
      { usuario_id: user?.id, contexto_pagina: currentPath },
    );
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleNovaConversa = () => {
    setConversaAtiva(null);
    setMensagens([]);
    setShowSuggestions(true);
    setShowHistory(false);
    setPesquisaResult(null);
  };

  const handleSelectConversa = (id: string) => {
    isFirstLoad.current = true;
    carregarMensagens(id);
    setShowHistory(false);
    setShowSuggestions(false);
  };

  const displayMessages = conversaAtiva ? mensagens : [INITIAL_MESSAGE];

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
            onClick={() => setShowHistory(!showHistory)}
            title="Histórico de conversas"
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-brand-foreground/10 transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-brand-foreground" />
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-brand-foreground/10 transition-colors"
          >
            <X className="h-4 w-4 text-brand-foreground" />
          </button>
        </div>

        {/* History panel (overlay) */}
        {showHistory && (
          <div className="bg-card border-b border-border">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-semibold text-foreground">Conversas</span>
              <button
                onClick={handleNovaConversa}
                className="flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <Plus className="h-3 w-3" /> Nova
              </button>
            </div>
            <ScrollArea className="max-h-[250px]">
              <div className="px-2 pb-2 space-y-0.5">
                {conversas.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversa(c.id)}
                    className={`group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-xs ${
                      conversaAtiva === c.id
                        ? "bg-brand-light text-foreground"
                        : "text-muted-foreground hover:bg-surface"
                    }`}
                  >
                    <MessageSquare className="h-3 w-3 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{c.titulo}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletarConversa(c.id); }}
                      className="p-0.5 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
                {conversas.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma conversa ainda</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {displayMessages.map((msg, i) =>
                msg.role === "assistant" ? (
                  <div key={msg.id || i} className="flex items-end gap-2">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
                      M
                    </div>
                    <div className="max-w-[85%] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground leading-relaxed">
                      {parseMessageWithCharts(msg.content).map((segment, si) =>
                        segment.type === "chart" ? (
                          <MirandaChart key={si} data={segment.data} />
                        ) : segment.type === "download" ? (
                          <DownloadCard key={si} filename={segment.data.filename} size={segment.data.size} url={segment.data.url} />
                        ) : segment.type === "generate_pdf" ? (
                          <PdfGeneratorCard key={si} data={
                            pesquisaResult && segment.data.__pdf_type === "proposta_completa"
                              ? {
                                  ...segment.data,
                                  personalizacao: pesquisaResult.personalizacao,
                                  perfil_cliente: pesquisaResult.perfil,
                                }
                              : segment.data
                          } />
                        ) : segment.type === "pesquisa_cliente" ? (
                          <PesquisaClienteCard key={si} data={segment.data} onResult={(r) => setPesquisaResult(r)} />
                        ) : segment.type === "proposta_criada" ? (
                          <PropostaCard key={si} slug={segment.data.slug} clienteNome={segment.data.cliente_nome} linkPublico={segment.data.link} pdfUrl={segment.data.pdf_url} pdfNome={segment.data.pdf_nome} economiaMensal={segment.data.economia_mensal} economiaPercentual={segment.data.economia_percentual} />
                        ) : (
                          <MirandaMarkdown key={si} content={segment.content} />
                        )
                      )}
                      {streaming && i === displayMessages.length - 1 && msg.role === "assistant" && <BlinkingCursor />}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id || i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {currentAction && streaming && (
                <div className="flex items-end gap-2 animate-msg-in">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
                    M
                  </div>
                  <ActionIndicator action={currentAction} />
                </div>
              )}

              {showSuggestions && !conversaAtiva && (
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
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-4 py-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKey}
            placeholder="Pergunte para a Miranda..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-[120px] leading-5 py-1.5"
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
