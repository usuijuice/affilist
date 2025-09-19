import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../apiClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('/api');
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const response = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
        signal: expect.any(AbortSignal),
      });

      expect(response).toEqual({
        data: mockData,
        success: true,
      });
    });

    it('should handle GET request errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Resource not found' }),
      });

      const response = await apiClient.get('/test');

      expect(response).toEqual({
        data: null,
        success: false,
        error: {
          message: 'Resource not found',
          status: 404,
        },
      });
    });

    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // First request
      const response1 = await apiClient.get('/test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const response2 = await apiClient.get('/test');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only called once

      expect(response1).toEqual(response2);
    });

    it('should not cache when cache is disabled', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // First request with cache disabled
      await apiClient.get('/test', { cache: false });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should not use cache
      await apiClient.get('/test', { cache: false });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, name: 'New Item' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const response = await apiClient.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });

      expect(response).toEqual({
        data: responseData,
        success: true,
      });
    });

    it('should not cache POST requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await apiClient.post('/test', { data: 'test' });
      await apiClient.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authentication', () => {
    it('should set auth token', async () => {
      const token = 'test-token';
      apiClient.setAuthToken(token);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: undefined,
        signal: expect.any(AbortSignal),
      });
    });

    it('should clear auth token', async () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('Retry logic', () => {
    it('should retry on network errors', async () => {
      // First call fails with network error
      mockFetch
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const responsePromise = apiClient.get('/test');
      
      // Fast-forward timers to trigger retry
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.success).toBe(true);
    });

    it('should retry on 5xx errors', async () => {
      // First call fails with 500 error
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const responsePromise = apiClient.get('/test');
      
      // Fast-forward timers to trigger retry
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.success).toBe(true);
    });

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not found' }),
      });

      const response = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
    });

    it('should respect max retries', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network error'));

      const responsePromise = apiClient.get('/test', { retries: 2 });
      
      // Fast-forward timers to trigger retries
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(response.success).toBe(false);
    });
  });

  describe('Cache management', () => {
    it('should clear all cache', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // Make cached request
      await apiClient.get('/test1');
      await apiClient.get('/test2');
      
      // Clear cache
      apiClient.clearCache();
      
      // Should make new requests
      await apiClient.get('/test1');
      await apiClient.get('/test2');

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should clear cache for specific endpoint', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // Make cached requests
      await apiClient.get('/test1');
      await apiClient.get('/test2');
      
      // Clear cache for specific endpoint
      apiClient.clearCacheForEndpoint('/test1');
      
      // test1 should make new request, test2 should use cache
      await apiClient.get('/test1');
      await apiClient.get('/test2');

      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 initial + 1 for cleared test1
    });
  });

  describe('Timeout handling', () => {
    it('should timeout requests', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          // Simulate a slow request that will be aborted
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: 'slow response' }),
          }), 2000);
        })
      );

      const response = await apiClient.get('/test', { timeout: 100 });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBeDefined();
    }, 10000);
  });
});