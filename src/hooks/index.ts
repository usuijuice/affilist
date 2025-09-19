// Custom hooks for the affiliate link aggregator

export { useDebounce } from './useDebounce';
export { useFilters } from './useFilters';
export { useAppState } from './useAppState';
export { useFilteredLinks } from './useFilteredLinks';
export { useAffiliateLinks, useAffiliateLinksSearch } from './useAffiliateLinks';
export { useCategories, usePopularCategories } from './useCategories';
export { 
  useAnalytics, 
  useClickAnalytics, 
  useRevenueAnalytics, 
  useLinkPerformance, 
  useRealTimeAnalytics 
} from './useAnalytics';

export { 
  useClickTracking, 
  useClickAnalytics as useClickAnalyticsUtils, 
  usePageTracking, 
  useInteractionTracking 
} from './useClickTracking';

export { useSessionManagement } from './useSessionManagement';

// Export types
export type { UseAffiliateLinksOptions, UseAffiliateLinksReturn } from './useAffiliateLinks';
export type { UseCategoriesOptions, UseCategoriesReturn } from './useCategories';
export type { UseAnalyticsOptions, UseAnalyticsReturn } from './useAnalytics';
export type { UseClickTrackingOptions, UseClickTrackingReturn } from './useClickTracking';
