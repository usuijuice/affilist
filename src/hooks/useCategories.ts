import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesApi } from '../services';
import type { Category } from '../types';
import { useAppState } from './useAppState';

export interface UseCategoriesOptions {
  autoFetch?: boolean;
  withCounts?: boolean;
  onError?: (error: string) => void;
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoriesWithCounts: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for fetching and managing categories
 */
export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { autoFetch = true, withCounts = false, onError } = options;
  const { setCategories, setLoading, setError, clearError: clearGlobalError } = useAppState();
  
  const [localState, setLocalState] = useState({
    categories: [] as Category[],
    loading: false,
    error: null as string | null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setLocalState(prev => ({ ...prev, error: null }));
    clearGlobalError();
  }, [clearGlobalError]);

  const fetchCategories = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLocalState(prev => ({ ...prev, loading: true, error: null }));
    setLoading(true);
    clearError();

    try {
      const response = await categoriesApi.getAllCategories();
      
      if (response.success) {
        setLocalState(prev => ({
          ...prev,
          categories: response.data,
          loading: false,
        }));

        // Update global state
        setCategories(response.data);
        setLoading(false);
      } else {
        const errorMessage = response.error?.message || 'Failed to fetch categories';
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
  }, [setCategories, setLoading, setError, clearError, onError]);

  const fetchCategoriesWithCounts = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLocalState(prev => ({ ...prev, loading: true, error: null }));
    setLoading(true);
    clearError();

    try {
      const response = await categoriesApi.getCategoriesWithCounts();
      
      if (response.success) {
        setLocalState(prev => ({
          ...prev,
          categories: response.data,
          loading: false,
        }));

        // Update global state
        setCategories(response.data);
        setLoading(false);
      } else {
        const errorMessage = response.error?.message || 'Failed to fetch categories with counts';
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
  }, [setCategories, setLoading, setError, clearError, onError]);

  const getCategoryById = useCallback((id: string): Category | undefined => {
    return localState.categories.find(category => category.id === id);
  }, [localState.categories]);

  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return localState.categories.find(category => category.slug === slug);
  }, [localState.categories]);

  const refetch = useCallback(async () => {
    if (withCounts) {
      await fetchCategoriesWithCounts();
    } else {
      await fetchCategories();
    }
  }, [withCounts, fetchCategories, fetchCategoriesWithCounts]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      if (withCounts) {
        fetchCategoriesWithCounts();
      } else {
        fetchCategories();
      }
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, withCounts, fetchCategories, fetchCategoriesWithCounts]);

  return {
    categories: localState.categories,
    loading: localState.loading,
    error: localState.error,
    fetchCategories,
    fetchCategoriesWithCounts,
    getCategoryById,
    getCategoryBySlug,
    refetch,
    clearError,
  };
}

/**
 * Hook for fetching popular categories
 */
export function usePopularCategories(limit: number = 10) {
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.getPopularCategories(limit);
      
      if (response.success) {
        setPopularCategories(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch popular categories');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularCategories();
  }, [fetchPopularCategories]);

  return {
    popularCategories,
    loading,
    error,
    refetch: fetchPopularCategories,
  };
}