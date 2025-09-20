# End-to-End Testing with Playwright

This directory contains comprehensive E2E tests for the Affiliate Link Aggregator application using Playwright.

## Test Structure

```
e2e/
├── fixtures/           # Test data and setup
├── helpers/           # Test utilities and helpers
├── config/            # Environment configurations
├── scripts/           # Test runner scripts
├── screenshots/       # Visual regression screenshots
├── *.spec.ts         # Test files
└── README.md         # This file
```

## Test Categories

### 1. User Journeys (`user-journeys.spec.ts`)
- Homepage browsing and navigation
- Search functionality
- Category filtering
- Sorting options
- Click tracking
- Mobile responsiveness
- Empty states

### 2. Admin Workflows (`admin-workflows.spec.ts`)
- Authentication (login/logout)
- Link management (CRUD operations)
- Analytics dashboard
- Bulk operations
- Form validation

### 3. Visual Regression (`visual-regression.spec.ts`)
- Homepage consistency
- Component visual consistency
- Responsive design verification
- Loading and empty states

### 4. Performance (`performance.spec.ts`)
- Core Web Vitals measurement
- Bundle size monitoring
- Search performance
- Memory usage tracking
- Image optimization

### 5. Accessibility (`accessibility.spec.ts`)
- WCAG compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Start the development servers:
   ```bash
   npm run dev          # Frontend (port 5173)
   cd server && npm run dev  # Backend (port 3000)
   ```

### Basic Commands
```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test user-journeys.spec.ts

# Run tests matching pattern
npx playwright test --grep "search"

# Run tests on specific browser
npx playwright test --project=chromium
```

### Advanced Options
```bash
# Run tests with custom reporter
npx playwright test --reporter=html

# Run tests in parallel with specific worker count
npx playwright test --workers=4

# Run tests with retries
npx playwright test --retries=2

# Update visual regression screenshots
npx playwright test --update-snapshots
```

## Test Configuration

The tests are configured in `playwright.config.ts` with:
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device testing
- Automatic server startup
- Screenshot and video capture on failure
- Trace collection for debugging

## Environment Variables

Set these environment variables for different test environments:

```bash
# Development (default)
NODE_ENV=development

# Staging
NODE_ENV=staging
STAGING_URL=https://staging.affilist.com
STAGING_API_URL=https://api-staging.affilist.com

# Production
NODE_ENV=production
PRODUCTION_URL=https://affilist.com
PRODUCTION_API_URL=https://api.affilist.com
```

## Test Data

Test data is managed in `fixtures/test-data.ts`:
- Sample affiliate links
- Categories
- Admin user credentials
- Mock API responses

## CI/CD Integration

The tests are configured to run in GitHub Actions (`.github/workflows/e2e-tests.yml`):
- Runs on push to main/develop branches
- Runs on pull requests
- Uses PostgreSQL service for database tests
- Uploads test reports and screenshots as artifacts

## Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### Best Practices
1. Use `data-testid` attributes for reliable element selection
2. Wait for network idle before assertions: `await page.waitForLoadState('networkidle')`
3. Use page object model for complex interactions
4. Mock external APIs when needed
5. Keep tests independent and idempotent
6. Use descriptive test names and organize with `describe` blocks

### Test Data Attributes
Add these attributes to components for reliable testing:
```html
<button data-testid="submit-button">Submit</button>
<input data-testid="search-input" />
<div data-testid="affiliate-link-card">...</div>
```

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npx playwright test --headed

# Debug specific test
npx playwright test --debug user-journeys.spec.ts

# Open test UI
npx playwright test --ui
```

### Trace Viewer
When tests fail, traces are automatically collected:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots at failure point
- Video recordings of the test run
- Network logs and console output

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Add explicit waits: `await page.waitForSelector('[data-testid="element"]')`

2. **Flaky tests**
   - Use `waitForLoadState('networkidle')`
   - Add retry logic for unstable elements
   - Mock external dependencies

3. **Visual regression failures**
   - Update screenshots: `npx playwright test --update-snapshots`
   - Check for dynamic content causing differences

4. **Server not starting**
   - Verify ports 5173 and 3000 are available
   - Check server logs for startup errors
   - Ensure database is running for backend tests

### Getting Help
- Check Playwright documentation: https://playwright.dev/
- Review test logs and traces
- Use `console.log()` in tests for debugging
- Run tests in headed mode to see browser interactions