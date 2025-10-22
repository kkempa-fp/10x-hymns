/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**/*"],
  },
});
