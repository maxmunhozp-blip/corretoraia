
CREATE TABLE public.gestao_executivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text NOT NULL DEFAULT 'CEO',
  empresa text,
  email text,
  telefone text,
  linkedin text,
  foto_url text,
  observacoes text,
  tipo text NOT NULL DEFAULT 'externo',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gestao_executivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view gestao_executivos" ON public.gestao_executivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert gestao_executivos" ON public.gestao_executivos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gestao_executivos" ON public.gestao_executivos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gestao_executivos" ON public.gestao_executivos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_gestao_executivos_updated_at
  BEFORE UPDATE ON public.gestao_executivos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
