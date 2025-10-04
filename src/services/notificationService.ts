/**
 * Notification service for user feedback
 */

import type { ToastType } from '../components/Toast';

export interface NotificationOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private toastHandler: ((notification: NotificationOptions) => void) | null =
    null;

  /**
   * Set the toast handler (called by ToastProvider)
   */
  setToastHandler(handler: (notification: NotificationOptions) => void) {
    this.toastHandler = handler;
  }

  /**
   * Show a success notification
   */
  success(
    title: string,
    message?: string,
    options?: Partial<NotificationOptions>
  ) {
    this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  /**
   * Show an error notification
   */
  error(
    title: string,
    message?: string,
    options?: Partial<NotificationOptions>
  ) {
    this.show({
      title,
      message,
      type: 'error',
      duration: 8000, // Longer duration for errors
      ...options,
    });
  }

  /**
   * Show a warning notification
   */
  warning(
    title: string,
    message?: string,
    options?: Partial<NotificationOptions>
  ) {
    this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  /**
   * Show an info notification
   */
  info(
    title: string,
    message?: string,
    options?: Partial<NotificationOptions>
  ) {
    this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  /**
   * Show a notification with confirmation action
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    options?: Partial<NotificationOptions>
  ) {
    this.show({
      title,
      message,
      type: 'warning',
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Confirm',
        onClick: onConfirm,
      },
      ...options,
    });
  }

  /**
   * Show a generic notification
   */
  private show(notification: NotificationOptions) {
    if (this.toastHandler) {
      this.toastHandler(notification);
    } else {
      // Fallback to console if toast handler not available
      console.log(
        `[${notification.type?.toUpperCase() || 'INFO'}] ${notification.title}`,
        notification.message
      );
    }
  }

  /**
   * Convenience methods for common admin operations
   */
  linkCreated(title: string) {
    this.success('Link Created', `"${title}" has been created successfully.`);
  }

  linkUpdated(title: string) {
    this.success('Link Updated', `"${title}" has been updated successfully.`);
  }

  linkDeleted(title: string) {
    this.success('Link Deleted', `"${title}" has been deleted successfully.`);
  }

  bulkOperationCompleted(operation: string, count: number) {
    this.success(
      'Bulk Operation Completed',
      `${operation} completed for ${count} item${count !== 1 ? 's' : ''}.`
    );
  }

  operationFailed(operation: string, error?: string) {
    this.error(
      `${operation} Failed`,
      error || 'An unexpected error occurred. Please try again.'
    );
  }

  networkError() {
    this.error(
      'Connection Error',
      'Unable to connect to the server. Please check your internet connection and try again.',
      {
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      }
    );
  }

  authenticationError() {
    this.error(
      'Authentication Required',
      'Your session has expired. Please log in again.',
      {
        action: {
          label: 'Login',
          onClick: () => {
            // This will be handled by the auth context
            window.location.href = '/admin/login';
          },
        },
      }
    );
  }

  validationError(message: string) {
    this.warning('Validation Error', message);
  }

  permissionDenied() {
    this.error(
      'Permission Denied',
      'You do not have permission to perform this action.'
    );
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
