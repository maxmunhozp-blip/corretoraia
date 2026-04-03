import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MARSALA, SAND, TEXT_BODY, TEXT_MUTED, WHITE, M, CW } from "./constants";
import { safeText, type DadosProposta } from "./helpers";
import { drawInnerHeader, drawSectionTitle } from "./drawUtils";

export function drawCoverageTable(doc: jsPDF, dados: DadosProposta) {
  drawInnerHeader(doc, "Tabela de coberturas", dados);

  let y = 38;
  drawSectionTitle(doc, "Coberturas Assistenciais", y);
  y += 10;

  const hasOdonto = safeText(dados.odontologico) !== "—";
  const acomod = safeText(dados.acomodacao) !== "—" ? dados.acomodacao! : "Apartamento";

  const coberturas = [
    ["Consultas médicas", "Rede referenciada", "Ilimitado", "Todas as especialidades"],
    ["Exames laboratoriais", "Rede referenciada", "Ilimitado", "Sangue, urina, fezes, hormônios"],
    ["Exames de imagem", "Rede referenciada", "Conforme rol ANS", "Raio-X, ultrassom, tomografia, ressonância"],
    ["Internações clínicas", acomod, "Ilimitado", "UTI, semi-intensiva, enfermaria"],
    ["Internações cirúrgicas", acomod, "Ilimitado", "Inclui materiais e medicamentos"],
    ["Pronto-socorro / Urgência", "24h", "Ilimitado", "Atendimento imediato"],
    ["Terapias (fisio, fono, TO)", "Rede referenciada", "Conforme rol ANS", "Sessões conforme prescrição"],
    ["Saúde mental", "Rede referenciada", "Conforme rol ANS", "Psicologia e psiquiatria"],
    ["Obstetrícia", "Rede referenciada", "Conforme contrato", "Pré-natal, parto e puerpério"],
    ["Odontológico", hasOdonto ? "Incluso" : "Não incluso", hasOdonto ? "Conforme contrato" : "—", hasOdonto ? "Limpeza, restauração, canal" : "—"],
    ["Telemedicina", "Plataforma digital", "Ilimitado", "Clínico geral e especialidades"],
    ["Medicina preventiva", "Programa corporativo", "Anual", "Check-up e campanhas de saúde"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Cobertura", "Acesso", "Limite", "Observação"]],
    body: coberturas,
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 7.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 2.8 },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold" },
      1: { cellWidth: 36 },
      2: { cellWidth: 36 },
      3: { cellWidth: CW - 116 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  const disclaimer = doc.splitTextToSize(
    "* Coberturas ilustrativas baseadas no rol mínimo obrigatório da ANS (Agência Nacional de Saúde Suplementar) e nas condições informadas durante a simulação. Limites, rede credenciada, carências e exclusões devem ser confirmados no contrato final da operadora.",
    CW,
  );
  doc.text(disclaimer, M, y);
}
