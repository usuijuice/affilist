/**
 * Tests for useAdminOperations hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminOperations } from '../useAdminOperations';
import { affiliateLinksApi, categoriesApi, notificationService } from '../../services';
import type { CreateLinkRequest } from '../../types';

// Mock the services
vi.mock('../../services', () => ({
  affiliateLinksApi: {
    createLink: vi.fn(),
    updateLink: vi.fn(),
    deleteLink: vi.fn(),
    bulkDeleteLinks: vi.fn(),
    bulkUpdateLinks: vi.fn(),
  },
  categoriesApi: {
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
  notificationService: {
    linkCreated: vi.fn(),
    linkUpdated: vi.fn(),
    linkDeleted: vi.fn(),
    bulkOperationCompleted: vi.fn(),
    operationFailed: vi.fn(),
    authenticationError: vi.fn(),
    networkError: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the error handler utilities
vi.mock('../../utils/apiErrorHandler', () => ({
  getErrorMessage: vi.fn((error) => error?.message || 'Unknown error'),
  isAuthError: vi.fn(() => false),
  isNetworkError: vi.fn(() => false),
}));

describe('useAdminOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Link Operations', () => {
    it('should create a link successfully', async () => {
      const mockLink = {
        id: '1',
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        category: { id: 'cat1', name: 'Test Category' },
        tags: ['test'],
        featured: false,
        clickCount: 0,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const linkData: CreateLinkRequest = {
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        categoryId: 'cat1',
        tags: ['test'],
        featured: false,
      };

      vi.mocked(affiliateLinksApi.createLink).mockResolvedValue({
        success: true,
        data: mockLink,
      });

      const { result } = renderHook(() => useAdminOperations());

      let createdLink: any;
      await act(async () => {
        createdLink = await result.current.createLink(linkData);
      });

      expect(affiliateLinksApi.createLink).toHaveBeenCalledWith(linkData);
      expect(notificationService.linkCreated).toHaveBeenCalledWith('Test Link');
      expect(createdLink).toEqual(mockLink);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle create link failure', async () => {
      const linkData: CreateLinkRequest = {
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        categoryId: 'cat1',
        tags: ['test'],
        featured: false,
      };

      vi.mocked(affiliateLinksApi.createLink).mockResolvedValue({
        success: false,
        data: null as any,
        error: { message: 'Validation failed' },
      });

      const { result } = renderHook(() => useAdminOperations());

      let createdLink: any;
      await act(async () => {
        createdLink = await result.current.createLink(linkData);
      });

      expect(createdLink).toBe(null);
      expect(result.current.error).toBe('Validation failed');
      expect(notificationService.operationFailed).toHaveBeenCalledWith('Create Link', 'Validation failed');
    });

    it('should update a link successfully', async () => {
      const mockLink = {
        id: '1',
        title: 'Updated Link',
        description: 'Updated Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        category: { id: 'cat1', name: 'Test Category' },
        tags: ['test'],
        featured: true,
        clickCount: 0,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        title: 'Updated Link',
        featured: true,
      };

      vi.mocked(affiliateLinksApi.updateLink).mockResolvedValue({
        success: true,
        data: mockLink,
      });

      const { result } = renderHook(() => useAdminOperations());

      let updatedLink: any;
      await act(async () => {
        updatedLink = await result.current.updateLink('1', updateData);
      });

      expect(affiliateLinksApi.updateLink).toHaveBeenCalledWith('1', updateData);
      expect(notificationService.linkUpdated).toHaveBeenCalledWith('Updated Link');
      expect(updatedLink).toEqual(mockLink);
    });

    it('should delete a link successfully', async () => {
      vi.mocked(affiliateLinksApi.deleteLink).mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const { result } = renderHook(() => useAdminOperations());

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteLink('1', 'Test Link');
      });

      expect(affiliateLinksApi.deleteLink).toHaveBeenCalledWith('1');
      expect(notificationService.linkDeleted).toHaveBeenCalledWith('Test Link');
      expect(deleteResult).toBe(true);
    });

    it('should perform bulk delete successfully', async () => {
      vi.mocked(affiliateLinksApi.bulkDeleteLinks).mockResolvedValue({
        success: true,
        data: { success: true, deletedCount: 3 },
      });

      const { result } = renderHook(() => useAdminOperations());

      let bulkDeleteResult: boolean;
      await act(async () => {
        bulkDeleteResult = await result.current.bulkDeleteLinks(
          ['1', '2', '3'],
          ['Link 1', 'Link 2', 'Link 3']
        );
      });

      expect(affiliateLinksApi.bulkDeleteLinks).toHaveBeenCalledWith(['1', '2', '3']);
      expect(notificationService.bulkOperationCompleted).toHaveBeenCalledWith('Bulk Delete', 3);
      expect(bulkDeleteResult).toBe(true);
    });

    it('should perform bulk update successfully', async () => {
      vi.mocked(affiliateLinksApi.bulkUpdateLinks).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAdminOperations());

      const updates = { featured: true };
      let bulkUpdateResult: boolean;
      
      await act(async () => {
        bulkUpdateResult = await result.current.bulkUpdateLinks(['1', '2'], updates);
      });

      expect(affiliateLinksApi.bulkUpdateLinks).toHaveBeenCalledWith([
        { id: '1', data: updates },
        { id: '2', data: updates },
      ]);
      expect(notificationService.bulkOperationCompleted).toHaveBeenCalledWith('Bulk Update', 2);
      expect(bulkUpdateResult).toBe(true);
    });
  });

  describe('Category Operations', () => {
    it('should create a category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test Description',
        color: '#blue',
        linkCount: 0,
      };

      const categoryData = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test Description',
        color: '#blue',
      };

      vi.mocked(categoriesApi.createCategory).mockResolvedValue({
        success: true,
        data: mockCategory,
      });

      const { result } = renderHook(() => useAdminOperations());

      let createdCategory: any;
      await act(async () => {
        createdCategory = await result.current.createCategory(categoryData);
      });

      expect(categoriesApi.createCategory).toHaveBeenCalledWith(categoryData);
      expect(notificationService.success).toHaveBeenCalledWith(
        'Category Created',
        '"Test Category" has been created successfully.'
      );
      expect(createdCategory).toEqual(mockCategory);
    });

    it('should update a category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Updated Category',
        slug: 'updated-category',
        description: 'Updated Description',
        color: '#red',
        linkCount: 5,
      };

      const updateData = {
        name: 'Updated Category',
        color: '#red',
      };

      vi.mocked(categoriesApi.updateCategory).mockResolvedValue({
        success: true,
        data: mockCategory,
      });

      const { result } = renderHook(() => useAdminOperations());

      let updatedCategory: any;
      await act(async () => {
        updatedCategory = await result.current.updateCategory('1', updateData);
      });

      expect(categoriesApi.updateCategory).toHaveBeenCalledWith('1', updateData);
      expect(notificationService.success).toHaveBeenCalledWith(
        'Category Updated',
        '"Updated Category" has been updated successfully.'
      );
      expect(updatedCategory).toEqual(mockCategory);
    });

    it('should delete a category successfully', async () => {
      vi.mocked(categoriesApi.deleteCategory).mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const { result } = renderHook(() => useAdminOperations());

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteCategory('1', 'Test Category');
      });

      expect(categoriesApi.deleteCategory).toHaveBeenCalledWith('1');
      expect(notificationService.success).toHaveBeenCalledWith(
        'Category Deleted',
        '"Test Category" has been deleted successfully.'
      );
      expect(deleteResult).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      
      vi.mocked(affiliateLinksApi.createLink).mockRejectedValue(networkError);
      
      // Mock the error handler to return network error
      const { isNetworkError } = await import('../../utils/apiErrorHandler');
      vi.mocked(isNetworkError).mockReturnValue(true);

      const { result } = renderHook(() => useAdminOperations());

      const linkData: CreateLinkRequest = {
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        categoryId: 'cat1',
        tags: [],
        featured: false,
      };

      await act(async () => {
        await result.current.createLink(linkData);
      });

      expect(notificationService.networkError).toHaveBeenCalled();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      
      vi.mocked(affiliateLinksApi.deleteLink).mockRejectedValue(authError);
      
      // Mock the error handler to return auth error
      const { isAuthError } = await import('../../utils/apiErrorHandler');
      vi.mocked(isAuthError).mockReturnValue(true);

      const { result } = renderHook(() => useAdminOperations());

      await act(async () => {
        await result.current.deleteLink('1', 'Test Link');
      });

      expect(notificationService.authenticationError).toHaveBeenCalled();
      expect(result.current.error).toBe('Unauthorized');
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useAdminOperations());

      // Set an error first
      vi.mocked(affiliateLinksApi.createLink).mockResolvedValue({
        success: false,
        data: null as any,
        error: { message: 'Test error' },
      });

      await act(async () => {
        await result.current.createLink({
          title: 'Test',
          description: 'Test',
          url: 'https://example.com',
          affiliateUrl: 'https://affiliate.example.com',
          categoryId: 'cat1',
          tags: [],
          featured: false,
        });
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Loading States', () => {
    it('should manage loading state during operations', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      vi.mocked(affiliateLinksApi.createLink).mockReturnValue(promise);

      const { result } = renderHook(() => useAdminOperations());

      expect(result.current.isLoading).toBe(false);

      // Start the operation
      const operationPromise = act(async () => {
        return result.current.createLink({
          title: 'Test',
          description: 'Test',
          url: 'https://example.com',
          affiliateUrl: 'https://affiliate.example.com',
          categoryId: 'cat1',
          tags: [],
          featured: false,
        });
      });

      // Should be loading now
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        success: true,
        data: { id: '1', title: 'Test' },
      });

      await operationPromise;

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false);
    });
  });
});