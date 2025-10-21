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
    const client = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY);
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
    const trackedNames: string[] = [];
    await use((name: string) => {
      if (!trackedNames.includes(name)) {
        trackedNames.push(name);
      }
    });

    for (const name of trackedNames) {
      const { error } = await supabase.from("sets").delete().eq("user_id", env.E2E_USERNAME_ID).eq("name", name);
      if (error) {
        throw new Error(`Failed to clean up test set "${name}": ${error.message}`);
      }
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
