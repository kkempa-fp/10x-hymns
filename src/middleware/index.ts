import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

const isUnauthorizedError = (error?: { status?: number; message?: string } | null) => {
  if (!error) {
    return false;
  }

  if (typeof error.status === "number") {
    return error.status === 401 || error.status === 403;
  }

  if (typeof error.message !== "string") {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return normalized.includes("session") && normalized.includes("missing");
};

export const onRequest = defineMiddleware(async ({ locals, cookies, request }, next) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  locals.supabase = supabase;

  const [sessionResponse, userResponse] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

  const session = sessionResponse.data.session ?? null;
  const userData = userResponse.data.user;
  const sessionUnauthorized = isUnauthorizedError(sessionResponse.error);
  const userUnauthorized = isUnauthorizedError(userResponse.error);

  locals.session = sessionUnauthorized ? null : session;
  locals.user = userUnauthorized || !userData ? null : { id: userData.id, email: userData.email };

  return next();
});
