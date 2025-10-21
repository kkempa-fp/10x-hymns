import { expect, type Locator, type Page } from "@playwright/test";

import type { EnvConfig } from "../utils/env";

export class AuthHelper {
  constructor(
    private readonly page: Page,
    private readonly env: EnvConfig
  ) {}

  private getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async ensureLoggedIn() {
    const loginButton = this.getByTestId("header-login-button");
    if (await loginButton.isHidden()) {
      await expect(this.getByTestId("header-logout-button")).toBeVisible();
      return;
    }

    await loginButton.click();

    const emailInput = this.getByTestId("login-email-input");
    await expect(emailInput).toBeVisible();

    await emailInput.fill(this.env.E2E_USERNAME);
    await this.getByTestId("login-password-input").fill(this.env.E2E_PASSWORD);
    await this.getByTestId("login-submit-button").click();

    await expect(this.getByTestId("header-logout-button")).toBeVisible();
  }

  async ensureLoggedOut() {
    const logoutButton = this.getByTestId("header-logout-button");
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }

    await expect(this.getByTestId("header-login-button")).toBeVisible();
  }
}
