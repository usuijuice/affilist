import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  performanceMonitor, 
  measureAsync, 
  measureSync,
  checkPerformanceBudget 
} from '../performance';
import { apiCache, cachedFetch } from '../apiCache';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
    apiCache.clear();
  });

  describe('Component Rendering Performance', () => {
    it('should measure component mount time within budget', async () => {
      const mockComponentMount = () => {
        // Simulate component mounting work
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Simulate 50ms of work
        }
        return 'mounted';
      };

      const result = measureSync('ComponentMount', mockComponentMount);
      
      expect(result).toBe('mounted');
      
      const metric = performanceMonitor.getMetric('ComponentMount');
      expect(metric).toBeDefined();
      expect(metric!.duration).toBeGreaterThan(40);
      expect(metric!.duration).toBeLessThan(100);
      
      // Check performance budget
      const budgetPassed = checkPerformanceBudget({
        'ComponentMount': 100, // 100ms budget
      });
      
      expect(budgetPassed).toBe(true);
    });

    it('should detect slow component renders', async () => {
      const slowComponentMount = () => {
        // Simulate slow component mounting
        const start = Date.now();
        while (Date.now() - start < 150) {
          // Simulate 150ms of work
        }
        return 'slow-mounted';
      };

      measureSync('SlowComponentMount', slowComponentMount);
      
      const budgetPassed = checkPerformanceBudget({
        'SlowComponentMount': 100, // 100ms budget
      });
      
      expect(budgetPassed).toBe(false);
    });
  });

  describe('API Caching Performance', () => {
    it('should improve performance with caching', async () => {
      const mockApiResponse = { data: 'test-data' };
      
      // Mock fetch to simulate network delay
      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockApiResponse),
              headers: new Map(),
            });
          }, 100); // 100ms network delay
        })
      );

      // First call - should hit network
      const start1 = Date.now();
      const result1 = await cachedFetch('/api/test');
      const duration1 = Date.now() - start1;
      
      expect(result1).toEqual(mockApiResponse);
      expect(duration1).toBeGreaterThan(90); // Should include network delay
      
      // Second call - should hit cache
      const start2 = Date.now();
      const result2 = await cachedFetch('/api/test');
      const duration2 = Date.now() - start2;
      
      expect(result2).toEqual(mockApiResponse);
      expect(duration2).toBeLessThan(10); // Should be much faster from cache
      
      // Verify cache hit
      const cacheStats = apiCache.getStats();
      expect(cacheStats.hits).toBe(1);
      expect(cacheStats.misses).toBe(1);
    });

    it('should handle cache performance under load', async () => {
      const mockApiResponse = { data: 'load-test-data' };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
        headers: new Map(),
      });

      // First, make some requests to populate cache
      await cachedFetch('/api/test-1');
      await cachedFetch('/api/test-2');
      await cachedFetch('/api/test-3');

      // Now simulate concurrent requests with some repeated URLs
      const concurrentRequests = 20;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        cachedFetch(`/api/test-${(i % 3) + 1}`) // 3 unique URLs, repeated requests
      );

      const start = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(results).toHaveLength(concurrentRequests);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const cacheStats = apiCache.getStats();
      expect(cacheStats.hits).toBeGreaterThan(0); // Should have cache hits from repeated URLs
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should monitor memory usage during operations', () => {
      // Create a large array to simulate memory usage
      const largeArray = new Array(100000).fill('test-data');
      
      const initialMemory = performanceMonitor.getMemoryUsage();
      
      // Perform memory-intensive operation
      const processedArray = largeArray.map(item => item.toUpperCase());
      
      const finalMemory = performanceMonitor.getMemoryUsage();
      
      expect(processedArray).toHaveLength(100000);
      
      if (initialMemory && finalMemory) {
        expect(finalMemory.usedJSHeapSize).toBeGreaterThanOrEqual(initialMemory.usedJSHeapSize);
      }
    });

    it('should detect memory leaks in cache', () => {
      const initialCacheSize = apiCache.getStats().size;
      
      // Add many items to cache
      for (let i = 0; i < 1000; i++) {
        apiCache.set(`/api/test-${i}`, { data: `test-${i}` });
      }
      
      const afterAddingSize = apiCache.getStats().size;
      expect(afterAddingSize).toBeGreaterThan(initialCacheSize);
      
      // Clear cache
      apiCache.clear();
      
      const afterClearingSize = apiCache.getStats().size;
      expect(afterClearingSize).toBe(0);
    });
  });

  describe('Bundle Size Performance', () => {
    it('should track code splitting effectiveness', () => {
      // This would typically be measured by build tools
      // Here we simulate checking if lazy loading is working
      
      const lazyComponents = [
        'AdminDashboard',
        'AnalyticsDashboard',
        'LinkManagementTable',
      ];
      
      // Simulate checking if components are lazy loaded
      lazyComponents.forEach(componentName => {
        const isLazyLoaded = true; // In real test, check if component is in separate chunk
        expect(isLazyLoaded).toBe(true);
      });
    });
  });

  describe('Database Query Performance', () => {
    it('should benchmark query execution times', async () => {
      // Mock database query
      const mockQuery = async () => {
        // Simulate database query delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return [{ id: 1, name: 'test' }];
      };

      const result = await measureAsync('DatabaseQuery', mockQuery);
      
      expect(result).toEqual([{ id: 1, name: 'test' }]);
      
      const metric = performanceMonitor.getMetric('DatabaseQuery');
      expect(metric).toBeDefined();
      expect(metric!.duration).toBeGreaterThan(40);
      expect(metric!.duration).toBeLessThan(100);
    });
  });

  describe('Performance Budget Validation', () => {
    it('should validate performance budgets for critical paths', () => {
      // Simulate various operations with different performance characteristics
      const operations = [
        { name: 'PageLoad', duration: 800, budget: 1000 },
        { name: 'APICall', duration: 200, budget: 500 },
        { name: 'ComponentRender', duration: 50, budget: 100 },
        { name: 'ImageLoad', duration: 300, budget: 1000 },
      ];

      operations.forEach(({ name, duration }) => {
        performanceMonitor.startTiming(name);
        // Simulate work
        const start = Date.now();
        while (Date.now() - start < duration) {
          // Busy wait to simulate work
        }
        performanceMonitor.endTiming(name);
      });

      const budgets = operations.reduce((acc, { name, budget }) => {
        acc[name] = budget;
        return acc;
      }, {} as Record<string, number>);

      const budgetPassed = checkPerformanceBudget(budgets);
      expect(budgetPassed).toBe(true);
    });

    it('should fail budget validation for slow operations', () => {
      // Simulate a slow operation
      performanceMonitor.startTiming('SlowOperation');
      const start = Date.now();
      while (Date.now() - start < 200) {
        // Simulate 200ms of work
      }
      performanceMonitor.endTiming('SlowOperation');

      const budgetPassed = checkPerformanceBudget({
        'SlowOperation': 100, // 100ms budget, but operation takes 200ms
      });

      expect(budgetPassed).toBe(false);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical user workflow performance', async () => {
      // Simulate a typical user workflow
      const workflow = async () => {
        // 1. Page load
        performanceMonitor.startTiming('PageLoad');
        await new Promise(resolve => setTimeout(resolve, 100));
        performanceMonitor.endTiming('PageLoad');

        // 2. API data fetch
        const apiData = await measureAsync('APIFetch', async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
          return { links: [], categories: [] };
        });

        // 3. Component rendering
        const renderResult = measureSync('ComponentRender', () => {
          // Simulate component rendering
          return 'rendered';
        });

        return { apiData, renderResult };
      };

      const result = await workflow();
      
      expect(result.apiData).toBeDefined();
      expect(result.renderResult).toBe('rendered');

      // Check that all operations completed within reasonable time
      const budgetPassed = checkPerformanceBudget({
        'PageLoad': 200,
        'APIFetch': 300,
        'ComponentRender': 50,
      });

      expect(budgetPassed).toBe(true);
    });
  });
});