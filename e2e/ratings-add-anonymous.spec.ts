import { randomUUID } from "node:crypto";

import { test, expect } from "./fixtures";

const DEMO_PROMPT = "Tekst liturgii";
const DEMO_RESPONSE = {
  data: [
    { number: "303", name: "Pieść trzecia", category: "Kategoria trzecia" },
    { number: "404", name: "Pieść czwarta", category: "Kategoria czwarta" },
  ],
  meta: { mode: "demo" },
};

const RATING_RESPONSE = { message: "Rating submitted successfully." };

const FINGERPRINT_STORAGE_KEY = "10x-hymns:fingerprint";

test("anonymous user can submit rating for suggestions", async ({ page, suggestionPage, trackRating }) => {
  let ratingPayload: unknown;
  let suggestionPayload: unknown;
  const fingerprint = `e2e-fingerprint-${randomUUID()}`;

  await page.addInitScript(
    ([storageKey, storageValue]) => {
      window.localStorage.setItem(storageKey, storageValue);
    },
    [FINGERPRINT_STORAGE_KEY, fingerprint]
  );

  await page.route("**/api/suggestions", async (route) => {
    suggestionPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEMO_RESPONSE),
    });
  });

  await page.route("**/api/ratings", async (route) => {
    ratingPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(RATING_RESPONSE),
    });
  });

  await suggestionPage.gotoHome();
  await suggestionPage.ensureLoggedOut();
  trackRating(fingerprint);

  await suggestionPage.generateSuggestions(DEMO_PROMPT);
  await suggestionPage.expectOutputContains("Pieść trzecia");
  await suggestionPage.expectStatusMessageContains("Tryb demo");

  await suggestionPage.rateUp();
  await suggestionPage.expectRatingButtonsDisabled();
  await suggestionPage.expectStatusMessageContains("Dziękujemy");

  expect(suggestionPayload).toMatchObject({ text: DEMO_PROMPT, count: 5 });
  expect(ratingPayload).toMatchObject({
    rating: "up",
    proposed_hymn_numbers: ["303", "404"],
  });
  expect((ratingPayload as { client_fingerprint?: string }).client_fingerprint).toBe(fingerprint);
});
