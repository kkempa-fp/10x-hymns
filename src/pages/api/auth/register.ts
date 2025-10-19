import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { RegisterFormSchema } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = RegisterFormSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Nieprawidłowe dane rejestracji.";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = parsed.data;
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error?.message && error.message.includes("User already registered")) {
    return new Response(JSON.stringify({ error: "Użytkownik z tym adresem e-mail już istnieje." }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      message: "Konto zostało utworzone i jest aktywne.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
