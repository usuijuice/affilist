import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsApi } from '../services';
import type { AnalyticsParams, ClickAnalytics, RevenueAnalytics, LinkPerformance } from '../services';
import type { AnalyticsResponse } from '../types';

export interface UseAnalyticsOptions {
  autoFetch?: boolean;
  params?: AnalyticsParams;
  refreshInterval?: number; // in milliseconds
  onError?: (error: string) => void;
}

export interface UseAnalyticsReturn {
  analytics: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  fetchAnalytics: (params?: AnalyticsParams) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for fetching dashboard analytics
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { autoFetch = true, params: defaultParams, refreshInterval, onError } = options;
  
  const [state, setState] = useState({
    analytics: null as AnalyticsResponse | null,
    loading: false,
    error: null as string | null,
  });

  const paramsRef = useRef<AnalyticsParams>(defaultParams || {});
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchAnalytics = useCallback(async (params: AnalyticsParams = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    paramsRef.current = { ...paramsRef.current, ...params };

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await analyticsApi.getDashboardAnalytics(paramsRef.current);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          analytics: response.data,
          loading: false,
        }));
      } else {
        const errorMessage = response.error?.message || 'Failed to fetch analytics';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        onError?.(errorMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      onError?.(errorMessage);
    }
  }, [onError]);

  const refetch = useCallback(async () => {
    await fetchAnalytics(paramsRef.current);
  }, [fetchAnalytics]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics(defaultParams);
    }

    // Set up refresh interval if specified
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchAnalytics(paramsRef.current);
      }, refreshInterval);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoFetch, defaultParams, refreshInterval, fetchAnalytics]);

  return {
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    fetchAnalytics,
    refetch,
    clearError,
  };
}

/**
 * Hook for fetching click analytics
 */
export function useClickAnalytics(params: AnalyticsParams = {}) {
  const [state, setState] = useState({
    clickAnalytics: null as ClickAnalytics | null,
    loading: false,
    error: null as string | null,
  });

  const fetchClickAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await analyticsApi.getClickAnalytics(params);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          clickAnalytics: response.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error?.message || 'Failed to fetch click analytics',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }));
    }
  }, [params]);

  useEffect(() => {
    fetchClickAnalytics();
  }, [fetchClickAnalytics]);

  return {
    ...state,
    refetch: fetchClickAnalytics,
  };
}

/**
 * Hook for fetching revenue analytics
 */
export function useRevenueAnalytics(params: AnalyticsParams = {}) {
  const [state, setState] = useState({
    revenueAnalytics: null as RevenueAnalytics | null,
    loading: false,
    error: null as string | null,
  });

  const fetchRevenueAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await analyticsApi.getRevenueAnalytics(params);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          revenueAnalytics: response.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error?.message || 'Failed to fetch revenue analytics',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }));
    }
  }, [params]);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [fetchRevenueAnalytics]);

  return {
    ...state,
    refetch: fetchRevenueAnalytics,
  };
}

/**
 * Hook for fetching link performance metrics
 */
export function useLinkPerformance(params: AnalyticsParams = {}) {
  const [state, setState] = useState({
    linkPerformance: [] as LinkPerformance[],
    loading: false,
    error: null as string | null,
  });

  const fetchLinkPerformance = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await analyticsApi.getLinkPerformance(params);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          linkPerformance: response.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error?.message || 'Failed to fetch link performance',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }));
    }
  }, [params]);

  useEffect(() => {
    fetchLinkPerformance();
  }, [fetchLinkPerformance]);

  return {
    ...state,
    refetch: fetchLinkPerformance,
  };
}

/**
 * Hook for real-time analytics with auto-refresh
 */
export function useRealTimeAnalytics(refreshInterval: number = 30000) {
  const [state, setState] = useState({
    realTimeData: null as any,
    loading: false,
    error: null as string | null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRealTimeAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await analyticsApi.getRealTimeAnalytics();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          realTimeData: response.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error?.message || 'Failed to fetch real-time analytics',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchRealTimeAnalytics();

    // Set up auto-refresh
    intervalRef.current = setInterval(fetchRealTimeAnalytics, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRealTimeAnalytics, refreshInterval]);

  return {
    ...state,
    refetch: fetchRealTimeAnalytics,
  };
}