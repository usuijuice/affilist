import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface UseSessionManagementOptions {
  /**
   * How often to check token validity (in milliseconds)
   * Default: 5 minutes
   */
  checkInterval?: number;
  
  /**
   * How long before token expiry to attempt refresh (in milliseconds)
   * Default: 5 minutes
   */
  refreshThreshold?: number;
  
  /**
   * Whether to show warnings before session expires
   * Default: true
   */
  showWarnings?: boolean;
  
  /**
   * How long before expiry to show warning (in milliseconds)
   * Default: 10 minutes
   */
  warningThreshold?: number;
  
  /**
   * Callback when session is about to expire
   */
  onSessionWarning?: (timeLeft: number) => void;
  
  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;
}

export function useSessionManagement(options: UseSessionManagementOptions = {}) {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    refreshThreshold = 5 * 60 * 1000, // 5 minutes
    showWarnings = true,
    warningThreshold = 10 * 60 * 1000, // 10 minutes
    onSessionWarning,
    onSessionExpired,
  } = options;

  const { state, logout } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const getTokenExpirationTime = useCallback((): number | null => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  }, []);

  const checkTokenValidity = useCallback(async () => {
    if (!state.isAuthenticated || !state.token) {
      return;
    }

    const expirationTime = getTokenExpirationTime();
    if (!expirationTime) {
      // Invalid token, logout
      await logout();
      if (onSessionExpired) {
        onSessionExpired();
      }
      return;
    }

    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Check if token has already expired
    if (timeUntilExpiry <= 0) {
      await logout();
      if (onSessionExpired) {
        onSessionExpired();
      }
      return;
    }

    // Check if we should refresh the token
    if (timeUntilExpiry <= refreshThreshold) {
      try {
        await authService.refreshToken();
        warningShownRef.current = false; // Reset warning flag after successful refresh
      } catch (error) {
        console.warn('Token refresh failed:', error);
        await logout();
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }
    }

    // Check if we should show a warning
    if (showWarnings && timeUntilExpiry <= warningThreshold && !warningShownRef.current) {
      warningShownRef.current = true;
      if (onSessionWarning) {
        onSessionWarning(timeUntilExpiry);
      }
    }
  }, [
    state.isAuthenticated,
    state.token,
    getTokenExpirationTime,
    logout,
    refreshThreshold,
    showWarnings,
    warningThreshold,
    onSessionWarning,
    onSessionExpired,
  ]);

  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      await authService.refreshToken();
      warningShownRef.current = false;
      return true;
    } catch (error) {
      console.warn('Failed to extend session:', error);
      return false;
    }
  }, []);

  const getTimeUntilExpiry = useCallback((): number | null => {
    const expirationTime = getTokenExpirationTime();
    if (!expirationTime) return null;
    
    return Math.max(0, expirationTime - Date.now());
  }, [getTokenExpirationTime]);

  // Set up periodic token checking
  useEffect(() => {
    if (state.isAuthenticated) {
      // Check immediately
      checkTokenValidity();
      
      // Set up interval
      intervalRef.current = setInterval(checkTokenValidity, checkInterval);
    } else {
      // Clear interval when not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      warningShownRef.current = false;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isAuthenticated, checkTokenValidity, checkInterval]);

  // Activity-based session extension
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const handleUserActivity = () => {
      const timeUntilExpiry = getTimeUntilExpiry();
      if (timeUntilExpiry && timeUntilExpiry <= refreshThreshold) {
        // User is active and token is close to expiry, refresh it
        extendSession();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Throttle activity detection to avoid excessive API calls
    let activityTimeout: NodeJS.Timeout | null = null;
    const throttledActivityHandler = () => {
      if (activityTimeout) return;
      
      activityTimeout = setTimeout(() => {
        handleUserActivity();
        activityTimeout = null;
      }, 30000); // Check at most once every 30 seconds
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivityHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivityHandler, true);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [state.isAuthenticated, getTimeUntilExpiry, refreshThreshold, extendSession]);

  return {
    /**
     * Manually extend the session
     */
    extendSession,
    
    /**
     * Get time until token expires (in milliseconds)
     */
    getTimeUntilExpiry,
    
    /**
     * Check if token is close to expiry
     */
    isCloseToExpiry: () => {
      const timeLeft = getTimeUntilExpiry();
      return timeLeft !== null && timeLeft <= warningThreshold;
    },
    
    /**
     * Force a token validity check
     */
    checkTokenValidity,
  };
}