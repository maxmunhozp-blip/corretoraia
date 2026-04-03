
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- TABELA: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  avatar_iniciais TEXT,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'gerente', 'vendedor')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- TABELA: operadoras
CREATE TABLE public.operadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  logo_letra TEXT,
  url_portal TEXT,
  telefone_suporte TEXT,
  login_portal TEXT,
  senha_portal TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operadoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view operadoras"
  ON public.operadoras FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert operadoras"
  ON public.operadoras FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update operadoras"
  ON public.operadoras FOR UPDATE TO authenticated USING (true);

-- TABELA: clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('PF', 'PJ')),
  empresa TEXT,
  email TEXT,
  telefone TEXT,
  operadora_id UUID REFERENCES public.operadoras(id),
  vidas INTEGER NOT NULL DEFAULT 1,
  valor_mensalidade NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'cancelado')),
  responsavel_id UUID REFERENCES public.profiles(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes"
  ON public.clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TABELA: propostas
CREATE TABLE public.propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  empresa TEXT,
  operadora_id UUID REFERENCES public.operadoras(id),
  vidas INTEGER NOT NULL DEFAULT 1,
  valor_estimado NUMERIC(10,2),
  responsavel_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada', 'em_analise', 'pendencia', 'aprovada', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view propostas"
  ON public.propostas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert propostas"
  ON public.propostas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update propostas"
  ON public.propostas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete propostas"
  ON public.propostas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TABELA: alertas
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('inadimplencia', 'cancelamento', 'proposta_parada', 'aniversario')),
  nivel TEXT NOT NULL CHECK (nivel IN ('baixo', 'medio', 'alto')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES public.clientes(id),
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alertas"
  ON public.alertas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert alertas"
  ON public.alertas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update alertas"
  ON public.alertas FOR UPDATE TO authenticated USING (true);

-- TABELA: atividades
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('proposta_criada', 'status_alterado', 'cliente_cadastrado', 'documento_enviado', 'alerta_gerado')),
  descricao TEXT NOT NULL,
  entidade_tipo TEXT CHECK (entidade_tipo IN ('proposta', 'cliente', 'alerta')),
  entidade_id UUID,
  autor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view atividades"
  ON public.atividades FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert atividades"
  ON public.atividades FOR INSERT TO authenticated WITH CHECK (true);

-- TABELA: configuracoes
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view configuracoes"
  ON public.configuracoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert configuracoes"
  ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update configuracoes"
  ON public.configuracoes FOR UPDATE TO authenticated USING (true);
