-- ============================================
-- SEED DE DADOS DE DEMONSTRAÇÃO — CORA
-- Execute no SQL Editor do Supabase ou via CLI
-- ============================================

-- Limpar dados existentes (ordem reversa de dependência)
TRUNCATE public.atividades CASCADE;
TRUNCATE public.alertas CASCADE;
TRUNCATE public.propostas CASCADE;
TRUNCATE public.clientes CASCADE;
TRUNCATE public.operadoras CASCADE;
TRUNCATE public.configuracoes CASCADE;

-- ════════════════════════════════════════════
-- OPERADORAS
-- ════════════════════════════════════════════

INSERT INTO public.operadoras (id, nome, logo_letra, url_portal, telefone_suporte, login_portal, senha_portal) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Bradesco Saúde', 'B', 'https://www.bradescosaude.com.br', '(11) 4090-7900', 'corretora@corasaude.com.br', 'Br@d2026!'),
  ('a1000000-0000-0000-0000-000000000002', 'SulAmérica', 'S', 'https://www.sulamerica.com.br', '0800 722 0404', 'corretora@corasaude.com.br', 'Sul@2026!'),
  ('a1000000-0000-0000-0000-000000000003', 'Amil', 'A', 'https://www.amil.com.br', '(11) 3003-2644', 'corretora@corasaude.com.br', 'Am1l#2026'),
  ('a1000000-0000-0000-0000-000000000004', 'Unimed', 'U', 'https://www.unimed.coop.br', '0800 722 4848', 'corretora@corasaude.com.br', 'Un1med@26'),
  ('a1000000-0000-0000-0000-000000000005', 'MedSênior', 'M', 'https://www.medseniorsaude.com.br', '(11) 3003-9000', 'corretora@corasaude.com.br', 'MedS@2026'),
  ('a1000000-0000-0000-0000-000000000006', 'Qualicorp', 'Q', 'https://www.qualicorp.com.br', '0800 722 5500', 'corretora@corasaude.com.br', 'Qual1@26!');

-- ════════════════════════════════════════════
-- CLIENTES (15 registros: 8 PJ, 5 PF, 2 cancelados)
-- ════════════════════════════════════════════

INSERT INTO public.clientes (id, nome, tipo, empresa, email, telefone, operadora_id, vidas, valor_mensalidade, status, observacoes) VALUES
  -- PJ Ativas (8)
  ('c1000000-0000-0000-0000-000000000001', 'Empresa ABC Ltda', 'PJ', 'Empresa ABC Ltda', 'contato@empresaabc.com.br', '(11) 3456-7890', 'a1000000-0000-0000-0000-000000000001', 12, 3200.00, 'ativo', 'Cliente desde 2024. Contrato renovado em janeiro.'),
  ('c1000000-0000-0000-0000-000000000002', 'Construtora XYZ', 'PJ', 'Construtora XYZ', 'rh@construtoraxyz.com.br', '(11) 2345-6789', 'a1000000-0000-0000-0000-000000000003', 45, 12600.00, 'ativo', 'Empresa de grande porte. Revisão anual em abril.'),
  ('c1000000-0000-0000-0000-000000000003', 'Tech Solutions', 'PJ', 'Tech Solutions', 'rh@techsolutions.com.br', '(11) 3321-4455', 'a1000000-0000-0000-0000-000000000001', 8, 2400.00, 'ativo', 'Startup em crescimento, potencial de aumento de vidas.'),
  ('c1000000-0000-0000-0000-000000000004', 'Grupo Alfa', 'PJ', 'Grupo Alfa Participações', 'beneficios@grupoalfa.com.br', '(11) 3456-1234', 'a1000000-0000-0000-0000-000000000002', 30, 8100.00, 'ativo', 'Holding com 3 empresas no grupo.'),
  ('c1000000-0000-0000-0000-000000000005', 'Logística Express', 'PJ', 'Logística Express S.A.', 'rh@logisticaexpress.com.br', '(11) 3678-9012', 'a1000000-0000-0000-0000-000000000006', 80, 18000.00, 'ativo', 'Maior cliente da carteira. Contrato até 2027.'),
  ('c1000000-0000-0000-0000-000000000006', 'Restaurante Bom Prato', 'PJ', 'Bom Prato Alimentação Ltda', 'gerencia@bomprato.com.br', '(11) 2789-0123', 'a1000000-0000-0000-0000-000000000002', 22, 5800.00, 'ativo', 'Rede com 3 unidades em São Paulo.'),
  ('c1000000-0000-0000-0000-000000000007', 'Metalúrgica São Paulo', 'PJ', 'Metalúrgica São Paulo Ind.', 'rh@metalurgicasp.com.br', '(11) 2012-3456', 'a1000000-0000-0000-0000-000000000004', 60, 15200.00, 'ativo', 'Funcionários em regime CLT. Coparticipação ativa.'),
  ('c1000000-0000-0000-0000-000000000008', 'Agência Digital Pixel', 'PJ', 'Pixel Comunicação Digital', 'adm@agenciapixel.com.br', '(11) 3123-4567', 'a1000000-0000-0000-0000-000000000003', 10, 3100.00, 'ativo', 'Equipe jovem, plano com odonto incluso.'),
  -- PF Ativas (5)
  ('c1000000-0000-0000-0000-000000000009', 'João da Silva', 'PF', NULL, 'joao.silva@email.com', '(11) 98765-4321', 'a1000000-0000-0000-0000-000000000002', 1, 890.00, 'ativo', 'Plano individual. DPS aprovada.'),
  ('c1000000-0000-0000-0000-000000000010', 'Família Santos', 'PF', NULL, 'santos.familia@email.com', '(21) 97654-3210', 'a1000000-0000-0000-0000-000000000004', 4, 1240.00, 'ativo', 'Família com 2 filhos menores. Desconto por adesão.'),
  ('c1000000-0000-0000-0000-000000000011', 'Ricardo Mendes', 'PF', NULL, 'ricardo.mendes@email.com', '(21) 98876-5432', 'a1000000-0000-0000-0000-000000000001', 2, 1580.00, 'ativo', 'Titular + dependente via MEI.'),
  ('c1000000-0000-0000-0000-000000000012', 'Fernanda Dias', 'PF', NULL, 'fernanda.dias@email.com', '(11) 94567-8901', 'a1000000-0000-0000-0000-000000000004', 1, 720.00, 'ativo', 'Adesão individual via associação de classe.'),
  ('c1000000-0000-0000-0000-000000000013', 'André Nascimento', 'PF', NULL, 'andre.nascimento@email.com', '(11) 97890-1234', 'a1000000-0000-0000-0000-000000000006', 3, 1450.00, 'ativo', 'Titular + 2 dependentes.'),
  -- Cancelados (2)
  ('c1000000-0000-0000-0000-000000000014', 'Maria Oliveira', 'PF', NULL, 'maria.oliveira@email.com', '(11) 91234-5678', 'a1000000-0000-0000-0000-000000000005', 1, 560.00, 'cancelado', 'Cancelou por questões financeiras em fev/2026.'),
  ('c1000000-0000-0000-0000-000000000015', 'Carla Ribeiro', 'PF', NULL, 'carla.ribeiro@email.com', '(21) 96789-0123', 'a1000000-0000-0000-0000-000000000002', 1, 450.00, 'cancelado', 'Migrou para plano empresarial do empregador.');

-- ════════════════════════════════════════════
-- PROPOSTAS (15 registros distribuídos por status)
-- ════════════════════════════════════════════

INSERT INTO public.propostas (id, cliente_nome, empresa, operadora_id, vidas, valor_estimado, status, observacoes, created_at, updated_at) VALUES
  -- Aprovadas (5) — distribuídas nas últimas 8 semanas para gráficos
  ('p1000000-0000-0000-0000-000000000001', 'Empresa ABC Ltda', 'Empresa ABC Ltda', 'a1000000-0000-0000-0000-000000000001', 12, 3200.00, 'aprovada', 'Contrato assinado, aguardando emissão das carteirinhas.', now() - interval '50 days', now() - interval '40 days'),
  ('p1000000-0000-0000-0000-000000000002', 'Tech Solutions', 'Tech Solutions', 'a1000000-0000-0000-0000-000000000001', 8, 2400.00, 'aprovada', 'Implantação agendada para próxima segunda.', now() - interval '42 days', now() - interval '35 days'),
  ('p1000000-0000-0000-0000-000000000003', 'Logística Express', 'Logística Express S.A.', 'a1000000-0000-0000-0000-000000000006', 80, 18000.00, 'aprovada', 'Maior contrato do trimestre. Implantação em 3 fases.', now() - interval '28 days', now() - interval '20 days'),
  ('p1000000-0000-0000-0000-000000000004', 'Ricardo Mendes', NULL, 'a1000000-0000-0000-0000-000000000001', 2, 1580.00, 'aprovada', 'Titular + dependente. Plano via MEI aprovado.', now() - interval '18 days', now() - interval '12 days'),
  ('p1000000-0000-0000-0000-000000000005', 'Fernanda Dias', NULL, 'a1000000-0000-0000-0000-000000000004', 1, 720.00, 'aprovada', 'Adesão individual via associação de classe.', now() - interval '10 days', now() - interval '5 days'),
  -- Em análise (3)
  ('p1000000-0000-0000-0000-000000000006', 'João da Silva', NULL, 'a1000000-0000-0000-0000-000000000002', 1, 890.00, 'em_analise', 'Análise de DPS em andamento pela operadora.', now() - interval '8 days', now() - interval '3 days'),
  ('p1000000-0000-0000-0000-000000000007', 'Grupo Alfa', 'Grupo Alfa Participações', 'a1000000-0000-0000-0000-000000000002', 30, 8100.00, 'em_analise', 'Operadora solicitou mais informações sobre sinistralidade.', now() - interval '12 days', now() - interval '4 days'),
  ('p1000000-0000-0000-0000-000000000008', 'Metalúrgica São Paulo', 'Metalúrgica São Paulo Ind.', 'a1000000-0000-0000-0000-000000000004', 60, 15200.00, 'em_analise', 'Pedido de coparticipação para reduzir valor mensal.', now() - interval '14 days', now() - interval '5 days'),
  -- Pendência (3) — criadas há mais de 7 dias para gerar alertas
  ('p1000000-0000-0000-0000-000000000009', 'Construtora XYZ', 'Construtora XYZ', 'a1000000-0000-0000-0000-000000000003', 45, 12600.00, 'pendencia', 'Aguardando documentação do CNPJ atualizado.', now() - interval '18 days', now() - interval '12 days'),
  ('p1000000-0000-0000-0000-000000000010', 'Clínica Norte', 'Clínica Norte Saúde', 'a1000000-0000-0000-0000-000000000003', 15, 4200.00, 'pendencia', 'Faltam documentos de 3 beneficiários.', now() - interval '15 days', now() - interval '10 days'),
  ('p1000000-0000-0000-0000-000000000011', 'Agência Digital Pixel', 'Pixel Comunicação Digital', 'a1000000-0000-0000-0000-000000000003', 10, 3100.00, 'pendencia', 'Aguardando carta de permanência do plano anterior.', now() - interval '12 days', now() - interval '8 days'),
  -- Enviadas (2)
  ('p1000000-0000-0000-0000-000000000012', 'Família Santos', NULL, 'a1000000-0000-0000-0000-000000000004', 4, 1240.00, 'enviada', 'Cotação enviada por email com 3 opções de plano.', now() - interval '3 days', now() - interval '2 days'),
  ('p1000000-0000-0000-0000-000000000013', 'André Nascimento', NULL, 'a1000000-0000-0000-0000-000000000006', 3, 1450.00, 'enviada', 'Cotação com plano familiar e odonto.', now() - interval '2 days', now() - interval '1 day'),
  -- Canceladas (2)
  ('p1000000-0000-0000-0000-000000000014', 'Maria Oliveira', NULL, 'a1000000-0000-0000-0000-000000000005', 1, 560.00, 'cancelada', 'Cliente desistiu por questões financeiras.', now() - interval '30 days', now() - interval '20 days'),
  ('p1000000-0000-0000-0000-000000000015', 'Carla Ribeiro', NULL, 'a1000000-0000-0000-0000-000000000002', 1, 800.00, 'cancelada', 'Migrou para plano empresarial do novo empregador.', now() - interval '25 days', now() - interval '18 days');

-- Propostas aprovadas extras para preencher gráfico de vendas semanais
INSERT INTO public.propostas (cliente_nome, empresa, operadora_id, vidas, valor_estimado, status, observacoes, created_at, updated_at) VALUES
  ('Restaurante Bom Prato', 'Bom Prato Alimentação Ltda', 'a1000000-0000-0000-0000-000000000002', 22, 5800.00, 'aprovada', 'Rede com 3 unidades.', now() - interval '55 days', now() - interval '52 days'),
  ('Instituto Educacional Saber', 'Instituto Saber', 'a1000000-0000-0000-0000-000000000001', 35, 9800.00, 'aprovada', 'Professores e administrativo.', now() - interval '48 days', now() - interval '45 days'),
  ('Escritório Contábil Fênix', 'Contábil Fênix', 'a1000000-0000-0000-0000-000000000003', 6, 1900.00, 'aprovada', 'Pequeno escritório.', now() - interval '38 days', now() - interval '36 days'),
  ('Marcos Tavares', NULL, 'a1000000-0000-0000-0000-000000000001', 1, 780.00, 'aprovada', 'Plano individual básico.', now() - interval '32 days', now() - interval '30 days'),
  ('Paula Ferreira', NULL, 'a1000000-0000-0000-0000-000000000005', 2, 1100.00, 'aprovada', 'Titular + dependente.', now() - interval '22 days', now() - interval '20 days'),
  ('Juliana Reis', NULL, 'a1000000-0000-0000-0000-000000000004', 1, 650.00, 'aprovada', 'Adesão individual.', now() - interval '15 days', now() - interval '13 days'),
  ('Carlos Eduardo', NULL, 'a1000000-0000-0000-0000-000000000002', 2, 1350.00, 'aprovada', 'Casal sem filhos.', now() - interval '7 days', now() - interval '5 days'),
  ('Farmácia Popular Centro', 'Farmácia Popular', 'a1000000-0000-0000-0000-000000000004', 5, 2100.00, 'aprovada', 'Equipe da farmácia.', now() - interval '4 days', now() - interval '2 days');

-- ════════════════════════════════════════════
-- ALERTAS (8 registros)
-- ════════════════════════════════════════════

INSERT INTO public.alertas (tipo, nivel, titulo, descricao, cliente_id, resolvido, created_at) VALUES
  -- Alto (2) — inadimplência
  ('inadimplencia', 'alto', 'Fatura vencida há 15 dias', 'Cliente com fatura em aberto desde 15/03. Risco de suspensão do plano pela operadora.', 'c1000000-0000-0000-0000-000000000001', false, now() - interval '1 day'),
  ('inadimplencia', 'alto', 'Fatura vencida há 22 dias', 'Segunda fatura consecutiva em atraso. Operadora notificou possível cancelamento.', 'c1000000-0000-0000-0000-000000000004', false, now() - interval '2 days'),
  -- Médio (3) — proposta parada
  ('proposta_parada', 'medio', 'Proposta em Pendência há 12 dias', 'Aguardando documentação do CNPJ atualizado. Cliente não respondeu últimos 2 contatos.', 'c1000000-0000-0000-0000-000000000002', false, now() - interval '3 days'),
  ('proposta_parada', 'medio', 'Proposta em Pendência há 10 dias', 'Faltam documentos de beneficiários. Prazo da operadora vence em 5 dias.', NULL, false, now() - interval '4 days'),
  ('proposta_parada', 'medio', 'Proposta em análise há 14 dias', 'Operadora pediu informações adicionais sobre sinistralidade. Sem retorno há 5 dias.', 'c1000000-0000-0000-0000-000000000004', false, now() - interval '2 days'),
  -- Baixo (2) — cancelamento
  ('cancelamento', 'baixo', 'Sinal de risco — baixa utilização', 'Cliente não utilizou o plano nos últimos 60 dias. Possível desinteresse.', 'c1000000-0000-0000-0000-000000000009', false, now() - interval '5 days'),
  ('cancelamento', 'baixo', 'Reclamação registrada na operadora', 'Cliente registrou reclamação sobre rede credenciada. Acompanhar satisfação.', 'c1000000-0000-0000-0000-000000000011', false, now() - interval '3 days'),
  -- Baixo (1) — aniversário
  ('aniversario', 'baixo', 'Aniversário de contrato — 1 ano', 'Contrato completa 1 ano amanhã. Oportunidade de upsell e revisão de condições.', 'c1000000-0000-0000-0000-000000000010', false, now() - interval '1 hour');

-- ════════════════════════════════════════════
-- ATIVIDADES (20 registros nos últimos 15 dias)
-- ════════════════════════════════════════════

INSERT INTO public.atividades (tipo, descricao, entidade_tipo, created_at) VALUES
  ('proposta_criada', 'Proposta criada para Logística Express — Qualicorp, 80 vidas', 'proposta', now() - interval '12 minutes'),
  ('documento_enviado', 'Documentos enviados para Bradesco Saúde — Tech Solutions', 'proposta', now() - interval '23 minutes'),
  ('status_alterado', 'Proposta de Empresa ABC Ltda alterada para Aprovada', 'proposta', now() - interval '45 minutes'),
  ('cliente_cadastrado', 'Novo cliente cadastrado: André Nascimento (PF)', 'cliente', now() - interval '1 hour'),
  ('alerta_gerado', 'Alerta de inadimplência gerado para Empresa ABC Ltda', 'alerta', now() - interval '1 hour 30 minutes'),
  ('proposta_criada', 'Cotação enviada para Família Santos — Unimed, 4 vidas', 'proposta', now() - interval '2 hours'),
  ('status_alterado', 'Proposta de Clínica Norte movida para Pendência', 'proposta', now() - interval '3 hours'),
  ('documento_enviado', 'Contrato assinado recebido — Metalúrgica São Paulo', 'proposta', now() - interval '4 hours'),
  ('cliente_cadastrado', 'Novo cliente cadastrado: Restaurante Bom Prato (PJ)', 'cliente', now() - interval '6 hours'),
  ('alerta_gerado', 'Alerta de cancelamento gerado — Maria Oliveira sem uso há 30 dias', 'alerta', now() - interval '8 hours'),
  ('proposta_criada', 'Proposta criada para Grupo Alfa — SulAmérica, 30 vidas', 'proposta', now() - interval '1 day'),
  ('status_alterado', 'Proposta de Ricardo Mendes alterada para Aprovada', 'proposta', now() - interval '1 day 4 hours'),
  ('documento_enviado', 'DPS enviada para análise — João da Silva', 'proposta', now() - interval '2 days'),
  ('cliente_cadastrado', 'Novo cliente cadastrado: Agência Digital Pixel (PJ)', 'cliente', now() - interval '3 days'),
  ('proposta_criada', 'Proposta criada para Construtora XYZ — Amil, 45 vidas', 'proposta', now() - interval '4 days'),
  ('alerta_gerado', 'Alerta de proposta parada gerado — Construtora XYZ', 'alerta', now() - interval '5 days'),
  ('status_alterado', 'Proposta de Fernanda Dias alterada para Aprovada', 'proposta', now() - interval '6 days'),
  ('cliente_cadastrado', 'Novo cliente cadastrado: Fernanda Dias (PF)', 'cliente', now() - interval '8 days'),
  ('documento_enviado', 'Carta de permanência recebida — Agência Digital Pixel', 'proposta', now() - interval '10 days'),
  ('proposta_criada', 'Proposta criada para Metalúrgica São Paulo — Unimed, 60 vidas', 'proposta', now() - interval '14 days');

-- ════════════════════════════════════════════
-- CONFIGURAÇÕES INICIAIS
-- ════════════════════════════════════════════

INSERT INTO public.configuracoes (chave, valor) VALUES
  ('nome_corretora', 'Cora Seguros e Benefícios'),
  ('cnpj', '12.345.678/0001-90'),
  ('susep', '15414.123456/2020-00'),
  ('email_contato', 'contato@corasaude.com.br'),
  ('telefone', '(11) 3456-7890');
