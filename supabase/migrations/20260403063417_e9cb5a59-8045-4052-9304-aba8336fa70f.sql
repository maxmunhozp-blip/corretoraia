CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _corretora_id uuid;
  _nome text;
  _nome_corretora text;
  _telefone text;
  _cnpj text;
  _plano text;
  _iniciais text;
BEGIN
  _nome := COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário');
  _nome_corretora := NEW.raw_user_meta_data->>'nome_corretora';
  _telefone := NEW.raw_user_meta_data->>'telefone';
  _cnpj := NEW.raw_user_meta_data->>'cnpj';
  _plano := COALESCE(NEW.raw_user_meta_data->>'plano', 'starter');
  
  _iniciais := UPPER(LEFT(_nome, 1));
  IF POSITION(' ' IN _nome) > 0 THEN
    _iniciais := _iniciais || UPPER(SUBSTRING(_nome FROM POSITION(' ' IN _nome) + 1 FOR 1));
  END IF;

  IF _nome_corretora IS NOT NULL AND _nome_corretora <> '' THEN
    INSERT INTO public.corretoras (nome, email, telefone, cnpj, plano, status, onboarding_completo)
    VALUES (_nome_corretora, NEW.email, _telefone, _cnpj, _plano, 'ativo', false)
    RETURNING id INTO _corretora_id;
  END IF;

  INSERT INTO public.profiles (id, nome, role, corretora_id, avatar_iniciais, cargo)
  VALUES (
    NEW.id,
    _nome,
    CASE WHEN _corretora_id IS NOT NULL THEN 'admin_corretora' ELSE 'vendedor' END,
    _corretora_id,
    _iniciais,
    'Administrador'
  );

  RETURN NEW;
END;
$function$;