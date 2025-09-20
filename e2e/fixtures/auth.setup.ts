import { test as setup, expect } from '@playwright/test';
import { testAdminUser } from './test-data';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/admin/login');
  
  // Fill in login form
  await page.fill('[data-testid="email-input"]', testAdminUser.email);
  await page.fill('[data-testid="password-input"]', testAdminUser.password);
  
  // Click login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login and redirect
  await expect(page).toHaveURL('/admin/dashboard');
  
  // Verify we're logged in by checking for admin navigation
  await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});