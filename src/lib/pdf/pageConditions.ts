import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MARSALA, SAND, TEXT_BODY, TEXT_MUTED, WHITE, M, CW } from "./constants";
import { safeText, splitOperatorProduct, type DadosProposta } from "./helpers";
import { drawInnerHeader, drawSectionTitle } from "./drawUtils";

export function drawConditionsAndBenefits(doc: jsPDF, dados: DadosProposta) {
  const { operadora, produto } = splitOperatorProduct(dados);
  drawInnerHeader(doc, "Condições e benefícios", dados);

  let y = 38;

  // ── Condições da Simulação ──
  drawSectionTitle(doc, "Condições da Simulação", y);
  y += 10;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Item", "Detalhe"]],
    body: [
      ["Operadora", safeText(operadora)],
      ["Produto", safeText(produto)],
      ["Acomodação", safeText(dados.acomodacao)],
      ["Odontológico", safeText(dados.odontologico)],
      ["Compra de carência", safeText(dados.compra_carencia)],
      ["Faixas etárias / idades", safeText(dados.idades)],
      ["Vidas", safeText(dados.vidas)],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── Condições Comerciais ──
  drawSectionTitle(doc, "Condições Comerciais", y);
  y += 10;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Cláusula", "Detalhe"]],
    body: [
      ["Vigência do contrato", "12 meses com renovação automática"],
      ["Reajuste", "Anual, conforme índice da ANS e sinistralidade"],
      ["Carência", safeText(dados.compra_carencia) !== "—" ? `Compra de carência: ${dados.compra_carencia}` : "Conforme regras da operadora"],
      ["Forma de pagamento", "Boleto bancário ou débito em conta"],
      ["Dia de vencimento", "A definir no ato da implantação"],
      ["Coparticipação", "Conforme tabela do produto contratado"],
      ["Inclusão de dependentes", "Cônjuge, filhos até 24 anos (universitários) e enteados"],
      ["Portabilidade", "Aceita conforme regulamentação ANS"],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: CW - 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ── Benefícios e Diferenciais ──
  drawSectionTitle(doc, "Benefícios e Diferenciais", y);
  y += 10;

  const beneficios = [
    ["Rede credenciada premium", "Acesso a hospitais, clínicas e laboratórios de referência nacional"],
    ["Telemedicina 24h", "Atendimento médico remoto a qualquer hora, sem custo adicional"],
    ["Programa de bem-estar", "Descontos em academias, farmácias e plataformas de saúde mental"],
    ["Gestão de saúde", "Acompanhamento de crônicos e programas preventivos"],
    ["Atendimento dedicado", "Canal exclusivo para RH com gestor de conta dedicado"],
    ["App do beneficiário", "Carteirinha digital, agendamento e autorização pelo aplicativo"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Benefício", "Descrição"]],
    body: beneficios,
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { textColor: TEXT_BODY, fontSize: 8.5 },
    alternateRowStyles: { fillColor: SAND },
    styles: { cellPadding: 3.2 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: CW - 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("* Benefícios sujeitos à disponibilidade do produto e operadora selecionados.", M, y);
}
