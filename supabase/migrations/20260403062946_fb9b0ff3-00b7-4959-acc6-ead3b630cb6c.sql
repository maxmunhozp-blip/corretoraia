ALTER TABLE public.corretoras
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#955251',
  ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#7a3f3e',
  ADD COLUMN IF NOT EXISTS dominio_customizado text,
  ADD COLUMN IF NOT EXISTS email_remetente text;

-- Global system settings table
CREATE TABLE IF NOT EXISTS public.configuracoes_globais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text,
  categoria text NOT NULL DEFAULT 'geral',
  descricao text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master full access configuracoes_globais"
  ON public.configuracoes_globais
  FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'master')
  WITH CHECK (get_user_role(auth.uid()) = 'master');

CREATE POLICY "Authenticated read configuracoes_globais"
  ON public.configuracoes_globais
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default global settings
INSERT INTO public.configuracoes_globais (chave, valor, categoria, descricao) VALUES
  ('modo_manutencao', 'false', 'sistema', 'Ativa o modo de manutenção para todas as corretoras'),
  ('banner_global', '', 'sistema', 'Mensagem de aviso global exibida para todos os usuários'),
  ('max_upload_mb', '50', 'sistema', 'Tamanho máximo de upload em MB'),
  ('permitir_cadastro', 'true', 'sistema', 'Permite novos cadastros de corretoras')
ON CONFLICT (chave) DO NOTHING;