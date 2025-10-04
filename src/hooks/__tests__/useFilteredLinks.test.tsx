import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AppProvider } from '../../contexts/AppContext';
import { useAppState } from '../useAppState';
import { useFilteredLinks } from '../useFilteredLinks';
import {
  createMockAffiliateLink,
  createMockCategory,
} from '../../test/factories';
import { beforeEach, describe, expect, it } from 'vitest';

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );
};

describe('useFilteredLinks', () => {
  const mockCategory1 = createMockCategory({ id: 'cat1', name: 'Category 1' });
  const mockCategory2 = createMockCategory({ id: 'cat2', name: 'Category 2' });

  const mockLinks = [
    createMockAffiliateLink({
      id: '1',
      title: 'React Tutorial',
      description: 'Learn React development',
      category: mockCategory1,
      tags: ['react', 'javascript'],
      clickCount: 100,
      commissionRate: 10,
      featured: true,
      createdAt: new Date('2024-01-01'),
    }),
    createMockAffiliateLink({
      id: '2',
      title: 'Vue.js Guide',
      description: 'Complete Vue.js tutorial',
      category: mockCategory2,
      tags: ['vue', 'javascript'],
      clickCount: 50,
      commissionRate: 15,
      featured: false,
      createdAt: new Date('2024-01-02'),
    }),
    createMockAffiliateLink({
      id: '3',
      title: 'Angular Course',
      description: 'Master Angular framework',
      category: mockCategory1,
      tags: ['angular', 'typescript'],
      clickCount: 75,
      commissionRate: 8,
      featured: true,
      createdAt: new Date('2024-01-03'),
    }),
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return all links when no filters are applied', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
    });

    expect(result.current.filteredLinks.links).toHaveLength(3);
    expect(result.current.filteredLinks.stats.total).toBe(3);
    expect(result.current.filteredLinks.stats.filtered).toBe(3);
    expect(result.current.filteredLinks.stats.hasActiveFilters).toBe(false);
  });

  it('should filter by search query', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setSearchQuery('react');
    });

    expect(result.current.filteredLinks.links).toHaveLength(1);
    expect(result.current.filteredLinks.links[0].title).toBe('React Tutorial');
    expect(result.current.filteredLinks.stats.hasActiveFilters).toBe(true);
  });

  it('should filter by category', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setCategoryFilter(['cat1']);
    });

    expect(result.current.filteredLinks.links).toHaveLength(2);
    expect(
      result.current.filteredLinks.links.every(
        (link) => link.category.id === 'cat1'
      )
    ).toBe(true);
  });

  it('should filter by commission rate', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setCommissionFilter(10, 20);
    });

    expect(result.current.filteredLinks.links).toHaveLength(2);
    expect(
      result.current.filteredLinks.links.every(
        (link) => link.commissionRate! >= 10 && link.commissionRate! <= 20
      )
    ).toBe(true);
  });

  it('should filter by featured status', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setFeaturedFilter(true);
    });

    expect(result.current.filteredLinks.links).toHaveLength(2);
    expect(
      result.current.filteredLinks.links.every((link) => link.featured)
    ).toBe(true);
  });

  it('should sort by popularity (default)', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
    });

    const links = result.current.filteredLinks.links;
    expect(links[0].clickCount).toBe(100); // React Tutorial
    expect(links[1].clickCount).toBe(75); // Angular Course
    expect(links[2].clickCount).toBe(50); // Vue.js Guide
  });

  it('should sort by newest', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setSortBy('newest');
    });

    const links = result.current.filteredLinks.links;
    expect(links[0].title).toBe('Angular Course'); // 2024-01-03
    expect(links[1].title).toBe('Vue.js Guide'); // 2024-01-02
    expect(links[2].title).toBe('React Tutorial'); // 2024-01-01
  });

  it('should sort by commission', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setSortBy('commission');
    });

    const links = result.current.filteredLinks.links;
    expect(links[0].commissionRate).toBe(15); // Vue.js Guide
    expect(links[1].commissionRate).toBe(10); // React Tutorial
    expect(links[2].commissionRate).toBe(8); // Angular Course
  });

  it('should sort alphabetically', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setSortBy('alphabetical');
    });

    const links = result.current.filteredLinks.links;
    expect(links[0].title).toBe('Angular Course');
    expect(links[1].title).toBe('React Tutorial');
    expect(links[2].title).toBe('Vue.js Guide');
  });

  it('should combine multiple filters', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setCategoryFilter(['cat1']);
      result.current.appState.setFeaturedFilter(true);
    });

    expect(result.current.filteredLinks.links).toHaveLength(2);
    expect(
      result.current.filteredLinks.links.every(
        (link) => link.category.id === 'cat1' && link.featured
      )
    ).toBe(true);
  });

  it('should provide correct statistics', () => {
    const { result } = renderHook(
      () => {
        const appState = useAppState();
        const filteredLinks = useFilteredLinks();
        return { appState, filteredLinks };
      },
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.appState.setAffiliateLinks(mockLinks);
      result.current.appState.setSearchQuery('react');
    });

    const stats = result.current.filteredLinks.stats;
    expect(stats.total).toBe(3);
    expect(stats.filtered).toBe(1);
    expect(stats.hasActiveFilters).toBe(true);
    expect(stats.isFiltered).toBe(true);
  });

  it('should provide highlight text function', () => {
    const { result } = renderHook(() => useFilteredLinks(), {
      wrapper: createWrapper(),
    });

    const highlightedParts = result.current.getHighlightedText(
      'React Tutorial',
      'react'
    );

    expect(highlightedParts).toEqual(['', 'React', ' Tutorial']);
  });
});
