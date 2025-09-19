import { useCallback } from 'react';
import { useAppContext } from '../contexts';
import type { AffiliateLink, Category, FilterState, SortOption } from '../types';

/**
 * Custom hook for accessing and updating global app state
 */
export function useAppState() {
  const { state, dispatch } = useAppContext();

  // Loading state actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  // Error state actions
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  // Data actions
  const setAffiliateLinks = useCallback((links: AffiliateLink[]) => {
    dispatch({ type: 'SET_AFFILIATE_LINKS', payload: links });
  }, [dispatch]);

  const setCategories = useCallback((categories: Category[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  }, [dispatch]);

  // Filter actions
  const updateFilters = useCallback((filters: Partial<FilterState>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, [dispatch]);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, [dispatch]);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const setSortBy = useCallback((sortBy: SortOption) => {
    dispatch({ type: 'SET_SORT_BY', payload: sortBy });
  }, [dispatch]);

  const setCategoryFilter = useCallback((categories: string[]) => {
    dispatch({ type: 'SET_CATEGORY_FILTER', payload: categories });
  }, [dispatch]);

  const setCommissionFilter = useCallback((min?: number, max?: number) => {
    dispatch({ type: 'SET_COMMISSION_FILTER', payload: { min, max } });
  }, [dispatch]);

  const setFeaturedFilter = useCallback((featuredOnly: boolean) => {
    dispatch({ type: 'SET_FEATURED_FILTER', payload: featuredOnly });
  }, [dispatch]);

  // Preference actions
  const updatePreferences = useCallback((preferences: Partial<typeof state.preferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, [dispatch]);

  return {
    // State
    ...state,
    
    // Actions
    setLoading,
    setError,
    clearError,
    setAffiliateLinks,
    setCategories,
    updateFilters,
    resetFilters,
    setSearchQuery,
    setSortBy,
    setCategoryFilter,
    setCommissionFilter,
    setFeaturedFilter,
    updatePreferences,
  };
}