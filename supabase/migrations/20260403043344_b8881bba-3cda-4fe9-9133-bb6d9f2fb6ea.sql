
CREATE TABLE corretoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  email text not null,
  telefone text,
  cidade text,
  estado text,
  logo_url text,
  site text,
  plano text default 'starter',
  status text default 'ativo',
  trial_expira_em timestamptz default (now() + interval '14 days'),
  assinatura_inicio timestamptz,
  assinatura_fim timestamptz,
  max_usuarios integer default 3,
  onboarding_completo boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  preco numeric(10,2) not null,
  max_usuarios integer,
  max_propostas integer,
  recursos jsonb default '[]',
  ativo boolean default true
);

INSERT INTO planos (nome, slug, preco, max_usuarios, max_propostas, recursos) VALUES
('Starter', 'starter', 500.00, 3, 50, '["Dashboard", "Propostas", "Clientes", "Miranda básica"]'),
('Profissional', 'profissional', 990.00, 8, 200, '["Tudo do Starter", "Ranking", "Alertas", "Relatórios PDF", "Base de conhecimento"]'),
('Business', 'business', 1790.00, 20, null, '["Tudo do Business", "Miranda 2.0", "WhatsApp automático", "API de integrações"]'),
('Enterprise', 'enterprise', 2500.00, null, null, '["Tudo do Business", "White-label", "Suporte prioritário", "Onboarding dedicado", "SLA garantido"]');

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ultimo_acesso timestamptz;
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE base_conhecimento ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);
ALTER TABLE miranda_conversas ADD COLUMN IF NOT EXISTS corretora_id uuid REFERENCES corretoras(id);

ALTER TABLE corretoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.get_user_corretora_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT corretora_id FROM profiles WHERE id = _user_id $$;

CREATE POLICY "Anyone can view planos" ON planos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Master full access corretoras" ON corretoras FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'master')
  WITH CHECK (public.get_user_role(auth.uid()) = 'master');
CREATE POLICY "Users view own corretora" ON corretoras FOR SELECT TO authenticated
  USING (id = public.get_user_corretora_id(auth.uid()));
CREATE POLICY "Admin update own corretora" ON corretoras FOR UPDATE TO authenticated
  USING (id = public.get_user_corretora_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin_corretora');

DROP POLICY IF EXISTS "Authenticated users can view propostas" ON propostas;
DROP POLICY IF EXISTS "Authenticated users can insert propostas" ON propostas;
DROP POLICY IF EXISTS "Authenticated users can update propostas" ON propostas;
DROP POLICY IF EXISTS "Authenticated users can delete propostas" ON propostas;
CREATE POLICY "Tenant select propostas" ON propostas FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant insert propostas" ON propostas FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant update propostas" ON propostas FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant delete propostas" ON propostas FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON clientes;
CREATE POLICY "Tenant select clientes" ON clientes FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant insert clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant update clientes" ON clientes FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant delete clientes" ON clientes FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view alertas" ON alertas;
DROP POLICY IF EXISTS "Authenticated users can insert alertas" ON alertas;
DROP POLICY IF EXISTS "Authenticated users can update alertas" ON alertas;
CREATE POLICY "Tenant select alertas" ON alertas FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant insert alertas" ON alertas FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant update alertas" ON alertas FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view atividades" ON atividades;
DROP POLICY IF EXISTS "Authenticated users can insert atividades" ON atividades;
CREATE POLICY "Tenant select atividades" ON atividades FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant insert atividades" ON atividades FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view base_conhecimento" ON base_conhecimento;
DROP POLICY IF EXISTS "Authenticated users can insert base_conhecimento" ON base_conhecimento;
DROP POLICY IF EXISTS "Authenticated users can update base_conhecimento" ON base_conhecimento;
DROP POLICY IF EXISTS "Authenticated users can delete base_conhecimento" ON base_conhecimento;
CREATE POLICY "Tenant select base_conhecimento" ON base_conhecimento FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant insert base_conhecimento" ON base_conhecimento FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant update base_conhecimento" ON base_conhecimento FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));
CREATE POLICY "Tenant delete base_conhecimento" ON base_conhecimento FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'master' OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

DROP POLICY IF EXISTS "Users can view own conversations" ON miranda_conversas;
DROP POLICY IF EXISTS "Users can insert own conversations" ON miranda_conversas;
DROP POLICY IF EXISTS "Users can update own conversations" ON miranda_conversas;
DROP POLICY IF EXISTS "Users can delete own conversations" ON miranda_conversas;
CREATE POLICY "Tenant select miranda_conversas" ON miranda_conversas FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'master');
CREATE POLICY "Tenant insert miranda_conversas" ON miranda_conversas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Tenant update miranda_conversas" ON miranda_conversas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Tenant delete miranda_conversas" ON miranda_conversas FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Tenant select profiles" ON profiles FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'master' OR id = auth.uid() OR corretora_id = public.get_user_corretora_id(auth.uid()) OR (corretora_id IS NULL AND public.get_user_corretora_id(auth.uid()) IS NULL));

CREATE TRIGGER update_corretoras_updated_at BEFORE UPDATE ON corretoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
