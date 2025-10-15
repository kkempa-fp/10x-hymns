import { createClient, type SupabaseClient as SupabaseClientInstance } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export type SupabaseClient = SupabaseClientInstance<Database>;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
