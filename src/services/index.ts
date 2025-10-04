// API service functions

export { apiClient, ApiClient } from './apiClient';
export type { ApiError, ApiResponse, RequestConfig } from './apiClient';

export { affiliateLinksApi, AffiliateLinksApi } from './affiliateLinksApi';
export type { GetLinksParams } from './affiliateLinksApi';

export { categoriesApi, CategoriesApi } from './categoriesApi';
export type { CreateCategoryRequest } from './categoriesApi';

export { analyticsApi, AnalyticsApi } from './analyticsApi';
export type {
  AnalyticsParams,
  ClickAnalytics as ClickAnalyticsType,
  RevenueAnalytics,
  LinkPerformance,
} from './analyticsApi';

export {
  clickTrackingService,
  ClickTrackingService,
  ClickAnalytics as ClickAnalyticsClass,
} from './clickTrackingService';
export type {
  ClickTrackingData,
  SessionData,
  ClickTrackingConfig,
} from '../types';

export { authService } from './authService';
export { notificationService } from './notificationService';
