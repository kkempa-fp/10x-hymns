import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { messages } from "@/lib/messages";

const loginSchema = z
  .object({
    email: z.string().min(1, messages.auth.validation.emailRequired).email(messages.auth.validation.emailInvalid),
    password: z.string().min(1, messages.auth.validation.passwordRequired),
  })
  .strict();

const resolveAuthErrorMessage = (message: string | null | undefined) => {
  if (!message) {
    return messages.auth.errors.loginFailed;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return messages.auth.errors.invalidCredentials;
  }

  if (normalized.includes("email not confirmed")) {
    return messages.auth.errors.emailNotConfirmed;
  }

  if (normalized.includes("over email otp rate limit")) {
    return messages.auth.errors.tooManyLoginAttempts;
  }

  return messages.auth.errors.loginFailed;
};

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? messages.auth.errors.invalidPayload;
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
      message: messages.auth.success.login,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
