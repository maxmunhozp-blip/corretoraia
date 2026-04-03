import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PropostaCompleta, PlanoOfertado, CorretoraInfo } from "./types";

const PAGE_W = 210;
const PAGE_H = 297;
const M = 15;
const CW = PAGE_W - M * 2;

const MARSALA: [number, number, number] = [149, 82, 81];
const MARSALA_DARK: [number, number, number] = [122, 63, 62];
const CREAM: [number, number, number] = [245, 237, 236];
const SURFACE: [number, number, number] = [248, 248, 248];
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT_DARK: [number, number, number] = [24, 24, 27];
const TEXT_BODY: [number, number, number] = [63, 63, 70];
const TEXT_MUTED: [number, number, number] = [113, 113, 122];
const BORDER: [number, number, number] = [228, 228, 231];
const GREEN: [number, number, number] = [22, 163, 74];

function safe(v?: string | number | null): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtCurrency(v?: number): string {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function drawHeader(doc: jsPDF, corretora: CorretoraInfo) {
  doc.setFillColor(...MARSALA);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(corretora.nome || "CORA", M, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const mesAno = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  doc.text(`Proposta Comercial • ${mesAno}`, PAGE_W - M, 9, { align: "right" });
  doc.setFillColor(...CREAM);
  doc.rect(0, 14, PAGE_W, 1, "F");
}

function drawFooter(doc: jsPDF, corretora: CorretoraInfo, page: number, total: number) {
  const y = PAGE_H - 8;
  doc.setDrawColor(...MARSALA);
  doc.line(M, y - 3, PAGE_W - M, y - 3);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(corretora.nome || "", M, y);
  const center = [corretora.telefone, corretora.email, corretora.site].filter(Boolean).join(" • ");
  doc.text(center, PAGE_W / 2, y, { align: "center" });
  doc.text(`Página ${page} de ${total}`, PAGE_W - M, y, { align: "right" });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, M, y);
  doc.setFillColor(...MARSALA);
  doc.rect(M, y + 2, 20, 1, "F");
  return y + 10;
}

function drawCoverPage(doc: jsPDF, data: PropostaCompleta) {
  const p = data.personalizacao;

  // Background
  doc.setFillColor(...SURFACE);
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.6, "F");
  doc.setFillColor(...MARSALA);
  doc.rect(0, PAGE_H * 0.6, PAGE_W, PAGE_H * 0.4, "F");

  // Logo/Name
  doc.setTextColor(...MARSALA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(data.corretora.nome || "CORA", PAGE_W / 2, 50, { align: "center" });

  // Decorative line
  doc.setFillColor(...MARSALA);
  doc.rect(PAGE_W / 2 - 10, 56, 20, 1, "F");

  // Title
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Proposta de Plano de Saúde", PAGE_W / 2, 80, { align: "center" });

  // Personalized subtitle or default
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const subtitulo = p?.frase_abertura_capa || `Preparada exclusivamente para ${data.cliente_nome}`;
  const subtLines = doc.splitTextToSize(subtitulo, CW - 20);
  doc.text(subtLines, PAGE_W / 2, 92, { align: "center" });

  const cidade = data.corretora.cidade || "Brasília";
  const dataStr = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(10);
  doc.text(`${cidade}, ${dataStr}`, PAGE_W / 2, 92 + subtLines.length * 5 + 8, { align: "center" });

  // Bottom bullets — personalized based on destaque_principal
  const bullets = p?.argumento_chave
    ? [
        p.argumento_chave,
        "Comparativo entre as melhores opções do mercado",
        "Explicação simples de todos os termos",
      ]
    : [
        "Análise personalizada da sua situação",
        "Comparativo entre as melhores opções do mercado",
        "Explicação simples de todos os termos",
      ];
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  let by = PAGE_H * 0.65;
  bullets.forEach((b) => {
    doc.text(`●  ${b}`, PAGE_W / 2, by, { align: "center" });
    by += 8;
  });

  doc.setTextColor(255, 255, 255, 0.6 as any);
  doc.setFontSize(8);
  const validaDias = data.valida_ate
    ? Math.max(0, Math.ceil((new Date(data.valida_ate).getTime() - Date.now()) / 86400000))
    : 7;
  doc.text(`Esta proposta é válida por ${validaDias} dias`, PAGE_W / 2, PAGE_H - 20, { align: "center" });
}

function drawQuemSomosPage(doc: jsPDF, data: PropostaCompleta) {
  drawHeader(doc, data.corretora);
  let y = drawSectionTitle(doc, "Quem somos", 26);

  doc.setTextColor(...TEXT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const text = `A ${data.corretora.nome || "nossa corretora"} é uma empresa especializada em facilitar sua vida na hora de escolher um plano de saúde. Trabalhamos para que você tenha um plano de qualidade, com preço justo, que realmente cuide da sua família.`;
  const lines = doc.splitTextToSize(text, CW);
  doc.text(lines, M, y);
  y += lines.length * 5 + 8;

  // Diferenciais
  const difs = [
    { title: "Cuidado Real", desc: "Trabalhamos para você, não para a operadora" },
    { title: "Presença Local", desc: "Conhecemos a rede credenciada da sua região" },
    { title: "Agilidade", desc: "Seu plano começa a valer rapidamente" },
  ];
  const colW = CW / 3;
  difs.forEach((d, i) => {
    const x = M + i * colW;
    doc.setTextColor(...MARSALA);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(d.title, x + colW / 2, y, { align: "center" });
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const dl = doc.splitTextToSize(d.desc, colW - 4);
    doc.text(dl, x + colW / 2, y + 6, { align: "center" });
  });
  y += 24;

  // Destaque
  doc.setFillColor(...CREAM);
  doc.roundedRect(M, y, CW, 18, 2, 2, "F");
  doc.setFillColor(...MARSALA);
  doc.rect(M, y, 1.2, 18, "F");
  doc.setTextColor(...TEXT_BODY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const quote = `Com a ${data.corretora.nome || "nossa corretora"}, você tem proteção de verdade, sem surpresas, e com a tranquilidade que sua família merece.`;
  doc.text(doc.splitTextToSize(quote, CW - 10), M + 6, y + 7);

  // Por que nos escolher - same page
  y += 30;
  y = drawSectionTitle(doc, "Por que nos escolher?", y);
  const cards = [
    { title: "Sem coparticipação", desc: "Você não paga nada extra ao usar consultas, exames ou internações." },
    { title: "Ativação rápida", desc: "Seu plano começa a valer no dia seguinte à contratação." },
    { title: "Cobertura ampla", desc: "Oferecemos opções regionais e nacionais." },
    { title: "Medicina preventiva", desc: "Programas para cuidar da sua saúde antes de você adoecer." },
  ];
  const cardW = (CW - 6) / 2;
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cardW + 6);
    const cy = y + row * 28;
    doc.setDrawColor(...BORDER);
    doc.roundedRect(cx, cy, cardW, 24, 2, 2, "S");
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(c.title, cx + 4, cy + 8);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(c.desc, cardW - 8), cx + 4, cy + 14);
  });
}

function drawTermosPage(doc: jsPDF, data: PropostaCompleta) {
  drawHeader(doc, data.corretora);
  let y = drawSectionTitle(doc, "Entendendo os termos", 26);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Explicamos tudo de forma simples para você decidir com confiança", M, y);
  y += 8;

  const termos = [
    { term: "ACOMODAÇÃO", explain: "É o tipo de quarto que você terá se precisar ficar internado no hospital.", detail: "Enfermaria: divide o espaço. Apartamento: quarto individual.", example: "O tipo de acomodação define se ficará sozinho ou com outros pacientes." },
    { term: "COPARTICIPAÇÃO", explain: "É quando você paga uma pequena taxa extra cada vez que usa o plano.", detail: "Nos planos sem coparticipação, tudo está incluso.", example: "Cada consulta pode custar R$ 20-50 extras." },
    { term: "REEMBOLSO", explain: "Se você usar médico fora da rede, alguns planos devolvem parte do valor.", detail: "Útil quando você tem um médico de confiança fora da rede.", example: "Paga R$ 300, o plano devolve até R$ 150." },
    { term: "COBERTURA", explain: "Define onde você pode usar o plano.", detail: "Regional: sua cidade. Nacional: qualquer lugar do Brasil.", example: "Filha em outra cidade? Plano nacional cobre." },
    { term: "CARÊNCIA", explain: "Tempo de espera para usar alguns serviços após contratar.", detail: "Urgências: carência zero. Cirurgias eletivas: até 300 dias.", example: "Pronto-socorro é coberto imediatamente." },
    { term: "REDE CREDENCIADA", explain: "Hospitais, clínicas e médicos parceiros do seu plano.", detail: "Dentro da rede, não paga extra. Fora, depende do reembolso.", example: "Como restaurantes parceiros de um delivery." },
  ];

  termos.forEach((t, i) => {
    if (y > PAGE_H - 45) {
      doc.addPage();
      drawHeader(doc, data.corretora);
      y = 24;
    }
    doc.setDrawColor(...BORDER);
    doc.roundedRect(M, y, CW, 32, 2, 2, "S");
    doc.setTextColor(...MARSALA);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(t.term, M + 4, y + 6);
    doc.setTextColor(...TEXT_BODY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(t.explain, CW - 8), M + 4, y + 12);
    doc.text(doc.splitTextToSize(t.detail, CW - 8), M + 4, y + 18);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(`Exemplo: ${t.example}`, M + 4, y + 27);
    y += 36;
  });
}

function drawComparativoPage(doc: jsPDF, data: PropostaCompleta) {
  drawHeader(doc, data.corretora);
  let y = drawSectionTitle(doc, "Comparativo entre os planos", 26);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Analisamos cada detalhe para que você tome a melhor decisão", M, y);
  y += 8;

  const cols = data.alternativas.map((a) => a.nome);
  const head = [["CARACTERÍSTICA", ...(data.plano_atual ? [data.plano_atual.nome || "Atual"] : []), ...cols]];
  const rows = [
    ["Acomodação", ...(data.plano_atual ? [safe((data.plano_atual as any).acomodacao)] : []), ...data.alternativas.map((a) => a.acomodacao)],
    ["Coparticipação", ...(data.plano_atual ? [data.plano_atual.coparticipacao ? "Sim" : "Não"] : []), ...data.alternativas.map((a) => a.coparticipacao ? "Sim" : "Não")],
    ["Reembolso", ...(data.plano_atual ? ["—"] : []), ...data.alternativas.map((a) => a.reembolso ? "Sim" : "Não")],
    ["Cobertura", ...(data.plano_atual ? [safe((data.plano_atual as any).abrangencia)] : []), ...data.alternativas.map((a) => a.abrangencia)],
    ["Med. Preventiva", ...(data.plano_atual ? ["—"] : []), ...data.alternativas.map((a) => a.medicina_preventiva ? "Sim" : "Não")],
    ["Valor Mensal", ...(data.plano_atual ? [fmtCurrency(data.plano_atual.valor_mensal)] : []), ...data.alternativas.map((a) => fmtCurrency(a.valor_mensal))],
  ];

  autoTable(doc, {
    startY: y,
    head,
    body: rows,
    margin: { left: M, right: M },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: MARSALA, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { fillColor: CREAM, textColor: [149, 82, 81], fontStyle: "bold" } },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Economia card
  if (data.plano_atual && data.alternativas.length > 0) {
    const rec = data.alternativas.find((a) => a.recomendado) || data.alternativas[0];
    const eco = (data.plano_atual.valor_mensal || 0) - (rec.valor_mensal || 0);
    if (eco > 0) {
      doc.setFillColor(...CREAM);
      doc.roundedRect(M, y, CW, 14, 2, 2, "F");
      doc.setFillColor(...MARSALA);
      doc.rect(M, y, 1.2, 14, "F");
      doc.setTextColor(...TEXT_BODY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Migrando para ${rec.nome}, você economiza ${fmtCurrency(eco)}/mês — ${fmtCurrency(eco * 12)}/ano.`, M + 6, y + 8);
    }
  }
}

function drawDetalhesPage(doc: jsPDF, data: PropostaCompleta) {
  data.alternativas.forEach((plano, idx) => {
    if (idx > 0) doc.addPage();
    drawHeader(doc, data.corretora);
    let y = 22;

    if (idx === 0) {
      y = drawSectionTitle(doc, "Detalhes dos planos", y);
      y += 4;
    }

    // Plano header
    doc.setFillColor(...CREAM);
    doc.roundedRect(M, y, CW, 22, 2, 2, "F");
    doc.setTextColor(...MARSALA);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(plano.nome, M + 4, y + 8);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(plano.operadora, M + 4, y + 14);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${fmtCurrency(plano.valor_mensal)} / mês`, PAGE_W - M - 4, y + 10, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("por beneficiário", PAGE_W - M - 4, y + 16, { align: "right" });
    y += 30;

    // Campos
    const campos = [
      ["Acomodação", plano.acomodacao],
      ["Abrangência", plano.abrangencia],
      ["Mínimo de vidas", safe(plano.minimo_vidas)],
      ["Coparticipação", plano.coparticipacao ? "Sim" : "Não"],
      ["Reembolso", plano.reembolso ? "Sim" : "Não"],
      ["Med. preventiva", plano.medicina_preventiva ? "Sim" : "Não"],
      ["Início cobertura", plano.inicio_cobertura || "1 dia após contratação"],
    ];
    const colW2 = CW / 2;
    campos.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = M + col * colW2;
      const cy = y + row * 10;
      doc.setTextColor(...TEXT_MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(c[0], cx, cy);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(c[1], cx, cy + 5);
    });
    y += Math.ceil(campos.length / 2) * 10 + 8;

    if (plano.descricao) {
      doc.setFillColor(...CREAM);
      doc.roundedRect(M, y, CW, 20, 2, 2, "F");
      doc.setFillColor(...MARSALA);
      doc.rect(M, y, 1.2, 20, "F");
      doc.setTextColor(...TEXT_BODY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(plano.descricao, CW - 10), M + 6, y + 6);
    }
  });
}

function drawRedeCredenciadaPage(doc: jsPDF, data: PropostaCompleta) {
  const planosComHospitais = data.alternativas.filter((a) => a.hospitais && a.hospitais.length > 0);
  if (planosComHospitais.length === 0) return;

  doc.addPage();
  drawHeader(doc, data.corretora);
  let y = drawSectionTitle(doc, "Rede credenciada", 26);

  planosComHospitais.forEach((plano) => {
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${plano.operadora} — Hospitais Credenciados`, M, y);
    y += 6;

    const head = [["Cidade/Região", "Hospital", "O que oferece"]];
    const body = (plano.hospitais || []).map((h) => [h.cidade, h.nome, h.servicos]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: M, right: M },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: CREAM as any, textColor: MARSALA, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  });
}

function drawProximosPassosPage(doc: jsPDF, data: PropostaCompleta) {
  doc.addPage();
  drawHeader(doc, data.corretora);
  let y = drawSectionTitle(doc, "Próximos passos", 26);

  const passos = [
    { title: "Você nos dá o sinal verde", desc: "Basta nos informar qual plano deseja. Cuidamos de toda a documentação." },
    { title: "Cuidamos de tudo", desc: "Nossa equipe acompanha todo o processo com a operadora até a aprovação." },
    { title: "Você começa a usar", desc: "Seu plano entra em vigor rapidamente. Estamos sempre disponíveis para dúvidas." },
  ];

  passos.forEach((p, i) => {
    doc.setFillColor(...MARSALA);
    doc.circle(M + 5, y + 4, 5, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(i + 1), M + 5, y + 5.5, { align: "center" });
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(10);
    doc.text(p.title, M + 14, y + 3);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(p.desc, M + 14, y + 9);
    y += 18;
  });

  // Validade
  if (data.valida_ate) {
    const dataVal = new Date(data.valida_ate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    y += 4;
    doc.setFillColor(...CREAM);
    doc.roundedRect(M, y, CW, 16, 2, 2, "F");
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Esta proposta é válida até ${dataVal}`, M + 6, y + 7);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Após essa data, os valores podem ser reajustados pela operadora.", M + 6, y + 12);
    y += 22;
  }

  // CTA
  y += 4;
  doc.setFillColor(...MARSALA);
  doc.roundedRect(M, y, CW, 36, 4, 4, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Pronto para cuidar da sua saúde?", PAGE_W / 2, y + 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Entre em contato agora e tire suas dúvidas sem compromisso.", PAGE_W / 2, y + 20, { align: "center" });
  const contacts = [data.corretora.telefone, data.corretora.email, data.corretora.site].filter(Boolean).join("  •  ");
  doc.setFontSize(8);
  doc.text(contacts, PAGE_W / 2, y + 28, { align: "center" });

  // Encerramento
  y += 54;
  doc.setTextColor(...MARSALA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.corretora.nome || "CORA", PAGE_W / 2, y, { align: "center" });
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Obrigado pela confiança.", PAGE_W / 2, y + 10, { align: "center" });
  doc.setFillColor(...MARSALA);
  doc.rect(PAGE_W / 2 - 8, y + 14, 16, 0.8, "F");
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(8);
  let contactY = y + 22;
  [data.corretora.telefone, data.corretora.email, data.corretora.site].filter(Boolean).forEach((c) => {
    doc.text(c!, PAGE_W / 2, contactY, { align: "center" });
    contactY += 5;
  });
}

export function gerarPropostaCompletaPdf(data: PropostaCompleta): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page 1: Capa
  drawCoverPage(doc, data);

  // Page 2: Quem somos + Por que escolher
  doc.addPage();
  drawQuemSomosPage(doc, data);

  // Pages 3-4: Termos
  doc.addPage();
  drawTermosPage(doc, data);

  // Page 5: Comparativo
  doc.addPage();
  drawComparativoPage(doc, data);

  // Pages 6+: Detalhes dos planos
  doc.addPage();
  drawDetalhesPage(doc, data);

  // Rede credenciada (if any)
  drawRedeCredenciadaPage(doc, data);

  // Últimos passos
  drawProximosPassosPage(doc, data);

  // Add footers (skip cover)
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, data.corretora, p, total);
  }

  return doc.output("blob");
}
