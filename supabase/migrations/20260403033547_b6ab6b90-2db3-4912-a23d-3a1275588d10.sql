
-- Conversations table
CREATE TABLE public.miranda_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miranda_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.miranda_conversas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON public.miranda_conversas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON public.miranda_conversas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON public.miranda_conversas FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages table
CREATE TABLE public.miranda_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.miranda_conversas(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miranda_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.miranda_mensagens FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.miranda_conversas WHERE id = conversa_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.miranda_mensagens FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.miranda_conversas WHERE id = conversa_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.miranda_mensagens FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.miranda_conversas WHERE id = conversa_id AND user_id = auth.uid()));
