import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Sparkles, Plus, Trash2, Send, PanelRightClose, PanelRightOpen,
  FileText, BarChart3, AlertTriangle, Database, Search, RefreshCw,
  MessageSquare, Clock, Zap, Paperclip,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMirandaConversas } from "@/hooks/useMirandaConversas";
import { supabase } from "@/integrations/supabase/client";
import { MirandaMarkdown } from "@/components/MirandaMarkdown";
import { MirandaChart, parseMessageWithCharts } from "@/components/MirandaChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadCard } from "@/components/miranda/DownloadCard";
import { PdfUploadPreview, PdfUploadBubble } from "@/components/miranda/PdfUploadPreview";
import { gerarRelatorioComparativo, DadosComparativo, TemplateStyle } from "@/lib/gerarRelatorioComparativo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/miranda-chat`;
const COMPARATIVO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/miranda-gerar-comparativo`;

const quickActions = [
  { label: "Relatório do dia", icon: FileText, message: "Gere um relatório executivo completo do dia de hoje com propostas, alertas, vendas e métricas." },
  { label: "Alertas críticos", icon: AlertTriangle, message: "Liste e analise todos os alertas críticos não resolvidos. Sugira ações para cada um." },
  { label: "Análise de conversão", icon: BarChart3, message: "Faça uma análise de conversão comparando a semana atual com a anterior. Identifique tendências." },
  { label: "Clientes em risco", icon: Search, message: "Liste todos os clientes em risco de cancelamento e sugira ações de retenção." },
  { label: "Resumo de vendas", icon: Database, message: "Apresente o resumo de vendas da semana com gráficos comparativos." },
];

interface DownloadInfo {
  filename: string;
  size: number;
  url: string;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
  pdfAttachment?: { filename: string; size: string };
  download?: DownloadInfo;
}

function ActionIndicator({ action }: { action: string }) {
  const labels: Record<string, string> = {
    buscar_cliente: "Buscando dados do cliente...",
    buscar_propostas: "Buscando propostas...",
    buscar_alertas: "Verificando alertas...",
    buscar_conhecimento: "Pesquisando base de conhecimento...",
    buscar_metricas: "Calculando métricas...",
    buscar_ranking: "Analisando ranking...",
    gerando_comparativo: "Analisando PDF e extraindo dados...",
    gerando_pdf: "Gerando relatório PDF profissional...",
  };
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse px-3 py-2 rounded-lg bg-surface">
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      <span>{labels[action] || "Processando..."}</span>
    </div>
  );
}

function BlinkingCursor() {
  return <span className="inline-block w-[2px] h-[1em] bg-brand animate-pulse ml-0.5 align-text-bottom" />;
}

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
    onDone();
  } catch {
    onError("Erro de conexão com a Miranda");
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MirandaPage() {
  const { user } = useAuth();
  const {
    conversas, conversaAtiva, mensagens, loading,
    carregarMensagens, novaConversa, deletarConversa,
    salvarMensagem, atualizarTitulo, atualizarUltimaMensagem, setMensagens,
  } = useMirandaConversas();

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [hoveredConversa, setHoveredConversa] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({});
  const [pdfAttachments, setPdfAttachments] = useState<Record<string, { filename: string; size: string }>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, streaming]);

  const detectAction = (text: string) => {
    const l = text.toLowerCase();
    if (l.includes("client") || l.includes("inadimpl")) return "buscar_cliente";
    if (l.includes("propost") || l.includes("pendên")) return "buscar_propostas";
    if (l.includes("alert") || l.includes("crítico")) return "buscar_alertas";
    if (l.includes("regra") || l.includes("conhecimento") || l.includes("carência")) return "buscar_conhecimento";
    if (l.includes("ranking") || l.includes("vendedor")) return "buscar_ranking";
    return "buscar_metricas";
  };

  const handleComparativo = async (file: File, mensagem: string) => {
    setStreaming(true);
    setCurrentAction("gerando_comparativo");

    let activeConversaId = conversaAtiva;
    if (!activeConversaId) {
      activeConversaId = await novaConversa();
      if (!activeConversaId) { setStreaming(false); return; }
    }

    // Save user message with PDF info
    const userMsg = await salvarMensagem(activeConversaId, "user", mensagem || "Gera um relatório comparativo profissional com base nesse PDF");
    if (userMsg) {
      setPdfAttachments((prev) => ({ ...prev, [userMsg.id]: { filename: file.name, size: formatFileSize(file.size) } }));
    }

    // Auto-title
    if (mensagens.filter((m) => m.role === "user").length === 0) {
      atualizarTitulo(activeConversaId, `Comparativo - ${file.name.replace(".pdf", "")}`);
    }

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Call edge function
      const resp = await fetch(COMPARATIVO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ arquivo_pdf_base64: base64, mensagem }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro ao processar PDF" }));
        throw new Error(err.error);
      }

      const dados: DadosComparativo = await resp.json();
      setCurrentAction("gerando_pdf");

      // Generate PDF client-side
      const pdfBlob = gerarRelatorioComparativo(dados);
      const safeRef = dados.data_referencia
        .replace(/\//g, "_")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_\-]/g, "");
      const filename = `Relatorio_Comparativo_${safeRef}_${format(new Date(), "ddMMyyyy")}.pdf`;

      // Upload to storage
      const filePath = `comparativos/${user?.id}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("relatorios")
        .upload(filePath, pdfBlob, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw new Error("Erro ao salvar relatório: " + uploadError.message);

      const { data: urlData } = supabase.storage.from("relatorios").getPublicUrl(filePath);
      const downloadUrl = urlData.publicUrl;

      // Build summary
      const numBeneficiarios = dados.beneficiarios.length;
      const numAlternativas = dados.beneficiarios[0]?.alternativas.length || 0;
      const melhorEconomia = dados.consolidacao.reduce(
        (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
        dados.consolidacao[0]
      );

      const summary = `✅ **Relatório comparativo gerado com sucesso!**\n\nIdentifiquei **${numBeneficiarios} beneficiários** e **${numAlternativas} alternativas** de planos.\n\n${
        melhorEconomia && melhorEconomia.percentual_reducao > 0
          ? `A maior economia projetada é de **${melhorEconomia.reducao_mensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês** (**${melhorEconomia.percentual_reducao.toFixed(1)}%**) migrando para **${melhorEconomia.plano}** (${melhorEconomia.operadora}).`
          : ""
      }\n\nClique abaixo para baixar o relatório:`;

      setCurrentAction(null);

      // Save assistant message
      const assistantMsg = await salvarMensagem(activeConversaId, "assistant", summary);
      if (assistantMsg) {
        setDownloads((prev) => ({
          ...prev,
          [assistantMsg.id]: { filename, size: pdfBlob.size, url: downloadUrl },
        }));
      }

      // Log activity
      await supabase.from("atividades").insert({
        tipo: "relatorio_gerado",
        descricao: `Relatório comparativo gerado via Miranda: ${filename}`,
        autor_id: user?.id,
      });

      setStreaming(false);
    } catch (error: any) {
      setStreaming(false);
      setCurrentAction(null);
      atualizarUltimaMensagem(`⚠️ ${error.message || "Erro ao gerar relatório comparativo"}`);
      toast.error(error.message || "Erro ao gerar relatório");
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !attachedFile) || streaming) return;

    // If PDF is attached, handle as comparativo
    if (attachedFile) {
      const file = attachedFile;
      setAttachedFile(null);
      setInput("");
      await handleComparativo(file, trimmed);
      return;
    }

    if (!trimmed) return;
    setInput("");
    setCurrentAction(detectAction(trimmed));
    setStreaming(true);

    let activeConversaId = conversaAtiva;
    if (!activeConversaId) {
      activeConversaId = await novaConversa();
      if (!activeConversaId) { setStreaming(false); return; }
    }

    await salvarMensagem(activeConversaId, "user", trimmed);

    if (mensagens.filter((m) => m.role === "user").length === 0) {
      const title = trimmed.length > 50 ? trimmed.slice(0, 47) + "..." : trimmed;
      atualizarTitulo(activeConversaId, title);
    }

    const apiMessages = [...mensagens, { id: "", role: "user" as const, content: trimmed, created_at: "" }]
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
        }
      },
      (errorMsg) => {
        setStreaming(false);
        setCurrentAction(null);
        atualizarUltimaMensagem(`⚠️ ${errorMsg}`);
      },
      { usuario_id: user?.id, contexto_pagina: "/miranda" },
    );
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("PDF muito grande. Máximo: 10MB");
        return;
      }
      setAttachedFile(file);
    } else if (file) {
      toast.error("Apenas arquivos PDF são aceitos");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeTools = [
    { name: "Banco de Dados", desc: "Clientes, propostas, alertas", icon: Database },
    { name: "Base de Conhecimento", desc: "Documentos e regras", icon: Search },
    { name: "Métricas e Ranking", desc: "KPIs e performance", icon: BarChart3 },
    { name: "Gerador de Relatórios", desc: "Comparativos em PDF", icon: FileText },
    { name: "Ações", desc: "Criar alertas, atualizar dados", icon: Zap },
  ];

  return (
    <div className="flex h-[calc(100vh-0px)] bg-background -m-6">
      {/* LEFT SIDEBAR */}
      <div className="w-[280px] border-r border-border flex flex-col bg-card shrink-0">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-brand" />
            <span className="text-base font-bold text-foreground">Miranda 2.0</span>
          </div>
          <button
            onClick={() => novaConversa()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand text-brand-foreground py-2.5 text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova conversa
          </button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-4">
            {conversas.map((c) => (
              <div
                key={c.id}
                onClick={() => carregarMensagens(c.id)}
                onMouseEnter={() => setHoveredConversa(c.id)}
                onMouseLeave={() => setHoveredConversa(null)}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                  conversaAtiva === c.id
                    ? "bg-brand-light text-foreground"
                    : "text-muted-foreground hover:bg-surface"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs">{c.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {hoveredConversa === c.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deletarConversa(c.id); }}
                    className="p-1 rounded hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}
            {conversas.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa ainda</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CENTRAL CHAT */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-foreground">
              {conversaAtiva
                ? conversas.find((c) => c.id === conversaAtiva)?.titulo || "Conversa"
                : "Miranda — Assistente IA"}
            </span>
          </div>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="p-2 rounded-md hover:bg-surface transition-colors"
            title={rightPanelOpen ? "Fechar painel" : "Abrir painel"}
          >
            {rightPanelOpen ? <PanelRightClose className="h-4 w-4 text-muted-foreground" /> : <PanelRightOpen className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
            {!conversaAtiva && mensagens.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-brand-light flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-brand" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">Olá! Sou a Miranda</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Sua assistente de IA com acesso completo aos dados da Cora. Pergunte sobre clientes, propostas, métricas ou envie um PDF de comparativo para gerar relatórios profissionais.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => send(a.message)}
                      className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-light px-3 py-2 text-xs font-medium text-brand hover:bg-brand hover:text-brand-foreground transition-colors"
                    >
                      <a.icon className="h-3.5 w-3.5" />
                      {a.label}
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-light px-3 py-2 text-xs font-medium text-brand hover:bg-brand hover:text-brand-foreground transition-colors"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Comparativo PDF
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {mensagens.map((msg, i) =>
              msg.role === "assistant" ? (
                <div key={msg.id || i} className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-brand-foreground mt-0.5">
                    M
                  </div>
                  <div className="max-w-[85%] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground leading-relaxed">
                    {parseMessageWithCharts(msg.content).map((seg, si) =>
                      seg.type === "chart" ? (
                        <MirandaChart key={si} data={seg.data} />
                      ) : (
                        <MirandaMarkdown key={si} content={seg.content} />
                      )
                    )}
                    {downloads[msg.id] && (
                      <DownloadCard
                        filename={downloads[msg.id].filename}
                        size={downloads[msg.id].size}
                        url={downloads[msg.id].url}
                      />
                    )}
                    {streaming && i === mensagens.length - 1 && <BlinkingCursor />}
                  </div>
                </div>
              ) : (
                <div key={msg.id || i} className="flex justify-end">
                  <div className="max-w-[85%]">
                    {pdfAttachments[msg.id] && (
                      <PdfUploadBubble
                        filename={pdfAttachments[msg.id].filename}
                        size={pdfAttachments[msg.id].size}
                      />
                    )}
                    <div className="rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            )}

            {currentAction && streaming && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-brand-foreground">
                  M
                </div>
                <ActionIndicator action={currentAction} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="max-w-3xl mx-auto">
            {attachedFile && (
              <PdfUploadPreview file={attachedFile} onRemove={() => setAttachedFile(null)} />
            )}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming}
                className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-40 shrink-0"
                title="Anexar PDF"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={attachedFile ? "Instrução para o relatório (opcional)..." : "Pergunte para a Miranda..."}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <button
                onClick={() => send(input)}
                disabled={(!input.trim() && !attachedFile) || streaming}
                className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-40"
              >
                <Send className="h-4 w-4 text-brand-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      {rightPanelOpen && (
        <div className="w-[300px] border-l border-border flex flex-col bg-card shrink-0">
          <div className="px-4 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Contexto & Ferramentas</h3>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ferramentas ativas</p>
                <div className="space-y-2">
                  {activeTools.map((tool) => (
                    <div key={tool.name} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
                      <tool.icon className="h-4 w-4 text-brand shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{tool.name}</p>
                        <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações rápidas</p>
                <div className="space-y-1.5">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => send(a.message)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-colors text-left"
                    >
                      <a.icon className="h-3.5 w-3.5 shrink-0" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sessão</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{mensagens.length} mensagens na conversa</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
