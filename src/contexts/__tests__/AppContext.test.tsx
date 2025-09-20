import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { vi } from 'vitest';
import { AppProvider, useAppContext } from '../AppContext';
import { SortOption } from '../../types';

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide initial state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toEqual({
      affiliateLinks: [],
      categories: [],
      filters: {
        categories: [],
        searchQuery: '',
        sortBy: 'popularity',
        featuredOnly: false,
      },
      loading: false,
      error: null,
      preferences: {
        defaultSortBy: 'popularity',
        defaultFilters: {},
        viewMode: 'grid',
      },
    });
  });

  it('should handle SET_LOADING action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch({ type: 'SET_LOADING', payload: true });
    });

    expect(result.current.state.loading).toBe(true);
  });

  it('should handle SET_ERROR action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const errorMessage = 'Test error';

    act(() => {
      result.current.dispatch({ type: 'SET_ERROR', payload: errorMessage });
    });

    expect(result.current.state.error).toBe(errorMessage);
    expect(result.current.state.loading).toBe(false);
  });

  it('should handle SET_SEARCH_QUERY action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const searchQuery = 'test search';

    act(() => {
      result.current.dispatch({
        type: 'SET_SEARCH_QUERY',
        payload: searchQuery,
      });
    });

    expect(result.current.state.filters.searchQuery).toBe(searchQuery);
  });

  it('should handle SET_SORT_BY action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const sortBy: SortOption = 'newest';

    act(() => {
      result.current.dispatch({ type: 'SET_SORT_BY', payload: sortBy });
    });

    expect(result.current.state.filters.sortBy).toBe(sortBy);
  });

  it('should handle SET_CATEGORY_FILTER action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const categories = ['cat1', 'cat2'];

    act(() => {
      result.current.dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: categories,
      });
    });

    expect(result.current.state.filters.categories).toEqual(categories);
  });

  it('should handle SET_COMMISSION_FILTER action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch({
        type: 'SET_COMMISSION_FILTER',
        payload: { min: 5, max: 15 },
      });
    });

    expect(result.current.state.filters.commissionRateMin).toBe(5);
    expect(result.current.state.filters.commissionRateMax).toBe(15);
  });

  it('should handle SET_FEATURED_FILTER action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch({ type: 'SET_FEATURED_FILTER', payload: true });
    });

    expect(result.current.state.filters.featuredOnly).toBe(true);
  });

  it('should handle RESET_FILTERS action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    // Set some filters first
    act(() => {
      result.current.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'test' });
      result.current.dispatch({ type: 'SET_FEATURED_FILTER', payload: true });
      result.current.dispatch({
        type: 'SET_CATEGORY_FILTER',
        payload: ['cat1'],
      });
    });

    // Reset filters
    act(() => {
      result.current.dispatch({ type: 'RESET_FILTERS' });
    });

    expect(result.current.state.filters).toEqual({
      categories: [],
      searchQuery: '',
      sortBy: 'popularity',
      featuredOnly: false,
    });
  });

  it('should handle UPDATE_PREFERENCES action', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const newPreferences = {
      defaultSortBy: 'newest' as SortOption,
      viewMode: 'list' as const,
    };

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_PREFERENCES',
        payload: newPreferences,
      });
    });

    expect(result.current.state.preferences.defaultSortBy).toBe('newest');
    expect(result.current.state.preferences.viewMode).toBe('list');
  });

  it('should load preferences from localStorage on mount', () => {
    const savedPreferences = {
      defaultSortBy: 'commission' as SortOption,
      defaultFilters: { featuredOnly: true },
      viewMode: 'list' as const,
    };

    localStorage.setItem(
      'affiliateAggregatorPreferences',
      JSON.stringify(savedPreferences)
    );

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.preferences).toEqual(savedPreferences);
    expect(result.current.state.filters.sortBy).toBe('commission');
    expect(result.current.state.filters.featuredOnly).toBe(true);
  });

  it('should save preferences to localStorage when they change', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    const newPreferences = {
      defaultSortBy: 'alphabetical' as SortOption,
      viewMode: 'list' as const,
    };

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_PREFERENCES',
        payload: newPreferences,
      });
    });

    const savedPreferences = JSON.parse(
      localStorage.getItem('affiliateAggregatorPreferences') || '{}'
    );

    expect(savedPreferences.defaultSortBy).toBe('alphabetical');
    expect(savedPreferences.viewMode).toBe('list');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');

    consoleSpy.mockRestore();
  });
});
