
-- Create propostas_interativas table
CREATE TABLE public.propostas_interativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  corretora_id uuid REFERENCES public.corretoras(id),
  criado_por uuid REFERENCES public.profiles(id),
  cliente_nome text NOT NULL,
  cliente_empresa text,
  cliente_email text,
  cliente_telefone text,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  plano_atual jsonb,
  alternativas jsonb,
  valida_ate timestamptz DEFAULT (now() + interval '7 days'),
  status text DEFAULT 'ativa',
  visualizacoes integer DEFAULT 0,
  primeira_visualizacao_em timestamptz,
  ultima_visualizacao_em timestamptz,
  aceita_em timestamptz,
  formato_padrao text DEFAULT 'interativo',
  created_at timestamptz DEFAULT now()
);

-- Function to generate random slug
CREATE OR REPLACE FUNCTION public.generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_slug text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_slug := lower(substr(md5(random()::text), 1, 6));
    done := NOT EXISTS (SELECT 1 FROM propostas_interativas WHERE slug = new_slug);
  END LOOP;
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_slug_before_insert
BEFORE INSERT ON public.propostas_interativas
FOR EACH ROW
WHEN (NEW.slug IS NULL OR NEW.slug = '')
EXECUTE FUNCTION public.generate_slug();

-- Enable RLS
ALTER TABLE public.propostas_interativas ENABLE ROW LEVEL SECURITY;

-- Public read access via slug (anyone with the link)
CREATE POLICY "Public read via slug"
ON public.propostas_interativas
FOR SELECT
TO anon, authenticated
USING (true);

-- Corretora members can insert
CREATE POLICY "Tenant insert propostas_interativas"
ON public.propostas_interativas
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) = 'master') 
  OR (corretora_id = get_user_corretora_id(auth.uid()))
);

-- Corretora members can update their own
CREATE POLICY "Tenant update propostas_interativas"
ON public.propostas_interativas
FOR UPDATE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'master') 
  OR (corretora_id = get_user_corretora_id(auth.uid()))
);

-- Corretora members can delete their own
CREATE POLICY "Tenant delete propostas_interativas"
ON public.propostas_interativas
FOR DELETE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'master') 
  OR (corretora_id = get_user_corretora_id(auth.uid()))
);
