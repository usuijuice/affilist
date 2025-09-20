import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useClickTracking,
  useClickAnalytics,
  usePageTracking,
  useInteractionTracking,
} from '../useClickTracking';
import { clickTrackingService } from '../../services/clickTrackingService';

// Mock the click tracking service
vi.mock('../../services/clickTrackingService', () => ({
  clickTrackingService: {
    trackClick: vi.fn(),
    setUserId: vi.fn(),
    getSessionData: vi.fn(),
    getSessionAnalytics: vi.fn(),
    clearSession: vi.fn(),
    updateConfig: vi.fn(),
  },
  ClickAnalytics: {
    calculateCTR: vi.fn(),
    calculateConversionRate: vi.fn(),
    groupClicksByPeriod: vi.fn(),
    getTopLinks: vi.fn(),
    calculateSessionMetrics: vi.fn(),
  },
}));

describe('useClickTracking', () => {
  const mockSessionData = {
    sessionId: 'test-session-123',
    startTime: new Date(),
    lastActivity: new Date(),
    userAgent: 'Test Browser',
    clickCount: 5,
  };

  const mockSessionAnalytics = {
    sessionId: 'test-session-123',
    duration: 300000,
    clickCount: 5,
    startTime: new Date(),
    lastActivity: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (clickTrackingService.getSessionData as any).mockReturnValue(
      mockSessionData
    );
    (clickTrackingService.getSessionAnalytics as any).mockReturnValue(
      mockSessionAnalytics
    );
    (clickTrackingService.trackClick as any).mockResolvedValue(undefined);
  });

  it('should initialize with session data', () => {
    const { result } = renderHook(() => useClickTracking());

    expect(result.current.sessionData).toEqual(mockSessionData);
    expect(result.current.sessionAnalytics).toEqual(mockSessionAnalytics);
    expect(result.current.isTracking).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should track clicks successfully', async () => {
    const { result } = renderHook(() => useClickTracking());

    await act(async () => {
      await result.current.trackClick('link-123', { category: 'test' });
    });

    expect(clickTrackingService.trackClick).toHaveBeenCalledWith('link-123', {
      category: 'test',
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle click tracking errors', async () => {
    const mockError = new Error('Tracking failed');
    (clickTrackingService.trackClick as any).mockRejectedValue(mockError);

    const onError = vi.fn();
    const { result } = renderHook(() => useClickTracking({ onError }));

    await act(async () => {
      await result.current.trackClick('link-123');
    });

    expect(result.current.error).toBe('Tracking failed');
    expect(onError).toHaveBeenCalledWith('Tracking failed');
  });

  it('should set user ID', async () => {
    const { result } = renderHook(() => useClickTracking());

    act(() => {
      result.current.setUserId('user-456');
    });

    expect(clickTrackingService.setUserId).toHaveBeenCalledWith('user-456');
  });

  it('should clear session', async () => {
    const { result } = renderHook(() => useClickTracking());

    act(() => {
      result.current.clearSession();
    });

    expect(clickTrackingService.clearSession).toHaveBeenCalled();
  });

  it('should update config on mount', () => {
    const config = { enableTracking: false, batchSize: 20 };
    renderHook(() => useClickTracking({ config }));

    expect(clickTrackingService.updateConfig).toHaveBeenCalledWith(config);
  });

  it('should enable debug logging', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { result } = renderHook(() =>
      useClickTracking({ enableDebug: true })
    );

    await act(async () => {
      await result.current.trackClick('link-123', { test: true });
    });

    expect(consoleSpy).toHaveBeenCalledWith('Tracking click:', {
      linkId: 'link-123',
      metadata: { test: true },
    });

    consoleSpy.mockRestore();
  });

  it('should update session data periodically', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useClickTracking());

    // Initial session data
    expect(result.current.sessionData).toEqual(mockSessionData);

    // Update mock data
    const updatedSessionData = { ...mockSessionData, clickCount: 10 };
    (clickTrackingService.getSessionData as any).mockReturnValue(
      updatedSessionData
    );

    // Fast-forward timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.sessionData).toEqual(updatedSessionData);

    vi.useRealTimers();
  });
});

describe('useClickAnalytics', () => {
  it('should provide analytics utility functions', () => {
    const { result } = renderHook(() => useClickAnalytics());

    expect(typeof result.current.calculateCTR).toBe('function');
    expect(typeof result.current.calculateConversionRate).toBe('function');
    expect(typeof result.current.groupClicksByPeriod).toBe('function');
    expect(typeof result.current.getTopLinks).toBe('function');
    expect(typeof result.current.calculateSessionMetrics).toBe('function');
  });
});

describe('usePageTracking', () => {
  it('should track page views on mount', () => {
    const mockTrackClick = vi.fn();
    vi.mocked(clickTrackingService.trackClick).mockImplementation(
      mockTrackClick
    );

    renderHook(() => usePageTracking('home', { section: 'hero' }));

    expect(mockTrackClick).toHaveBeenCalledWith('page:home', {
      type: 'page_view',
      page: 'home',
      timestamp: expect.any(String),
      section: 'hero',
    });
  });

  it('should track new page when pageName changes', () => {
    const mockTrackClick = vi.fn();
    vi.mocked(clickTrackingService.trackClick).mockImplementation(
      mockTrackClick
    );

    const { rerender } = renderHook(
      ({ pageName }) => usePageTracking(pageName),
      { initialProps: { pageName: 'home' } }
    );

    expect(mockTrackClick).toHaveBeenCalledWith(
      'page:home',
      expect.any(Object)
    );

    rerender({ pageName: 'about' });

    expect(mockTrackClick).toHaveBeenCalledWith(
      'page:about',
      expect.any(Object)
    );
    expect(mockTrackClick).toHaveBeenCalledTimes(2);
  });
});

describe('useInteractionTracking', () => {
  let mockTrackClick: any;

  beforeEach(() => {
    mockTrackClick = vi.fn();
    vi.mocked(clickTrackingService.trackClick).mockImplementation(
      mockTrackClick
    );
  });

  it('should track generic interactions', () => {
    const { result } = renderHook(() => useInteractionTracking());

    act(() => {
      result.current.trackInteraction('button_click', 'submit-btn', {
        form: 'contact',
      });
    });

    expect(mockTrackClick).toHaveBeenCalledWith('interaction:button_click', {
      type: 'interaction',
      interactionType: 'button_click',
      elementId: 'submit-btn',
      timestamp: expect.any(String),
      form: 'contact',
    });
  });

  it('should track search interactions', () => {
    const { result } = renderHook(() => useInteractionTracking());

    act(() => {
      result.current.trackSearch('react hooks', 25);
    });

    expect(mockTrackClick).toHaveBeenCalledWith('interaction:search', {
      type: 'interaction',
      interactionType: 'search',
      elementId: 'search-input',
      timestamp: expect.any(String),
      query: 'react hooks',
      resultsCount: 25,
    });
  });

  it('should track filter interactions', () => {
    const { result } = renderHook(() => useInteractionTracking());

    act(() => {
      result.current.trackFilter('category', ['technology', 'design']);
    });

    expect(mockTrackClick).toHaveBeenCalledWith('interaction:filter', {
      type: 'interaction',
      interactionType: 'filter',
      elementId: 'filter-category',
      timestamp: expect.any(String),
      filterType: 'category',
      filterValue: ['technology', 'design'],
    });
  });

  it('should track sort interactions', () => {
    const { result } = renderHook(() => useInteractionTracking());

    act(() => {
      result.current.trackSort('popularity');
    });

    expect(mockTrackClick).toHaveBeenCalledWith('interaction:sort', {
      type: 'interaction',
      interactionType: 'sort',
      elementId: 'sort-control',
      timestamp: expect.any(String),
      sortBy: 'popularity',
    });
  });
});
