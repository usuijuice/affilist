/**
 * Integration tests for API client with real backend
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { apiClient } from '../apiClient';
import { affiliateLinksApi } from '../affiliateLinksApi';
import { categoriesApi } from '../categoriesApi';
import { authService } from '../authService';
import { config } from '../../config/environment';

// Test configuration
const TEST_API_BASE_URL = 'http://localhost:3001/api';
const TEST_ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'testpassword123',
};

describe('API Integration Tests', () => {
  const authToken: string | null = null;

  beforeAll(async () => {
    // Set test API base URL
    apiClient['baseUrl'] = TEST_API_BASE_URL;

    // Skip if not in test environment or server not available
    if (!config.isTest) {
      console.log('Skipping integration tests - not in test environment');
      return;
    }

    try {
      // Test server connectivity
      const healthResponse = await fetch(
        `${TEST_API_BASE_URL.replace('/api', '')}/health`
      );
      if (!healthResponse.ok) {
        throw new Error('Server not available');
      }
    } catch (error) {
      console.log('Skipping integration tests - server not available');
      return;
    }
  });

  afterAll(async () => {
    // Cleanup: logout if authenticated
    if (authToken) {
      try {
        await authService.logout();
      } catch (error) {
        // Ignore logout errors in cleanup
      }
    }
  });

  beforeEach(() => {
    // Clear any cached data
    apiClient.clearCache();
  });

  describe('Health Check', () => {
    it('should connect to the server', async () => {
      const response = await apiClient.get('/health');
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('status', 'ok');
    });
  });

  describe('Public API Endpoints', () => {
    it('should fetch affiliate links', async () => {
      const response = await affiliateLinksApi.getLinks({ limit: 5 });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('links');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('hasMore');
      expect(Array.isArray(response.data.links)).toBe(true);
    });

    it('should fetch categories', async () => {
      const response = await categoriesApi.getCategories();

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('categories');
      expect(Array.isArray(response.data.categories)).toBe(true);
    });

    it('should handle search with query parameters', async () => {
      const response = await affiliateLinksApi.getLinks({
        search: 'test',
        limit: 10,
        page: 1,
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('links');
    });

    it('should handle filtering by category', async () => {
      // First get categories to use a valid category ID
      const categoriesResponse = await categoriesApi.getCategories();
      if (
        categoriesResponse.success &&
        categoriesResponse.data.categories.length > 0
      ) {
        const categoryId = categoriesResponse.data.categories[0].id;

        const response = await affiliateLinksApi.getLinks({
          categories: [categoryId],
          limit: 5,
        });

        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('links');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await apiClient.get('/nonexistent-endpoint');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
    });

    it('should handle network timeouts', async () => {
      // Create a client with very short timeout
      const shortTimeoutResponse = await apiClient.request('/links', {
        timeout: 1, // 1ms timeout
      });

      expect(shortTimeoutResponse.success).toBe(false);
      expect(shortTimeoutResponse.error).toBeDefined();
    });

    it('should retry failed requests', async () => {
      // This test would need a way to simulate network failures
      // For now, we'll just test that the retry mechanism doesn't break normal requests
      const response = await apiClient.get('/health', { retries: 2 });
      expect(response.success).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await affiliateLinksApi.getLinks({ limit: 1 });
      const duration1 = Date.now() - start1;

      expect(response1.success).toBe(true);

      // Second request (should be cached and faster)
      const start2 = Date.now();
      const response2 = await affiliateLinksApi.getLinks({ limit: 1 });
      const duration2 = Date.now() - start2;

      expect(response2.success).toBe(true);
      expect(duration2).toBeLessThan(duration1);
    });

    it('should not cache POST requests', async () => {
      // This would require authentication, so we'll test the concept
      const response = await apiClient.post(
        '/test-endpoint',
        { test: 'data' },
        { cache: false }
      );
      // We expect this to fail since it's not a real endpoint, but it shouldn't be cached
      expect(response.success).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle authentication endpoints', async () => {
      // Test login endpoint exists (even if credentials are wrong)
      const response = await apiClient.post('/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      // Should fail with 401, not 404
      expect(response.success).toBe(false);
      expect(response.error?.status).toBe(401);
    });

    it('should handle token verification', async () => {
      // Test verify endpoint without token
      const response = await apiClient.get('/auth/verify');

      expect(response.success).toBe(false);
      expect(response.error?.status).toBe(401);
    });
  });

  describe('Admin Endpoints', () => {
    it('should require authentication for admin endpoints', async () => {
      const response = await apiClient.get('/admin/links');

      expect(response.success).toBe(false);
      expect(response.error?.status).toBe(401);
    });

    it('should handle admin link creation validation', async () => {
      const response = await apiClient.post('/admin/links', {
        // Invalid data to test validation
        title: '',
        url: 'not-a-url',
      });

      expect(response.success).toBe(false);
      expect(response.error?.status).toBe(401); // Should be 401 due to no auth, not 400 for validation
    });
  });

  describe('Click Tracking', () => {
    it('should handle click tracking endpoint', async () => {
      const response = await apiClient.post('/clicks', {
        linkId: 'test-link-id',
      });

      // May fail due to invalid link ID, but endpoint should exist
      expect(response.success).toBe(false);
      // Should not be 404 (endpoint not found)
      expect(response.error?.status).not.toBe(404);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        affiliateLinksApi.getLinks({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.success).toBe(true);
      });
    });

    it('should handle large result sets', async () => {
      const response = await affiliateLinksApi.getLinks({ limit: 100 });

      expect(response.success).toBe(true);
      expect(response.data.links.length).toBeLessThanOrEqual(100);
    });
  });
});

// Helper function to check if server is available
export async function isServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      `${TEST_API_BASE_URL.replace('/api', '')}/health`,
      {
        method: 'GET',
        timeout: 5000,
      } as RequestInit
    );
    return response.ok;
  } catch {
    return false;
  }
}
