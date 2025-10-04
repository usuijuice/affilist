import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type {
  AffiliateLink,
  GetLinksResponse,
  CreateLinkRequest,
  FilterState,
} from '../types';

export interface GetLinksParams {
  page?: number;
  limit?: number;
  search?: string;
  categories?: string[];
  sortBy?: string;
  commissionRateMin?: number;
  commissionRateMax?: number;
  featuredOnly?: boolean;
}

/**
 * API service for affiliate links operations
 */
export class AffiliateLinksApi {
  /**
   * Get paginated list of affiliate links with filtering and sorting
   */
  async getLinks(
    params: GetLinksParams = {}
  ): Promise<ApiResponse<GetLinksResponse>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.categories?.length)
      searchParams.set('categories', params.categories.join(','));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.commissionRateMin !== undefined)
      searchParams.set(
        'commissionRateMin',
        params.commissionRateMin.toString()
      );
    if (params.commissionRateMax !== undefined)
      searchParams.set(
        'commissionRateMax',
        params.commissionRateMax.toString()
      );
    if (params.featuredOnly) searchParams.set('featuredOnly', 'true');

    const endpoint = `/links${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<GetLinksResponse>(endpoint);
  }

  /**
   * Get all affiliate links (for client-side filtering)
   */
  async getAllLinks(): Promise<ApiResponse<AffiliateLink[]>> {
    return apiClient.get<AffiliateLink[]>('/links/all');
  }

  /**
   * Get a single affiliate link by ID
   */
  async getLinkById(id: string): Promise<ApiResponse<AffiliateLink>> {
    return apiClient.get<AffiliateLink>(`/links/${id}`);
  }

  /**
   * Get featured affiliate links
   */
  async getFeaturedLinks(
    limit: number = 10
  ): Promise<ApiResponse<AffiliateLink[]>> {
    return apiClient.get<AffiliateLink[]>(`/links/featured?limit=${limit}`);
  }

  /**
   * Get popular affiliate links
   */
  async getPopularLinks(
    limit: number = 10
  ): Promise<ApiResponse<AffiliateLink[]>> {
    return apiClient.get<AffiliateLink[]>(`/links/popular?limit=${limit}`);
  }

  /**
   * Search affiliate links
   */
  async searchLinks(
    query: string,
    filters?: Partial<FilterState>
  ): Promise<ApiResponse<AffiliateLink[]>> {
    const params: GetLinksParams = {
      search: query,
      categories: filters?.categories,
      sortBy: filters?.sortBy,
      commissionRateMin: filters?.commissionRateMin,
      commissionRateMax: filters?.commissionRateMax,
      featuredOnly: filters?.featuredOnly,
    };

    const response = await this.getLinks(params);
    if (response.success) {
      return {
        data: response.data.links,
        success: true,
      };
    }
    // Handle error case properly
    return {
      success: false,
      error: response.error,
      data: [] as AffiliateLink[], // Provide empty array as fallback
    };
  }

  /**
   * Record a click event for tracking
   */
  async recordClick(
    linkId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>('/clicks', { linkId });
  }

  /**
   * Get redirect URL for affiliate link (with click tracking)
   */
  getRedirectUrl(linkId: string): string {
    return `${apiClient['baseUrl']}/redirect/${linkId}`;
  }

  // Admin-only methods (require authentication)

  /**
   * Create a new affiliate link (admin only)
   */
  async createLink(
    linkData: CreateLinkRequest
  ): Promise<ApiResponse<AffiliateLink>> {
    return apiClient.post<AffiliateLink>('/admin/links', linkData);
  }

  /**
   * Update an existing affiliate link (admin only)
   */
  async updateLink(
    id: string,
    linkData: Partial<CreateLinkRequest>
  ): Promise<ApiResponse<AffiliateLink>> {
    return apiClient.put<AffiliateLink>(`/admin/links/${id}`, linkData);
  }

  /**
   * Delete an affiliate link (admin only)
   */
  async deleteLink(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/admin/links/${id}`);
  }

  /**
   * Bulk update affiliate links (admin only)
   */
  async bulkUpdateLinks(
    updates: Array<{ id: string; data: Partial<CreateLinkRequest> }>
  ): Promise<ApiResponse<AffiliateLink[]>> {
    return apiClient.put<AffiliateLink[]>('/admin/links/bulk', { updates });
  }

  /**
   * Bulk delete affiliate links (admin only)
   */
  async bulkDeleteLinks(
    ids: string[]
  ): Promise<ApiResponse<{ success: boolean; deletedCount: number }>> {
    return apiClient.request<{ success: boolean; deletedCount: number }>(
      '/admin/links/bulk',
      {
        method: 'DELETE',
        body: { ids },
      }
    );
  }
}

// Create and export singleton instance
export const affiliateLinksApi = new AffiliateLinksApi();
