// ── Types ──

export type StatusProposta = "Aprovada" | "Em análise" | "Pendência" | "Enviada" | "Cancelada";
export type TipoCliente = "PF" | "PJ";
export type NivelAlerta = "alto" | "medio" | "baixo";
export type TipoAlerta = "Cancelamento" | "Inadimplência" | "Proposta parada" | "Contrato";
export type TipoEvento = "proposta_criada" | "status_alterado" | "cliente_cadastrado" | "documento_enviado" | "alerta_gerado";

export interface Vendedor {
  id: number;
  nome: string;
  cargo: string;
  avatar: string;
}

export interface Cliente {
  id: number;
  nome: string;
  tipo: TipoCliente;
  operadora: string;
  vidas: number;
  valor: number;
  responsavelId: number;
  status: "Ativo" | "Inativo" | "Pendente";
  telefone: string;
  email: string;
}

export interface Proposta {
  id: number;
  cliente: string;
  operadora: string;
  vidas: number;
  valor: string;
  responsavelId: number;
  status: StatusProposta;
  dataCriacao: string;
  dataAtualizacao: string;
  observacao: string;
}

export interface VendaSemanal {
  semana: string;
  vendas: number;
}

export interface PropostaDiaria {
  dia: string;
  criadas: number;
  fechadas: number;
}

export interface Evento {
  tipo: TipoEvento;
  descricao: string;
  vendedor: string;
  hora: string;
  icone: TipoEvento;
}

export interface Alerta {
  id: number;
  nivel: NivelAlerta;
  tipo: TipoAlerta;
  descricao: string;
  cliente: string;
  tempo: string;
}

export interface RankingVendedor {
  pos: number;
  vendedorId: number;
  nome: string;
  vendas: number;
  receitaGerada: number;
  conversao: number;
  propostasAtivas: number;
  variacao: number;
}

export interface Operadora {
  nome: string;
  logo: string;
  url: string;
  suporte: string;
  login: string;
  senha: string;
}

// ── Data ──

export const vendedores: Vendedor[] = [
  { id: 1, nome: "Ana Lima", cargo: "Corretora Sênior", avatar: "AL" },
  { id: 2, nome: "Carlos Melo", cargo: "Corretor", avatar: "CM" },
  { id: 3, nome: "Pedro Costa", cargo: "Corretor", avatar: "PC" },
  { id: 4, nome: "Julia Ramos", cargo: "Corretora", avatar: "JR" },
  { id: 5, nome: "Diego Farias", cargo: "Corretor Júnior", avatar: "DF" },
];

export const getVendedorNome = (id: number) =>
  vendedores.find((v) => v.id === id)?.nome ?? "—";

export const clientes: Cliente[] = [
  { id: 1, nome: "Empresa ABC Ltda", tipo: "PJ", operadora: "Bradesco", vidas: 12, valor: 3200, responsavelId: 1, status: "Ativo", telefone: "(11) 3456-7890", email: "contato@empresaabc.com.br" },
  { id: 2, nome: "João da Silva", tipo: "PF", operadora: "SulAmérica", vidas: 1, valor: 890, responsavelId: 2, status: "Ativo", telefone: "(11) 98765-4321", email: "joao.silva@email.com" },
  { id: 3, nome: "Construtora XYZ", tipo: "PJ", operadora: "Amil", vidas: 45, valor: 12600, responsavelId: 1, status: "Ativo", telefone: "(11) 2345-6789", email: "rh@construtoraxyz.com.br" },
  { id: 4, nome: "Família Santos", tipo: "PF", operadora: "Unimed", vidas: 4, valor: 1240, responsavelId: 3, status: "Ativo", telefone: "(21) 97654-3210", email: "santos.familia@email.com" },
  { id: 5, nome: "Tech Solutions", tipo: "PJ", operadora: "Bradesco", vidas: 8, valor: 2400, responsavelId: 2, status: "Ativo", telefone: "(11) 3321-4455", email: "rh@techsolutions.com.br" },
  { id: 6, nome: "Maria Oliveira", tipo: "PF", operadora: "MedSênior", vidas: 1, valor: 560, responsavelId: 3, status: "Inativo", telefone: "(11) 91234-5678", email: "maria.oliveira@email.com" },
  { id: 7, nome: "Grupo Alfa", tipo: "PJ", operadora: "SulAmérica", vidas: 30, valor: 8100, responsavelId: 1, status: "Ativo", telefone: "(11) 3456-1234", email: "beneficios@grupoalfa.com.br" },
  { id: 8, nome: "Clínica Norte", tipo: "PJ", operadora: "Amil", vidas: 15, valor: 4200, responsavelId: 2, status: "Pendente", telefone: "(11) 2567-8901", email: "admin@clinicanorte.com.br" },
  { id: 9, nome: "Ricardo Mendes", tipo: "PF", operadora: "Bradesco", vidas: 2, valor: 1580, responsavelId: 4, status: "Ativo", telefone: "(21) 98876-5432", email: "ricardo.mendes@email.com" },
  { id: 10, nome: "Logística Express", tipo: "PJ", operadora: "Qualicorp", vidas: 80, valor: 18000, responsavelId: 1, status: "Ativo", telefone: "(11) 3678-9012", email: "rh@logisticaexpress.com.br" },
  { id: 11, nome: "Fernanda Dias", tipo: "PF", operadora: "Unimed", vidas: 1, valor: 720, responsavelId: 5, status: "Ativo", telefone: "(11) 94567-8901", email: "fernanda.dias@email.com" },
  { id: 12, nome: "Restaurante Bom Prato", tipo: "PJ", operadora: "SulAmérica", vidas: 22, valor: 5800, responsavelId: 4, status: "Ativo", telefone: "(11) 2789-0123", email: "gerencia@bomprato.com.br" },
  { id: 13, nome: "Escritório Contábil Fênix", tipo: "PJ", operadora: "Amil", vidas: 6, valor: 1900, responsavelId: 3, status: "Ativo", telefone: "(11) 3890-1234", email: "contato@contabilfenix.com.br" },
  { id: 14, nome: "Paula Ferreira", tipo: "PF", operadora: "MedSênior", vidas: 2, valor: 1100, responsavelId: 5, status: "Pendente", telefone: "(21) 99012-3456", email: "paula.ferreira@email.com" },
  { id: 15, nome: "Instituto Educacional Saber", tipo: "PJ", operadora: "Bradesco", vidas: 35, valor: 9800, responsavelId: 2, status: "Ativo", telefone: "(11) 3901-2345", email: "rh@institutosaber.edu.br" },
  { id: 16, nome: "André Nascimento", tipo: "PF", operadora: "Qualicorp", vidas: 3, valor: 1450, responsavelId: 4, status: "Ativo", telefone: "(11) 97890-1234", email: "andre.nascimento@email.com" },
  { id: 17, nome: "Metalúrgica São Paulo", tipo: "PJ", operadora: "Unimed", vidas: 60, valor: 15200, responsavelId: 1, status: "Ativo", telefone: "(11) 2012-3456", email: "rh@metalurgicasp.com.br" },
  { id: 18, nome: "Carla Ribeiro", tipo: "PF", operadora: "SulAmérica", vidas: 1, valor: 450, responsavelId: 5, status: "Inativo", telefone: "(21) 96789-0123", email: "carla.ribeiro@email.com" },
  { id: 19, nome: "Agência Digital Pixel", tipo: "PJ", operadora: "Amil", vidas: 10, valor: 3100, responsavelId: 3, status: "Ativo", telefone: "(11) 3123-4567", email: "adm@agenciapixel.com.br" },
  { id: 20, nome: "Marcos Tavares", tipo: "PF", operadora: "Bradesco", vidas: 1, valor: 780, responsavelId: 2, status: "Ativo", telefone: "(11) 95678-9012", email: "marcos.tavares@email.com" },
];

export const propostas: Proposta[] = [
  { id: 1001, cliente: "Empresa ABC Ltda", operadora: "Bradesco", vidas: 12, valor: "R$ 3.200/mês", responsavelId: 1, status: "Aprovada", dataCriacao: "15/03/2026", dataAtualizacao: "28/03/2026", observacao: "Contrato assinado, aguardando emissão das carteirinhas." },
  { id: 1002, cliente: "João da Silva", operadora: "SulAmérica", vidas: 1, valor: "R$ 890/mês", responsavelId: 2, status: "Em análise", dataCriacao: "20/03/2026", dataAtualizacao: "27/03/2026", observacao: "Análise de DPS em andamento." },
  { id: 1003, cliente: "Construtora XYZ", operadora: "Amil", vidas: 45, valor: "R$ 12.600/mês", responsavelId: 1, status: "Pendência", dataCriacao: "10/03/2026", dataAtualizacao: "25/03/2026", observacao: "Aguardando documentação do CNPJ atualizado." },
  { id: 1004, cliente: "Família Santos", operadora: "Unimed", vidas: 4, valor: "R$ 1.240/mês", responsavelId: 3, status: "Enviada", dataCriacao: "22/03/2026", dataAtualizacao: "24/03/2026", observacao: "Cotação enviada por email, aguardando retorno." },
  { id: 1005, cliente: "Tech Solutions", operadora: "Bradesco", vidas: 8, valor: "R$ 2.400/mês", responsavelId: 2, status: "Aprovada", dataCriacao: "05/03/2026", dataAtualizacao: "22/03/2026", observacao: "Implantação agendada para dia 01/04." },
  { id: 1006, cliente: "Maria Oliveira", operadora: "MedSênior", vidas: 1, valor: "R$ 560/mês", responsavelId: 3, status: "Cancelada", dataCriacao: "01/03/2026", dataAtualizacao: "20/03/2026", observacao: "Cliente desistiu por questões financeiras." },
  { id: 1007, cliente: "Grupo Alfa", operadora: "SulAmérica", vidas: 30, valor: "R$ 8.100/mês", responsavelId: 1, status: "Em análise", dataCriacao: "18/03/2026", dataAtualizacao: "26/03/2026", observacao: "Operadora solicitou mais informações sobre sinistralidade." },
  { id: 1008, cliente: "Clínica Norte", operadora: "Amil", vidas: 15, valor: "R$ 4.200/mês", responsavelId: 2, status: "Pendência", dataCriacao: "12/03/2026", dataAtualizacao: "23/03/2026", observacao: "Faltam documentos de 3 beneficiários." },
  { id: 1009, cliente: "Logística Express", operadora: "Qualicorp", vidas: 80, valor: "R$ 18.000/mês", responsavelId: 1, status: "Aprovada", dataCriacao: "02/03/2026", dataAtualizacao: "28/03/2026", observacao: "Maior contrato do mês. Implantação em fases." },
  { id: 1010, cliente: "Ricardo Mendes", operadora: "Bradesco", vidas: 2, valor: "R$ 1.580/mês", responsavelId: 4, status: "Aprovada", dataCriacao: "08/03/2026", dataAtualizacao: "19/03/2026", observacao: "Titular + dependente. Plano empresarial via MEI." },
  { id: 1011, cliente: "Restaurante Bom Prato", operadora: "SulAmérica", vidas: 22, valor: "R$ 5.800/mês", responsavelId: 4, status: "Em análise", dataCriacao: "19/03/2026", dataAtualizacao: "27/03/2026", observacao: "Negociando desconto por volume." },
  { id: 1012, cliente: "Metalúrgica São Paulo", operadora: "Unimed", vidas: 60, valor: "R$ 15.200/mês", responsavelId: 1, status: "Em análise", dataCriacao: "16/03/2026", dataAtualizacao: "25/03/2026", observacao: "Pedido de coparticipação para reduzir valor." },
  { id: 1013, cliente: "Agência Digital Pixel", operadora: "Amil", vidas: 10, valor: "R$ 3.100/mês", responsavelId: 3, status: "Pendência", dataCriacao: "14/03/2026", dataAtualizacao: "21/03/2026", observacao: "Aguardando carta de permanência do plano anterior." },
  { id: 1014, cliente: "André Nascimento", operadora: "Qualicorp", vidas: 3, valor: "R$ 1.450/mês", responsavelId: 4, status: "Enviada", dataCriacao: "24/03/2026", dataAtualizacao: "26/03/2026", observacao: "Cotação com 3 opções de plano." },
  { id: 1015, cliente: "Fernanda Dias", operadora: "Unimed", vidas: 1, valor: "R$ 720/mês", responsavelId: 5, status: "Aprovada", dataCriacao: "11/03/2026", dataAtualizacao: "20/03/2026", observacao: "Adesão individual via associação de classe." },
];

export const vendasSemanais: VendaSemanal[] = [
  { semana: "Sem 1", vendas: 10 },
  { semana: "Sem 2", vendas: 15 },
  { semana: "Sem 3", vendas: 8 },
  { semana: "Sem 4", vendas: 14 },
  { semana: "Sem 5", vendas: 18 },
  { semana: "Sem 6", vendas: 12 },
  { semana: "Sem 7", vendas: 22 },
  { semana: "Sem 8", vendas: 16 },
];

export const propostasDiarias: PropostaDiaria[] = [
  { dia: "01/03", criadas: 5, fechadas: 2 },
  { dia: "02/03", criadas: 7, fechadas: 3 },
  { dia: "03/03", criadas: 4, fechadas: 4 },
  { dia: "04/03", criadas: 8, fechadas: 5 },
  { dia: "05/03", criadas: 6, fechadas: 3 },
  { dia: "06/03", criadas: 3, fechadas: 1 },
  { dia: "07/03", criadas: 5, fechadas: 2 },
  { dia: "08/03", criadas: 6, fechadas: 4 },
  { dia: "09/03", criadas: 7, fechadas: 3 },
  { dia: "10/03", criadas: 4, fechadas: 2 },
  { dia: "11/03", criadas: 8, fechadas: 5 },
  { dia: "12/03", criadas: 5, fechadas: 3 },
  { dia: "13/03", criadas: 3, fechadas: 1 },
  { dia: "14/03", criadas: 6, fechadas: 4 },
  { dia: "15/03", criadas: 7, fechadas: 3 },
  { dia: "16/03", criadas: 5, fechadas: 2 },
  { dia: "17/03", criadas: 4, fechadas: 3 },
  { dia: "18/03", criadas: 8, fechadas: 4 },
  { dia: "19/03", criadas: 6, fechadas: 5 },
  { dia: "20/03", criadas: 3, fechadas: 2 },
  { dia: "21/03", criadas: 5, fechadas: 1 },
  { dia: "22/03", criadas: 7, fechadas: 4 },
  { dia: "23/03", criadas: 4, fechadas: 3 },
  { dia: "24/03", criadas: 6, fechadas: 2 },
  { dia: "25/03", criadas: 8, fechadas: 5 },
  { dia: "26/03", criadas: 5, fechadas: 3 },
  { dia: "27/03", criadas: 3, fechadas: 2 },
  { dia: "28/03", criadas: 7, fechadas: 4 },
  { dia: "29/03", criadas: 6, fechadas: 3 },
  { dia: "30/03", criadas: 4, fechadas: 2 },
];

export const kpis = {
  vendasMes: 47,
  variacaoMes: 12,
  propostasAtivas: 23,
  ticketMedio: 1840,
  variacaoTicket: 5,
  taxaConversao: 68,
};

export const atividadeRecente: Evento[] = [
  { tipo: "proposta_criada", descricao: "Nova proposta criada para Logística Express", vendedor: "Ana Lima", hora: "Há 12 minutos", icone: "proposta_criada" },
  { tipo: "documento_enviado", descricao: "Documentos enviados para Bradesco Saúde — Tech Solutions", vendedor: "Carlos Melo", hora: "Há 23 minutos", icone: "documento_enviado" },
  { tipo: "status_alterado", descricao: "Proposta #1001 alterada para Aprovada", vendedor: "Ana Lima", hora: "Há 45 minutos", icone: "status_alterado" },
  { tipo: "cliente_cadastrado", descricao: "Cliente André Nascimento cadastrado", vendedor: "Julia Ramos", hora: "Há 1 hora", icone: "cliente_cadastrado" },
  { tipo: "alerta_gerado", descricao: "Alerta de inadimplência gerado — Empresa ABC", vendedor: "Sistema", hora: "Há 1h30", icone: "alerta_gerado" },
  { tipo: "proposta_criada", descricao: "Cotação enviada para Família Santos", vendedor: "Pedro Costa", hora: "Há 2 horas", icone: "proposta_criada" },
  { tipo: "status_alterado", descricao: "Proposta #1008 movida para Pendência", vendedor: "Carlos Melo", hora: "Há 3 horas", icone: "status_alterado" },
  { tipo: "documento_enviado", descricao: "Contrato assinado recebido — Metalúrgica São Paulo", vendedor: "Ana Lima", hora: "Há 4 horas", icone: "documento_enviado" },
  { tipo: "cliente_cadastrado", descricao: "Cliente Restaurante Bom Prato cadastrado", vendedor: "Julia Ramos", hora: "Ontem às 16h", icone: "cliente_cadastrado" },
  { tipo: "alerta_gerado", descricao: "Alerta de cancelamento — Maria Oliveira sem uso há 30 dias", vendedor: "Sistema", hora: "Ontem às 14h", icone: "alerta_gerado" },
];

export const alertas: Alerta[] = [
  { id: 1, nivel: "alto", tipo: "Cancelamento", descricao: "Risco de cancelamento — sem uso do plano há 45 dias", cliente: "João da Silva", tempo: "Há 2 dias" },
  { id: 2, nivel: "alto", tipo: "Inadimplência", descricao: "Fatura vencida há 15 dias — risco de suspensão", cliente: "Empresa ABC Ltda", tempo: "Há 1 dia" },
  { id: 3, nivel: "alto", tipo: "Cancelamento", descricao: "Solicitação de cancelamento recebida — negociar retenção", cliente: "Carla Ribeiro", tempo: "Há 6 horas" },
  { id: 4, nivel: "medio", tipo: "Proposta parada", descricao: "Em \"Pendência\" há 12 dias — documentação faltante", cliente: "Construtora XYZ", tempo: "Há 3 dias" },
  { id: 5, nivel: "medio", tipo: "Inadimplência", descricao: "Fatura vencida há 8 dias", cliente: "Maria Oliveira", tempo: "Há 4 horas" },
  { id: 6, nivel: "medio", tipo: "Proposta parada", descricao: "Em \"Em análise\" há 10 dias — sem retorno da operadora", cliente: "Grupo Alfa", tempo: "Há 2 dias" },
  { id: 7, nivel: "baixo", tipo: "Proposta parada", descricao: "Em \"Em análise\" há 7 dias — prazo normal", cliente: "Clínica Norte", tempo: "Há 5 dias" },
  { id: 8, nivel: "baixo", tipo: "Contrato", descricao: "Aniversário de contrato — completa 1 ano amanhã. Oportunidade de upsell", cliente: "Família Santos", tempo: "Há 1 hora" },
];

export const rankingVendedores: RankingVendedor[] = [
  { pos: 1, vendedorId: 1, nome: "Ana Lima", vendas: 18, receitaGerada: 28400, conversao: 74, propostasAtivas: 5, variacao: 12 },
  { pos: 2, vendedorId: 2, nome: "Carlos Melo", vendas: 14, receitaGerada: 19200, conversao: 61, propostasAtivas: 4, variacao: 8 },
  { pos: 3, vendedorId: 3, nome: "Pedro Costa", vendas: 9, receitaGerada: 11800, conversao: 58, propostasAtivas: 3, variacao: -3 },
  { pos: 4, vendedorId: 4, nome: "Julia Ramos", vendas: 7, receitaGerada: 9400, conversao: 52, propostasAtivas: 2, variacao: 5 },
  { pos: 5, vendedorId: 5, nome: "Diego Farias", vendas: 5, receitaGerada: 6200, conversao: 45, propostasAtivas: 3, variacao: -7 },
];

export const operadoras: Operadora[] = [
  { nome: "Bradesco Saúde", logo: "B", url: "https://www.bradescosaude.com.br", suporte: "(11) 4090-7900", login: "corretora@email.com", senha: "Br@d2026!" },
  { nome: "SulAmérica", logo: "S", url: "https://www.sulamerica.com.br", suporte: "0800 722 0404", login: "corretora@email.com", senha: "Sul@2026!" },
  { nome: "Amil", logo: "A", url: "https://www.amil.com.br", suporte: "(11) 3003-2644", login: "corretora@email.com", senha: "Am1l#2026" },
  { nome: "Unimed", logo: "U", url: "https://www.unimed.coop.br", suporte: "0800 722 4848", login: "corretora@email.com", senha: "Un1med@26" },
  { nome: "MedSênior", logo: "M", url: "https://www.medseniorsaude.com.br", suporte: "(11) 3003-9000", login: "corretora@email.com", senha: "MedS@2026" },
  { nome: "Qualicorp", logo: "Q", url: "https://www.qualicorp.com.br", suporte: "0800 722 5500", login: "corretora@email.com", senha: "Qual1@26!" },
];
