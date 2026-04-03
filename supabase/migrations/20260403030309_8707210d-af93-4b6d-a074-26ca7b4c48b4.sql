
CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL,
  setor text NOT NULL,
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'solicitado',
  autor_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert solicitacoes" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin or author can update solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated USING (autor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin or author can delete solicitacoes" ON public.solicitacoes FOR DELETE TO authenticated USING (autor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE public.solicitacao_votos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(solicitacao_id, user_id)
);

ALTER TABLE public.solicitacao_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votos" ON public.solicitacao_votos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert votos" ON public.solicitacao_votos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own votos" ON public.solicitacao_votos FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.solicitacao_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.profiles(id),
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacao_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comentarios" ON public.solicitacao_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comentarios" ON public.solicitacao_comentarios FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Author can delete own comentarios" ON public.solicitacao_comentarios FOR DELETE TO authenticated USING (autor_id = auth.uid());

CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
