import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function respond(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function respondFormError(message: string) {
  return respond({ success: false, error: message }, 200);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();

    if (!caller) return respond({ error: "Não autorizado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, corretora_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["master", "admin_corretora"].includes(callerProfile.role)) {
      return respond({ error: "Sem permissão" }, 403);
    }

    const body = await req.json();

    // Handle list-emails action
    if (body.action === "list-emails") {
      const userIds: string[] = body.user_ids || [];
      if (!userIds.length) return respond({ emails: {} });

      const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const emailMap: Record<string, string> = {};
      allUsers?.users?.forEach((u: { id: string; email?: string }) => {
        if (userIds.includes(u.id) && u.email) {
          emailMap[u.id] = u.email;
        }
      });

      return respond({ emails: emailMap });
    }

    // Handle password reset action
    if (body.action === "reset-password") {
      const { user_id, password } = body;
      if (!user_id || !password) {
        return respondFormError("user_id e password são obrigatórios");
      }

      if (callerProfile.role !== "master" && callerProfile.role !== "admin_corretora") {
        return respond({ error: "Sem permissão" }, 403);
      }

      // If admin_corretora, verify user belongs to same corretora
      if (callerProfile.role === "admin_corretora") {
        const { data: targetProfile } = await adminClient
          .from("profiles")
          .select("corretora_id")
          .eq("id", user_id)
          .single();

        if (!targetProfile || targetProfile.corretora_id !== callerProfile.corretora_id) {
          return respond({ error: "Sem permissão para este usuário" }, 403);
        }
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, {
        password,
      });

      if (updateError) {
        return respondFormError(updateError.message || "Erro ao redefinir senha");
      }

      return respond({ success: true });
    }

    const { email, password, nome, cargo, role, corretora_id } = body;

    if (!email || !password || !nome) {
      return respondFormError("Email, senha e nome são obrigatórios");
    }

    if (callerProfile.role === "admin_corretora") {
      if (!["admin_corretora", "vendedor", "gerente"].includes(role)) {
        return respondFormError("Role inválido");
      }

      if (corretora_id !== callerProfile.corretora_id) {
        return respond({ error: "Sem permissão para esta corretora" }, 403);
      }

      const { data: corretora } = await adminClient
        .from("corretoras")
        .select("max_usuarios, plano")
        .eq("id", corretora_id)
        .single();

      if (corretora?.max_usuarios) {
        const { count } = await adminClient
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("corretora_id", corretora_id)
          .eq("ativo", true);

        if ((count ?? 0) >= corretora.max_usuarios) {
          return respondFormError("Limite de usuários atingido. Faça upgrade do plano.");
        }
      }
    }

    const initials = nome
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    async function createProfileForUser(userId: string) {
      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: userId,
        nome,
        cargo: cargo || null,
        role: role || "vendedor",
        corretora_id: corretora_id || null,
        avatar_iniciais: initials,
        ativo: true,
      }, { onConflict: "id" });

      return profileError;
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (
        authError.message?.includes("already been registered") ||
        authError.message?.includes("User already registered") ||
        (authError as { status?: number }).status === 422
      ) {
        const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = allUsers?.users?.find((u: { email?: string; id: string }) => u.email === email);

        if (!existingUser) {
          return respondFormError("Este e-mail já está cadastrado no sistema.");
        }

        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", existingUser.id)
          .maybeSingle();

        if (existingProfile) {
          return respondFormError("Este e-mail já está cadastrado no sistema.");
        }

        const orphanProfileError = await createProfileForUser(existingUser.id);
        if (orphanProfileError) {
          return respondFormError(`Erro ao criar perfil: ${orphanProfileError.message}`);
        }

        return respond({
          success: true,
          user: { id: existingUser.id, email, nome, role: role || "vendedor" },
        });
      }

      return respondFormError(authError.message || "Erro ao convidar usuário");
    }

    // upsert handles trigger-created profiles gracefully

    const profileError = await createProfileForUser(authData.user.id);

    if (profileError) {
      if (profileError.code === "23505") {
        return respondFormError("Usuário já existe no sistema. Verifique a lista de usuários.");
      }

      await adminClient.auth.admin.deleteUser(authData.user.id);
      return respondFormError(profileError.message || "Erro ao criar perfil do usuário");
    }

    return respond({
      success: true,
      user: { id: authData.user.id, email, nome, role: role || "vendedor" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return respond({ error: message }, 500);
  }
});