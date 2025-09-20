# Testing Documentation

This document provides comprehensive information about the testing strategy, setup, and execution for the Affiliate Link Aggregator application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Types](#test-types)
- [Setup and Configuration](#setup-and-configuration)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Performance Testing](#performance-testing)
- [E2E Testing](#e2e-testing)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing strategy follows the testing pyramid approach:

```
    /\
   /  \     E2E Tests (Few)
  /____\    - Critical user journeys
 /      \   - Cross-browser compatibility
/________\  - Visual regression

Integration Tests (Some)
- Component interactions
- API integrations
- Workflow testing

Unit Tests (Many)
- Individual functions
- Component logic
- Utility functions
```

### Test Coverage Goals

- **Unit Tests**: 90% coverage for utilities and services
- **Component Tests**: 85% coverage for React components
- **Integration Tests**: Cover all major user workflows
- **E2E Tests**: Cover critical business paths
- **Performance Tests**: Validate performance requirements

## Test Types

### 1. Unit Tests

Test individual functions, components, and modules in isolation.

**Location**: `src/**/__tests__/*.test.{ts,tsx}`

**Tools**: Vitest, React Testing Library, Jest DOM

**Examples**:
- Component rendering and props
- Hook behavior
- Utility function logic
- Service method functionality

### 2. Integration Tests

Test interactions between multiple components or systems.

**Location**: `src/**/__tests__/integration/*.integration.test.tsx`

**Examples**:
- Search and filter interactions
- Admin workflow combinations
- API service integrations

### 3. End-to-End Tests

Test complete user journeys across the entire application.

**Location**: `e2e/*.spec.ts`

**Tools**: Playwright

**Examples**:
- User browsing and searching
- Admin login and management
- Click tracking workflows

### 4. Performance Tests

Test application performance under various load conditions.

**Location**: `tests/performance/*.js`

**Tools**: k6

**Examples**:
- Load testing API endpoints
- Stress testing admin operations
- Volume testing with large datasets

### 5. Visual Regression Tests

Test UI consistency and prevent visual regressions.

**Location**: `e2e/visual-regression.spec.ts`

**Tools**: Playwright screenshots

**Examples**:
- Component visual consistency
- Responsive design validation
- Cross-browser rendering

### 6. Accessibility Tests

Test application accessibility compliance.

**Location**: `e2e/accessibility.spec.ts`

**Tools**: Axe-core, Playwright

**Examples**:
- WCAG compliance
- Keyboard navigation
- Screen reader compatibility

## Setup and Configuration

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install k6 for performance testing (macOS)
brew install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

### Environment Setup

Create test environment files:

```bash
# .env.test
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Affilist Test
NODE_ENV=test

# server/.env.test
DATABASE_URL=postgresql://test:test@localhost:5432/affilist_test
JWT_SECRET=test-secret
NODE_ENV=test
```

### Database Setup for Testing

```bash
# Create test database
createdb affilist_test

# Run migrations
cd server && npm run migrate:test
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/Header.test.tsx

# Run tests matching pattern
npm test -- --grep "search"
```

### E2E Tests

```bash
# Start development servers first
npm run dev          # Terminal 1
cd server && npm run dev  # Terminal 2

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test user-journeys.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
```

### Performance Tests

```bash
# Basic load test
npm run test:performance

# Admin-specific load test
npm run test:performance:admin

# Custom k6 test
k6 run tests/performance/load-testing.js

# With environment variables
BASE_URL=https://staging.affilist.com k6 run tests/performance/load-testing.js
```

### All Tests

```bash
# Run complete test suite
npm run test:all

# Generate comprehensive coverage report
npm run coverage:report
```

## Test Coverage

### Coverage Configuration

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/components/**': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: `coverage/index.html` - Interactive web report
- **JSON**: `coverage/coverage-summary.json` - Machine-readable data
- **LCOV**: `coverage/lcov.info` - For CI/CD integration
- **Text**: Console output during test runs

### Viewing Coverage

```bash
# Generate and view HTML coverage report
npm run test:coverage
open coverage/index.html

# Generate comprehensive report
npm run coverage:report
open test-reports/coverage-report-*.html
```

## Performance Testing

### Load Testing Scenarios

1. **Normal Load**: Simulate typical user traffic
2. **Stress Test**: Test system limits
3. **Spike Test**: Test sudden traffic increases
4. **Volume Test**: Test with large datasets

### Performance Metrics

- **Response Time**: 95th percentile < 500ms
- **Throughput**: Requests per second
- **Error Rate**: < 1% for normal load
- **Resource Usage**: CPU, memory, database connections

### Running Performance Tests

```bash
# Basic load test (10-20 concurrent users)
k6 run tests/performance/load-testing.js

# Stress test (high load)
k6 run --vus 50 --duration 5m tests/performance/load-testing.js

# Admin operations test
k6 run tests/performance/admin-load-testing.js

# Custom configuration
k6 run --vus 10 --duration 2m --env BASE_URL=http://localhost:3000 tests/performance/load-testing.js
```

### Performance Test Results

Results include:
- Request duration percentiles
- Request rate and throughput
- Error rate and types
- Custom metrics (click tracking, etc.)

## E2E Testing

### Test Organization

E2E tests are organized by functionality:

- `user-journeys.spec.ts` - Public user interactions
- `admin-workflows.spec.ts` - Admin operations
- `visual-regression.spec.ts` - UI consistency
- `accessibility.spec.ts` - Accessibility compliance
- `performance.spec.ts` - Client-side performance

### Test Data Management

Test data is managed through:
- `fixtures/test-data.ts` - Static test data
- `helpers/test-setup.ts` - Test utilities
- Database seeding for consistent state

### Cross-Browser Testing

Tests run on multiple browsers:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome and Safari

### Visual Testing

Visual regression tests capture screenshots and compare them:

```bash
# Update visual baselines
npx playwright test --update-snapshots

# Run visual tests only
npx playwright test visual-regression.spec.ts
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled runs (nightly)

### Test Pipeline

1. **Setup**: Install dependencies, start services
2. **Unit Tests**: Run with coverage
3. **Integration Tests**: Test component interactions
4. **E2E Tests**: Full application testing
5. **Performance Tests**: Load and stress testing
6. **Reports**: Generate and upload test artifacts

### Artifacts

Test artifacts are preserved:
- Coverage reports
- E2E test videos and screenshots
- Performance test results
- Test logs and traces

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should explain what they test
3. **Test Behavior, Not Implementation**: Focus on what the code does
4. **Keep Tests Independent**: Each test should run in isolation
5. **Use Test Data Builders**: Create reusable test data factories

### Component Testing

```typescript
// Good: Test behavior
test('should show error message when login fails', async () => {
  const user = userEvent.setup();
  render(<LoginForm onLogin={mockLogin} />);
  
  mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
  
  await user.click(screen.getByRole('button', { name: /login/i }));
  
  expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
});

// Avoid: Testing implementation details
test('should call setState when button is clicked', () => {
  // This tests implementation, not behavior
});
```

### E2E Testing

```typescript
// Good: Use data-testid for reliable selectors
await page.click('[data-testid="submit-button"]');

// Avoid: Fragile CSS selectors
await page.click('.btn.btn-primary.submit-btn');

// Good: Wait for specific conditions
await page.waitForSelector('[data-testid="success-message"]');

// Avoid: Arbitrary timeouts
await page.waitForTimeout(5000);
```

### Performance Testing

```javascript
// Good: Test realistic scenarios
export default function() {
  // Simulate real user behavior
  http.get('/api/links');
  sleep(1);
  http.get('/api/links?search=vercel');
  sleep(2);
}

// Avoid: Unrealistic load patterns
export default function() {
  // This doesn't represent real usage
  for(let i = 0; i < 100; i++) {
    http.get('/api/links');
  }
}
```

## Troubleshooting

### Common Issues

#### Tests Timing Out

```bash
# Increase timeout in vitest.config.ts
testTimeout: 10000,

# Or in specific test
test('slow test', async () => {
  // test code
}, 15000);
```

#### E2E Tests Failing

```bash
# Check if servers are running
curl http://localhost:5173
curl http://localhost:3000/api/health

# Run in headed mode to debug
npx playwright test --headed

# Use debug mode
npx playwright test --debug
```

#### Database Connection Issues

```bash
# Check database status
pg_isready -h localhost -p 5432

# Reset test database
dropdb affilist_test
createdb affilist_test
cd server && npm run migrate:test
```

#### Coverage Issues

```bash
# Clear coverage cache
rm -rf coverage/
npm run test:coverage

# Check excluded files in vitest.config.ts
coverage: {
  exclude: [
    // Add files to exclude
  ]
}
```

### Debugging Tests

#### Unit Tests

```typescript
// Add debug output
test('debug test', () => {
  const result = myFunction(input);
  console.log('Result:', result);
  expect(result).toBe(expected);
});

// Use debugger
test('debug test', () => {
  debugger; // Will pause in browser dev tools
  // test code
});
```

#### E2E Tests

```typescript
// Take screenshots for debugging
await page.screenshot({ path: 'debug.png' });

// Console log page content
const content = await page.content();
console.log(content);

// Pause test execution
await page.pause();
```

### Getting Help

1. **Check Documentation**: Review test files and comments
2. **Run in Debug Mode**: Use headed/debug modes for E2E tests
3. **Check Logs**: Review test output and error messages
4. **Isolate Issues**: Run specific tests to narrow down problems
5. **Update Dependencies**: Ensure testing tools are up to date

### Performance Optimization

#### Test Speed

```bash
# Run tests in parallel
npm test -- --reporter=verbose --threads

# Run only changed files
npm test -- --changed

# Skip slow tests during development
npm test -- --grep "^(?!.*slow).*$"
```

#### CI/CD Optimization

```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Run tests in parallel
strategy:
  matrix:
    test-type: [unit, integration, e2e]
```

This comprehensive testing setup ensures high code quality, reliability, and maintainability of the Affiliate Link Aggregator application.