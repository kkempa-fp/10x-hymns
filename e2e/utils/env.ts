import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_KEY", "E2E_USERNAME_ID", "E2E_USERNAME", "E2E_PASSWORD"] as const;

type RequiredEnvKey = (typeof requiredEnvVars)[number];

export type EnvConfig = Record<RequiredEnvKey, string>;

let envLoaded = false;
let cachedEnv: EnvConfig | null = null;

const hydrateProcessEnvFromFile = () => {
  if (envLoaded) {
    return;
  }

  envLoaded = true;

  const envUrl = new URL("../../.env.test", import.meta.url);
  const envPath = fileURLToPath(envUrl);

  let content: string;

  try {
    content = readFileSync(envPath, "utf-8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return; // rely on values injected through the environment
    }

    throw error;
  }

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key) {
      return;
    }

    const value = trimmed.slice(separatorIndex + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const resolveEnvConfig = (): EnvConfig => {
  hydrateProcessEnvFromFile();

  const config = requiredEnvVars.reduce<Partial<EnvConfig>>((accumulator, key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable "${key}" for e2e tests.`);
    }

    accumulator[key] = value;
    return accumulator;
  }, {});

  return config as EnvConfig;
};

export const getEnvConfig = (): EnvConfig => {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = resolveEnvConfig();
  return cachedEnv;
};
