import { useState, useEffect, useCallback, useRef } from 'react';
import { affiliateLinksApi, GetLinksParams } from '../services';
import { AffiliateLink, FilterState } from '../types';
import { useAppState } from './useAppState';

export interface UseAffiliateLinksOptions {
  autoFetch?: boolean;
  params?: GetLinksParams;
  onError?: (error: string) => void;
}

export interface UseAffiliateLinksReturn {
  links: AffiliateLink[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  page: number;
  fetchLinks: (params?: GetLinksParams) => Promise<void>;
  fetchAllLinks: () => Promise<void>;
  fetchMoreLinks: () => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for fetching and managing affiliate links
 */
export function useAffiliateLinks(options: UseAffiliateLinksOptions = {}): UseAffiliateLinksReturn {
  const { autoFetch = true, params: defaultParams, onError } = options;
  const { setAffiliateLinks, setLoading, setError, clearError: clearGlobalError } = useAppState();
  
  const [localState, setLocalState] = useState({
    links: [] as AffiliateLink[],
    loading: false,
    error: null as string | null,
    hasMore: false,
    total: 0,
    page: 1,
  });

  const paramsRef = useRef<GetLinksParams>(defaultParams || {});
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setLocalState(prev => ({ ...prev, error: null }));
    clearGlobalError();
  }, [clearGlobalError]);

  const fetchLinks = useCallback(async (params: GetLinksParams = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    paramsRef.current = { ...paramsRef.current, ...params };

    setLocalState(prev => ({ ...prev, loading: true, error: null }));
    setLoading(true);
    clearError();

    try {
      const response = await affiliateLinksApi.getLinks(paramsRef.current);
      
      if (response && response.success) {
        const newLinks = params.page && params.page > 1 
          ? [...localState.links, ...response.data.links]
          : response.data.links;

        setLocalState(prev => ({
          ...prev,
          links: newLinks,
          hasMore: response.data.hasMore,
          total: response.data.total,
          page: response.data.page,
          loading: false,
        }));

        // Update global state
        setAffiliateLinks(newLinks);
        setLoading(false);
      } else {
        const errorMessage = response?.error?.message || 'Failed to fetch affiliate links';
        setLocalState(prev => ({ ...prev, error: errorMessage, loading: false }));
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLocalState(prev => ({ ...prev, error: errorMessage, loading: false }));
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  }, [localState.links, setAffiliateLinks, setLoading, setError, clearError, onError]);

  const fetchAllLinks = useCallback(async () => {
    setLocalState(prev => ({ ...prev, loading: true, error: null }));
    setLoading(true);
    clearError();

    try {
      const response = await affiliateLinksApi.getAllLinks();
      
      if (response && response.success) {
        setLocalState(prev => ({
          ...prev,
          links: response.data,
          hasMore: false,
          total: response.data.length,
          page: 1,
          loading: false,
        }));

        // Update global state
        setAffiliateLinks(response.data);
        setLoading(false);
      } else {
        const errorMessage = response?.error?.message || 'Failed to fetch all affiliate links';
        setLocalState(prev => ({ ...prev, error: errorMessage, loading: false }));
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLocalState(prev => ({ ...prev, error: errorMessage, loading: false }));
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  }, [setAffiliateLinks, setLoading, setError, clearError, onError]);

  const fetchMoreLinks = useCallback(async () => {
    if (!localState.hasMore || localState.loading) return;

    await fetchLinks({
      ...paramsRef.current,
      page: localState.page + 1,
    });
  }, [localState.hasMore, localState.loading, localState.page, fetchLinks]);

  const refetch = useCallback(async () => {
    await fetchLinks({ ...paramsRef.current, page: 1 });
  }, [fetchLinks]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchLinks(defaultParams);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, defaultParams, fetchLinks]);

  return {
    links: localState.links,
    loading: localState.loading,
    error: localState.error,
    hasMore: localState.hasMore,
    total: localState.total,
    page: localState.page,
    fetchLinks,
    fetchAllLinks,
    fetchMoreLinks,
    refetch,
    clearError,
  };
}

/**
 * Hook for searching affiliate links with debouncing
 */
export function useAffiliateLinksSearch(filters: FilterState, debounceMs: number = 300) {
  const [searchResults, setSearchResults] = useState<AffiliateLink[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (searchFilters: FilterState) => {
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchFilters.searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await affiliateLinksApi.searchLinks(searchFilters.searchQuery, searchFilters);
      
      if (response && response.success) {
        setSearchResults(response.data);
      } else {
        setSearchError(response?.error?.message || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(filters);
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, debounceMs, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
  };
}