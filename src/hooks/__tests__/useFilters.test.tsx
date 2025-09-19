import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useFilters } from '../useFilters';

// Mock react-router-dom
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams]
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useFilters', () => {
  beforeEach(() => {
    mockSetSearchParams.mockClear();
  });

  it('initializes with default filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filters).toEqual({
      categories: [],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false,
      searchQuery: '',
      sortBy: 'popularity'
    });
  });

  it('updates categories', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateCategories(['cat1', 'cat2']);
    });

    expect(result.current.filters.categories).toEqual(['cat1', 'cat2']);
  });

  it('updates sort option', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateSort('newest');
    });

    expect(result.current.filters.sortBy).toBe('newest');
  });

  it('updates search query', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateSearch('test query');
    });

    expect(result.current.filters.searchQuery).toBe('test query');
  });

  it('updates multiple filters at once', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        commissionRateMin: 5,
        commissionRateMax: 25,
        featuredOnly: true
      });
    });

    expect(result.current.filters.commissionRateMin).toBe(5);
    expect(result.current.filters.commissionRateMax).toBe(25);
    expect(result.current.filters.featuredOnly).toBe(true);
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    // Set some filters first
    act(() => {
      result.current.updateFilters({
        categories: ['cat1'],
        commissionRateMin: 10,
        featuredOnly: true,
        searchQuery: 'test',
        sortBy: 'newest'
      });
    });

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      categories: [],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false,
      searchQuery: '',
      sortBy: 'popularity'
    });
  });

  it('clears only advanced filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    // Set some filters first
    act(() => {
      result.current.updateFilters({
        categories: ['cat1'],
        commissionRateMin: 10,
        commissionRateMax: 25,
        featuredOnly: true,
        searchQuery: 'test',
        sortBy: 'newest'
      });
    });

    // Clear only advanced filters
    act(() => {
      result.current.clearAdvancedFilters();
    });

    expect(result.current.filters).toEqual({
      categories: ['cat1'],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false,
      searchQuery: 'test',
      sortBy: 'newest'
    });
  });

  it('correctly identifies when filters are active', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    // Initially no active filters
    expect(result.current.hasActiveFilters).toBe(false);

    // Add a category filter
    act(() => {
      result.current.updateCategories(['cat1']);
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear and add search query
    act(() => {
      result.current.clearFilters();
      result.current.updateSearch('test');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear and add sort
    act(() => {
      result.current.clearFilters();
      result.current.updateSort('newest');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('correctly identifies when advanced filters are active', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    // Initially no advanced filters
    expect(result.current.hasAdvancedFilters).toBe(false);

    // Add commission rate filter
    act(() => {
      result.current.updateFilters({ commissionRateMin: 5 });
    });

    expect(result.current.hasAdvancedFilters).toBe(true);

    // Clear and add featured filter
    act(() => {
      result.current.clearAdvancedFilters();
      result.current.updateFilters({ featuredOnly: true });
    });

    expect(result.current.hasAdvancedFilters).toBe(true);

    // Category filter should not count as advanced
    act(() => {
      result.current.clearAdvancedFilters();
      result.current.updateCategories(['cat1']);
    });

    expect(result.current.hasAdvancedFilters).toBe(false);
  });

  it('updates URL parameters when filters change', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        categories: ['cat1', 'cat2'],
        commissionRateMin: 5,
        commissionRateMax: 25,
        featuredOnly: true,
        searchQuery: 'test query',
        sortBy: 'newest'
      });
    });

    // Should call setSearchParams with the correct parameters
    expect(mockSetSearchParams).toHaveBeenCalled();
    const [params] = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    
    expect(params.get('categories')).toBe('cat1,cat2');
    expect(params.get('minCommission')).toBe('5');
    expect(params.get('maxCommission')).toBe('25');
    expect(params.get('featured')).toBe('true');
    expect(params.get('q')).toBe('test query');
    expect(params.get('sort')).toBe('newest');
  });

  it('does not set URL parameters for default values', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateSort('popularity'); // Default value
    });

    const [params] = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    expect(params.get('sort')).toBeNull();
  });

  it('handles empty arrays and undefined values in URL', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        categories: [],
        commissionRateMin: undefined,
        featuredOnly: false,
        searchQuery: ''
      });
    });

    const [params] = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    expect(params.get('categories')).toBeNull();
    expect(params.get('minCommission')).toBeNull();
    expect(params.get('featured')).toBeNull();
    expect(params.get('q')).toBeNull();
  });
});