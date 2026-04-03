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

const MARSALA: [number, number, number] = [149, 82, 81];
const LIGHT_BG: [number, number, number] = [245, 237, 236];
const GRAY_BG: [number, number, number] = [244, 244, 245];
const BORDER_COLOR: [number, number, number] = [228, 228, 231];
const TEXT_GRAY: [number, number, number] = [113, 113, 122];

function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function addHeader(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, pageWidth, 16, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", 15, 11);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma Inteligente para Corretoras", 40, 11);

  doc.setFillColor(...GRAY_BG);
  doc.rect(0, 16, pageWidth, 2, "F");
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number) {
  const y = pageHeight - 8;
  doc.setDrawColor(...MARSALA);
  doc.setLineWidth(0.3);
  doc.line(15, y - 3, pageWidth - 15, y - 3);

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");

  doc.text("Cora — Plataforma Inteligente para Corretoras", 15, y);
  doc.text("www.cora.com.br", pageWidth / 2, y, { align: "center" });

  const now = new Date();
  doc.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - 15, y, { align: "right" }
  );
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 15, y + 4, { align: "right" });
}

export function gerarRelatorioComparativo(dados: DadosComparativo): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Page 1
  addHeader(doc, pageWidth);

  // Title
  let y = 26;
  doc.setTextColor(...MARSALA);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO COMPARATIVO DE PLANOS DE SAÚDE", pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Referência: ${dados.data_referencia}`, pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Section 1 — Comparativo por Beneficiário
  y += 6;
  doc.setFillColor(...MARSALA);
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("1. Comparativo Vida a Vida", margin + 4, y + 5);
  y += 12;

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
    ...b.alternativas.map((a) => (a.valor > 0 ? fmt(a.valor) : "-")),
  ]);

  // Total row
  const totalAtual = dados.beneficiarios.reduce((s, b) => s + b.valor_atual, 0);
  const totalAlts = (dados.beneficiarios[0]?.alternativas || []).map((_, i) => {
    const sum = dados.beneficiarios.reduce((s, b) => s + (b.alternativas[i]?.valor || 0), 0);
    return sum > 0 ? fmt(sum) : "-";
  });
  body.push(["TOTAL", "", fmt(totalAtual), ...totalAlts]);

  autoTable(doc, {
    startY: y,
    head: [headers],
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: BORDER_COLOR as any,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: LIGHT_BG as any,
      textColor: MARSALA as any,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { textColor: [60, 60, 60] as any },
    alternateRowStyles: { fillColor: [250, 250, 250] as any },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      1: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1 && data.section === "body") {
        data.cell.styles.fillColor = LIGHT_BG as any;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.cell.text[0] === "-" && data.section === "body") {
        data.cell.styles.textColor = [160, 160, 160] as any;
        data.cell.styles.fontStyle = "italic";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // New page if needed
  if (y > pageHeight - 80) {
    doc.addPage();
    addHeader(doc, pageWidth);
    y = 24;
  }

  // Section 2 — Consolidação
  doc.setFillColor(...MARSALA);
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("2. Consolidação — Economia Projetada", margin + 4, y + 5);
  y += 12;

  const consolHeaders = ["Plano", "Total c/ IOF", "Redução Mensal", "Redução Anual", "% Redução"];
  const consolBody = dados.consolidacao.map((c) => [
    `${c.plano}\n(${c.operadora})`,
    fmt(c.total_iof),
    c.reducao_mensal > 0 ? fmt(c.reducao_mensal) : "-",
    c.reducao_anual > 0 ? fmt(c.reducao_anual) : "-",
    c.percentual_reducao > 0 ? `${c.percentual_reducao.toFixed(1)}%` : "-",
  ]);

  const melhorEconomia = dados.consolidacao.reduce(
    (best, c) => (c.percentual_reducao > (best?.percentual_reducao || 0) ? c : best),
    dados.consolidacao[0]
  );

  autoTable(doc, {
    startY: y,
    head: [consolHeaders],
    body: consolBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: BORDER_COLOR as any,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: LIGHT_BG as any,
      textColor: MARSALA as any,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { textColor: [60, 60, 60] as any },
    columnStyles: {
      0: { halign: "left" },
      4: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const text = data.cell.text[0];
        if (text && text !== "-") {
          data.cell.styles.textColor = [22, 163, 74] as any;
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (
        data.section === "body" &&
        melhorEconomia &&
        data.row.index === dados.consolidacao.indexOf(melhorEconomia)
      ) {
        data.cell.styles.fillColor = LIGHT_BG as any;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Highlight card
  if (melhorEconomia && melhorEconomia.percentual_reducao > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      addHeader(doc, pageWidth);
      y = 24;
    }

    const texto = `Migrando para ${melhorEconomia.plano} (${melhorEconomia.operadora}), a empresa terá uma redução de ${fmt(melhorEconomia.reducao_mensal)} por mês, representando ${fmt(melhorEconomia.reducao_anual)} de economia anual — uma redução de ${melhorEconomia.percentual_reducao.toFixed(1)}% nos custos com saúde.`;
    const lines = doc.splitTextToSize(texto, contentWidth - 12);
    const cardHeight = 14 + lines.length * 4;

    doc.setDrawColor(...MARSALA);
    doc.setLineWidth(0.5);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

    doc.setTextColor(...MARSALA);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Maior Economia Identificada", margin + 6, y + 8);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(lines, margin + 6, y + 14);
  }

  // Add headers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pageWidth);
    addFooter(doc, i, totalPages, pageWidth, pageHeight);
  }

  return doc.output("blob");
}
