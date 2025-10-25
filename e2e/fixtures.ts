/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/db/database.types";
import { SetsPage } from "./page-objects/sets-page";
import { SuggestionGeneratorPage } from "./page-objects/suggestion-generator-page";
import { getEnvConfig, type EnvConfig } from "./utils/env";

type SupabaseDatabaseClient = SupabaseClient<Database>;

interface Fixtures {
  env: EnvConfig;
  setsPage: SetsPage;
  suggestionPage: SuggestionGeneratorPage;
  supabase: SupabaseDatabaseClient;
  trackSet: (name: string) => void;
  trackRating: (fingerprint: string) => void;
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  env: async ({}, use) => {
    const config = getEnvConfig();
    await use(config);
  },
  supabase: async ({ env }, use) => {
    const client = createClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_KEY);
    await use(client);
  },
  setsPage: async ({ page, env }, use) => {
    const setsPage = new SetsPage(page, env);
    await use(setsPage);
  },
  suggestionPage: async ({ page, env }, use) => {
    const suggestionPage = new SuggestionGeneratorPage(page, env);
    await use(suggestionPage);
  },
  trackSet: async ({ supabase, env }, use) => {
    const trackedNames = new Set<string>();
    let cachedUserId: string | null = null;

    const resolveTestUserId = async (): Promise<string> => {
      if (cachedUserId) {
        return cachedUserId;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: env.E2E_USERNAME,
        password: env.E2E_PASSWORD,
      });

      if (error) {
        throw new Error(`Unable to authenticate cleanup user: ${error.message}`);
      }

      const resolvedId = data.user?.id ?? data.session?.user.id ?? null;

      if (!resolvedId) {
        throw new Error("Cleanup authentication succeeded, but no user id was returned.");
      }

      cachedUserId = resolvedId;
      return resolvedId;
    };

    await use((name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return;
      }

      trackedNames.add(trimmedName);
    });

    if (trackedNames.size === 0) {
      return;
    }

    const userId = await resolveTestUserId();
    const names = Array.from(trackedNames);
    const { error, data } = await supabase
      .from("sets")
      .delete()
      .eq("user_id", userId)
      .in("name", names)
      .select("id, name");

    if (error) {
      throw new Error(`Failed to clean up test sets ${names.join(", ")}: ${error.message}`);
    }

    if (data?.length === names.length) {
      return;
    }

    const removedNames = new Set((data ?? []).map((row) => row.name));
    const leftoverNames = names.filter((name) => !removedNames.has(name));

    if (leftoverNames.length === 0) {
      return;
    }

    const fallbackResult = await supabase.from("sets").delete().in("name", leftoverNames);
    if (fallbackResult.error) {
      throw new Error(
        `Failed to clean up test sets (${leftoverNames.join(", ")}) using fallback strategy: ${fallbackResult.error.message}`
      );
    }
  },
  trackRating: async ({ supabase }, use) => {
    const trackedFingerprints: string[] = [];
    await use((fingerprint: string) => {
      if (!fingerprint) {
        return;
      }

      if (!trackedFingerprints.includes(fingerprint)) {
        trackedFingerprints.push(fingerprint);
      }
    });

    if (trackedFingerprints.length === 0) {
      return;
    }

    const { error } = await supabase.from("ratings").delete().in("client_fingerprint", trackedFingerprints);
    if (error) {
      throw new Error(
        `Failed to clean up test ratings for fingerprints ${trackedFingerprints.join(", ")}: ${error.message}`
      );
    }
  },
});

export const expect = test.expect;
