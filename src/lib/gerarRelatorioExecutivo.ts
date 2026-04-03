import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface DadosRelatorioExecutivo {
  periodo: string;
  propostas_total: number;
  propostas_aprovadas: number;
  taxa_conversao: number;
  valor_total_aprovado: number;
  ticket_medio: number;
  alertas: { total: number; alto: number; medio: number; baixo: number };
  top_vendedores: { nome: string; vendas: number; valor_total: number }[];
  propostas_por_status: { status: string; count: number }[];
  usuario: string;
}

const MARSALA: [number, number, number] = [149, 82, 81];
const MARSALA_DARK: [number, number, number] = [120, 60, 59];
const LIGHT_BG: [number, number, number] = [245, 237, 236];
const CREAM_BG: [number, number, number] = [252, 249, 248];
const TEXT_DARK: [number, number, number] = [39, 39, 42];
const TEXT_BODY: [number, number, number] = [63, 63, 70];
const TEXT_GRAY: [number, number, number] = [113, 113, 122];
const WHITE: [number, number, number] = [255, 255, 255];
const GREEN: [number, number, number] = [22, 163, 74];
const GREEN_BG: [number, number, number] = [240, 253, 244];
const RED: [number, number, number] = [220, 38, 38];
const RED_BG: [number, number, number] = [254, 242, 242];
const AMBER: [number, number, number] = [217, 119, 6];
const AMBER_BG: [number, number, number] = [255, 251, 235];
const BORDER: [number, number, number] = [228, 228, 231];

const M = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CW = PAGE_W - 2 * M;

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function drawKpiCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, sub?: string, color?: [number, number, number]
) {
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_GRAY);
  doc.text(label, x + 6, y + 9);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...(color || TEXT_DARK));
  doc.text(value, x + 6, y + 22);

  if (sub) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_GRAY);
    doc.text(sub, x + 6, y + 28);
  }
}

export function gerarRelatorioExecutivo(dados: DadosRelatorioExecutivo): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const now = new Date();

  // ─── Cover Header ───
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 40, "F");
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 40, PAGE_W, 2, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M, 16);
  doc.setFontSize(14);
  doc.text("Relatório Executivo", M, 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${dados.periodo}`, M, 34);
  doc.text(format(now, "dd/MM/yyyy HH:mm"), PAGE_W - M, 16, { align: "right" });
  doc.text(`Gerado por: ${dados.usuario}`, PAGE_W - M, 24, { align: "right" });

  let y = 52;

  // ─── KPI Cards ───
  const cardW = (CW - 9) / 4;
  const cardH = 32;

  drawKpiCard(doc, M, y, cardW, cardH, "Propostas", String(dados.propostas_total), `${dados.propostas_aprovadas} aprovadas`);
  drawKpiCard(doc, M + cardW + 3, y, cardW, cardH, "Taxa Conversão", `${dados.taxa_conversao}%`, undefined, dados.taxa_conversao >= 30 ? GREEN : RED);
  drawKpiCard(doc, M + (cardW + 3) * 2, y, cardW, cardH, "Receita Aprovada", fmt(dados.valor_total_aprovado));
  drawKpiCard(doc, M + (cardW + 3) * 3, y, cardW, cardH, "Ticket Médio", fmt(dados.ticket_medio));

  y += cardH + 10;

  // ─── Alertas Summary ───
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...MARSALA);
  doc.text("Alertas Ativos", M, y);
  y += 6;

  const alertW = (CW - 6) / 3;
  const alertH = 20;

  // Alto
  doc.setFillColor(...RED_BG);
  doc.roundedRect(M, y, alertW, alertH, 2, 2, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...RED);
  doc.text(String(dados.alertas.alto), M + 6, y + 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Críticos", M + 6, y + 16);

  // Médio
  doc.setFillColor(...AMBER_BG);
  doc.roundedRect(M + alertW + 3, y, alertW, alertH, 2, 2, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text(String(dados.alertas.medio), M + alertW + 9, y + 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Médios", M + alertW + 9, y + 16);

  // Baixo
  doc.setFillColor(...GREEN_BG);
  doc.roundedRect(M + (alertW + 3) * 2, y, alertW, alertH, 2, 2, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text(String(dados.alertas.baixo), M + (alertW + 3) * 2 + 6, y + 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Baixos", M + (alertW + 3) * 2 + 6, y + 16);

  y += alertH + 10;

  // ─── Propostas por Status ───
  if (dados.propostas_por_status.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MARSALA);
    doc.text("Propostas por Status", M, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Status", "Quantidade", "% do Total"]],
      body: dados.propostas_por_status.map((p) => [
        p.status.charAt(0).toUpperCase() + p.status.slice(1).replace(/_/g, " "),
        String(p.count),
        dados.propostas_total > 0 ? `${((p.count / dados.propostas_total) * 100).toFixed(1)}%` : "0%",
      ]),
      headStyles: { fillColor: MARSALA, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: TEXT_BODY },
      alternateRowStyles: { fillColor: CREAM_BG },
      styles: { cellPadding: 3 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Top Vendedores ───
  if (dados.top_vendedores.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MARSALA);
    doc.text("Top Vendedores", M, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["#", "Vendedor", "Vendas", "Receita Gerada"]],
      body: dados.top_vendedores.map((v, i) => [
        String(i + 1),
        v.nome,
        String(v.vendas),
        fmt(v.valor_total),
      ]),
      headStyles: { fillColor: MARSALA, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: TEXT_BODY },
      alternateRowStyles: { fillColor: CREAM_BG },
      styles: { cellPadding: 3 },
    });
  }

  // Footer
  const footerY = PAGE_H - 10;
  doc.setDrawColor(...BORDER);
  doc.line(M, footerY - 6, PAGE_W - M, footerY - 6);
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório gerado automaticamente pela Miranda IA · Cora", M, footerY);
  doc.text(format(now, "dd/MM/yyyy HH:mm"), PAGE_W - M, footerY, { align: "right" });

  return doc.output("blob");
}
