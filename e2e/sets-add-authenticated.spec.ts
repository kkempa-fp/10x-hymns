import { randomUUID } from "node:crypto";
import { test } from "./fixtures";

test("user can create a new set", async ({ setsPage, trackSet }) => {
  const setName = `Zestaw ${randomUUID()}`;
  const setContent = `Nazwa ${Date.now()}`;

  await setsPage.navigateToSets();
  await setsPage.createSet({ name: setName, content: setContent });
  trackSet(setName);

  await setsPage.expectCreationSuccess();
  await setsPage.expectSetVisible(setName);
});
