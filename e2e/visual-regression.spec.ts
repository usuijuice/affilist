import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for images to load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('affiliate link card visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot of first affiliate link card
    const firstCard = page
      .locator('[data-testid="affiliate-link-card"]')
      .first();
    await expect(firstCard).toHaveScreenshot('affiliate-link-card.png', {
      animations: 'disabled',
    });
  });

  test('search results visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Perform search
    await page.fill('[data-testid="search-input"]', 'Vercel');
    await page.waitForTimeout(500);

    // Screenshot search results
    const resultsGrid = page.locator('[data-testid="affiliate-links-grid"]');
    await expect(resultsGrid).toHaveScreenshot('search-results.png', {
      animations: 'disabled',
    });
  });

  test('category filter visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot category filter panel
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await expect(categoryFilter).toHaveScreenshot('category-filter.png', {
      animations: 'disabled',
    });
  });

  test('admin login page visual consistency', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Screenshot login page
    await expect(page).toHaveScreenshot('admin-login.png', {
      animations: 'disabled',
    });
  });

  test('admin dashboard visual consistency', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/admin/dashboard');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot admin dashboard
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('link management table visual consistency', async ({ page }) => {
    // Login and navigate to link management
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/admin/links');

    await page.waitForLoadState('networkidle');

    // Screenshot link management table
    const linkTable = page.locator('[data-testid="link-management-table"]');
    await expect(linkTable).toHaveScreenshot('link-management-table.png', {
      animations: 'disabled',
    });
  });

  test('analytics dashboard visual consistency', async ({ page }) => {
    // Login and navigate to analytics
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/admin/analytics');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for charts to render

    // Screenshot analytics dashboard
    await expect(page).toHaveScreenshot('analytics-dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('mobile responsive visual consistency', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot mobile homepage
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('tablet responsive visual consistency', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot tablet homepage
    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('empty states visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Search for something that doesn't exist
    await page.fill('[data-testid="search-input"]', 'nonexistentservice12345');
    await page.waitForTimeout(500);

    // Screenshot empty search results
    const emptyState = page.locator('[data-testid="empty-search-results"]');
    await expect(emptyState).toHaveScreenshot('empty-search-results.png', {
      animations: 'disabled',
    });
  });

  test('loading states visual consistency', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/links*', async (route) => {
      // Delay response to capture loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/');

    // Screenshot loading state
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    await expect(loadingSpinner).toHaveScreenshot('loading-state.png', {
      animations: 'disabled',
    });
  });
});
