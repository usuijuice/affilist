import { useMemo } from 'react';
import { useAppContext } from '../contexts';

/**
 * Custom hook that returns filtered and sorted affiliate links based on current filters
 */
export function useFilteredLinks() {
  const { state } = useAppContext();
  const { affiliateLinks, filters } = state;

  const filteredAndSortedLinks = useMemo(() => {
    let filtered = [...affiliateLinks];

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.description.toLowerCase().includes(query) ||
          link.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          link.category.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((link) =>
        filters.categories.includes(link.category.id)
      );
    }

    // Apply commission rate filter
    if (filters.commissionRateMin !== undefined) {
      filtered = filtered.filter(
        (link) =>
          link.commissionRate !== undefined &&
          link.commissionRate >= filters.commissionRateMin!
      );
    }

    if (filters.commissionRateMax !== undefined) {
      filtered = filtered.filter(
        (link) =>
          link.commissionRate !== undefined &&
          link.commissionRate <= filters.commissionRateMax!
      );
    }

    // Apply featured filter
    if (filters.featuredOnly) {
      filtered = filtered.filter((link) => link.featured);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popularity':
          return b.clickCount - a.clickCount;

        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        case 'commission':
          const aCommission = a.commissionRate || 0;
          const bCommission = b.commissionRate || 0;
          return bCommission - aCommission;

        case 'alphabetical':
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });

    return filtered;
  }, [affiliateLinks, filters]);

  // Helper function to get search highlights
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts;
  };

  // Statistics about filtered results
  const stats = useMemo(() => {
    const total = affiliateLinks.length;
    const filtered = filteredAndSortedLinks.length;
    const hasActiveFilters =
      filters.searchQuery.trim() !== '' ||
      filters.categories.length > 0 ||
      filters.commissionRateMin !== undefined ||
      filters.commissionRateMax !== undefined ||
      filters.featuredOnly;

    return {
      total,
      filtered,
      hasActiveFilters,
      isFiltered: filtered !== total,
    };
  }, [affiliateLinks.length, filteredAndSortedLinks.length, filters]);

  return {
    links: filteredAndSortedLinks,
    stats,
    getHighlightedText,
  };
}
