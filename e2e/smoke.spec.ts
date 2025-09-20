import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('can load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Basic checks that the page loads
    await expect(page).toHaveTitle(/Affilist|Affiliate/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to admin login', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check that login page loads
    await expect(page.locator('input[type="email"], [data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('input[type="password"], [data-testid="password-input"]')).toBeVisible();
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test that API is responding
    const response = await page.request.get('/api/links');
    expect(response.status()).toBeLessThan(500); // Should not be server error
  });
});