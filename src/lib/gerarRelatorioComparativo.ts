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
}

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

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18; // margin
const CW = PAGE_W - 2 * M; // content width

function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/* ── Header Bar ── */
function addHeader(doc: jsPDF) {
  // Top gradient bar
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 14, PAGE_W, 1.5, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M, 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma Inteligente para Corretoras", 38, 10);
}

/* ── Footer ── */
function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 10;

  // Thin line
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

/* ── Cover Page ── */
function addCoverPage(doc: jsPDF, dados: DadosComparativo) {
  // Full marsala background top half
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 140, "F");

  // Subtle pattern - diagonal accent line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 8; i++) {
    doc.line(PAGE_W - 60 + i * 8, 0, PAGE_W - 20 + i * 8, 140);
  }

  // Logo area
  doc.setTextColor(...WHITE);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M + 2, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma Inteligente para Corretoras", M + 2, 48);

  // Divider
  doc.setLineWidth(0.8);
  doc.line(M + 2, 55, M + 50, 55);

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO", M + 2, 75);
  doc.text("COMPARATIVO", M + 2, 85);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("DE PLANOS DE SAÚDE", M + 2, 94);

  // Reference date
  doc.setFontSize(11);
  doc.text(`Referência: ${dados.data_referencia}`, M + 2, 110);

  // Bottom half - white area with info cards
  doc.setFillColor(...WHITE);
  doc.rect(0, 140, PAGE_W, PAGE_H - 140, "F");

  // Accent line at transition
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 140, PAGE_W, 2, "F");

  let y = 160;

  // Info grid
  const numBeneficiarios = dados.beneficiarios.length;
  const numAlternativas = dados.beneficiarios[0]?.alternativas.length || 0;
  const melhor = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  const cards = [
    { label: "Plano Atual", value: `${dados.plano_atual.nome}`, sub: dados.plano_atual.operadora },
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

    // Left accent bar
    doc.setFillColor(...MARSALA);
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

  // Confidentiality note
  y = PAGE_H - 30;
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Este documento é confidencial e foi gerado automaticamente pela plataforma Cora.", PAGE_W / 2, y, { align: "center" });
  doc.text("Distribuição restrita ao destinatário autorizado.", PAGE_W / 2, y + 5, { align: "center" });
}

/* ── Section Title ── */
function sectionTitle(doc: jsPDF, y: number, num: string, title: string): number {
  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y, CW, 8, 1.5, 1.5, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${num}. ${title}`, M + 5, y + 5.5);
  return y + 13;
}

/* ── Ensure Y fits ── */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    addHeader(doc);
    return 22;
  }
  return y;
}

/* ── Main Export ── */
export function gerarRelatorioComparativo(dados: DadosComparativo): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ─── Page 1: Cover ───
  addCoverPage(doc, dados);

  // ─── Page 2: Comparativo Vida a Vida ───
  doc.addPage();
  addHeader(doc);

  let y = 22;

  // Subtitle
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Comparativo de planos · ${dados.data_referencia}`, M, y);
  y += 6;

  y = sectionTitle(doc, y, "1", "Comparativo Vida a Vida");

  // Build beneficiary table
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

  // Total row
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
      fillColor: MARSALA as any,
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
      // Total row styling
      if (data.row.index === body.length - 1 && data.section === "body") {
        data.cell.styles.fillColor = LIGHT_BG as any;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = MARSALA as any;
      }
      // Dash styling
      if (data.cell.text[0] === "—" && data.section === "body") {
        data.cell.styles.textColor = [180, 180, 180] as any;
        data.cell.styles.fontStyle = "italic";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ─── Section 2: Consolidação ───
  y = ensureSpace(doc, y, 60);

  y = sectionTitle(doc, y, "2", "Consolidação — Economia Projetada");

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
      fillColor: MARSALA as any,
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
      // Green highlight for savings percentages
      if (data.column.index === 4 && data.section === "body") {
        const text = data.cell.text[0];
        if (text && text !== "—") {
          data.cell.styles.textColor = GREEN as any;
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Savings values in green
      if ((data.column.index === 2 || data.column.index === 3) && data.section === "body") {
        const text = data.cell.text[0];
        if (text && text.startsWith("-")) {
          data.cell.styles.textColor = GREEN as any;
        }
      }
      // Best option row highlight
      if (
        data.section === "body" &&
        melhorEconomia &&
        data.row.index === dados.consolidacao.indexOf(melhorEconomia)
      ) {
        data.cell.styles.fillColor = GREEN_BG as any;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ─── Highlight Card ───
  if (melhorEconomia && melhorEconomia.percentual_reducao > 0) {
    y = ensureSpace(doc, y, 50);

    const cardW = CW;
    const innerMargin = 10;

    // Card background
    doc.setFillColor(...GREEN_BG);
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.6);

    const headline = `Economia de ${fmtPct(melhorEconomia.percentual_reducao)} identificada`;
    const texto = `Migrando para ${melhorEconomia.plano} (${melhorEconomia.operadora}), a empresa terá uma redução de ${fmt(melhorEconomia.reducao_mensal)} por mês, representando ${fmt(melhorEconomia.reducao_anual)} de economia anual.`;
    const lines = doc.splitTextToSize(texto, cardW - innerMargin * 2);
    const cardHeight = 22 + lines.length * 4;

    doc.roundedRect(M, y, cardW, cardHeight, 2, 2, "FD");

    // Green accent bar on left
    doc.setFillColor(...GREEN);
    doc.rect(M, y + 4, 3, cardHeight - 8, "F");

    // Icon area - checkmark circle
    doc.setFillColor(...GREEN);
    doc.circle(M + innerMargin + 4, y + 10, 4, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("✓", M + innerMargin + 2.2, y + 12);

    // Headline
    doc.setTextColor(...GREEN);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(headline, M + innerMargin + 12, y + 12);

    // Body text
    doc.setTextColor(...TEXT_BODY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(lines, M + innerMargin, y + 20);

    y += cardHeight + 8;
  }

  // ─── Section 3: Observações ───
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, y, "3", "Observações Importantes");

  const obs = [
    "Os valores apresentados são estimativas baseadas nas tabelas vigentes e podem sofrer alterações.",
    "A análise não substitui a proposta formal da operadora, sendo um instrumento de apoio à decisão.",
    "Recomenda-se verificar rede credenciada, carências e coberturas de cada plano antes da migração.",
    "Valores incluem IOF quando aplicável. Taxas administrativas podem variar conforme negociação.",
  ];

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_BODY);

  obs.forEach((text, i) => {
    y = ensureSpace(doc, y, 8);

    // Bullet
    doc.setFillColor(...MARSALA);
    doc.circle(M + 3, y - 1, 1, "F");

    const wrappedLines = doc.splitTextToSize(text, CW - 10);
    doc.text(wrappedLines, M + 7, y);
    y += wrappedLines.length * 3.5 + 3;
  });

  // ─── Add headers and footers to all pages (except cover) ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i === 1) {
      // Cover footer only
      addFooter(doc, i, totalPages);
    } else {
      addFooter(doc, i, totalPages);
    }
  }

  return doc.output("blob");
}
