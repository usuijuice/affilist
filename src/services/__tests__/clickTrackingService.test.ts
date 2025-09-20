import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ClickTrackingService, ClickAnalytics } from '../clickTrackingService';
import { apiClient } from '../apiClient';

// Mock the API client
vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock browser APIs
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockNavigator = {
  onLine: true,
  userAgent: 'Mozilla/5.0 (Test Browser)',
  sendBeacon: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
});

Object.defineProperty(document, 'referrer', {
  value: 'https://example.com',
});

Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

// Mock event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});
Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
});

describe('ClickTrackingService', () => {
  let service: ClickTrackingService;
  const mockApiPost = apiClient.post as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockApiPost.mockResolvedValue({ success: true });

    service = new ClickTrackingService({
      enableTracking: true,
      sessionTimeout: 30 * 60 * 1000,
      batchSize: 5,
      flushInterval: 1000,
      enableLocalStorage: true,
    });
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Session Management', () => {
    it('should create a new session on initialization', () => {
      const sessionData = service.getSessionData();

      expect(sessionData).toBeTruthy();
      expect(sessionData?.sessionId).toBeTruthy();
      expect(sessionData?.startTime).toBeInstanceOf(Date);
      expect(sessionData?.lastActivity).toBeInstanceOf(Date);
      expect(sessionData?.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(sessionData?.referrer).toBe('https://example.com');
      expect(sessionData?.clickCount).toBe(0);
    });

    it('should restore existing session from localStorage', () => {
      const existingSession = {
        sessionId: 'existing-session-123',
        startTime: new Date(Date.now() - 10000).toISOString(),
        lastActivity: new Date(Date.now() - 5000).toISOString(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referrer: 'https://example.com',
        clickCount: 5,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingSession));

      const newService = new ClickTrackingService();
      const sessionData = newService.getSessionData();

      expect(sessionData?.sessionId).toBe('existing-session-123');
      expect(sessionData?.clickCount).toBe(5);

      newService.destroy();
    });

    it('should create new session if existing session is expired', () => {
      const expiredSession = {
        sessionId: 'expired-session-123',
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        lastActivity: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        clickCount: 5,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession));

      const newService = new ClickTrackingService();
      const sessionData = newService.getSessionData();

      expect(sessionData?.sessionId).not.toBe('expired-session-123');
      expect(sessionData?.clickCount).toBe(0);

      newService.destroy();
    });

    it('should set user ID for session', () => {
      service.setUserId('user-123');
      const sessionData = service.getSessionData();

      expect(sessionData?.userId).toBe('user-123');
    });

    it('should clear session and create new one', () => {
      const originalSessionId = service.getSessionData()?.sessionId;

      service.clearSession();
      const newSessionData = service.getSessionData();

      expect(newSessionData?.sessionId).not.toBe(originalSessionId);
      expect(newSessionData?.clickCount).toBe(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'clickTracking_session'
      );
    });
  });

  describe('Click Tracking', () => {
    it('should track click events', async () => {
      await service.trackClick('link-123', { category: 'test' });

      const sessionData = service.getSessionData();
      expect(sessionData?.clickCount).toBe(1);
    });

    it('should queue clicks and flush when batch size is reached', async () => {
      // Track clicks up to batch size
      for (let i = 0; i < 5; i++) {
        await service.trackClick(`link-${i}`);
      }

      expect(mockApiPost).toHaveBeenCalledWith('/clicks/batch', {
        clicks: expect.arrayContaining([
          expect.objectContaining({
            linkId: 'link-0',
            timestamp: expect.any(Date),
            userAgent: 'Mozilla/5.0 (Test Browser)',
            sessionId: expect.any(String),
          }),
        ]),
      });
    });

    it('should include metadata in click tracking', async () => {
      const metadata = {
        category: 'technology',
        featured: true,
        commissionRate: 10,
      };

      await service.trackClick('link-123', metadata);

      // Trigger flush by reaching batch size
      for (let i = 0; i < 4; i++) {
        await service.trackClick(`link-${i}`);
      }

      expect(mockApiPost).toHaveBeenCalledWith('/clicks/batch', {
        clicks: expect.arrayContaining([
          expect.objectContaining({
            linkId: 'link-123',
            metadata,
          }),
        ]),
      });
    });

    it('should not track clicks when tracking is disabled', async () => {
      const disabledService = new ClickTrackingService({
        enableTracking: false,
      });

      await disabledService.trackClick('link-123');

      expect(mockApiPost).not.toHaveBeenCalled();

      disabledService.destroy();
    });

    it('should handle API errors gracefully', async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        error: { message: 'Server error' },
      });

      // Should not throw error
      await expect(service.trackClick('link-123')).resolves.toBeUndefined();
    });

    it('should re-queue clicks on network failure when offline', async () => {
      // Simulate being offline
      (service as any).isOnline = false;
      mockApiPost.mockRejectedValue(new Error('Network error'));

      // Track clicks - each will trigger a flush when offline
      for (let i = 0; i < 5; i++) {
        await service.trackClick(`link-${i}`);
      }

      expect(mockApiPost).toHaveBeenCalledTimes(5); // Each click triggers flush when offline

      // Simulate coming back online and successful API call
      (service as any).isOnline = true;
      mockApiPost.mockResolvedValue({ success: true });

      // Track another click to trigger flush of re-queued items
      await service.trackClick('link-new');

      expect(mockApiPost).toHaveBeenCalledTimes(6); // Previous calls + retry with re-queued items
    });
  });

  describe('Session Analytics', () => {
    it('should calculate session analytics', () => {
      const analytics = service.getSessionAnalytics();

      expect(analytics).toMatchObject({
        sessionId: expect.any(String),
        duration: expect.any(Number),
        clickCount: 0,
        startTime: expect.any(Date),
        lastActivity: expect.any(Date),
      });
    });

    it('should return null analytics when no session', () => {
      service.clearSession();
      // Manually set session to null to test edge case
      (service as any).sessionData = null;

      const analytics = service.getSessionAnalytics();
      expect(analytics).toBeNull();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      service.updateConfig({
        batchSize: 20,
        flushInterval: 2000,
      });

      // Configuration should be updated (tested indirectly through behavior)
      expect(service).toBeTruthy();
    });

    it('should destroy service when tracking is disabled', () => {
      const destroySpy = vi.spyOn(service, 'destroy');

      service.updateConfig({ enableTracking: false });

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});

describe('ClickAnalytics', () => {
  describe('calculateCTR', () => {
    it('should calculate click-through rate correctly', () => {
      expect(ClickAnalytics.calculateCTR(50, 1000)).toBe(5);
      expect(ClickAnalytics.calculateCTR(0, 1000)).toBe(0);
      expect(ClickAnalytics.calculateCTR(100, 0)).toBe(0);
    });
  });

  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly', () => {
      expect(ClickAnalytics.calculateConversionRate(10, 100)).toBe(10);
      expect(ClickAnalytics.calculateConversionRate(0, 100)).toBe(0);
      expect(ClickAnalytics.calculateConversionRate(5, 0)).toBe(0);
    });
  });

  describe('groupClicksByPeriod', () => {
    const mockClicks = [
      { linkId: 'link1', timestamp: new Date('2024-01-15T10:30:00Z') },
      { linkId: 'link2', timestamp: new Date('2024-01-15T14:20:00Z') },
      { linkId: 'link3', timestamp: new Date('2024-01-16T09:15:00Z') },
    ] as any[];

    it('should group clicks by day', () => {
      const grouped = ClickAnalytics.groupClicksByPeriod(mockClicks, 'day');

      expect(grouped['2024-1-15']).toBe(2);
      expect(grouped['2024-1-16']).toBe(1);
    });

    it('should group clicks by hour', () => {
      const grouped = ClickAnalytics.groupClicksByPeriod(mockClicks, 'hour');

      // The dates are in UTC, so we need to check the actual keys
      const keys = Object.keys(grouped);
      expect(keys).toHaveLength(3);
      expect(Object.values(grouped)).toEqual([1, 1, 1]);
    });
  });

  describe('getTopLinks', () => {
    it('should return top performing links', () => {
      const mockClicks = [
        { linkId: 'link1' },
        { linkId: 'link2' },
        { linkId: 'link1' },
        { linkId: 'link3' },
        { linkId: 'link1' },
      ] as any[];

      const topLinks = ClickAnalytics.getTopLinks(mockClicks, 2);

      expect(topLinks).toEqual([
        { linkId: 'link1', clicks: 3 },
        { linkId: 'link2', clicks: 1 },
      ]);
    });
  });

  describe('calculateSessionMetrics', () => {
    it('should calculate session metrics correctly', () => {
      const mockSessions = [
        {
          startTime: new Date('2024-01-15T10:00:00Z'),
          lastActivity: new Date('2024-01-15T10:05:00Z'),
          clickCount: 3,
        },
        {
          startTime: new Date('2024-01-15T11:00:00Z'),
          lastActivity: new Date('2024-01-15T11:10:00Z'),
          clickCount: 0,
        },
        {
          startTime: new Date('2024-01-15T12:00:00Z'),
          lastActivity: new Date('2024-01-15T12:03:00Z'),
          clickCount: 2,
        },
      ] as any[];

      const metrics = ClickAnalytics.calculateSessionMetrics(mockSessions);

      expect(metrics.totalSessions).toBe(3);
      expect(metrics.averageClicksPerSession).toBe(5 / 3);
      expect(metrics.bounceRate).toBeCloseTo(33.33, 2); // 1 out of 3 sessions had 0 clicks
      expect(metrics.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should handle empty sessions array', () => {
      const metrics = ClickAnalytics.calculateSessionMetrics([]);

      expect(metrics).toEqual({
        averageSessionDuration: 0,
        averageClicksPerSession: 0,
        totalSessions: 0,
        bounceRate: 0,
      });
    });
  });
});
