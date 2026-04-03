
CREATE TABLE public.ranking_vendedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cargo text NOT NULL DEFAULT 'Corretor',
  avatar_iniciais text,
  foto_url text,
  vendas integer NOT NULL DEFAULT 0,
  receita_gerada numeric NOT NULL DEFAULT 0,
  conversao integer NOT NULL DEFAULT 0,
  propostas_ativas integer NOT NULL DEFAULT 0,
  meta_mensal numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ranking_vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ranking" ON public.ranking_vendedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage ranking" ON public.ranking_vendedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_vendedores;
