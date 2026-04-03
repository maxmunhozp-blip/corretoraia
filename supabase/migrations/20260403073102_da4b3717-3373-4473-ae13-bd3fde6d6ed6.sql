CREATE TABLE public.pesquisa_cliente_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave_busca text NOT NULL,
  nome_empresa text NOT NULL,
  cnpj text,
  resultado jsonb NOT NULL,
  corretora_id uuid REFERENCES public.corretoras(id) ON DELETE CASCADE,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  expira_em timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_pesquisa_cache_chave ON public.pesquisa_cliente_cache(chave_busca);
CREATE INDEX idx_pesquisa_cache_corretora ON public.pesquisa_cliente_cache(corretora_id);

ALTER TABLE public.pesquisa_cliente_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pesquisa cache"
  ON public.pesquisa_cliente_cache FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
    OR (corretora_id IS NULL AND get_user_corretora_id(auth.uid()) IS NULL)
  );

CREATE POLICY "Authenticated users can insert pesquisa cache"
  ON public.pesquisa_cliente_cache FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
    OR (corretora_id IS NULL AND get_user_corretora_id(auth.uid()) IS NULL)
  );

CREATE POLICY "Authenticated users can delete pesquisa cache"
  ON public.pesquisa_cliente_cache FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'master'
    OR corretora_id = get_user_corretora_id(auth.uid())
  );