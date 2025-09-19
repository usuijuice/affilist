import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { AnalyticsResponse } from '../types';

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  linkId?: string;
}

export interface ClickAnalytics {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDate: Array<{
    date: string;
    clicks: number;
    uniqueClicks: number;
  }>;
  clicksByCategory: Array<{
    categoryId: string;
    categoryName: string;
    clicks: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    clicks: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  estimatedRevenue: number;
  revenueByDate: Array<{
    date: string;
    revenue: number;
  }>;
  revenueByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
  }>;
}

export interface LinkPerformance {
  linkId: string;
  title: string;
  clicks: number;
  uniqueClicks: number;
  conversionRate: number;
  revenue: number;
  ctr: number; // Click-through rate
}

/**
 * API service for analytics operations
 */
export class AnalyticsApi {
  /**
   * Get comprehensive analytics dashboard data (admin only)
   */
  async getDashboardAnalytics(params: AnalyticsParams = {}): Promise<ApiResponse<AnalyticsResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.linkId) searchParams.set('linkId', params.linkId);

    const endpoint = `/admin/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<AnalyticsResponse>(endpoint);
  }

  /**
   * Get click analytics (admin only)
   */
  async getClickAnalytics(params: AnalyticsParams = {}): Promise<ApiResponse<ClickAnalytics>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);

    const endpoint = `/admin/analytics/clicks${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<ClickAnalytics>(endpoint);
  }

  /**
   * Get revenue analytics (admin only)
   */
  async getRevenueAnalytics(params: AnalyticsParams = {}): Promise<ApiResponse<RevenueAnalytics>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);

    const endpoint = `/admin/analytics/revenue${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<RevenueAnalytics>(endpoint);
  }

  /**
   * Get link performance metrics (admin only)
   */
  async getLinkPerformance(params: AnalyticsParams = {}): Promise<ApiResponse<LinkPerformance[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);

    const endpoint = `/admin/analytics/links${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<LinkPerformance[]>(endpoint);
  }

  /**
   * Get analytics for a specific link (admin only)
   */
  async getLinkAnalytics(linkId: string, params: Omit<AnalyticsParams, 'linkId'> = {}): Promise<ApiResponse<LinkPerformance>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const endpoint = `/admin/analytics/links/${linkId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<LinkPerformance>(endpoint);
  }

  /**
   * Export analytics data as CSV (admin only)
   */
  async exportAnalytics(params: AnalyticsParams & { format?: 'csv' | 'json' } = {}): Promise<ApiResponse<Blob>> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.format) searchParams.set('format', params.format);

    const endpoint = `/admin/analytics/export${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<Blob>(endpoint, { cache: false });
  }

  /**
   * Get real-time analytics summary (admin only)
   */
  async getRealTimeAnalytics(): Promise<ApiResponse<{
    activeUsers: number;
    clicksToday: number;
    revenueToday: number;
    topLinksToday: Array<{
      linkId: string;
      title: string;
      clicks: number;
    }>;
  }>> {
    return apiClient.get('/admin/analytics/realtime', { cache: false });
  }
}

// Create and export singleton instance
export const analyticsApi = new AnalyticsApi();