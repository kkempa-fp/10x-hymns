import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { messages } from "@/lib/messages";

const passwordSchema = z
  .string()
  .min(8, messages.auth.validation.passwordMin)
  .regex(/[A-Z]/, messages.auth.validation.passwordUppercase)
  .regex(/[0-9]/, messages.auth.validation.passwordDigit);

const registerSchema = z
  .object({
    email: z.string().min(1, messages.auth.validation.emailRequired).email(messages.auth.validation.emailInvalid),
    password: passwordSchema,
    confirmPassword: z.string().min(1, messages.auth.validation.confirmPasswordRequired),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messages.auth.validation.passwordsMismatch,
        path: ["confirmPassword"],
      });
    }
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? messages.auth.errors.invalidRegisterPayload;
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = parsed.data;
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error?.message && error.message.includes("User already registered")) {
    return new Response(JSON.stringify({ error: messages.auth.errors.userAlreadyExists }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error) {
    return new Response(JSON.stringify({ error: messages.auth.errors.registerFailed }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      user: data.user,
      message: messages.auth.success.register,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
