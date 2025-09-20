import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseConnection } from '../database/connection.js';

describe('Database Connection', () => {
  let db: DatabaseConnection;

  beforeAll(() => {
    db = DatabaseConnection.getInstance();
  });

  afterAll(async () => {
    // Don't close the connection in tests as it's a singleton
    // and other tests might need it
  });

  describe('Connection Management', () => {
    it('should create a singleton instance', () => {
      const db1 = DatabaseConnection.getInstance();
      const db2 = DatabaseConnection.getInstance();
      expect(db1).toBe(db2);
    });

    it('should provide pool information', () => {
      const poolInfo = db.getPoolInfo();
      expect(poolInfo).toHaveProperty('totalCount');
      expect(poolInfo).toHaveProperty('idleCount');
      expect(poolInfo).toHaveProperty('waitingCount');
      expect(typeof poolInfo.totalCount).toBe('number');
      expect(typeof poolInfo.idleCount).toBe('number');
      expect(typeof poolInfo.waitingCount).toBe('number');
    });
  });

  describe('Query Execution', () => {
    it('should execute simple queries', async () => {
      const result = await db.query('SELECT 1 as test_value');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test_value).toBe(1);
    });

    it('should execute parameterized queries', async () => {
      const testValue = 'test_string';
      const result = await db.query('SELECT $1 as test_value', [testValue]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test_value).toBe(testValue);
    });

    it('should handle query errors gracefully', async () => {
      await expect(db.query('INVALID SQL QUERY')).rejects.toThrow();
    });
  });

  describe('Transaction Management', () => {
    it('should execute successful transactions', async () => {
      const result = await db.transaction(async (client) => {
        const res = await client.query('SELECT 1 as value');
        return res.rows[0].value;
      });

      expect(result).toBe(1);
    });

    it('should rollback failed transactions', async () => {
      await expect(
        db.transaction(async (client) => {
          await client.query('SELECT 1');
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      const isConnected = await db.testConnection();
      expect(isConnected).toBe(true);
    });
  });
});
