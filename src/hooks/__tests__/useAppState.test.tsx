import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AppProvider } from '../../contexts/AppContext';
import { useAppState } from '../useAppState';
import { createMockAffiliateLink, createMockCategory } from '../../test/factories';

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );
};

describe('useAppState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide initial state and actions', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    // Check initial state
    expect(result.current.affiliateLinks).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Check actions are functions
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.setAffiliateLinks).toBe('function');
    expect(typeof result.current.setCategories).toBe('function');
  });

  it('should update loading state', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should update error state', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should update affiliate links', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    const mockLinks = [
      createMockAffiliateLink({ id: '1', title: 'Link 1' }),
      createMockAffiliateLink({ id: '2', title: 'Link 2' }),
    ];

    act(() => {
      result.current.setAffiliateLinks(mockLinks);
    });

    expect(result.current.affiliateLinks).toEqual(mockLinks);
  });

  it('should update categories', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    const mockCategories = [
      createMockCategory({ id: '1', name: 'Category 1' }),
      createMockCategory({ id: '2', name: 'Category 2' }),
    ];

    act(() => {
      result.current.setCategories(mockCategories);
    });

    expect(result.current.categories).toEqual(mockCategories);
  });

  it('should update search query', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    const searchQuery = 'test search';

    act(() => {
      result.current.setSearchQuery(searchQuery);
    });

    expect(result.current.filters.searchQuery).toBe(searchQuery);
  });

  it('should update sort by', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSortBy('newest');
    });

    expect(result.current.filters.sortBy).toBe('newest');
  });

  it('should update category filter', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    const categories = ['cat1', 'cat2'];

    act(() => {
      result.current.setCategoryFilter(categories);
    });

    expect(result.current.filters.categories).toEqual(categories);
  });

  it('should update commission filter', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCommissionFilter(5, 15);
    });

    expect(result.current.filters.commissionRateMin).toBe(5);
    expect(result.current.filters.commissionRateMax).toBe(15);
  });

  it('should update featured filter', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setFeaturedFilter(true);
    });

    expect(result.current.filters.featuredOnly).toBe(true);
  });

  it('should reset filters', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    // Set some filters first
    act(() => {
      result.current.setSearchQuery('test');
      result.current.setFeaturedFilter(true);
      result.current.setCategoryFilter(['cat1']);
    });

    // Reset filters
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({
      categories: [],
      searchQuery: '',
      sortBy: 'popularity',
      featuredOnly: false,
    });
  });

  it('should update filters partially', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateFilters({
        searchQuery: 'test',
        featuredOnly: true,
      });
    });

    expect(result.current.filters.searchQuery).toBe('test');
    expect(result.current.filters.featuredOnly).toBe(true);
    expect(result.current.filters.sortBy).toBe('popularity'); // unchanged
  });

  it('should update preferences', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updatePreferences({
        defaultSortBy: 'newest',
        viewMode: 'list',
      });
    });

    expect(result.current.preferences.defaultSortBy).toBe('newest');
    expect(result.current.preferences.viewMode).toBe('list');
  });
});