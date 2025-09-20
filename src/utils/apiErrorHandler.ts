/**
 * API error handling utilities
 */

import type { ApiError } from '../services/apiClient';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (error && typeof error === 'object') {
    // Handle API response errors
    if ('error' in error && error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiError;
      return apiError.message || fallback;
    }

    // Handle direct API errors
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'TypeError' || error.message.includes('fetch');
  }

  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error.error as ApiError;
    return !apiError.status || apiError.status >= 500;
  }

  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error.error as ApiError;
    return apiError.status === 401 || apiError.status === 403;
  }

  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error.error as ApiError;
    return apiError.status === 400;
  }

  return false;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error.error as ApiError;
    return apiError.status === 404;
  }

  return false;
}

/**
 * Get appropriate retry delay based on error type
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  // Exponential backoff for network errors
  if (isNetworkError(error)) {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  }

  // Fixed delay for other errors
  return baseDelay;
}

/**
 * Determine if error should trigger a retry
 */
export function shouldRetry(
  error: unknown,
  attempt: number,
  maxRetries: number = 3
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Don't retry auth errors or validation errors
  if (
    isAuthError(error) ||
    isValidationError(error) ||
    isNotFoundError(error)
  ) {
    return false;
  }

  // Retry network errors and server errors
  return isNetworkError(error);
}

/**
 * Create user-friendly error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK:
    'Unable to connect to the server. Please check your internet connection and try again.',
  AUTH: 'You are not authorized to perform this action. Please log in and try again.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER: 'A server error occurred. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Get contextual error message based on error type
 */
export function getContextualErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK;
  }

  if (isAuthError(error)) {
    return ERROR_MESSAGES.AUTH;
  }

  if (isValidationError(error)) {
    return ERROR_MESSAGES.VALIDATION;
  }

  if (isNotFoundError(error)) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  // Try to get specific error message, fall back to generic
  const specificMessage = getErrorMessage(error);
  if (specificMessage !== ERROR_MESSAGES.UNKNOWN) {
    return specificMessage;
  }

  return ERROR_MESSAGES.SERVER;
}
