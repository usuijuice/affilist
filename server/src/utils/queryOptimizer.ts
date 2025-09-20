// Database Query Optimization Utilities

import { Pool, PoolClient } from 'pg';

interface QueryCacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
}

interface QueryStats {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  slowQueries: Array<{
    query: string;
    executionTime: number;
    timestamp: number;
  }>;
}

class QueryOptimizer {
  private cache = new Map<string, QueryCacheEntry>();
  private stats: QueryStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0,
    slowQueries: [],
  };
  private executionTimes: number[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_SLOW_QUERIES = 100;
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private pool: Pool) {}

  private generateCacheKey(query: string, params: any[]): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  private isExpired(entry: QueryCacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateStats(executionTime: number, fromCache: boolean): void {
    this.stats.totalQueries++;

    if (fromCache) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
      this.executionTimes.push(executionTime);

      // Calculate rolling average (last 1000 queries)
      if (this.executionTimes.length > 1000) {
        this.executionTimes.shift();
      }

      this.stats.averageExecutionTime =
        this.executionTimes.reduce((sum, time) => sum + time, 0) /
        this.executionTimes.length;

      // Track slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        this.stats.slowQueries.push({
          query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
          executionTime,
          timestamp: Date.now(),
        });

        // Keep only recent slow queries
        if (this.stats.slowQueries.length > this.MAX_SLOW_QUERIES) {
          this.stats.slowQueries.shift();
        }
      }
    }
  }

  async query<T = any>(
    query: string,
    params: any[] = [],
    options: {
      cache?: boolean;
      cacheTTL?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      cache = false,
      cacheTTL = this.DEFAULT_CACHE_TTL,
      timeout = 30000,
    } = options;
    const startTime = Date.now();

    // Check cache for SELECT queries
    if (cache && query.trim().toLowerCase().startsWith('select')) {
      const cacheKey = this.generateCacheKey(query, params);
      const cached = this.cache.get(cacheKey);

      if (cached && !this.isExpired(cached)) {
        this.updateStats(Date.now() - startTime, true);
        return cached.result;
      }
    }

    let client: PoolClient | null = null;

    try {
      // Get client with timeout
      client = await Promise.race([
        this.pool.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        ),
      ]);

      // Execute query with timeout
      const result = await Promise.race([
        client.query(query, params),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        ),
      ]);

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      // Cache SELECT query results
      if (cache && query.trim().toLowerCase().startsWith('select')) {
        const cacheKey = this.generateCacheKey(query, params);
        this.cache.set(cacheKey, {
          result: result.rows,
          timestamp: Date.now(),
          ttl: cacheTTL,
        });
      }

      return result.rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      console.error('Query execution failed:', {
        query: query.substring(0, 200),
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      });

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Batch query execution
  async batchQuery<T = any>(
    queries: Array<{ query: string; params?: any[] }>,
    options: { transaction?: boolean; timeout?: number } = {}
  ): Promise<T[]> {
    const { transaction = false, timeout = 60000 } = options;
    const startTime = Date.now();

    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      if (transaction) {
        await client.query('BEGIN');
      }

      const results: T[] = [];

      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push(result.rows);
      }

      if (transaction) {
        await client.query('COMMIT');
      }

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      return results;
    } catch (error) {
      if (client && transaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Prepared statement execution
  async preparedQuery<T = any>(
    name: string,
    query: string,
    params: any[] = [],
    options: { cache?: boolean; cacheTTL?: number } = {}
  ): Promise<T> {
    const { cache = false, cacheTTL = this.DEFAULT_CACHE_TTL } = options;
    const startTime = Date.now();

    // Check cache
    if (cache) {
      const cacheKey = this.generateCacheKey(`${name}:${query}`, params);
      const cached = this.cache.get(cacheKey);

      if (cached && !this.isExpired(cached)) {
        this.updateStats(Date.now() - startTime, true);
        return cached.result;
      }
    }

    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      // Prepare statement if not exists
      try {
        await client.query(`PREPARE ${name} AS ${query}`);
      } catch (error) {
        // Statement might already exist, ignore error
      }

      // Execute prepared statement
      const result = await client.query(
        `EXECUTE ${name}(${params.map((_, i) => `$${i + 1}`).join(', ')})`,
        params
      );

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      // Cache result
      if (cache) {
        const cacheKey = this.generateCacheKey(`${name}:${query}`, params);
        this.cache.set(cacheKey, {
          result: result.rows,
          timestamp: Date.now(),
          ttl: cacheTTL,
        });
      }

      return result.rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Connection pool monitoring
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  // Query statistics
  getQueryStats(): QueryStats {
    return { ...this.stats };
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  cleanupExpiredCache(): number {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate:
        this.stats.totalQueries > 0
          ? this.stats.cacheHits / this.stats.totalQueries
          : 0,
      hits: this.stats.cacheHits,
      misses: this.stats.cacheMisses,
    };
  }

  // Query analysis
  analyzeQuery(query: string): {
    type: string;
    tables: string[];
    hasWhere: boolean;
    hasJoin: boolean;
    hasOrderBy: boolean;
    hasLimit: boolean;
    complexity: 'low' | 'medium' | 'high';
  } {
    const normalizedQuery = query.toLowerCase().trim();

    const type = normalizedQuery.split(' ')[0];
    const tables = this.extractTables(query);
    const hasWhere = normalizedQuery.includes(' where ');
    const hasJoin = normalizedQuery.includes(' join ');
    const hasOrderBy = normalizedQuery.includes(' order by ');
    const hasLimit = normalizedQuery.includes(' limit ');

    let complexity: 'low' | 'medium' | 'high' = 'low';

    if (hasJoin && tables.length > 2) {
      complexity = 'high';
    } else if (hasJoin || tables.length > 1) {
      complexity = 'medium';
    }

    return {
      type,
      tables,
      hasWhere,
      hasJoin,
      hasOrderBy,
      hasLimit,
      complexity,
    };
  }

  private extractTables(query: string): string[] {
    const tables: string[] = [];
    const normalizedQuery = query.toLowerCase();

    // Simple table extraction (can be improved)
    const fromMatch = normalizedQuery.match(/from\s+(\w+)/g);
    const joinMatch = normalizedQuery.match(/join\s+(\w+)/g);

    if (fromMatch) {
      fromMatch.forEach((match) => {
        const table = match.replace(/from\s+/, '');
        tables.push(table);
      });
    }

    if (joinMatch) {
      joinMatch.forEach((match) => {
        const table = match.replace(/join\s+/, '');
        tables.push(table);
      });
    }

    return [...new Set(tables)]; // Remove duplicates
  }

  // Performance monitoring
  startPerformanceMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      const stats = this.getQueryStats();
      const poolStats = this.getPoolStats();
      const cacheStats = this.getCacheStats();

      console.log('Database Performance Stats:', {
        queries: {
          total: stats.totalQueries,
          averageTime: Math.round(stats.averageExecutionTime),
          slowQueries: stats.slowQueries.length,
        },
        cache: {
          hitRate: Math.round(cacheStats.hitRate * 100) + '%',
          size: cacheStats.size,
        },
        pool: poolStats,
      });

      // Cleanup expired cache entries
      const removed = this.cleanupExpiredCache();
      if (removed > 0) {
        console.log(`Cleaned up ${removed} expired cache entries`);
      }
    }, intervalMs);
  }
}

export { QueryOptimizer };
export type { QueryStats };
