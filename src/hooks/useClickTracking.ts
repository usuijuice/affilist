import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clickTrackingService,
  ClickAnalytics,
} from '../services/clickTrackingService';
import type { ClickTrackingConfig, SessionData } from '../types';

export interface UseClickTrackingOptions {
  config?: Partial<ClickTrackingConfig>;
  onError?: (error: string) => void;
  enableDebug?: boolean;
}

export interface UseClickTrackingReturn {
  trackClick: (linkId: string, metadata?: Record<string, any>) => Promise<void>;
  sessionData: SessionData | null;
  sessionAnalytics: ReturnType<typeof clickTrackingService.getSessionAnalytics>;
  setUserId: (userId: string) => void;
  clearSession: () => void;
  isTracking: boolean;
  error: string | null;
}

/**
 * Custom hook for click tracking functionality
 */
export function useClickTracking(
  options: UseClickTrackingOptions = {}
): UseClickTrackingReturn {
  const { config, onError, enableDebug = false } = options;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true);

  const configRef = useRef(config);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    configRef.current = config;
    onErrorRef.current = onError;
  }, [config, onError]);

  // Initialize tracking service
  useEffect(() => {
    if (config) {
      clickTrackingService.updateConfig(config);
    }

    // Get initial session data
    setSessionData(clickTrackingService.getSessionData());
    setIsTracking(config?.enableTracking !== false);

    // Set up periodic session data updates
    const interval = setInterval(() => {
      setSessionData(clickTrackingService.getSessionData());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [config]);

  /**
   * Track a click event
   */
  const trackClick = useCallback(
    async (linkId: string, metadata?: Record<string, any>) => {
      try {
        setError(null);

        if (enableDebug) {
          console.log('Tracking click:', { linkId, metadata });
        }

        await clickTrackingService.trackClick(linkId, metadata);

        // Update session data after tracking
        setSessionData(clickTrackingService.getSessionData());
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to track click';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);

        if (enableDebug) {
          console.error('Click tracking error:', err);
        }
      }
    },
    [enableDebug]
  );

  /**
   * Set user ID for the current session
   */
  const setUserId = useCallback(
    (userId: string) => {
      try {
        clickTrackingService.setUserId(userId);
        setSessionData(clickTrackingService.getSessionData());

        if (enableDebug) {
          console.log('User ID set:', userId);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to set user ID';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      }
    },
    [enableDebug]
  );

  /**
   * Clear current session and start fresh
   */
  const clearSession = useCallback(() => {
    try {
      clickTrackingService.clearSession();
      setSessionData(clickTrackingService.getSessionData());
      setError(null);

      if (enableDebug) {
        console.log('Session cleared');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear session';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [enableDebug]);

  /**
   * Get session analytics
   */
  const sessionAnalytics = clickTrackingService.getSessionAnalytics();

  return {
    trackClick,
    sessionData,
    sessionAnalytics,
    setUserId,
    clearSession,
    isTracking,
    error,
  };
}

/**
 * Hook for analytics calculations and utilities
 */
export function useClickAnalytics() {
  return {
    calculateCTR: ClickAnalytics.calculateCTR,
    calculateConversionRate: ClickAnalytics.calculateConversionRate,
    groupClicksByPeriod: ClickAnalytics.groupClicksByPeriod,
    getTopLinks: ClickAnalytics.getTopLinks,
    calculateSessionMetrics: ClickAnalytics.calculateSessionMetrics,
  };
}

/**
 * Hook for tracking page views and user behavior
 */
export function usePageTracking(
  pageName: string,
  metadata?: Record<string, any>
) {
  const { trackClick } = useClickTracking();

  useEffect(() => {
    // Track page view as a special click event
    trackClick(`page:${pageName}`, {
      type: 'page_view',
      page: pageName,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }, [pageName, trackClick, metadata]);
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const { trackClick } = useClickTracking();

  const trackInteraction = useCallback(
    (
      interactionType: string,
      elementId?: string,
      metadata?: Record<string, any>
    ) => {
      trackClick(`interaction:${interactionType}`, {
        type: 'interaction',
        interactionType,
        elementId,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    },
    [trackClick]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      trackInteraction('search', 'search-input', {
        query,
        resultsCount,
      });
    },
    [trackInteraction]
  );

  const trackFilter = useCallback(
    (filterType: string, filterValue: any) => {
      trackInteraction('filter', `filter-${filterType}`, {
        filterType,
        filterValue,
      });
    },
    [trackInteraction]
  );

  const trackSort = useCallback(
    (sortBy: string) => {
      trackInteraction('sort', 'sort-control', {
        sortBy,
      });
    },
    [trackInteraction]
  );

  return {
    trackInteraction,
    trackSearch,
    trackFilter,
    trackSort,
  };
}
