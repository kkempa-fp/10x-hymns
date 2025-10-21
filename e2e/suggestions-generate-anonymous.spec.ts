import { test, expect } from "./fixtures";

const DEMO_RESPONSE = {
  data: [
    { number: "101", name: "Pieśń pierwsza", category: "Kategoria pierwsza" },
    { number: "202", name: "Pieśń druga", category: "Kategoria druga" },
  ],
  meta: { mode: "demo" },
};

const DEMO_PROMPT = "Tekst liturgii";

test("anonymous user can generate demo suggestions", async ({ page, suggestionPage }) => {
  await suggestionPage.gotoHome();
  await suggestionPage.ensureLoggedOut();

  let requestPayload: unknown;
  await page.route("**/api/suggestions", async (route) => {
    requestPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEMO_RESPONSE),
    });
  });

  await suggestionPage.generateSuggestions(DEMO_PROMPT);

  await suggestionPage.expectOutputContains("Pieśń pierwsza");
  await suggestionPage.expectStatusMessageContains("Tryb demo");

  expect(requestPayload).toMatchObject({ text: DEMO_PROMPT, count: 5 });
});
