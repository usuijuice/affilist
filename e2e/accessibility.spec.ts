import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('search functionality should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation to search
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toBe('search-input');

    // Test search with keyboard
    await page.keyboard.type('Vercel');
    await page.waitForTimeout(500);

    // Run accessibility scan on search results
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('category filters should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation to category filters
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await categoryFilter.focus();

    // Check that filter has proper ARIA attributes
    const ariaLabel = await categoryFilter.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('affiliate link cards should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCard = page
      .locator('[data-testid="affiliate-link-card"]')
      .first();

    // Check for proper heading structure
    const heading = firstCard.locator('h2, h3, h4');
    await expect(heading).toBeVisible();

    // Check for proper link accessibility
    const linkButton = firstCard.locator(
      '[data-testid="affiliate-link-button"]'
    );
    const ariaLabel = await linkButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Test keyboard navigation
    await linkButton.focus();
    await expect(linkButton).toBeFocused();

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin login should be accessible', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Check form labels
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');

    const emailLabel =
      (await emailInput.getAttribute('aria-label')) ||
      (await page.locator('label[for="email"]').textContent());
    const passwordLabel =
      (await passwordInput.getAttribute('aria-label')) ||
      (await page.locator('label[for="password"]').textContent());

    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin dashboard should be accessible', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/admin/dashboard');

    // Check navigation accessibility
    const adminNav = page.locator('[data-testid="admin-nav"]');
    await expect(adminNav).toBeVisible();

    // Test keyboard navigation through admin nav
    const navLinks = adminNav.locator('a');
    const navCount = await navLinks.count();

    for (let i = 0; i < navCount; i++) {
      const link = navLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should have alt text, aria-label, or be aria-hidden
      expect(alt || ariaLabel || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('focus management should work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test focus trap in modals (if any)
    // Test skip links
    await page.keyboard.press('Tab');

    // Check if first focusable element is accessible
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      return {
        tagName: element?.tagName,
        testId: element?.getAttribute('data-testid'),
        ariaLabel: element?.getAttribute('aria-label'),
        visible: element
          ? window.getComputedStyle(element).display !== 'none'
          : false,
      };
    });

    expect(focusedElement.visible).toBe(true);
  });

  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName.charAt(1))))
    );

    // Verify heading hierarchy (no skipped levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];

      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }

    // Check for ARIA landmarks
    const landmarks = await page
      .locator(
        '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer'
      )
      .count();
    expect(landmarks).toBeGreaterThan(0);
  });

  test('mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check touch target sizes (minimum 44px)
    const touchTargets = await page
      .locator('button, a, input[type="checkbox"], input[type="radio"]')
      .all();

    for (const target of touchTargets) {
      const box = await target.boundingBox();
      if (box && (await target.isVisible())) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
