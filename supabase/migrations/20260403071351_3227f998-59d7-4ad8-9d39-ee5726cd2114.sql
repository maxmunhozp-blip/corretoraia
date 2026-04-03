
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'email',
  nome text NOT NULL,
  assunto text,
  conteudo text NOT NULL DEFAULT '',
  variaveis jsonb DEFAULT '[]'::jsonb,
  categoria text NOT NULL DEFAULT 'geral',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master full access templates"
  ON public.templates FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'master')
  WITH CHECK (public.get_user_role(auth.uid()) = 'master');

CREATE POLICY "Authenticated read templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
