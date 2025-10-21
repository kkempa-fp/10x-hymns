import { expect, type Locator, type Page } from "@playwright/test";

import { AuthHelper } from "./auth-helper";
import type { EnvConfig } from "../utils/env";
import { waitForAppHydration } from "../utils/page";

interface CreateSetPayload {
  content: string;
  name: string;
}

export class SetsPage {
  constructor(
    private readonly page: Page,
    env: EnvConfig
  ) {
    this.auth = new AuthHelper(page, env);
  }

  private readonly auth: AuthHelper;

  private getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async gotoHome() {
    await this.page.goto("/", { waitUntil: "networkidle" });
    await waitForAppHydration(this.page);
  }

  async ensureLoggedIn() {
    await this.auth.ensureLoggedIn();
  }

  async openSetsManager() {
    const setsTab = this.getByTestId("main-tab-sets");
    await expect(setsTab).toBeVisible();
    await setsTab.click();

    await expect(this.getByTestId("sets-manager")).toBeVisible();
  }

  async navigateToSets() {
    await this.gotoHome();
    await this.ensureLoggedIn();
    await this.openSetsManager();
  }

  async createSet(payload: CreateSetPayload) {
    await this.getByTestId("sets-create-button").click();

    const form = this.getByTestId("set-form");
    await expect(form).toBeVisible();

    await this.getByTestId("set-name-input").fill(payload.name);
    await this.getByTestId("set-content-input").fill(payload.content);
    await this.getByTestId("set-submit-button").click();

    await expect(form).toBeHidden();
  }

  async expectCreationSuccess() {
    const statusMessage = this.getByTestId("sets-status-message");
    await expect(statusMessage).toHaveText("Zestaw został utworzony.");
  }

  async expectSetVisible(name: string) {
    const row = this.getByTestId("sets-table-row").filter({ hasText: name });
    await expect(row).toBeVisible();
  }
}
