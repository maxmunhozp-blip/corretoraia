
CREATE TABLE public.user_menu_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, menu_key)
);

ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master and admin can manage menu permissions"
ON public.user_menu_permissions
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'master'
  OR get_user_role(auth.uid()) = 'admin_corretora'
)
WITH CHECK (
  get_user_role(auth.uid()) = 'master'
  OR get_user_role(auth.uid()) = 'admin_corretora'
);

CREATE POLICY "Users can read own permissions"
ON public.user_menu_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
