// API Response Caching Utilities

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh data
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, maxSize: 0 };
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    staleWhileRevalidate: true,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.stats.maxSize = this.defaultConfig.maxSize;
  }

  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.size--;
    }
  }

  private shouldEvict(): boolean {
    return this.cache.size >= this.defaultConfig.maxSize;
  }

  set<T>(
    url: string,
    data: T,
    options: {
      params?: Record<string, any>;
      ttl?: number;
      etag?: string;
      lastModified?: string;
    } = {}
  ): void {
    const key = this.generateKey(url, options.params);
    const ttl = options.ttl || this.defaultConfig.ttl;

    // Evict oldest entry if cache is full
    if (this.shouldEvict()) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      etag: options.etag,
      lastModified: options.lastModified,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  get<T>(
    url: string,
    params?: Record<string, any>
  ): { data: T; isStale: boolean } | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    const isStale = this.isExpired(entry);

    return {
      data: entry.data,
      isStale,
    };
  }

  has(url: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    return this.cache.has(key);
  }

  delete(url: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  // Clean up expired entries
  cleanup(): number {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.stats.size = this.cache.size;
    return removedCount;
  }

  // Get cache entry with metadata
  getEntry<T>(url: string, params?: Record<string, any>): CacheEntry<T> | null {
    const key = this.generateKey(url, params);
    return this.cache.get(key) || null;
  }

  // Update cache entry TTL
  updateTTL(url: string, ttl: number, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (entry) {
      entry.ttl = ttl;
      entry.timestamp = Date.now(); // Reset timestamp
      return true;
    }

    return false;
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: RegExp): number {
    let removedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.stats.size = this.cache.size;
    return removedCount;
  }
}

// Global API cache instance
export const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  staleWhileRevalidate: true,
});

// Cache-aware fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & {
    params?: Record<string, any>;
    cacheTTL?: number;
    useCache?: boolean;
  } = {}
): Promise<T> {
  const { params, cacheTTL, useCache = true, ...fetchOptions } = options;

  // Only cache GET requests
  if (fetchOptions.method && fetchOptions.method !== 'GET') {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Check cache first
  if (useCache) {
    const cached = apiCache.get<T>(url, params);
    if (cached && !cached.isStale) {
      console.log(`[Cache] Hit: ${url}`);
      return cached.data;
    }

    // Return stale data while revalidating in background
    if (
      cached &&
      cached.isStale &&
      apiCache.defaultConfig.staleWhileRevalidate
    ) {
      console.log(`[Cache] Stale hit, revalidating: ${url}`);

      // Revalidate in background
      cachedFetch(url, { ...options, useCache: false })
        .then((freshData) => {
          apiCache.set(url, freshData, { params, ttl: cacheTTL });
        })
        .catch((error) => {
          console.warn(
            `[Cache] Background revalidation failed: ${error.message}`
          );
        });

      return cached.data;
    }
  }

  console.log(`[Cache] Miss: ${url}`);

  // Fetch from network
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the response
    if (useCache) {
      const etag = response.headers.get('etag') || undefined;
      const lastModified = response.headers.get('last-modified') || undefined;

      apiCache.set(url, data, {
        params,
        ttl: cacheTTL,
        etag,
        lastModified,
      });
    }

    return data;
  } catch (error) {
    // Try to return stale data if network fails
    if (useCache) {
      const cached = apiCache.get<T>(url, params);
      if (cached) {
        console.warn(`[Cache] Network failed, returning stale data: ${url}`);
        return cached.data;
      }
    }

    throw error;
  }
}

// React hook for cached API calls
export function useCachedAPI<T>(
  url: string | null,
  options: {
    params?: Record<string, any>;
    cacheTTL?: number;
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { params, cacheTTL, enabled = true, refetchInterval } = options;

  const fetchData = React.useCallback(async () => {
    if (!url || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await cachedFetch<T>(url, { params, cacheTTL });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, params, cacheTTL, enabled]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refetch interval
  React.useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval, enabled]);

  const refetch = React.useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const invalidate = React.useCallback(() => {
    if (url) {
      apiCache.delete(url, params);
    }
  }, [url, params]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

// Cache management utilities
export function getCacheStats(): CacheStats {
  return apiCache.getStats();
}

export function clearAPICache(): void {
  apiCache.clear();
}

export function cleanupExpiredCache(): number {
  return apiCache.cleanup();
}

export function invalidateCachePattern(pattern: RegExp): number {
  return apiCache.invalidatePattern(pattern);
}

// Auto cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      const removed = cleanupExpiredCache();
      if (removed > 0) {
        console.log(`[Cache] Cleaned up ${removed} expired entries`);
      }
    },
    10 * 60 * 1000
  );
}

// Export types
export type { CacheConfig, CacheEntry, CacheStats };

// Import React for hooks
import React from 'react';
