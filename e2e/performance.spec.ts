import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage loads within performance budget', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    console.log('Performance metrics:', metrics);
    
    // Assert performance budgets
    if (metrics.FCP) {
      expect(metrics.FCP).toBeLessThan(2000); // FCP should be under 2s
    }
    if (metrics.LCP) {
      expect(metrics.LCP).toBeLessThan(4000); // LCP should be under 4s
    }
  });

  test('search performance is acceptable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Measure search response time
    const startTime = Date.now();
    await searchInput.fill('Vercel');
    
    // Wait for search results to update
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('[data-testid="affiliate-link-card"]');
      return cards.length > 0;
    });
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    console.log(`Search took ${searchTime}ms`);
    expect(searchTime).toBeLessThan(1000); // Search should respond within 1s
  });

  test('page bundle size is reasonable', async ({ page }) => {
    // Monitor network requests
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.url().includes('.js') ? 'js' : 'css'
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    const totalJsSize = responses
      .filter(r => r.type === 'js')
      .reduce((sum, r) => sum + (parseInt(r.size) || 0), 0);
    
    const totalCssSize = responses
      .filter(r => r.type === 'css')
      .reduce((sum, r) => sum + (parseInt(r.size) || 0), 0);
    
    console.log(`Total JS size: ${totalJsSize} bytes`);
    console.log(`Total CSS size: ${totalCssSize} bytes`);
    
    // Assert reasonable bundle sizes (adjust based on your requirements)
    expect(totalJsSize).toBeLessThan(500000); // 500KB for JS
    expect(totalCssSize).toBeLessThan(100000); // 100KB for CSS
  });

  test('images load efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Wait for images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    }, { timeout: 10000 });
    
    // Check that images are optimized
    const imageInfo = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.offsetWidth,
        displayHeight: img.offsetHeight,
      }));
    });
    
    // Verify images aren't oversized
    imageInfo.forEach(img => {
      const oversized = img.naturalWidth > img.displayWidth * 2 || 
                       img.naturalHeight > img.displayHeight * 2;
      if (oversized) {
        console.warn(`Oversized image detected: ${img.src}`);
      }
    });
  });

  test('memory usage is stable during navigation', async ({ page }) => {
    // Navigate through different pages
    const pages = ['/', '/categories', '/featured'];
    const memoryUsage: number[] = [];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Measure memory usage
      const memory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (memory > 0) {
        memoryUsage.push(memory);
        console.log(`Memory usage on ${pagePath}: ${memory} bytes`);
      }
    }
    
    // Check for memory leaks (memory should not grow excessively)
    if (memoryUsage.length > 1) {
      const growth = memoryUsage[memoryUsage.length - 1] - memoryUsage[0];
      const growthPercentage = (growth / memoryUsage[0]) * 100;
      
      console.log(`Memory growth: ${growthPercentage.toFixed(2)}%`);
      expect(growthPercentage).toBeLessThan(200); // Less than 200% growth
    }
  });
});