import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, SortOption } from '../types';

const defaultFilters: FilterState = {
  categories: [],
  commissionRateMin: undefined,
  commissionRateMax: undefined,
  featuredOnly: false,
  searchQuery: '',
  sortBy: 'popularity'
};

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize from URL parameters
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const commissionRateMin = searchParams.get('minCommission') 
      ? parseFloat(searchParams.get('minCommission')!) 
      : undefined;
    const commissionRateMax = searchParams.get('maxCommission') 
      ? parseFloat(searchParams.get('maxCommission')!) 
      : undefined;
    const featuredOnly = searchParams.get('featured') === 'true';
    const searchQuery = searchParams.get('q') || '';
    const sortBy = (searchParams.get('sort') as SortOption) || 'popularity';

    return {
      categories,
      commissionRateMin: isNaN(commissionRateMin!) ? undefined : commissionRateMin,
      commissionRateMax: isNaN(commissionRateMax!) ? undefined : commissionRateMax,
      featuredOnly,
      searchQuery,
      sortBy
    };
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }

    if (filters.commissionRateMin !== undefined) {
      params.set('minCommission', filters.commissionRateMin.toString());
    }

    if (filters.commissionRateMax !== undefined) {
      params.set('maxCommission', filters.commissionRateMax.toString());
    }

    if (filters.featuredOnly) {
      params.set('featured', 'true');
    }

    if (filters.searchQuery.trim()) {
      params.set('q', filters.searchQuery);
    }

    if (filters.sortBy !== 'popularity') {
      params.set('sort', filters.sortBy);
    }

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateCategories = useCallback((categories: string[]) => {
    updateFilters({ categories });
  }, [updateFilters]);

  const updateSort = useCallback((sortBy: SortOption) => {
    updateFilters({ sortBy });
  }, [updateFilters]);

  const updateSearch = useCallback((searchQuery: string) => {
    updateFilters({ searchQuery });
  }, [updateFilters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    updateFilters({
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false
    });
  }, [updateFilters]);

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.commissionRateMin !== undefined ||
    filters.commissionRateMax !== undefined ||
    filters.featuredOnly ||
    filters.searchQuery.trim() !== '' ||
    filters.sortBy !== 'popularity';

  const hasAdvancedFilters = 
    filters.commissionRateMin !== undefined ||
    filters.commissionRateMax !== undefined ||
    filters.featuredOnly;

  return {
    filters,
    updateFilters,
    updateCategories,
    updateSort,
    updateSearch,
    clearFilters,
    clearAdvancedFilters,
    hasActiveFilters,
    hasAdvancedFilters
  };
}