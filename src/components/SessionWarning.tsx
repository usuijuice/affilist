import React, { useState, useEffect } from 'react';

interface SessionWarningProps {
  /**
   * Time left in milliseconds
   */
  timeLeft: number;

  /**
   * Called when user chooses to extend session
   */
  onExtendSession: () => Promise<boolean>;

  /**
   * Called when user chooses to logout or time runs out
   */
  onLogout: () => void;

  /**
   * Called when warning is dismissed
   */
  onDismiss?: () => void;

  /**
   * Whether the warning can be dismissed
   */
  dismissible?: boolean;

  /**
   * Auto-logout when countdown reaches zero
   */
  autoLogout?: boolean;
}

export function SessionWarning({
  timeLeft: initialTimeLeft,
  onExtendSession,
  onLogout,
  onDismiss,
  dismissible = false,
  autoLogout = true,
}: SessionWarningProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isExtending, setIsExtending] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1000);

        // Auto-logout when time reaches zero
        if (newTime === 0 && autoLogout) {
          onLogout();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onLogout, autoLogout]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await onExtendSession();
      if (success && onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft <= 60000; // Less than 1 minute

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            {/* Icon */}
            <div
              className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                isUrgent ? 'bg-red-100' : 'bg-yellow-100'
              }`}
            >
              <svg
                className={`h-6 w-6 ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Session Expiring Soon
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Your session will expire in{' '}
                  <span
                    className={`font-mono font-bold ${
                      isUrgent ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Would you like to extend your session or logout?
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              disabled={isExtending}
              onClick={handleExtendSession}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Extending...
                </>
              ) : (
                'Stay Logged In'
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Logout Now
            </button>
          </div>

          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onDismiss}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
