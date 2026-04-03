import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Beneficiario {
  nome: string;
  idade: number;
  valor_atual: number;
  alternativas: { plano: string; operadora: string; valor: number }[];
}

export interface Consolidacao {
  plano: string;
  operadora: string;
  total_iof: number;
  reducao_mensal: number;
  reducao_anual: number;
  percentual_reducao: number;
}

export interface DadosComparativo {
  titulo: string;
  plano_atual: { nome: string; operadora: string };
  beneficiarios: Beneficiario[];
  consolidacao: Consolidacao[];
  data_referencia: string;
  observacoes_gerais?: string;
}

export type TemplateStyle = "executivo" | "detalhado" | "apresentacao";

/* ── Design Tokens ── */
const MARSALA: [number, number, number] = [149, 82, 81];
const MARSALA_DARK: [number, number, number] = [120, 60, 59];
const LIGHT_BG: [number, number, number] = [245, 237, 236];
const CREAM_BG: [number, number, number] = [252, 249, 248];
const GRAY_BG: [number, number, number] = [248, 248, 249];
const BORDER_COLOR: [number, number, number] = [228, 228, 231];
const TEXT_DARK: [number, number, number] = [39, 39, 42];
const TEXT_BODY: [number, number, number] = [63, 63, 70];
const TEXT_GRAY: [number, number, number] = [113, 113, 122];
const GREEN: [number, number, number] = [22, 163, 74];
const GREEN_BG: [number, number, number] = [240, 253, 244];
const WHITE: [number, number, number] = [255, 255, 255];

// Blue theme for "apresentacao"
const BLUE: [number, number, number] = [37, 99, 235];
const BLUE_DARK: [number, number, number] = [29, 78, 186];
const BLUE_BG: [number, number, number] = [239, 246, 255];
const NAVY: [number, number, number] = [15, 23, 42];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const CW = PAGE_W - 2 * M;

function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/* ══════════════════════════════════════════════
   TEMPLATE: EXECUTIVO (padrão marsala - resumido)
   ══════════════════════════════════════════════ */

function gerarExecutivo(doc: jsPDF, dados: DadosComparativo): void {
  addCoverPage(doc, dados, MARSALA, MARSALA_DARK);

  doc.addPage();
  addHeader(doc, MARSALA, MARSALA_DARK);
  let y = 22;

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Comparativo de planos · ${dados.data_referencia}`, M, y);
  y += 6;

  y = sectionTitle(doc, y, "1", "Resumo Executivo", MARSALA);

  // Executive summary cards
  const totalAtual = dados.beneficiarios.reduce((s, b) => s + b.valor_atual, 0);
  const melhor = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  const summaryCards = [
    { label: "CUSTO ATUAL MENSAL", value: fmt(totalAtual) },
    { label: "MELHOR ALTERNATIVA", value: melhor ? fmt(melhor.total_iof) : "—" },
    { label: "ECONOMIA MENSAL", value: melhor && melhor.reducao_mensal > 0 ? fmt(melhor.reducao_mensal) : "—" },
    { label: "ECONOMIA ANUAL", value: melhor && melhor.reducao_anual > 0 ? fmt(melhor.reducao_anual) : "—" },
  ];

  const cardW = (CW - 9) / 4;
  summaryCards.forEach((card, i) => {
    const cx = M + i * (cardW + 3);
    doc.setFillColor(...CREAM_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, y, cardW, 20, 1.5, 1.5, "FD");

    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.text(card.label, cx + 3, y + 7);

    doc.setTextColor(...MARSALA);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, cx + 3, y + 15);
  });
  y += 28;

  // Consolidação table only (executivo is summary-focused)
  y = sectionTitle(doc, y, "2", "Consolidação — Economia Projetada", MARSALA);
  y = addConsolidacaoTable(doc, y, dados, MARSALA);

  // Highlight card
  y = addHighlightCard(doc, y, dados);

  // Observações
  y = addObservacoes(doc, y, dados, MARSALA);
}

/* ══════════════════════════════════════════════
   TEMPLATE: DETALHADO (marsala - todas as tabelas)
   ══════════════════════════════════════════════ */

function gerarDetalhado(doc: jsPDF, dados: DadosComparativo): void {
  addCoverPage(doc, dados, MARSALA, MARSALA_DARK);

  doc.addPage();
  addHeader(doc, MARSALA, MARSALA_DARK);
  let y = 22;

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Comparativo de planos · ${dados.data_referencia}`, M, y);
  y += 6;

  // Section 1: Vida a vida
  y = sectionTitle(doc, y, "1", "Comparativo Vida a Vida", MARSALA);
  y = addBeneficiariosTable(doc, y, dados, MARSALA);

  // Section 2: Consolidação
  y = ensureSpace(doc, y, 60, MARSALA, MARSALA_DARK);
  y = sectionTitle(doc, y, "2", "Consolidação — Economia Projetada", MARSALA);
  y = addConsolidacaoTable(doc, y, dados, MARSALA);

  // Highlight card
  y = addHighlightCard(doc, y, dados);

  // Section 3: Observações do documento
  if (dados.observacoes_gerais) {
    y = ensureSpace(doc, y, 40, MARSALA, MARSALA_DARK);
    y = sectionTitle(doc, y, "3", "Informações Adicionais do Comparativo", MARSALA);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_BODY);
    const lines = doc.splitTextToSize(dados.observacoes_gerais, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 3.5 + 6;
  }

  // Section 4: Observações padrão
  const secNum = dados.observacoes_gerais ? "4" : "3";
  y = addObservacoes(doc, y, dados, MARSALA, secNum);
}

/* ══════════════════════════════════════════════
   TEMPLATE: APRESENTAÇÃO (azul, moderno, para cliente)
   ══════════════════════════════════════════════ */

function gerarApresentacao(doc: jsPDF, dados: DadosComparativo): void {
  // Cover with blue theme
  addCoverPage(doc, dados, BLUE, BLUE_DARK);

  // Page 2: Impact summary (big numbers)
  doc.addPage();
  addHeader(doc, BLUE, BLUE_DARK);
  let y = 24;

  const totalAtual = dados.beneficiarios.reduce((s, b) => s + b.valor_atual, 0);
  const melhor = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  // Big headline
  doc.setTextColor(...NAVY);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Impacto Financeiro", M, y);
  y += 4;

  doc.setFillColor(...BLUE);
  doc.rect(M, y, 40, 1.5, "F");
  y += 10;

  // Big number cards (2x2 grid)
  const bigCards = [
    { label: "Custo Atual", value: fmt(totalAtual), color: TEXT_DARK },
    { label: "Melhor Proposta", value: melhor ? fmt(melhor.total_iof) : "—", color: BLUE },
    { label: "Economia Mensal", value: melhor && melhor.reducao_mensal > 0 ? fmt(melhor.reducao_mensal) : "—", color: GREEN },
    { label: "Economia Anual", value: melhor && melhor.reducao_anual > 0 ? fmt(melhor.reducao_anual) : "—", color: GREEN },
  ];

  const bigCardW = (CW - 8) / 2;
  const bigCardH = 35;
  bigCards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (bigCardW + 8);
    const cy = y + row * (bigCardH + 6);

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, bigCardW, bigCardH, 3, 3, "FD");

    // Top accent
    doc.setFillColor(...(card.color as [number, number, number]));
    doc.rect(cx + 8, cy, bigCardW - 16, 2, "F");

    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.label.toUpperCase(), cx + bigCardW / 2, cy + 14, { align: "center" });

    doc.setTextColor(...(card.color as [number, number, number]));
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, cx + bigCardW / 2, cy + 26, { align: "center" });
  });
  y += (bigCardH + 6) * 2 + 8;

  // Reduction percentage highlight
  if (melhor && melhor.percentual_reducao > 0) {
    doc.setFillColor(...BLUE_BG);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, 22, 2, 2, "FD");

    doc.setTextColor(...BLUE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Redução de ${fmtPct(melhor.percentual_reducao)}`, PAGE_W / 2, y + 9, { align: "center" });

    doc.setTextColor(...TEXT_BODY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Migrando para ${melhor.plano} (${melhor.operadora})`,
      PAGE_W / 2, y + 17, { align: "center" }
    );
    y += 30;
  }

  // Page 3: Tables
  doc.addPage();
  addHeader(doc, BLUE, BLUE_DARK);
  y = 22;

  y = sectionTitle(doc, y, "1", "Detalhamento por Beneficiário", BLUE);
  y = addBeneficiariosTable(doc, y, dados, BLUE);

  y = ensureSpace(doc, y, 60, BLUE, BLUE_DARK);
  y = sectionTitle(doc, y, "2", "Consolidação de Alternativas", BLUE);
  y = addConsolidacaoTable(doc, y, dados, BLUE);

  y = addObservacoes(doc, y, dados, BLUE, "3");
}

/* ═══════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════ */

function addHeader(doc: jsPDF, primary: [number, number, number], dark: [number, number, number]) {
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setFillColor(...dark);
  doc.rect(0, 14, PAGE_W, 1.5, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M, 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma Inteligente para Corretoras", 38, 10);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 10;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.line(M, y - 2, PAGE_W - M, y - 2);

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Cora — Plataforma Inteligente para Corretoras", M, y + 1);

  const now = new Date();
  doc.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}  |  Página ${pageNum} de ${totalPages}`,
    PAGE_W - M, y + 1, { align: "right" }
  );
}

function addCoverPage(doc: jsPDF, dados: DadosComparativo, primary: [number, number, number], dark: [number, number, number]) {
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 140, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 8; i++) {
    doc.line(PAGE_W - 60 + i * 8, 0, PAGE_W - 20 + i * 8, 140);
  }

  doc.setTextColor(...WHITE);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M + 2, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma Inteligente para Corretoras", M + 2, 48);

  doc.setLineWidth(0.8);
  doc.line(M + 2, 55, M + 50, 55);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO", M + 2, 75);
  doc.text("COMPARATIVO", M + 2, 85);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("DE PLANOS DE SAÚDE", M + 2, 94);

  doc.setFontSize(11);
  doc.text(`Referência: ${dados.data_referencia}`, M + 2, 110);

  // Bottom white
  doc.setFillColor(...WHITE);
  doc.rect(0, 140, PAGE_W, PAGE_H - 140, "F");
  doc.setFillColor(...dark);
  doc.rect(0, 140, PAGE_W, 2, "F");

  let y = 160;
  const numBeneficiarios = dados.beneficiarios.length;
  const numAlternativas = dados.beneficiarios[0]?.alternativas.length || 0;
  const melhor = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  const cards = [
    { label: "Plano Atual", value: dados.plano_atual.nome, sub: dados.plano_atual.operadora },
    { label: "Beneficiários", value: numBeneficiarios.toString(), sub: "vidas analisadas" },
    { label: "Alternativas", value: numAlternativas.toString(), sub: "planos comparados" },
    { label: "Maior Economia", value: melhor && melhor.percentual_reducao > 0 ? fmtPct(melhor.percentual_reducao) : "—", sub: melhor && melhor.percentual_reducao > 0 ? melhor.plano : "" },
  ];

  const cardW = (CW - 12) / 2;
  const cardH = 28;

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cardW + 12);
    const cy = y + row * (cardH + 8);

    doc.setFillColor(...CREAM_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");

    doc.setFillColor(...primary);
    doc.rect(cx, cy + 4, 3, cardH - 8, "F");

    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label.toUpperCase(), cx + 8, cy + 9);

    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, cx + 8, cy + 18);

    if (card.sub) {
      doc.setTextColor(...TEXT_GRAY);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(card.sub, cx + 8, cy + 24);
    }
  });

  y = PAGE_H - 30;
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Este documento é confidencial e foi gerado automaticamente pela plataforma Cora.", PAGE_W / 2, y, { align: "center" });
  doc.text("Distribuição restrita ao destinatário autorizado.", PAGE_W / 2, y + 5, { align: "center" });
}

function sectionTitle(doc: jsPDF, y: number, num: string, title: string, color: [number, number, number]): number {
  doc.setFillColor(...color);
  doc.roundedRect(M, y, CW, 8, 1.5, 1.5, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${num}. ${title}`, M + 5, y + 5.5);
  return y + 13;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, primary?: [number, number, number], dark?: [number, number, number]): number {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    if (primary && dark) addHeader(doc, primary, dark);
    return 22;
  }
  return y;
}

function addBeneficiariosTable(doc: jsPDF, y: number, dados: DadosComparativo, primary: [number, number, number]): number {
  const altNames = dados.beneficiarios[0]?.alternativas.map(
    (a) => `${a.plano}\n(${a.operadora})`
  ) || [];

  const headers = [
    "Beneficiário",
    "Idade",
    `${dados.plano_atual.nome}\n(${dados.plano_atual.operadora})`,
    ...altNames,
  ];

  const body: string[][] = dados.beneficiarios.map((b) => [
    b.nome,
    b.idade.toString(),
    fmt(b.valor_atual),
    ...b.alternativas.map((a) => (a.valor > 0 ? fmt(a.valor) : "—")),
  ]);

  const totalAtual = dados.beneficiarios.reduce((s, b) => s + b.valor_atual, 0);
  const totalAlts = (dados.beneficiarios[0]?.alternativas || []).map((_, i) => {
    const sum = dados.beneficiarios.reduce((s, b) => s + (b.alternativas[i]?.valor || 0), 0);
    return sum > 0 ? fmt(sum) : "—";
  });
  body.push(["TOTAL", "", fmt(totalAtual), ...totalAlts]);

  autoTable(doc, {
    startY: y,
    head: [headers],
    body,
    margin: { left: M, right: M },
    styles: {
      fontSize: 7,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: BORDER_COLOR as any,
      lineWidth: 0.15,
      textColor: TEXT_BODY as any,
    },
    headStyles: {
      fillColor: primary as any,
      textColor: WHITE as any,
      fontStyle: "bold",
      halign: "center",
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
    },
    alternateRowStyles: { fillColor: GRAY_BG as any },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 38 },
      1: { halign: "center", cellWidth: 14 },
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1 && data.section === "body") {
        data.cell.styles.fillColor = LIGHT_BG as any;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = primary as any;
      }
      if (data.cell.text[0] === "—" && data.section === "body") {
        data.cell.styles.textColor = [180, 180, 180] as any;
        data.cell.styles.fontStyle = "italic";
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 12;
}

function addConsolidacaoTable(doc: jsPDF, y: number, dados: DadosComparativo, primary: [number, number, number]): number {
  const consolHeaders = ["Plano Alternativo", "Total c/ IOF (Mensal)", "Redução Mensal", "Redução Anual", "% Redução"];
  const consolBody = dados.consolidacao.map((c) => [
    `${c.plano}\n(${c.operadora})`,
    fmt(c.total_iof),
    c.reducao_mensal > 0 ? `- ${fmt(c.reducao_mensal)}` : "—",
    c.reducao_anual > 0 ? `- ${fmt(c.reducao_anual)}` : "—",
    c.percentual_reducao > 0 ? fmtPct(c.percentual_reducao) : "—",
  ]);

  const melhorEconomia = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  autoTable(doc, {
    startY: y,
    head: [consolHeaders],
    body: consolBody,
    margin: { left: M, right: M },
    styles: {
      fontSize: 7,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: BORDER_COLOR as any,
      lineWidth: 0.15,
      textColor: TEXT_BODY as any,
    },
    headStyles: {
      fillColor: primary as any,
      textColor: WHITE as any,
      fontStyle: "bold",
      halign: "center",
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
    },
    alternateRowStyles: { fillColor: GRAY_BG as any },
    columnStyles: {
      0: { halign: "left", cellWidth: 42 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const text = data.cell.text[0];
        if (text && text !== "—") {
          data.cell.styles.textColor = GREEN as any;
          data.cell.styles.fontStyle = "bold";
        }
      }
      if ((data.column.index === 2 || data.column.index === 3) && data.section === "body") {
        const text = data.cell.text[0];
        if (text && text.startsWith("-")) {
          data.cell.styles.textColor = GREEN as any;
        }
      }
      if (
        data.section === "body" &&
        melhorEconomia &&
        data.row.index === dados.consolidacao.indexOf(melhorEconomia)
      ) {
        data.cell.styles.fillColor = GREEN_BG as any;
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

function addHighlightCard(doc: jsPDF, y: number, dados: DadosComparativo): number {
  const melhorEconomia = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  if (!melhorEconomia || melhorEconomia.percentual_reducao <= 0) return y;

  if (y + 50 > PAGE_H - 20) return y; // skip if no space on page

  const cardW = CW;
  const innerMargin = 10;

  doc.setFillColor(...GREEN_BG);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);

  const headline = `Economia de ${fmtPct(melhorEconomia.percentual_reducao)} identificada`;
  const texto = `Migrando para ${melhorEconomia.plano} (${melhorEconomia.operadora}), a empresa terá uma redução de ${fmt(melhorEconomia.reducao_mensal)} por mês, representando ${fmt(melhorEconomia.reducao_anual)} de economia anual.`;
  const lines = doc.splitTextToSize(texto, cardW - innerMargin * 2);
  const cardHeight = 22 + lines.length * 4;

  doc.roundedRect(M, y, cardW, cardHeight, 2, 2, "FD");

  doc.setFillColor(...GREEN);
  doc.rect(M, y + 4, 3, cardHeight - 8, "F");

  doc.setFillColor(...GREEN);
  doc.circle(M + innerMargin + 4, y + 10, 4, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("✓", M + innerMargin + 2.2, y + 12);

  doc.setTextColor(...GREEN);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(headline, M + innerMargin + 12, y + 12);

  doc.setTextColor(...TEXT_BODY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(lines, M + innerMargin, y + 20);

  return y + cardHeight + 8;
}

function addObservacoes(doc: jsPDF, y: number, dados: DadosComparativo, primary: [number, number, number], secNum = "3"): number {
  y = ensureSpace(doc, y, 40, primary, primary);
  y = sectionTitle(doc, y, secNum, "Observações Importantes", primary);

  const obs = [
    "Os valores apresentados são estimativas baseadas nas tabelas vigentes e podem sofrer alterações.",
    "A análise não substitui a proposta formal da operadora, sendo um instrumento de apoio à decisão.",
    "Recomenda-se verificar rede credenciada, carências e coberturas de cada plano antes da migração.",
    "Valores incluem IOF quando aplicável. Taxas administrativas podem variar conforme negociação.",
  ];

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_BODY);

  obs.forEach((text) => {
    y = ensureSpace(doc, y, 8, primary, primary);
    doc.setFillColor(...primary);
    doc.circle(M + 3, y - 1, 1, "F");
    const wrappedLines = doc.splitTextToSize(text, CW - 10);
    doc.text(wrappedLines, M + 7, y);
    y += wrappedLines.length * 3.5 + 3;
  });

  return y;
}

/* ── Main Export ── */
export function gerarRelatorioComparativo(dados: DadosComparativo, template: TemplateStyle = "detalhado"): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  switch (template) {
    case "executivo":
      gerarExecutivo(doc, dados);
      break;
    case "apresentacao":
      gerarApresentacao(doc, dados);
      break;
    case "detalhado":
    default:
      gerarDetalhado(doc, dados);
      break;
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc.output("blob");
}
