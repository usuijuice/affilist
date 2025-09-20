import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import {
  useAffiliateLinks,
  useAffiliateLinksSearch,
} from '../useAffiliateLinks';
import { createMockAffiliateLink } from '../../test/factories';

// Mock the API
const mockGetLinks = vi.fn();
const mockGetAllLinks = vi.fn();
const mockSearchLinks = vi.fn();

vi.mock('../../services', () => ({
  affiliateLinksApi: {
    getLinks: mockGetLinks,
    getAllLinks: mockGetAllLinks,
    searchLinks: mockSearchLinks,
  },
}));

const mockAffiliateLinksApi = {
  getLinks: mockGetLinks,
  getAllLinks: mockGetAllLinks,
  searchLinks: mockSearchLinks,
};

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );
};

describe('useAffiliateLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should fetch links on mount when autoFetch is true', async () => {
    const mockLinks = [
      createMockAffiliateLink({ id: '1', title: 'Link 1' }),
      createMockAffiliateLink({ id: '2', title: 'Link 2' }),
    ];

    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: true,
      data: {
        links: mockLinks,
        total: 2,
        page: 1,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useAffiliateLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.links).toEqual(mockLinks);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch links on mount when autoFetch is false', async () => {
    const { result } = renderHook(
      () => useAffiliateLinks({ autoFetch: false }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.loading).toBe(false);
    expect(mockAffiliateLinksApi.getLinks).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: false,
      error: { message: 'API Error' },
    });

    const { result } = renderHook(() => useAffiliateLinks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.links).toEqual([]);
  });

  it('should fetch more links for pagination', async () => {
    const initialLinks = [
      createMockAffiliateLink({ id: '1', title: 'Link 1' }),
    ];
    const moreLinks = [createMockAffiliateLink({ id: '2', title: 'Link 2' })];

    // Initial fetch
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: true,
      data: {
        links: initialLinks,
        total: 2,
        page: 1,
        hasMore: true,
      },
    });

    const { result } = renderHook(() => useAffiliateLinks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.links).toEqual(initialLinks);
    expect(result.current.hasMore).toBe(true);

    // Fetch more
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: true,
      data: {
        links: moreLinks,
        total: 2,
        page: 2,
        hasMore: false,
      },
    });

    await act(async () => {
      await result.current.fetchMoreLinks();
    });

    expect(result.current.links).toEqual([...initialLinks, ...moreLinks]);
    expect(result.current.hasMore).toBe(false);
  });

  it('should fetch all links', async () => {
    const allLinks = [
      createMockAffiliateLink({ id: '1', title: 'Link 1' }),
      createMockAffiliateLink({ id: '2', title: 'Link 2' }),
      createMockAffiliateLink({ id: '3', title: 'Link 3' }),
    ];

    mockAffiliateLinksApi.getAllLinks.mockResolvedValueOnce({
      success: true,
      data: allLinks,
    });

    const { result } = renderHook(
      () => useAffiliateLinks({ autoFetch: false }),
      {
        wrapper: createWrapper(),
      }
    );

    await act(async () => {
      await result.current.fetchAllLinks();
    });

    expect(result.current.links).toEqual(allLinks);
    expect(result.current.total).toBe(3);
    expect(result.current.hasMore).toBe(false);
  });

  it('should refetch links', async () => {
    const initialLinks = [
      createMockAffiliateLink({ id: '1', title: 'Link 1' }),
    ];
    const updatedLinks = [
      createMockAffiliateLink({ id: '1', title: 'Updated Link 1' }),
      createMockAffiliateLink({ id: '2', title: 'Link 2' }),
    ];

    // Initial fetch
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: true,
      data: {
        links: initialLinks,
        total: 1,
        page: 1,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useAffiliateLinks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.links).toEqual(initialLinks);

    // Refetch
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: true,
      data: {
        links: updatedLinks,
        total: 2,
        page: 1,
        hasMore: false,
      },
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.links).toEqual(updatedLinks);
    expect(result.current.total).toBe(2);
  });

  it('should clear errors', async () => {
    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: false,
      error: { message: 'API Error' },
    });

    const { result } = renderHook(() => useAffiliateLinks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should call onError callback when error occurs', async () => {
    const onError = vi.fn();

    mockAffiliateLinksApi.getLinks.mockResolvedValueOnce({
      success: false,
      error: { message: 'API Error' },
    });

    renderHook(() => useAffiliateLinks({ onError }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('API Error');
    });
  });
});

describe('useAffiliateLinksSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should search links with debouncing', async () => {
    const searchResults = [
      createMockAffiliateLink({ id: '1', title: 'React Tutorial' }),
    ];

    mockAffiliateLinksApi.searchLinks.mockResolvedValueOnce({
      success: true,
      data: searchResults,
    });

    const filters = {
      searchQuery: 'react',
      categories: [],
      sortBy: 'popularity' as const,
      featuredOnly: false,
    };

    const { result } = renderHook(() => useAffiliateLinksSearch(filters, 300), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSearching).toBe(false);
    expect(mockAffiliateLinksApi.searchLinks).not.toHaveBeenCalled();

    // Fast-forward time to trigger debounced search
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockAffiliateLinksApi.searchLinks).toHaveBeenCalledWith(
        'react',
        filters
      );
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(searchResults);
      expect(result.current.isSearching).toBe(false);
    });
  });

  it('should not search when query is empty', async () => {
    const filters = {
      searchQuery: '',
      categories: [],
      sortBy: 'popularity' as const,
      featuredOnly: false,
    };

    const { result } = renderHook(() => useAffiliateLinksSearch(filters, 300), {
      wrapper: createWrapper(),
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockAffiliateLinksApi.searchLinks).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should handle search errors', async () => {
    mockAffiliateLinksApi.searchLinks.mockResolvedValueOnce({
      success: false,
      error: { message: 'Search failed' },
    });

    const filters = {
      searchQuery: 'react',
      categories: [],
      sortBy: 'popularity' as const,
      featuredOnly: false,
    };

    const { result } = renderHook(() => useAffiliateLinksSearch(filters, 300), {
      wrapper: createWrapper(),
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.searchError).toBe('Search failed');
      expect(result.current.searchResults).toEqual([]);
    });
  });

  it('should cancel previous search when new search is triggered', async () => {
    const filters1 = {
      searchQuery: 'react',
      categories: [],
      sortBy: 'popularity' as const,
      featuredOnly: false,
    };

    const filters2 = {
      searchQuery: 'vue',
      categories: [],
      sortBy: 'popularity' as const,
      featuredOnly: false,
    };

    const { result, rerender } = renderHook(
      ({ filters }) => useAffiliateLinksSearch(filters, 300),
      {
        wrapper: createWrapper(),
        initialProps: { filters: filters1 },
      }
    );

    // Start first search
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Change search query before first search completes
    rerender({ filters: filters2 });

    // Complete debounce for second search
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only the second search should be called
    await waitFor(() => {
      expect(mockAffiliateLinksApi.searchLinks).toHaveBeenCalledTimes(1);
      expect(mockAffiliateLinksApi.searchLinks).toHaveBeenCalledWith(
        'vue',
        filters2
      );
    });
  });
});
