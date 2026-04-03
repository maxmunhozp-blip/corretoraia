
CREATE TABLE public.base_conhecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  operadora_id uuid REFERENCES public.operadoras(id),
  descricao text,
  arquivo_url text,
  conteudo_extraido text,
  fonte_url text,
  status text NOT NULL DEFAULT 'processando',
  erro_mensagem text,
  adicionado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view base_conhecimento" ON public.base_conhecimento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert base_conhecimento" ON public.base_conhecimento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update base_conhecimento" ON public.base_conhecimento FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete base_conhecimento" ON public.base_conhecimento FOR DELETE TO authenticated USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('conhecimento', 'conhecimento', true);

CREATE POLICY "Authenticated users can upload to conhecimento" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'conhecimento');
CREATE POLICY "Anyone can view conhecimento files" ON storage.objects FOR SELECT USING (bucket_id = 'conhecimento');
CREATE POLICY "Authenticated users can delete from conhecimento" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'conhecimento');
