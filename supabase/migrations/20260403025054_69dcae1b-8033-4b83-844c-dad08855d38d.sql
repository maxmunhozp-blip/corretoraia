
-- Table for knowledge base documents
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'outro',
  operadora_id uuid REFERENCES public.operadoras(id),
  descricao text,
  tipo_arquivo text,
  arquivo_path text,
  fonte_url text,
  status text NOT NULL DEFAULT 'processando',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documentos" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documentos" ON public.documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete documentos" ON public.documentos FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true);

CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');
CREATE POLICY "Anyone can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos');
