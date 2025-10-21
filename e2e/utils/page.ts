import type { Page } from "@playwright/test";

export const waitForAppHydration = async (page: Page) => {
  await page.waitForFunction(() => {
    const islands = Array.from(document.querySelectorAll("astro-island"));
    if (islands.length === 0) {
      return true;
    }

    return islands.every((island) => !island.hasAttribute("ssr"));
  });
};
