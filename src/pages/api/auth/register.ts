import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.client";

const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków.")
  .regex(/[A-Z]/, "Hasło powinno zawierać przynajmniej jedną wielką literę.")
  .regex(/[0-9]/, "Hasło powinno zawierać przynajmniej jedną cyfrę.");

const registerSchema = z
  .object({
    email: z.string().min(1, "Podaj adres e-mail.").email("Podaj poprawny adres e-mail."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Potwierdź hasło."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hasła muszą być identyczne.",
        path: ["confirmPassword"],
      });
    }
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(payload);
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
      message: "Konto zostało utworzone. Wysłaliśmy wiadomość z linkiem aktywacyjnym.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
