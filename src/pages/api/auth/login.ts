import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { LoginFormSchema } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = LoginFormSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Nieprawidłowe dane logowania.";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      message: "Zalogowano pomyślnie.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
