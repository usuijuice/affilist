import { test, expect } from '@playwright/test';
import { testAdminUser, testAffiliateLinks } from './fixtures/test-data';

test.describe('Admin Workflows', () => {
  test.describe('Authentication', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testAdminUser.email);
      await page.fill('[data-testid="password-input"]', testAdminUser.password);
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL('/admin/dashboard');
      
      // Should show admin navigation
      await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Fill with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@test.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]'))
        .toContainText('Invalid credentials');
      
      // Should stay on login page
      await expect(page).toHaveURL('/admin/login');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/admin/login');
      await page.fill('[data-testid="email-input"]', testAdminUser.email);
      await page.fill('[data-testid="password-input"]', testAdminUser.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/admin/dashboard');
      
      // Logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login page
      await expect(page).toHaveURL('/admin/login');
      
      // Should not be able to access admin pages
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL('/admin/login');
    });
  });

  test.describe('Link Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('[data-testid="email-input"]', testAdminUser.email);
      await page.fill('[data-testid="password-input"]', testAdminUser.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/admin/dashboard');
    });

    test('should create a new affiliate link', async ({ page }) => {
      // Navigate to link creation
      await page.click('[data-testid="create-link-button"]');
      await expect(page).toHaveURL('/admin/links/new');
      
      // Fill out the form
      await page.fill('[data-testid="title-input"]', 'Test Service');
      await page.fill('[data-testid="description-input"]', 'A test service for E2E testing');
      await page.fill('[data-testid="url-input"]', 'https://testservice.com');
      await page.fill('[data-testid="affiliate-url-input"]', 'https://testservice.com?ref=affiliate');
      
      // Select category
      await page.selectOption('[data-testid="category-select"]', '1');
      
      // Add tags
      await page.fill('[data-testid="tags-input"]', 'testing, e2e, automation');
      
      // Set commission rate
      await page.fill('[data-testid="commission-rate-input"]', '25');
      
      // Mark as featured
      await page.check('[data-testid="featured-checkbox"]');
      
      // Submit form
      await page.click('[data-testid="submit-button"]');
      
      // Should redirect to link management
      await expect(page).toHaveURL('/admin/links');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]'))
        .toContainText('Link created successfully');
      
      // Should see the new link in the table
      await expect(page.locator('[data-testid="link-row"]').last())
        .toContainText('Test Service');
    });

    test('should edit an existing affiliate link', async ({ page }) => {
      // Navigate to link management
      await page.goto('/admin/links');
      
      // Click edit on first link
      await page.click('[data-testid="edit-link-button"]');
      
      // Should navigate to edit page
      await expect(page.url()).toContain('/admin/links/');
      await expect(page.url()).toContain('/edit');
      
      // Update the title
      const titleInput = page.locator('[data-testid="title-input"]');
      await titleInput.clear();
      await titleInput.fill('Updated Test Service');
      
      // Update description
      const descInput = page.locator('[data-testid="description-input"]');
      await descInput.clear();
      await descInput.fill('Updated description for testing');
      
      // Submit changes
      await page.click('[data-testid="submit-button"]');
      
      // Should redirect back to link management
      await expect(page).toHaveURL('/admin/links');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Should see updated link in table
      await expect(page.locator('[data-testid="link-row"]').first())
        .toContainText('Updated Test Service');
    });

    test('should delete an affiliate link', async ({ page }) => {
      // Navigate to link management
      await page.goto('/admin/links');
      
      // Get initial row count
      const initialRows = await page.locator('[data-testid="link-row"]').count();
      
      // Click delete on first link
      await page.click('[data-testid="delete-link-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"]'))
        .toContainText('Are you sure you want to delete this link?');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Should have one less row
      await expect(page.locator('[data-testid="link-row"]')).toHaveCount(initialRows - 1);
    });

    test('should validate form fields', async ({ page }) => {
      // Navigate to link creation
      await page.click('[data-testid="create-link-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="url-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="affiliate-url-error"]')).toBeVisible();
      
      // Fill invalid URL
      await page.fill('[data-testid="url-input"]', 'not-a-valid-url');
      await page.click('[data-testid="submit-button"]');
      
      // Should show URL validation error
      await expect(page.locator('[data-testid="url-error"]'))
        .toContainText('Please enter a valid URL');
    });
  });

  test.describe('Analytics Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('[data-testid="email-input"]', testAdminUser.email);
      await page.fill('[data-testid="password-input"]', testAdminUser.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/admin/dashboard');
    });

    test('should display analytics dashboard', async ({ page }) => {
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav-link"]');
      await expect(page).toHaveURL('/admin/analytics');
      
      // Should show metrics summary
      await expect(page.locator('[data-testid="metrics-summary"]')).toBeVisible();
      
      // Should show total clicks
      await expect(page.locator('[data-testid="total-clicks"]')).toBeVisible();
      
      // Should show total revenue
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      
      // Should show analytics chart
      await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
      
      // Should show performance table
      await expect(page.locator('[data-testid="performance-table"]')).toBeVisible();
    });

    test('should filter analytics by date range', async ({ page }) => {
      await page.goto('/admin/analytics');
      
      // Change date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      
      // Wait for data to update
      await page.waitForTimeout(1000);
      
      // Verify chart updates
      await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
      
      // Verify metrics update
      const totalClicks = page.locator('[data-testid="total-clicks"]');
      await expect(totalClicks).toBeVisible();
    });

    test('should export analytics data', async ({ page }) => {
      await page.goto('/admin/analytics');
      
      // Start download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-button"]')
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toContain('analytics');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('[data-testid="email-input"]', testAdminUser.email);
      await page.fill('[data-testid="password-input"]', testAdminUser.password);
      await page.click('[data-testid="login-button"]');
      await page.goto('/admin/links');
    });

    test('should select multiple links for bulk operations', async ({ page }) => {
      // Select first two checkboxes
      await page.check('[data-testid="link-checkbox"]:nth-child(1)');
      await page.check('[data-testid="link-checkbox"]:nth-child(2)');
      
      // Should show bulk actions toolbar
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();
      
      // Should show selected count
      await expect(page.locator('[data-testid="selected-count"]'))
        .toContainText('2 selected');
    });

    test('should bulk delete selected links', async ({ page }) => {
      // Select multiple links
      await page.check('[data-testid="link-checkbox"]:nth-child(1)');
      await page.check('[data-testid="link-checkbox"]:nth-child(2)');
      
      // Get initial count
      const initialCount = await page.locator('[data-testid="link-row"]').count();
      
      // Click bulk delete
      await page.click('[data-testid="bulk-delete-button"]');
      
      // Confirm deletion
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Should have fewer rows
      await expect(page.locator('[data-testid="link-row"]'))
        .toHaveCount(initialCount - 2);
    });
  });
});