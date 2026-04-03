import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface DadosProposta {
  cliente_nome: string;
  empresa?: string;
  vidas?: number;
  valor_estimado?: number;
  valor_atual?: number;
  economia_mensal?: number;
  percentual_economia?: number;
  operadora?: string;
  produto?: string;
  status?: string;
  responsavel?: string;
  observacoes?: string;
  acomodacao?: string;
  odontologico?: string;
  compra_carencia?: string;
  idades?: string;
  created_at?: string;
}

const MARSALA: [number, number, number] = [149, 82, 81];
const MARSALA_DARK: [number, number, number] = [106, 53, 52];
const SAND: [number, number, number] = [244, 237, 233];
const CREAM: [number, number, number] = [252, 249, 248];
const TEXT_DARK: [number, number, number] = [39, 39, 42];
const TEXT_BODY: [number, number, number] = [63, 63, 70];
const TEXT_MUTED: [number, number, number] = [113, 113, 122];
const WHITE: [number, number, number] = [255, 255, 255];
const GREEN: [number, number, number] = [22, 163, 74];
const BORDER: [number, number, number] = [228, 228, 231];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;
const CW = PAGE_W - M * 2;

function fmtCurrency(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPercent(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function safeText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function fmtDate(value?: string, pattern = "dd/MM/yyyy HH:mm") {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? format(new Date(), pattern) : format(date, pattern);
}

function splitOperatorProduct(dados: DadosProposta) {
  const rawOperadora = (dados.operadora || "").trim();
  const rawProduto = (dados.produto || "").trim();

  if (rawOperadora.includes("—") && (!rawProduto || rawOperadora.includes(rawProduto))) {
    const [operadora, produto] = rawOperadora.split("—").map((item) => item.trim());
    return {
      operadora: operadora || rawOperadora,
      produto: rawProduto || produto || rawProduto,
      headline: rawOperadora,
    };
  }

  return {
    operadora: rawOperadora,
    produto: rawProduto,
    headline: [rawOperadora, rawProduto].filter(Boolean).join(" — ") || "Proposta personalizada",
  };
}

function drawCover(doc: jsPDF, dados: DadosProposta) {
  const { operadora, headline } = splitOperatorProduct(dados);
  const clientName = safeText(dados.empresa || dados.cliente_nome);
  const economyValue = dados.economia_mensal ?? (typeof dados.valor_atual === "number" && typeof dados.valor_estimado === "number"
    ? dados.valor_atual - dados.valor_estimado
    : undefined);

  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  doc.setFillColor(...MARSALA);
  doc.roundedRect(10, 10, PAGE_W - 20, PAGE_H - 20, 8, 8, "F");

  doc.setFillColor(...CREAM);
  doc.roundedRect(M, 78, CW, 176, 8, 8, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CORA", M, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Proposta corporativa gerada pela Miranda", M, 31);

  doc.setFillColor(...WHITE);
  doc.roundedRect(M, 40, 58, 14, 7, 7, "F");
  doc.setTextColor(...MARSALA_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(safeText(dados.status).toUpperCase(), M + 29, 49.2, { align: "center" });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Proposta", M, 66);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Comercial", M + 57, 66);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const clientLines = doc.splitTextToSize(clientName, CW - 28);
  doc.text(clientLines, M + 10, 102);

  const headlineY = 120 + (clientLines.length - 1) * 7;
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const headlineLines = doc.splitTextToSize(headline, CW - 28);
  doc.text(headlineLines, M + 10, headlineY);

  const summaryY = headlineY + headlineLines.length * 6 + 12;
  doc.setTextColor(...TEXT_BODY);
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(
    "Simulação comercial pronta para apresentação executiva, com foco em redução de custo, posicionamento premium e próximos passos para conversão da conta.",
    CW - 28,
  );
  doc.text(summaryLines, M + 10, summaryY);

  const cardsTop = 175;
  const cardW = (CW - 12) / 3;
  const metrics = [
    { title: "Valor mensal", value: fmtCurrency(dados.valor_estimado), accent: MARSALA },
    { title: "Economia estimada", value: fmtCurrency(economyValue), accent: GREEN },
    { title: "Vidas", value: safeText(dados.vidas), accent: MARSALA_DARK },
  ];

  metrics.forEach((metric, index) => {
    const x = M + index * (cardW + 6);
    doc.setFillColor(...SAND);
    doc.roundedRect(x, cardsTop, cardW, 34, 5, 5, "F");
    doc.setFillColor(...metric.accent);
    doc.roundedRect(x + 4, cardsTop + 4, 14, 3, 1.5, 1.5, "F");
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(metric.title, x + 6, cardsTop + 15);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(metric.value, x + 6, cardsTop + 26);
  });

  doc.setDrawColor(...BORDER);
  doc.line(M + 10, 224, PAGE_W - M - 10, 224);

  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Operadora", M + 10, 236);
  doc.text("Acomodação", M + 72, 236);
  doc.text("Gerado em", PAGE_W - M - 10, 236, { align: "right" });

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(safeText(operadora), M + 10, 245);
  doc.text(safeText(dados.acomodacao), M + 72, 245);
  doc.text(fmtDate(dados.created_at, "dd/MM/yyyy"), PAGE_W - M - 10, 245, { align: "right" });
}

function drawInnerHeader(doc: jsPDF, title: string, dados: DadosProposta) {
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 24, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CORA", M, 15);
  doc.setFontSize(11);
  doc.text(title, PAGE_W / 2, 15, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(safeText(dados.empresa || dados.cliente_nome), PAGE_W - M, 15, { align: "right" });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y - 4, 18, 3, 1.5, 1.5, "F");
  doc.setTextColor(...MARSALA_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, M, y + 5);
}

function drawInsightCard(doc: jsPDF, dados: DadosProposta, y: number) {
  const economyValue = dados.economia_mensal ?? (typeof dados.valor_atual === "number" && typeof dados.valor_estimado === "number"
    ? dados.valor_atual - dados.valor_estimado
    : undefined);

  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y, CW, 34, 5, 5, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Leitura comercial", M + 8, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(fmtCurrency(economyValue), M + 8, y + 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("de economia mensal potencial", M + 8, y + 30);
  doc.text(`Redução estimada: ${fmtPercent(dados.percentual_economia)}`, PAGE_W - M - 8, y + 23, { align: "right" });
}

function drawFooter(doc: jsPDF, cover = false) {
  const footerY = PAGE_H - 10;
  doc.setDrawColor(...(cover ? WHITE : BORDER));
  doc.line(M, footerY - 5, PAGE_W - M, footerY - 5);
  doc.setTextColor(...(cover ? WHITE : TEXT_MUTED));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Documento gerado automaticamente pela Miranda IA · Cora", M, footerY);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), PAGE_W - M, footerY, { align: "right" });
}

export function gerarPropostaPdf(dados: DadosProposta): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { operadora, produto, headline } = splitOperatorProduct(dados);

  drawCover(doc, dados);

  doc.addPage();
  drawInnerHeader(doc, "Resumo executivo", dados);

  let y = 38;
  drawSectionTitle(doc, "Visão Geral da Oportunidade", y);
  y += 14;

  doc.setTextColor(...TEXT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const resumo = doc.splitTextToSize(
    `A proposta para ${safeText(dados.empresa || dados.cliente_nome)} foi estruturada para apresentar uma alternativa ${headline.toLowerCase()} com argumento comercial orientado a ganho financeiro, manutenção de valor percebido e avanço rápido para implantação.`,
    CW,
  );
  doc.text(resumo, M, y);
  y += resumo.length * 5 + 8;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "plain",
    body: [
      [{ content: "Cliente", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, safeText(dados.cliente_nome)],
      [{ content: "Empresa", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, safeText(dados.empresa || dados.cliente_nome)],
      [{ content: "Operadora / Produto", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, safeText(headline)],
      [{ content: "Status", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, safeText(dados.status).toUpperCase()],
      [{ content: "Responsável", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, safeText(dados.responsavel)],
      [{ content: "Data da simulação", styles: { fontStyle: "bold", textColor: TEXT_MUTED } }, fmtDate(dados.created_at)],
    ],
    styles: {
      fontSize: 9,
      textColor: TEXT_DARK,
      fillColor: CREAM,
      cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 46, fillColor: SAND },
      1: { cellWidth: CW - 46 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  drawInsightCard(doc, dados, y);
  y += 44;

  drawSectionTitle(doc, "Detalhamento Financeiro", y);
  y += 10;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Indicador", "Valor"]],
    body: [
      ["Valor atual", fmtCurrency(dados.valor_atual)],
      ["Valor proposto", fmtCurrency(dados.valor_estimado)],
      ["Economia mensal", fmtCurrency(dados.economia_mensal)],
      ["Redução estimada", fmtPercent(dados.percentual_economia)],
      ["Custo por vida", dados.vidas && dados.valor_estimado ? fmtCurrency(dados.valor_estimado / dados.vidas) : "—"],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
  });

  doc.addPage();
  drawInnerHeader(doc, "Condições, narrativa e próximos passos", dados);
  y = 38;

  drawSectionTitle(doc, "Condições da Simulação", y);
  y += 10;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Item", "Detalhe"]],
    body: [
      ["Operadora", safeText(operadora)],
      ["Produto", safeText(produto)],
      ["Acomodação", safeText(dados.acomodacao)],
      ["Odontológico", safeText(dados.odontologico)],
      ["Compra de carência", safeText(dados.compra_carencia)],
      ["Faixas etárias / idades", safeText(dados.idades)],
      ["Vidas", safeText(dados.vidas)],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  drawSectionTitle(doc, "Narrativa para apresentação", y);
  y += 13;
  doc.setTextColor(...TEXT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const narrativa = doc.splitTextToSize(
    "A recomendação comercial é posicionar esta proposta como uma evolução de eficiência: menor desembolso mensal, manutenção de percepção premium e um desenho de implantação com foco em agilidade, segurança documental e fechamento consultivo.",
    CW,
  );
  doc.text(narrativa, M, y);
  y += narrativa.length * 5 + 8;

  drawSectionTitle(doc, "Observações e recomendações", y);
  y += 13;
  const observacoes = doc.splitTextToSize(
    dados.observacoes || "Esta proposta foi gerada automaticamente com base nas informações compartilhadas na conversa. Recomendamos validar carências, rede credenciada, vigência e documentação final com a operadora antes do envio comercial.",
    CW,
  );
  doc.text(observacoes, M, y);
  y += observacoes.length * 5 + 10;

  drawSectionTitle(doc, "Próximos passos", y);
  y += 10;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Etapa", "Ação recomendada"]],
    body: [
      ["1", "Confirmar dados cadastrais, composição de vidas e vigência desejada."],
      ["2", "Validar documentação de carência e condições comerciais com a operadora."],
      ["3", "Apresentar a proposta destacando economia, posicionamento e diferenciais."],
      ["4", "Formalizar aceite e iniciar a implantação com checklist operacional."],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
  });

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    drawFooter(doc, page === 1);
  }

  return doc.output("blob");
}
