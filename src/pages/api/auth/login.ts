import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.client";

const loginSchema = z
  .object({
    email: z.string().min(1, "Podaj adres e-mail.").email("Podaj poprawny adres e-mail."),
    password: z.string().min(1, "Podaj hasło."),
  })
  .strict();

const resolveAuthErrorMessage = (message: string | null | undefined) => {
  if (!message) {
    return "Nie udało się zalogować.";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Nieprawidłowy adres e-mail lub hasło.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Adres e-mail nie został jeszcze potwierdzony. Sprawdź skrzynkę pocztową.";
  }

  if (normalized.includes("over email otp rate limit")) {
    return "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.";
  }

  return message;
};

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = loginSchema.safeParse(payload);
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
    const statusCode = error.status ?? 401;
    const message = resolveAuthErrorMessage(error.message);

    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
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
