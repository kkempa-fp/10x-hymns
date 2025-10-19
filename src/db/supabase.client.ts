import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient as SupabaseClientInstance } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

export type SupabaseClient = SupabaseClientInstance<Database>;

const resolvePublicSupabaseUrl = () => {
  return import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
};

const resolvePublicSupabaseAnonKey = () => {
  return import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_KEY;
};

const resolveServerSupabaseUrl = () => {
  return import.meta.env.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
};

const resolveServerServiceKey = () => {
  return import.meta.env.SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
};

const PUBLIC_SUPABASE_URL = resolvePublicSupabaseUrl();
const PUBLIC_SUPABASE_ANON_KEY = resolvePublicSupabaseAnonKey();

if (!PUBLIC_SUPABASE_URL) {
  throw new Error("Supabase URL is not configured. Provide SUPABASE_URL or PUBLIC_SUPABASE_URL in your environment.");
}

if (!PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase anon key is not configured. Provide SUPABASE_KEY or PUBLIC_SUPABASE_ANON_KEY in your environment."
  );
}

const cookieOptions: CookieOptionsWithName = {
  name: "sb:token",
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 7,
};

const parseCookieHeader = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return [] as { name: string; value: string }[];
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
  const serverUrl = resolveServerSupabaseUrl();
  const serverKey = resolveServerServiceKey();

  if (!serverUrl || !serverKey) {
    throw new Error("Supabase server credentials are missing. Configure SUPABASE_URL and SUPABASE_KEY.");
  }

  return createServerClient<Database>(serverUrl, serverKey, {
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

let browserClient: SupabaseClient | null = null;

const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions,
  });
};

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseBrowserClient();
  return browserClient;
};
