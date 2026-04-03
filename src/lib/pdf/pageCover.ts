import jsPDF from "jspdf";
import { MARSALA, MARSALA_DARK, SAND, CREAM, TEXT_DARK, TEXT_BODY, TEXT_MUTED, WHITE, GREEN, BORDER, PAGE_W, PAGE_H, M, CW } from "./constants";
import { safeText, fmtCurrency, fmtDate, splitOperatorProduct, getEconomy, type DadosProposta } from "./helpers";

export function drawCover(doc: jsPDF, dados: DadosProposta) {
  const { operadora, headline } = splitOperatorProduct(dados);
  const clientName = safeText(dados.empresa || dados.cliente_nome);
  const economyValue = getEconomy(dados);
  const corretoraName = dados.corretora_nome || "CORA";

  // Background
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(...MARSALA);
  doc.roundedRect(10, 10, PAGE_W - 20, PAGE_H - 20, 8, 8, "F");

  // Content card
  doc.setFillColor(...CREAM);
  doc.roundedRect(M, 78, CW, 176, 8, 8, "F");

  // Top branding — corretora name (logo would need async image loading)
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(corretoraName.toUpperCase(), M, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Proposta corporativa gerada pela Miranda", M, 31);

  // Status badge
  doc.setFillColor(...WHITE);
  doc.roundedRect(M, 40, 58, 14, 7, 7, "F");
  doc.setTextColor(...MARSALA_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(safeText(dados.status).toUpperCase(), M + 29, 49.2, { align: "center" });

  // Title
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Proposta", M, 66);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Comercial", M + 57, 66);

  // Client name
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const clientLines = doc.splitTextToSize(clientName, CW - 28);
  doc.text(clientLines, M + 10, 102);

  // CNPJ do cliente (if available)
  let headlineStartY = 120 + (clientLines.length - 1) * 7;
  if (dados.cnpj) {
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`CNPJ: ${dados.cnpj}`, M + 10, headlineStartY);
    headlineStartY += 8;
  }

  // Headline
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const headlineLines = doc.splitTextToSize(headline, CW - 28);
  doc.text(headlineLines, M + 10, headlineStartY);

  // Summary
  const summaryY = headlineStartY + headlineLines.length * 6 + 12;
  doc.setTextColor(...TEXT_BODY);
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(
    "Simulação comercial pronta para apresentação executiva, com foco em redução de custo, posicionamento premium e próximos passos para conversão da conta.",
    CW - 28,
  );
  doc.text(summaryLines, M + 10, summaryY);

  // Metric cards
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

  // Bottom details
  doc.setDrawColor(...BORDER);
  doc.line(M + 10, 224, PAGE_W - M - 10, 224);

  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Operadora", M + 10, 236);
  doc.text("Acomodação", M + 72, 236);
  doc.text("Vigência", PAGE_W - M - 10, 236, { align: "right" });

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(safeText(operadora), M + 10, 245);
  doc.text(safeText(dados.acomodacao), M + 72, 245);

  // Vigência value
  const vigenciaText = dados.vigencia || fmtDate(dados.created_at, "dd/MM/yyyy");
  doc.text(vigenciaText, PAGE_W - M - 10, 245, { align: "right" });
}
