// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import process from "node:process";

const isCloudflare = Boolean(process.env.CF_PAGES);
const session = isCloudflare
  ? {
      driver: "memory",
    }
  : undefined;

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  session,
  // Decide adapter at runtime so local dev stays on Node while deployment targets Cloudflare.
  adapter: isCloudflare
    ? cloudflare()
    : node({
        mode: "standalone",
      }),
});
