/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    css: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**/*"],
  },
});
