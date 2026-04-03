import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function respond(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
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

    // Verify caller
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return respond({ error: "Não autorizado" }, 401);

    // Check caller role
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
    const { email, password, nome, cargo, role, corretora_id } = body;

    if (!email || !password || !nome) {
      return respond({ error: "Email, senha e nome são obrigatórios" }, 400);
    }

    // Validate permissions for admin_corretora
    if (callerProfile.role === "admin_corretora") {
      if (!["admin_corretora", "vendedor", "gerente"].includes(role)) {
        return respond({ error: "Role inválido" }, 400);
      }
      if (corretora_id !== callerProfile.corretora_id) {
        return respond({ error: "Sem permissão para esta corretora" }, 403);
      }

      // Check user limit
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
          return respond({ error: "Limite de usuários atingido. Faça upgrade do plano." }, 400);
        }
      }
    }

    const initials = nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    // Helper to create profile for a given user id
    async function createProfileForUser(userId: string) {
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: userId,
        nome,
        cargo: cargo || null,
        role: role || "vendedor",
        corretora_id: corretora_id || null,
        avatar_iniciais: initials,
        ativo: true,
      });
      return profileError;
    }

    // Try to create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      // If email already exists in auth, handle orphan user scenario
      if (authError.message?.includes("already been registered") || (authError as any).status === 422) {
        // Find the existing auth user
        const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1 });
        let existingUserId: string | null = null;

        if (listData?.users) {
          const found = listData.users.find((u: any) => u.email === email);
          if (found) existingUserId = found.id;
        }

        // If we can't find the user via list, try a broader search
        if (!existingUserId) {
          const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
          if (allUsers?.users) {
            const found = allUsers.users.find((u: any) => u.email === email);
            if (found) existingUserId = found.id;
          }
        }

        if (!existingUserId) {
          return respond({ error: "Este e-mail já está cadastrado no sistema." }, 400);
        }

        // Check if this user already has a profile
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", existingUserId)
          .maybeSingle();

        if (existingProfile) {
          return respond({ error: "Este e-mail já está cadastrado no sistema." }, 400);
        }

        // Orphan user: auth exists but no profile — create the profile
        const profileError = await createProfileForUser(existingUserId);
        if (profileError) {
          return respond({ error: "Erro ao criar perfil: " + profileError.message }, 500);
        }

        return respond({
          success: true,
          user: { id: existingUserId, email, nome, role: role || "vendedor" },
        });
      }

      return respond({ error: authError.message }, 400);
    }

    // Auth user created successfully — check for existing profile (shouldn't happen but safety check)
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (existingProfile) {
      return respond({ error: "Este e-mail já está cadastrado no sistema." }, 400);
    }

    // Create profile for the new auth user
    const profileError = await createProfileForUser(authData.user.id);

    if (profileError) {
      if (profileError.code === "23505") {
        return respond({ error: "Usuário já existe no sistema. Verifique a lista de usuários." }, 400);
      }
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return respond({ error: profileError.message }, 400);
    }

    return respond({
      success: true,
      user: { id: authData.user.id, email, nome, role: role || "vendedor" },
    });
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
});
