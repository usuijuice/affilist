/**
 * Custom hook for admin operations with integrated error handling and notifications
 */

import { useState, useCallback } from 'react';
import {
  affiliateLinksApi,
  categoriesApi,
  notificationService,
} from '../services';
import {
  getErrorMessage,
  isAuthError,
  isNetworkError,
} from '../utils/apiErrorHandler';
import type { AffiliateLink, Category, CreateLinkRequest } from '../types';

export interface UseAdminOperationsReturn {
  // Link operations
  createLink: (linkData: CreateLinkRequest) => Promise<AffiliateLink | null>;
  updateLink: (
    id: string,
    linkData: Partial<CreateLinkRequest>
  ) => Promise<AffiliateLink | null>;
  deleteLink: (id: string, title: string) => Promise<boolean>;
  bulkDeleteLinks: (ids: string[], titles: string[]) => Promise<boolean>;
  bulkUpdateLinks: (
    ids: string[],
    updates: Partial<CreateLinkRequest>
  ) => Promise<boolean>;

  // Category operations
  createCategory: (categoryData: any) => Promise<Category | null>;
  updateCategory: (id: string, categoryData: any) => Promise<Category | null>;
  deleteCategory: (id: string, name: string) => Promise<boolean>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAdminOperations(): UseAdminOperationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = getErrorMessage(error);
    setError(errorMessage);

    if (isAuthError(error)) {
      notificationService.authenticationError();
    } else if (isNetworkError(error)) {
      notificationService.networkError();
    } else {
      notificationService.operationFailed(operation, errorMessage);
    }
  }, []);

  // Link operations
  const createLink = useCallback(
    async (linkData: CreateLinkRequest): Promise<AffiliateLink | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await affiliateLinksApi.createLink(linkData);

        if (response.success) {
          notificationService.linkCreated(linkData.title);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to create link');
        }
      } catch (error) {
        handleError(error, 'Create Link');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const updateLink = useCallback(
    async (
      id: string,
      linkData: Partial<CreateLinkRequest>
    ): Promise<AffiliateLink | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await affiliateLinksApi.updateLink(id, linkData);

        if (response.success) {
          notificationService.linkUpdated(linkData.title || 'Link');
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to update link');
        }
      } catch (error) {
        handleError(error, 'Update Link');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const deleteLink = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await affiliateLinksApi.deleteLink(id);

        if (response.success) {
          notificationService.linkDeleted(title);
          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to delete link');
        }
      } catch (error) {
        handleError(error, 'Delete Link');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const bulkDeleteLinks = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await affiliateLinksApi.bulkDeleteLinks(ids);

        if (response.success) {
          notificationService.bulkOperationCompleted(
            'Bulk Delete',
            response.data.deletedCount
          );
          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to delete links');
        }
      } catch (error) {
        handleError(error, 'Bulk Delete Links');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const bulkUpdateLinks = useCallback(
    async (
      ids: string[],
      updates: Partial<CreateLinkRequest>
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const updateData = ids.map((id) => ({ id, data: updates }));
        const response = await affiliateLinksApi.bulkUpdateLinks(updateData);

        if (response.success) {
          notificationService.bulkOperationCompleted('Bulk Update', ids.length);
          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to update links');
        }
      } catch (error) {
        handleError(error, 'Bulk Update Links');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Category operations
  const createCategory = useCallback(
    async (categoryData: any): Promise<Category | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await categoriesApi.createCategory(categoryData);

        if (response.success) {
          notificationService.success(
            'Category Created',
            `"${categoryData.name}" has been created successfully.`
          );
          return response.data;
        } else {
          throw new Error(
            response.error?.message || 'Failed to create category'
          );
        }
      } catch (error) {
        handleError(error, 'Create Category');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const updateCategory = useCallback(
    async (id: string, categoryData: any): Promise<Category | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await categoriesApi.updateCategory(id, categoryData);

        if (response.success) {
          notificationService.success(
            'Category Updated',
            `"${categoryData.name || 'Category'}" has been updated successfully.`
          );
          return response.data;
        } else {
          throw new Error(
            response.error?.message || 'Failed to update category'
          );
        }
      } catch (error) {
        handleError(error, 'Update Category');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  const deleteCategory = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await categoriesApi.deleteCategory(id);

        if (response.success) {
          notificationService.success(
            'Category Deleted',
            `"${name}" has been deleted successfully.`
          );
          return true;
        } else {
          throw new Error(
            response.error?.message || 'Failed to delete category'
          );
        }
      } catch (error) {
        handleError(error, 'Delete Category');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  return {
    // Link operations
    createLink,
    updateLink,
    deleteLink,
    bulkDeleteLinks,
    bulkUpdateLinks,

    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,

    // State
    isLoading,
    error,
    clearError,
  };
}
