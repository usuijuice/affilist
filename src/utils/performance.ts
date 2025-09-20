// Performance monitoring utilities
import React from 'react';

interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.logNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

        // Observe resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.logResourceMetrics(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.logMetric('LCP', lastEntry.startTime, performance.now());
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = (entry as any).processingStart - entry.startTime;
            this.logMetric('FID', fid, performance.now());
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  private logNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'TLS Handshake':
        entry.secureConnectionStart > 0
          ? entry.connectEnd - entry.secureConnectionStart
          : 0,
      Request: entry.responseStart - entry.requestStart,
      Response: entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domComplete - (entry as any).domLoading,
      'Load Complete': entry.loadEventEnd - entry.loadEventStart,
      'Total Load Time': entry.loadEventEnd - (entry as any).navigationStart,
    };

    Object.entries(metrics).forEach(([name, duration]) => {
      if (duration > 0) {
        this.logMetric(name, duration, performance.now());
      }
    });
  }

  private logResourceMetrics(entry: PerformanceResourceTiming) {
    // Only log slow resources (>100ms)
    const duration = entry.responseEnd - entry.startTime;
    if (duration > 100) {
      const resourceType = this.getResourceType(entry.name);
      this.logMetric(`${resourceType} Load`, duration, performance.now());
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Image';
    if (url.includes('/api/')) return 'API';
    return 'Resource';
  }

  // Public methods
  startTiming(name: string): void {
    const startTime = performance.now();
    this.metrics.set(name, {
      name,
      duration: 0,
      startTime,
      endTime: 0,
    });
  }

  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      duration,
      endTime,
    });

    this.logMetric(name, duration, endTime);
    return duration;
  }

  private logMetric(name: string, duration: number, _timestamp: number): void {
    // Only log in development or when explicitly enabled
    if (
      import.meta.env.DEV ||
      localStorage.getItem('enablePerformanceLogging')
    ) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    // Send to analytics in production (if configured)
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        custom_map: { metric_name: name },
      });
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Web Vitals helpers
  getCLS(): Promise<number> {
    return new Promise((resolve) => {
      let clsValue = 0;
      const clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsEntries.push(entry);
            clsValue += entry.value;
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Resolve after 5 seconds or when page is hidden
      const timeout = setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(clsValue);
        }
      });
    });
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const startTiming = (name: string) => performanceMonitor.startTiming(name);
  const endTiming = (name: string) => performanceMonitor.endTiming(name);
  const getMetrics = () => performanceMonitor.getMetrics();
  const getMetric = (name: string) => performanceMonitor.getMetric(name);

  return {
    startTiming,
    endTiming,
    getMetrics,
    getMetric,
  };
}

// Higher-order component for measuring component render time
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const name =
      componentName || Component.displayName || Component.name || 'Component';

    React.useEffect(() => {
      performanceMonitor.startTiming(`${name} Mount`);
      return () => {
        performanceMonitor.endTiming(`${name} Mount`);
      };
    }, [name]);

    React.useLayoutEffect(() => {
      performanceMonitor.startTiming(`${name} Render`);
      return () => {
        performanceMonitor.endTiming(`${name} Render`);
      };
    });

    return React.createElement(Component, props);
  };
}

// Utility functions
export function measureAsync<T>(
  name: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  performanceMonitor.startTiming(name);
  return asyncFn().finally(() => {
    performanceMonitor.endTiming(name);
  });
}

export function measureSync<T>(name: string, syncFn: () => T): T {
  performanceMonitor.startTiming(name);
  try {
    return syncFn();
  } finally {
    performanceMonitor.endTiming(name);
  }
}

// Performance budget checker
export function checkPerformanceBudget(
  budgets: Record<string, number>
): boolean {
  const metrics = performanceMonitor.getMetrics();
  let budgetPassed = true;

  Object.entries(budgets).forEach(([metricName, budget]) => {
    const metric = metrics.find((m) => m.name === metricName);
    if (metric && metric.duration > budget) {
      console.warn(
        `Performance budget exceeded for ${metricName}: ${metric.duration.toFixed(2)}ms > ${budget}ms`
      );
      budgetPassed = false;
    }
  });

  return budgetPassed;
}

// Export types
export type { PerformanceMetrics };

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
