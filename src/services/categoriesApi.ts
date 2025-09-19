import { apiClient, ApiResponse } from './apiClient';
import { Category, GetCategoriesResponse } from '../types';

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
}

/**
 * API service for categories operations
 */
export class CategoriesApi {
  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<GetCategoriesResponse>> {
    return apiClient.get<GetCategoriesResponse>('/categories');
  }

  /**
   * Get all categories as a simple array
   */
  async getAllCategories(): Promise<ApiResponse<Category[]>> {
    const response = await this.getCategories();
    if (response.success) {
      return {
        data: response.data.categories,
        success: true,
      };
    }
    return response as ApiResponse<Category[]>;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`/categories/${id}`);
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`/categories/slug/${slug}`);
  }

  /**
   * Get categories with link counts
   */
  async getCategoriesWithCounts(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories/with-counts');
  }

  /**
   * Get popular categories (by link count)
   */
  async getPopularCategories(limit: number = 10): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>(`/categories/popular?limit=${limit}`);
  }

  // Admin-only methods (require authentication)

  /**
   * Create a new category (admin only)
   */
  async createCategory(categoryData: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/admin/categories', categoryData);
  }

  /**
   * Update an existing category (admin only)
   */
  async updateCategory(id: string, categoryData: Partial<CreateCategoryRequest>): Promise<ApiResponse<Category>> {
    return apiClient.put<Category>(`/admin/categories/${id}`, categoryData);
  }

  /**
   * Delete a category (admin only)
   */
  async deleteCategory(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/admin/categories/${id}`);
  }

  /**
   * Reorder categories (admin only)
   */
  async reorderCategories(categoryIds: string[]): Promise<ApiResponse<Category[]>> {
    return apiClient.put<Category[]>('/admin/categories/reorder', { categoryIds });
  }
}

// Create and export singleton instance
export const categoriesApi = new CategoriesApi();