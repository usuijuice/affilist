import { Page, expect } from '@playwright/test';
import { testAdminUser } from '../fixtures/test-data';

export class TestSetup {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    await this.page.goto('/admin/login');
    await this.page.fill('[data-testid="email-input"]', testAdminUser.email);
    await this.page.fill('[data-testid="password-input"]', testAdminUser.password);
    await this.page.click('[data-testid="login-button"]');
    await expect(this.page).toHaveURL('/admin/dashboard');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(urlPattern);
  }

  async mockApiResponse(url: string | RegExp, response: any) {
    await this.page.route(url, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async mockApiError(url: string | RegExp, status: number = 500) {
    await this.page.route(url, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test error' }),
      });
    });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async setViewport(device: 'mobile' | 'tablet' | 'desktop') {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 },
    };
    
    await this.page.setViewportSize(viewports[device]);
  }

  async takeScreenshot(name: string, options?: { fullPage?: boolean }) {
    return this.page.screenshot({
      path: `e2e/screenshots/${name}`,
      fullPage: options?.fullPage || false,
    });
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    return this.page.waitForSelector(selector, { timeout });
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[data-testid="${field}"]`, value);
    }
  }

  async expectToastMessage(message: string) {
    await expect(this.page.locator('[data-testid="toast"]')).toContainText(message);
  }

  async expectErrorMessage(selector: string, message: string) {
    await expect(this.page.locator(selector)).toContainText(message);
  }
}