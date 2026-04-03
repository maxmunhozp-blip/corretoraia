import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MARSALA, MARSALA_DARK, SAND, TEXT_DARK, TEXT_BODY, TEXT_MUTED, WHITE, M, CW, PAGE_W } from "./constants";
import { safeText, fmtDate, type DadosProposta } from "./helpers";
import { drawInnerHeader, drawSectionTitle } from "./drawUtils";

export function drawNarrativeAndSignature(doc: jsPDF, dados: DadosProposta) {
  drawInnerHeader(doc, "Narrativa, próximos passos e assinatura", dados);

  let y = 38;

  // ── Narrativa ──
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

  // ── Observações ──
  drawSectionTitle(doc, "Observações e recomendações", y);
  y += 13;
  const observacoes = doc.splitTextToSize(
    dados.observacoes || "Esta proposta foi gerada automaticamente com base nas informações compartilhadas na conversa. Recomendamos validar carências, rede credenciada, vigência e documentação final com a operadora antes do envio comercial.",
    CW,
  );
  doc.text(observacoes, M, y);
  y += observacoes.length * 5 + 10;

  // ── Próximos Passos ──
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
    columnStyles: {
      0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: CW - 16 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 18;

  // ── Assinatura Comercial ──
  drawSectionTitle(doc, "Assinatura Comercial", y);
  y += 18;

  doc.setDrawColor(...MARSALA_DARK);
  doc.setLineWidth(0.5);
  const sigLineW = 72;
  const sigLeftX = M + 10;
  const sigRightX = PAGE_W - M - sigLineW - 10;

  // Left signature
  doc.line(sigLeftX, y, sigLeftX + sigLineW, y);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(safeText(dados.responsavel), sigLeftX + sigLineW / 2, y + 6, { align: "center" });
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Consultor(a) comercial · Cora", sigLeftX + sigLineW / 2, y + 11, { align: "center" });

  // Right signature
  doc.line(sigRightX, y, sigRightX + sigLineW, y);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(safeText(dados.empresa || dados.cliente_nome), sigRightX + sigLineW / 2, y + 6, { align: "center" });
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Cliente / Representante legal", sigRightX + sigLineW / 2, y + 11, { align: "center" });

  y += 22;

  // Location / date box
  doc.setFillColor(...SAND);
  doc.roundedRect(M, y, CW, 26, 4, 4, "F");
  doc.setTextColor(...TEXT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Local: ________________________________________", M + 8, y + 9);
  doc.text(`Data: ${fmtDate(undefined, "dd/MM/yyyy")}`, M + 8, y + 18);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("Proposta válida por 15 dias a partir da data de emissão.", PAGE_W - M - 8, y + 18, { align: "right" });
}
