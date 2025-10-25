import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient as SupabaseClientInstance } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

export type SupabaseClient = SupabaseClientInstance<Database>;

const requireEnvVar = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing ${name}. Set ${name} in your environment.`);
  }

  return value;
};

const PUBLIC_SUPABASE_URL = requireEnvVar(import.meta.env.PUBLIC_SUPABASE_URL, "PUBLIC_SUPABASE_URL");
const PUBLIC_SUPABASE_KEY = requireEnvVar(import.meta.env.PUBLIC_SUPABASE_KEY, "PUBLIC_SUPABASE_KEY");

const cookieOptions: CookieOptionsWithName = {
  name: "sb:token",
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 7,
};

const parseCookieHeader = (cookieHeader: string | null): { name: string; value: string }[] => {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader.split(";").reduce<{ name: string; value: string }[]>((accumulator, cookie) => {
    if (!cookie.trim()) {
      return accumulator;
    }

    const [name, ...valueParts] = cookie.trim().split("=");
    accumulator.push({ name, value: valueParts.join("=") });
    return accumulator;
  }, []);
};

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, { ...cookieOptions, ...options });
        });
      },
    },
  });
};
