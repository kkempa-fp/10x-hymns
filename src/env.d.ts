/// <reference types="astro/client" />

import type { Session, User } from "@supabase/supabase-js";

import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
      user: Pick<User, "id" | "email"> | null;
    }
  }

  type ThemeMode = "light" | "dark" | "system";

  interface Window {
    __setPreferredTheme?: (mode: ThemeMode) => void;
    __getPreferredTheme?: () => ThemeMode;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly GOOGLE_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
