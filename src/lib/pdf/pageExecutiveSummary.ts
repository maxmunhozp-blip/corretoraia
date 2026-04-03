import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MARSALA, SAND, CREAM, TEXT_DARK, TEXT_BODY, TEXT_MUTED, WHITE, BORDER, M, CW, PAGE_W } from "./constants";
import { safeText, fmtCurrency, fmtPercent, fmtDate, splitOperatorProduct, getEconomy, type DadosProposta } from "./helpers";
import { drawInnerHeader, drawSectionTitle } from "./drawUtils";

function drawInsightCard(doc: jsPDF, dados: DadosProposta, y: number) {
  const economyValue = getEconomy(dados);
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

export function drawExecutiveSummary(doc: jsPDF, dados: DadosProposta) {
  const { headline } = splitOperatorProduct(dados);
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
      ["Economia mensal", fmtCurrency(getEconomy(dados))],
      ["Redução estimada", fmtPercent(dados.percentual_economia)],
      ["Custo por vida", dados.vidas && dados.valor_estimado ? fmtCurrency(dados.valor_estimado / dados.vidas) : "—"],
      ["Custo anual estimado", dados.valor_estimado ? fmtCurrency(dados.valor_estimado * 12) : "—"],
      ["Economia anual projetada", getEconomy(dados) ? fmtCurrency(getEconomy(dados)! * 12) : "—"],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
  });
}
