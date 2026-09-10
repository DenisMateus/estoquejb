import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// One-time setup: creates the system login account in Auth.
Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const email = "planejamentopcp@estoquejb.app";
  const password = "Jhonrob@1";

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && !`${error.message}`.toLowerCase().includes("already")) {
    console.error("createUser failed:", error.message);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
