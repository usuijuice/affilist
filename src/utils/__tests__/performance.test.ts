import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  performanceMonitor,
  usePerformanceMonitor,
  measureAsync,
  measureSync,
  checkPerformanceBudget,
  withPerformanceMonitoring,
} from '../performance';
import { renderHook } from '@testing-library/react';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: (list: any) => void;

  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}
}

global.PerformanceObserver = MockPerformanceObserver as any;
global.performance = mockPerformance as any;

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Basic Timing', () => {
    it('should start and end timing correctly', () => {
      const startTime = 1000;
      const endTime = 1500;

      mockPerformance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      performanceMonitor.startTiming('test-operation');
      const duration = performanceMonitor.endTiming('test-operation');

      expect(duration).toBe(500);

      const metric = performanceMonitor.getMetric('test-operation');
      expect(metric).toEqual({
        name: 'test-operation',
        duration: 500,
        startTime,
        endTime,
      });
    });

    it('should handle ending timing for non-existent operation', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const duration = performanceMonitor.endTiming('non-existent');

      expect(duration).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'No timing started for: non-existent'
      );

      consoleSpy.mockRestore();
    });

    it('should clear metrics', () => {
      performanceMonitor.startTiming('test');
      performanceMonitor.endTiming('test');

      expect(performanceMonitor.getMetrics()).toHaveLength(1);

      performanceMonitor.clearMetrics();

      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('usePerformanceMonitor Hook', () => {
    it('should provide performance monitoring functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      expect(result.current).toHaveProperty('startTiming');
      expect(result.current).toHaveProperty('endTiming');
      expect(result.current).toHaveProperty('getMetrics');
      expect(result.current).toHaveProperty('getMetric');
    });

    it('should work with hook functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor());

      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200);

      result.current.startTiming('hook-test');
      const duration = result.current.endTiming('hook-test');

      expect(duration).toBe(200);

      const metrics = result.current.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('hook-test');
    });
  });

  describe('Async Measurement', () => {
    it('should measure async operations', async () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1300);

      const asyncOperation = vi.fn().mockResolvedValue('result');

      const result = await measureAsync('async-test', asyncOperation);

      expect(result).toBe('result');
      expect(asyncOperation).toHaveBeenCalled();

      const metric = performanceMonitor.getMetric('async-test');
      expect(metric?.duration).toBe(300);
    });

    it('should measure async operations that throw', async () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);

      const asyncOperation = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(measureAsync('async-error', asyncOperation)).rejects.toThrow(
        'Test error'
      );

      const metric = performanceMonitor.getMetric('async-error');
      expect(metric?.duration).toBe(100);
    });
  });

  describe('Sync Measurement', () => {
    it('should measure sync operations', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1150);

      const syncOperation = vi.fn().mockReturnValue('sync-result');

      const result = measureSync('sync-test', syncOperation);

      expect(result).toBe('sync-result');
      expect(syncOperation).toHaveBeenCalled();

      const metric = performanceMonitor.getMetric('sync-test');
      expect(metric?.duration).toBe(150);
    });

    it('should measure sync operations that throw', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

      const syncOperation = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });

      expect(() => measureSync('sync-error', syncOperation)).toThrow(
        'Sync error'
      );

      const metric = performanceMonitor.getMetric('sync-error');
      expect(metric?.duration).toBe(50);
    });
  });

  describe('Performance Budget', () => {
    beforeEach(() => {
      // Set up some test metrics
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200) // fast-operation: 200ms
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2800); // slow-operation: 800ms

      performanceMonitor.startTiming('fast-operation');
      performanceMonitor.endTiming('fast-operation');

      performanceMonitor.startTiming('slow-operation');
      performanceMonitor.endTiming('slow-operation');
    });

    it('should pass when all metrics are within budget', () => {
      const budgets = {
        'fast-operation': 300,
        'slow-operation': 1000,
      };

      const result = checkPerformanceBudget(budgets);
      expect(result).toBe(true);
    });

    it('should fail when metrics exceed budget', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const budgets = {
        'fast-operation': 100, // This will fail (200ms > 100ms)
        'slow-operation': 1000,
      };

      const result = checkPerformanceBudget(budgets);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Performance budget exceeded for fast-operation'
        )
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing metrics gracefully', () => {
      const budgets = {
        'non-existent-metric': 100,
      };

      const result = checkPerformanceBudget(budgets);
      expect(result).toBe(true); // Should pass if metric doesn't exist
    });
  });

  describe('Memory Usage', () => {
    it('should return memory usage when available', () => {
      const mockMemory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      };

      (global.performance as any).memory = mockMemory;

      const memoryUsage = performanceMonitor.getMemoryUsage();
      expect(memoryUsage).toEqual(mockMemory);
    });

    it('should return null when memory API is not available', () => {
      delete (global.performance as any).memory;

      const memoryUsage = performanceMonitor.getMemoryUsage();
      expect(memoryUsage).toBeNull();
    });
  });

  describe('Component Performance Monitoring', () => {
    it('should create a performance monitored component', () => {
      const TestComponent = () => React.createElement('div', null, 'Test');
      const MonitoredComponent = withPerformanceMonitoring(
        TestComponent,
        'TestComponent'
      );

      expect(MonitoredComponent).toBeDefined();
      expect(typeof MonitoredComponent).toBe('function');
    });
  });
});

describe('Performance Integration', () => {
  it('should handle multiple concurrent timings', () => {
    const timings = [
      { name: 'operation-1', start: 1000, end: 1200 },
      { name: 'operation-2', start: 1100, end: 1400 },
      { name: 'operation-3', start: 1300, end: 1500 },
    ];

    // Mock all the performance.now calls in sequence
    mockPerformance.now
      .mockReturnValueOnce(1000) // operation-1 start
      .mockReturnValueOnce(1100) // operation-2 start
      .mockReturnValueOnce(1300) // operation-3 start
      .mockReturnValueOnce(1200) // operation-1 end
      .mockReturnValueOnce(1400) // operation-2 end
      .mockReturnValueOnce(1500); // operation-3 end

    // Start all timings
    timings.forEach((timing) => {
      performanceMonitor.startTiming(timing.name);
    });

    // End all timings
    const durations = timings.map((timing) =>
      performanceMonitor.endTiming(timing.name)
    );

    expect(durations).toEqual([200, 300, 200]);

    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(3);
  });

  it('should handle performance monitoring lifecycle', () => {
    // Test the full lifecycle
    performanceMonitor.clearMetrics();
    expect(performanceMonitor.getMetrics()).toHaveLength(0);

    // Add some metrics
    mockPerformance.now
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(2300);

    performanceMonitor.startTiming('lifecycle-1');
    performanceMonitor.endTiming('lifecycle-1');

    performanceMonitor.startTiming('lifecycle-2');
    performanceMonitor.endTiming('lifecycle-2');

    expect(performanceMonitor.getMetrics()).toHaveLength(2);

    // Test budget checking
    const budgetResult = checkPerformanceBudget({
      'lifecycle-1': 200,
      'lifecycle-2': 400,
    });
    expect(budgetResult).toBe(true);

    // Clear and verify
    performanceMonitor.clearMetrics();
    expect(performanceMonitor.getMetrics()).toHaveLength(0);
  });
});
