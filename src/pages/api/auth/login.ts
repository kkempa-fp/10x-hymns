import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.client";

const loginSchema = z
  .object({
    email: z.string().min(1, "Email is required.").email("Email must be a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

const resolveAuthErrorMessage = (message: string | null | undefined) => {
  if (!message) {
    return "Failed to sign in.";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("over email otp rate limit")) {
    return "Too many login attempts. Try again later.";
  }

  return "Failed to sign in.";
};

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = await request.json().catch(() => null);

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Invalid login payload.";
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
      message: "Signed in successfully.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
