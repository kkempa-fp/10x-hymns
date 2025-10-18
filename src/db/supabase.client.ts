import { createClient, type SupabaseClient as SupabaseClientInstance } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

if (import.meta.env.SSR) {
  supabaseUrl =
    import.meta.env.SUPABASE_URL ??
    import.meta.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.PUBLIC_SUPABASE_PROJECT_URL ??
    import.meta.env.SUPABASE_PROJECT_URL;

  supabaseAnonKey =
    import.meta.env.SUPABASE_KEY ??
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.PUBLIC_SUPABASE_KEY ??
    import.meta.env.SUPABASE_ANON_KEY;
} else {
  supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_PROJECT_URL;
  supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;
}

if (!supabaseUrl) {
  throw new Error(
    "Supabase URL is not configured. Set PUBLIC_SUPABASE_URL (or PUBLIC_SUPABASE_PROJECT_URL) in your environment."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Supabase anon key is not configured. Set PUBLIC_SUPABASE_ANON_KEY (or PUBLIC_SUPABASE_KEY) in your environment."
  );
}

export type SupabaseClient = SupabaseClientInstance<Database>;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = "009e8b3a-4361-451a-8e74-17348761907b";
