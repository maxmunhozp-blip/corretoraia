
INSERT INTO storage.buckets (id, name, public) VALUES ('relatorios', 'relatorios', true);

CREATE POLICY "Authenticated users can upload relatorios" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'relatorios');
CREATE POLICY "Authenticated users can view relatorios" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'relatorios');
CREATE POLICY "Authenticated users can delete relatorios" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'relatorios');
