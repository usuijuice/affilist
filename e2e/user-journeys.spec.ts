import { test, expect } from '@playwright/test';
import { testAffiliateLinks, testCategories } from './fixtures/test-data';

test.describe('User Journeys - Browsing and Searching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with affiliate links', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Affilist/);
    
    // Check header is visible
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    
    // Check affiliate links grid is visible
    await expect(page.locator('[data-testid="affiliate-links-grid"]')).toBeVisible();
    
    // Check that at least one affiliate link card is displayed
    await expect(page.locator('[data-testid="affiliate-link-card"]').first()).toBeVisible();
    
    // Check footer is visible
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });

  test('should search for affiliate links', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and use search input
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Search for "Vercel"
    await searchInput.fill('Vercel');
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Check that search results are filtered
    const linkCards = page.locator('[data-testid="affiliate-link-card"]');
    await expect(linkCards).toHaveCount(1);
    
    // Verify the correct link is shown
    await expect(linkCards.first().locator('[data-testid="link-title"]')).toContainText('Vercel');
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Verify all links are shown again
    await expect(linkCards).toHaveCountGreaterThan(1);
  });

  test('should filter by category', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await expect(categoryFilter).toBeVisible();
    
    // Select "Web Development" category
    await page.click('[data-testid="category-web-development"]');
    
    // Wait for filtering
    await page.waitForTimeout(500);
    
    // Check that only web development links are shown
    const linkCards = page.locator('[data-testid="affiliate-link-card"]');
    const categoryBadges = linkCards.locator('[data-testid="category-badge"]');
    
    // Verify all visible cards have the correct category
    const count = await linkCards.count();
    for (let i = 0; i < count; i++) {
      await expect(categoryBadges.nth(i)).toContainText('Web Development');
    }
  });

  test('should sort affiliate links', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find sort controls
    const sortSelect = page.locator('[data-testid="sort-select"]');
    await expect(sortSelect).toBeVisible();
    
    // Sort by commission rate
    await sortSelect.selectOption('commission');
    
    // Wait for sorting
    await page.waitForTimeout(500);
    
    // Get all commission rates and verify they're sorted
    const commissionElements = page.locator('[data-testid="commission-rate"]');
    const commissionTexts = await commissionElements.allTextContents();
    
    // Extract numbers and verify descending order
    const commissionRates = commissionTexts.map(text => 
      parseInt(text.replace(/[^\d]/g, ''))
    );
    
    for (let i = 0; i < commissionRates.length - 1; i++) {
      expect(commissionRates[i]).toBeGreaterThanOrEqual(commissionRates[i + 1]);
    }
  });

  test('should track clicks on affiliate links', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find first affiliate link
    const firstLink = page.locator('[data-testid="affiliate-link-card"]').first();
    await expect(firstLink).toBeVisible();
    
    // Get initial click count
    const clickCountElement = firstLink.locator('[data-testid="click-count"]');
    const initialClickText = await clickCountElement.textContent();
    const initialClickCount = parseInt(initialClickText?.replace(/[^\d]/g, '') || '0');
    
    // Click the affiliate link
    const linkButton = firstLink.locator('[data-testid="affiliate-link-button"]');
    
    // Listen for new page/tab opening
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      linkButton.click()
    ]);
    
    // Verify external link opened
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('vercel.com');
    
    // Close the new page
    await newPage.close();
    
    // Wait a moment for click tracking to process
    await page.waitForTimeout(1000);
    
    // Refresh page to see updated click count
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify click count increased
    const updatedClickElement = page.locator('[data-testid="affiliate-link-card"]')
      .first()
      .locator('[data-testid="click-count"]');
    const updatedClickText = await updatedClickElement.textContent();
    const updatedClickCount = parseInt(updatedClickText?.replace(/[^\d]/g, '') || '0');
    
    expect(updatedClickCount).toBe(initialClickCount + 1);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
    
    // Check that affiliate links are displayed in mobile layout
    const linkCards = page.locator('[data-testid="affiliate-link-card"]');
    await expect(linkCards.first()).toBeVisible();
    
    // Verify cards are stacked vertically (mobile layout)
    const firstCard = linkCards.first();
    const secondCard = linkCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    if (firstCardBox && secondCardBox) {
      // In mobile layout, second card should be below first card
      expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
    }
  });

  test('should handle empty search results', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Search for something that doesn't exist
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistentservice12345');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check for empty state message
    await expect(page.locator('[data-testid="empty-search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-search-results"]'))
      .toContainText('No affiliate links found');
    
    // Verify no link cards are shown
    await expect(page.locator('[data-testid="affiliate-link-card"]')).toHaveCount(0);
  });
});