import jsPDF from "jspdf";
import { format } from "date-fns";
import { MARSALA, MARSALA_DARK, CREAM, WHITE, TEXT_MUTED, BORDER, PAGE_W, PAGE_H, M, CW } from "./constants";
import { safeText, type DadosProposta } from "./helpers";

export function drawInnerHeader(doc: jsPDF, title: string, dados: DadosProposta) {
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

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y - 4, 18, 3, 1.5, 1.5, "F");
  doc.setTextColor(...MARSALA_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, M, y + 5);
}

export function drawFooter(doc: jsPDF, cover = false, pageNum?: number, totalPages?: number) {
  const footerY = PAGE_H - 10;
  doc.setDrawColor(...(cover ? WHITE : BORDER));
  doc.line(M, footerY - 5, PAGE_W - M, footerY - 5);
  doc.setTextColor(...(cover ? WHITE : TEXT_MUTED));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Documento gerado automaticamente pela Miranda IA · Cora", M, footerY);

  const rightText = pageNum && totalPages
    ? `${format(new Date(), "dd/MM/yyyy HH:mm")}  ·  ${pageNum}/${totalPages}`
    : format(new Date(), "dd/MM/yyyy HH:mm");
  doc.text(rightText, PAGE_W - M, footerY, { align: "right" });
}
