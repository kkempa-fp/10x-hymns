import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { messages } from "@/lib/messages";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: messages.auth.errors.logoutFailed }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(null, { status: 204 });
};
