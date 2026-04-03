import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou a Miranda, sua assistente de IA. Posso buscar clientes, verificar status de propostas, responder sobre regras das operadoras e consultar a base de conhecimento. Como posso ajudar?",
};

const quickSuggestions = [
  "Ver propostas pendentes",
  "Clientes inadimplentes",
  "Regras da SulAmérica PME",
  "Resumo do dia",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/miranda-chat`;

/* ── Typing dots ── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-msg-in">
      <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
        M
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/* ── Markdown-lite renderer (bold only) ── */
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

async function streamChat(
  messages: { role: string; content: string }[],
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
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
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* partial JSON, skip */ }
      }
    }
    onDone();
  } catch (e) {
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
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setShowSuggestions(false);
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setTyping(true);

    let assistantSoFar = "";

    const apiMessages = newMessages
      .filter((m) => m !== INITIAL_MESSAGE)
      .map((m) => ({ role: m.role, content: m.content }));

    streamChat(
      apiMessages,
      (chunk) => {
        assistantSoFar += chunk;
        const current = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
          }
          return [...prev, { role: "assistant", content: current }];
        });
        setTyping(false);
      },
      () => {
        setTyping(false);
      },
      (errorMsg) => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${errorMsg}` },
        ]);
      },
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
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-brand">
          <Sparkles className="h-5 w-5 text-brand-foreground" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-foreground">Miranda</p>
            <p className="text-xs text-brand-foreground/70">Assistente IA</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-brand-foreground/10 transition-colors"
          >
            <X className="h-4 w-4 text-brand-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="flex items-end gap-2 animate-msg-in">
                <div className="h-7 w-7 shrink-0 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-brand-foreground">
                  M
                </div>
                <div className="max-w-[80%] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground leading-relaxed">
                  {renderContent(msg.content)}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end animate-msg-in">
                <div className="max-w-[80%] rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground leading-relaxed">
                  {msg.content}
                </div>
              </div>
            )
          )}

          {showSuggestions && (
            <div className="flex flex-wrap gap-2 animate-msg-in">
              {quickSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-brand-light hover:border-brand transition-colors duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

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
            disabled={!input.trim() || typing}
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
