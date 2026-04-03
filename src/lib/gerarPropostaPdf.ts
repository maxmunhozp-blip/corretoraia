import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface DadosProposta {
  cliente_nome: string;
  empresa?: string;
  vidas: number;
  valor_estimado?: number;
  operadora?: string;
  status: string;
  responsavel?: string;
  observacoes?: string;
  created_at: string;
}

const MARSALA: [number, number, number] = [149, 82, 81];
const MARSALA_DARK: [number, number, number] = [120, 60, 59];
const LIGHT_BG: [number, number, number] = [245, 237, 236];
const TEXT_DARK: [number, number, number] = [39, 39, 42];
const TEXT_BODY: [number, number, number] = [63, 63, 70];
const TEXT_GRAY: [number, number, number] = [113, 113, 122];
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER: [number, number, number] = [228, 228, 231];

const M = 18;
const PAGE_W = 210;
const CW = PAGE_W - 2 * M;

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarPropostaPdf(dados: DadosProposta): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header bar
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 32, PAGE_W, 2, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CORA", M, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta Comercial", M, 22);

  doc.setFontSize(8);
  doc.text(format(new Date(), "dd/MM/yyyy"), PAGE_W - M, 15, { align: "right" });
  doc.text(`Ref: ${dados.created_at}`, PAGE_W - M, 22, { align: "right" });

  let y = 44;

  // Title
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Proposta — ${dados.cliente_nome}`, M, y);
  y += 10;

  // Info card
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(M, y, CW, 42, 3, 3, "F");

  const infoLeft = [
    ["Cliente", dados.cliente_nome || "—"],
    ["Empresa", dados.empresa || "—"],
    ["Operadora", dados.operadora || "—"],
    ["Vidas", dados.vidas != null ? String(dados.vidas) : "—"],
  ];
  const infoRight = [
    ["Valor Estimado", dados.valor_estimado ? fmt(dados.valor_estimado) : "—"],
    ["Status", (dados.status || "—").toUpperCase()],
    ["Responsável", dados.responsavel || "—"],
    ["Data Criação", dados.created_at ? format(new Date(dados.created_at), "dd/MM/yyyy HH:mm") : "—"],
  ];

  let iy = y + 8;
  doc.setFontSize(8);
  for (const [label, value] of infoLeft) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_GRAY);
    doc.text(label, M + 6, iy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, M + 40, iy);
    iy += 8;
  }

  iy = y + 8;
  const rightX = M + CW / 2 + 4;
  for (const [label, value] of infoRight) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_GRAY);
    doc.text(label, rightX, iy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, rightX + 40, iy);
    iy += 8;
  }

  y += 50;

  // Observações
  if (dados.observacoes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MARSALA);
    doc.text("Observações", M, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_BODY);
    const lines = doc.splitTextToSize(dados.observacoes, CW - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 4.5 + 6;
  }

  // Value highlight
  if (dados.valor_estimado) {
    doc.setFillColor(...MARSALA);
    doc.roundedRect(M, y, CW, 28, 3, 3, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Valor Mensal Estimado", M + 8, y + 10);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(dados.valor_estimado), M + 8, y + 22);

    if (dados.vidas > 0 && dados.valor_estimado > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${fmt(dados.valor_estimado / dados.vidas)}/vida`,
        PAGE_W - M - 8,
        y + 22,
        { align: "right" }
      );
    }
  }

  // Footer
  const footerY = 287;
  doc.setDrawColor(...BORDER);
  doc.line(M, footerY - 6, PAGE_W - M, footerY - 6);
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Documento gerado automaticamente pela Miranda IA · Cora", M, footerY);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), PAGE_W - M, footerY, { align: "right" });

  return doc.output("blob");
}
