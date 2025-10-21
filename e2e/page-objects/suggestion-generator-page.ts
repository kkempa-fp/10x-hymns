import { expect, type Locator, type Page } from "@playwright/test";

import { AuthHelper } from "./auth-helper";
import type { EnvConfig } from "../utils/env";
import { waitForAppHydration } from "../utils/page";

export class SuggestionGeneratorPage {
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

  async ensureLoggedOut() {
    await this.auth.ensureLoggedOut();
  }

  async fillPrompt(value: string) {
    await this.getByTestId("suggestion-input").fill(value);
  }

  async submitPrompt() {
    await this.getByTestId("suggestion-submit-button").click();
  }

  async generateSuggestions(prompt: string) {
    await this.fillPrompt(prompt);
    await this.submitPrompt();
  }

  async expectOutputContains(text: string) {
    await expect(this.getByTestId("suggestion-output")).toContainText(text);
  }

  async expectStatusMessageContains(text: string) {
    await expect(this.getByTestId("suggestion-status-message")).toContainText(text);
  }

  async expectErrorMessageContains(text: string) {
    await expect(this.getByTestId("suggestion-error-message")).toContainText(text);
  }

  async rateUp() {
    await this.getByTestId("suggestion-rate-up").click();
  }

  async expectRatingButtonsDisabled() {
    await expect(this.getByTestId("suggestion-rate-up")).toBeDisabled();
    await expect(this.getByTestId("suggestion-rate-down")).toBeDisabled();
  }
}
