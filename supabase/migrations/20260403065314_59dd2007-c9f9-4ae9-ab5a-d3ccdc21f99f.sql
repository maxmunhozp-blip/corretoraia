
-- Tabela de memória da Miranda
CREATE TABLE public.miranda_memoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES public.corretoras(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Tabela de skills da Miranda
CREATE TABLE public.miranda_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES public.corretoras(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  conteudo_md text NOT NULL,
  versao integer DEFAULT 1,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- RLS para miranda_memoria
ALTER TABLE public.miranda_memoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select miranda_memoria" ON public.miranda_memoria
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

CREATE POLICY "Tenant insert miranda_memoria" ON public.miranda_memoria
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

CREATE POLICY "Tenant update miranda_memoria" ON public.miranda_memoria
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

CREATE POLICY "Tenant delete miranda_memoria" ON public.miranda_memoria
  FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

-- RLS para miranda_skills
ALTER TABLE public.miranda_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select miranda_skills" ON public.miranda_skills
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
    OR corretora_id IS NULL
  );

CREATE POLICY "Tenant insert miranda_skills" ON public.miranda_skills
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

CREATE POLICY "Tenant update miranda_skills" ON public.miranda_skills
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

CREATE POLICY "Tenant delete miranda_skills" ON public.miranda_skills
  FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );

-- Seed: skill padrão de design (global, sem corretora_id)
INSERT INTO public.miranda_skills (nome, descricao, conteudo_md) VALUES
(
  'design_propostas',
  'Preferências de design para propostas comerciais',
  '# Design de Propostas — Preferências da Corretora

## Paleta de cores
- Primária: #955251 (marsala)
- Fundo: #FFFFFF (branco)
- Surface: #F4F4F5
- Texto: #18181B

## Tipografia
- Títulos: bold, maiores, marsala
- Corpo: regular, 15px, preto
- Destaque numérico: extrabold, marsala

## Estilo geral
- Tema: sempre claro (nunca escuro)
- Ícones: Lucide, monocromáticos
- Tabelas: header marsala, linhas alternadas
- Sem gradientes complexos

## Capa
- Estilo atual: dois blocos (superior claro + inferior marsala)
- Logo no topo centralizado

## Tom de escrita
- Linguagem: profissional mas acessível
- Explicar termos técnicos sempre
- Didático: ensinar antes de vender

## O que funcionou bem
(vazio — Miranda vai preenchendo com o tempo)

## O que evitar
(vazio — Miranda vai preenchendo com o tempo)
'
);
