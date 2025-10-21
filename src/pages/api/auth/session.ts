import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { messages } from "@/lib/messages";

const isUnauthorizedError = (error?: { status?: number; message?: string } | null) => {
  if (!error) {
    return false;
  }

  if (typeof error.status === "number") {
    return error.status === 400 || error.status === 401 || error.status === 403;
  }

  if (typeof error.message !== "string") {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return normalized.includes("session") || normalized.includes("token") || normalized.includes("authenticated");
};

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  const [sessionResponse, userResponse] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

  const session = sessionResponse.data.session ?? null;
  const sessionUnauthorized = isUnauthorizedError(sessionResponse.error);
  const userUnauthorized = isUnauthorizedError(userResponse.error);
  const user = userUnauthorized ? null : (userResponse.data.user ?? null);

  if (sessionResponse.error && !sessionUnauthorized) {
    return new Response(JSON.stringify({ error: messages.auth.errors.sessionApiFailed }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (userResponse.error && !userUnauthorized) {
    return new Response(JSON.stringify({ error: messages.auth.errors.userFetchFailed }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      session: sessionUnauthorized ? null : session,
      user,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
