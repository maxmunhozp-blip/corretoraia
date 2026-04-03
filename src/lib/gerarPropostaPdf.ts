import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface DadosProposta {
  cliente_nome: string;
  empresa?: string;
  vidas?: number;
  valor_estimado?: number;
  valor_atual?: number;
  economia_mensal?: number;
  percentual_economia?: number;
  operadora?: string;
  produto?: string;
  status?: string;
  responsavel?: string;
  observacoes?: string;
  acomodacao?: string;
  odontologico?: string;
  compra_carencia?: string;
  idades?: string;
  created_at?: string;
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
const BORDER: [number, number, number] = [228, 228, 231];

const M = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CW = PAGE_W - 2 * M;

function fmt(v?: number): string {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function drawHeader(doc: jsPDF, subtitle: string, refDate: string) {
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 36, "F");
  doc.setFillColor(...MARSALA_DARK);
  doc.rect(0, 36, PAGE_W, 2.5, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text("CORA", M, 16);
  doc.setFontSize(12);
  doc.text(subtitle, M, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(format(new Date(), "dd/MM/yyyy"), PAGE_W - M, 15, { align: "right" });
  doc.text(`Ref: ${refDate}`, PAGE_W - M, 24, { align: "right" });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...MARSALA);
  doc.text(title, M, y);
}

function drawInfoGrid(doc: jsPDF, dados: DadosProposta, y: number) {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(M, y, CW, 52, 4, 4, "F");

  const left = [
    ["Cliente", safeText(dados.cliente_nome)],
    ["Empresa", safeText(dados.empresa || dados.cliente_nome)],
    ["Operadora / Produto", safeText([dados.operadora, dados.produto].filter(Boolean).join(" — "))],
    ["Vidas", safeText(dados.vidas)],
  ];

  const right = [
    ["Valor estimado", fmt(dados.valor_estimado)],
    ["Status", safeText(dados.status).toUpperCase()],
    ["Responsável", safeText(dados.responsavel)],
    ["Data de geração", dados.created_at ? format(new Date(dados.created_at), "dd/MM/yyyy HH:mm") : format(new Date(), "dd/MM/yyyy HH:mm")],
  ];

  let ly = y + 9;
  let ry = y + 9;
  const leftLabelX = M + 7;
  const leftValueX = M + 42;
  const rightLabelX = M + CW / 2 + 3;
  const rightValueX = rightLabelX + 40;

  for (const [label, value] of left) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(label, leftLabelX, ly);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(value), leftValueX, ly);
    ly += 11;
  }

  for (const [label, value] of right) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(label, rightLabelX, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(value), rightValueX, ry);
    ry += 11;
  }
}

function drawHighlightCard(doc: jsPDF, title: string, value: string, subvalue: string, y: number) {
  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y, CW, 34, 4, 4, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title, M + 8, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text(value, M + 8, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subvalue, PAGE_W - M - 8, y + 24, { align: "right" });
}

export function gerarPropostaPdf(dados: DadosProposta): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dataRef = dados.created_at || new Date().toISOString();

  drawHeader(doc, "Proposta Comercial", dataRef);

  let y = 52;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Proposta — ${safeText(dados.cliente_nome)}`, M, y);
  y += 10;

  drawInfoGrid(doc, dados, y);
  y += 64;

  drawSectionTitle(doc, "Resumo Executivo", y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_BODY);

  const resumo = [
    `Apresentamos a simulação comercial para ${safeText(dados.cliente_nome)}, considerando a alternativa ${safeText([dados.operadora, dados.produto].filter(Boolean).join(" — "))}.`,
    dados.vidas ? `A proposta considera ${dados.vidas} vida(s) na composição analisada.` : null,
    dados.compra_carencia ? `Condição de carência: ${dados.compra_carencia}.` : null,
    dados.acomodacao ? `Acomodação: ${dados.acomodacao}.` : null,
    dados.odontologico ? `Odontológico: ${dados.odontologico}.` : null,
  ].filter(Boolean).join(" ");

  const resumoLines = doc.splitTextToSize(resumo || "Simulação comercial preparada pela Miranda com base nos dados disponíveis na conversa.", CW);
  doc.text(resumoLines, M, y);
  y += resumoLines.length * 4.8 + 8;

  drawHighlightCard(
    doc,
    "Valor Mensal Estimado",
    fmt(dados.valor_estimado),
    dados.vidas && dados.valor_estimado ? `${fmt(dados.valor_estimado / dados.vidas)}/vida` : "Valor por vida indisponível",
    y
  );
  y += 44;

  const financeiro = [
    ["Valor atual", fmt(dados.valor_atual)],
    ["Valor proposto", fmt(dados.valor_estimado)],
    ["Economia mensal", fmt(dados.economia_mensal)],
    ["Redução estimada", typeof dados.percentual_economia === "number" ? `${dados.percentual_economia.toFixed(1)}%` : "—"],
  ];

  drawSectionTitle(doc, "Detalhamento Financeiro", y);
  y += 4;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Indicador", "Valor"]],
    body: financeiro,
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_BODY },
    alternateRowStyles: { fillColor: CREAM_BG },
    styles: { cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  drawSectionTitle(doc, "Condições da Simulação", y);
  y += 4;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Item", "Detalhe"]],
    body: [
      ["Operadora", safeText(dados.operadora)],
      ["Produto", safeText(dados.produto)],
      ["Acomodação", safeText(dados.acomodacao)],
      ["Odontológico", safeText(dados.odontologico)],
      ["Compra de carência", safeText(dados.compra_carencia)],
      ["Faixas etárias / idades", safeText(dados.idades)],
      ["Status da proposta", safeText(dados.status)],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_BODY },
    alternateRowStyles: { fillColor: CREAM_BG },
    styles: { cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > 225) {
    doc.addPage();
    drawHeader(doc, "Proposta Comercial", dataRef);
    y = 52;
  }

  drawSectionTitle(doc, "Observações e Recomendações", y);
  y += 7;
  const observacoes = dados.observacoes || "Esta proposta foi gerada automaticamente com base nas informações compartilhadas na conversa. Recomendamos validar as condições finais, carências, rede credenciada e vigência com a operadora antes do envio comercial.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_BODY);
  const obsLines = doc.splitTextToSize(observacoes, CW);
  doc.text(obsLines, M, y);
  y += obsLines.length * 4.8 + 10;

  drawSectionTitle(doc, "Próximos Passos", y);
  y += 4;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Etapa", "Ação recomendada"]],
    body: [
      ["1", "Confirmar os dados cadastrais e composição de vidas do cliente."],
      ["2", "Validar condições comerciais, carências e documentação necessária."],
      ["3", "Apresentar a proposta ao cliente com destaque para economia e cobertura."],
      ["4", "Formalizar aceite e seguir com implantação junto à operadora."],
    ],
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_BODY },
    alternateRowStyles: { fillColor: CREAM_BG },
    styles: { cellPadding: 3 },
  });

  const footerY = PAGE_H - 10;
  doc.setDrawColor(...BORDER);
  doc.line(M, footerY - 6, PAGE_W - M, footerY - 6);
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Documento gerado automaticamente pela Miranda IA · Cora", M, footerY);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), PAGE_W - M, footerY, { align: "right" });

  return doc.output("blob");
}
