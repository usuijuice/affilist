import type {
  ClickTrackingData,
  SessionData,
  ClickTrackingConfig,
} from '../types';
import { apiClient } from './apiClient';

/**
 * Click tracking service for recording affiliate link clicks
 * Handles session management, user identification, and analytics data collection
 */
export class ClickTrackingService {
  private config: ClickTrackingConfig;
  private sessionData: SessionData | null = null;
  private clickQueue: ClickTrackingData[] = [];
  private flushTimer: number | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<ClickTrackingConfig> = {}) {
    this.config = {
      enableTracking: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      enableLocalStorage: true,
      enableAnalytics: true,
      ...config,
    };

    this.initializeService();
  }

  /**
   * Initialize the click tracking service
   */
  private initializeService(): void {
    if (!this.config.enableTracking) {
      return;
    }

    // Initialize or restore session
    this.initializeSession();

    // Set up periodic flush
    this.startFlushTimer();

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for page visibility changes
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );

    // Listen for beforeunload to flush remaining data
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Initialize or restore session data
   */
  private initializeSession(): void {
    const existingSession = this.getStoredSession();
    const now = new Date();

    if (existingSession && this.isSessionValid(existingSession, now)) {
      // Restore existing session
      this.sessionData = {
        ...existingSession,
        lastActivity: now,
      };
    } else {
      // Create new session
      this.sessionData = {
        sessionId: this.generateSessionId(),
        startTime: now,
        lastActivity: now,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        clickCount: 0,
      };
    }

    this.storeSession();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Check if a session is still valid
   */
  private isSessionValid(session: SessionData, currentTime: Date): boolean {
    const timeDiff = currentTime.getTime() - session.lastActivity.getTime();
    return timeDiff < this.config.sessionTimeout;
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): SessionData | null {
    if (
      !this.config.enableLocalStorage ||
      typeof localStorage === 'undefined'
    ) {
      return null;
    }

    try {
      const stored = localStorage.getItem('clickTracking_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          startTime: new Date(parsed.startTime),
          lastActivity: new Date(parsed.lastActivity),
        };
      }
    } catch (error) {
      console.warn('Failed to parse stored session data:', error);
    }

    return null;
  }

  /**
   * Store session data to localStorage
   */
  private storeSession(): void {
    if (
      !this.config.enableLocalStorage ||
      !this.sessionData ||
      typeof localStorage === 'undefined'
    ) {
      return;
    }

    try {
      localStorage.setItem(
        'clickTracking_session',
        JSON.stringify(this.sessionData)
      );
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  }

  /**
   * Track a click event
   */
  public async trackClick(
    linkId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableTracking || !this.sessionData) {
      return;
    }

    const now = new Date();

    // Update session activity
    this.sessionData.lastActivity = now;
    this.sessionData.clickCount++;
    this.storeSession();

    // Create click tracking data
    const clickData: ClickTrackingData = {
      linkId,
      timestamp: now,
      userAgent: this.sessionData.userAgent,
      referrer: this.sessionData.referrer,
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      metadata,
    };

    // Add to queue
    this.clickQueue.push(clickData);

    // Flush immediately if batch size reached or if offline
    if (this.clickQueue.length >= this.config.batchSize || !this.isOnline) {
      await this.flushClickQueue();
    }
  }

  /**
   * Set user ID for the current session
   */
  public setUserId(userId: string): void {
    if (this.sessionData) {
      this.sessionData.userId = userId;
      this.storeSession();
    }
  }

  /**
   * Get current session data
   */
  public getSessionData(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Flush click queue to server
   */
  private async flushClickQueue(): Promise<void> {
    if (this.clickQueue.length === 0) {
      return;
    }

    const clicksToSend = [...this.clickQueue];
    this.clickQueue = [];

    try {
      const response = await apiClient.post('/clicks/batch', {
        clicks: clicksToSend,
      });

      if (!response.success) {
        // Re-queue failed clicks if offline or server error
        if (
          !this.isOnline ||
          (response.error?.status && response.error.status >= 500)
        ) {
          this.clickQueue.unshift(...clicksToSend);
        }
      }
    } catch (error) {
      console.warn('Failed to send click data:', error);

      // Re-queue clicks if network error
      if (!this.isOnline) {
        this.clickQueue.unshift(...clicksToSend);
      }
    }
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      window.clearInterval(this.flushTimer);
    }

    this.flushTimer = window.setInterval(() => {
      this.flushClickQueue();
    }, this.config.flushInterval);
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    // Flush any queued clicks when coming back online
    this.flushClickQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Handle visibility change (tab focus/blur)
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.sessionData) {
      // Update last activity when tab becomes visible
      this.sessionData.lastActivity = new Date();
      this.storeSession();
    } else if (document.visibilityState === 'hidden') {
      // Flush clicks when tab becomes hidden
      this.flushClickQueue();
    }
  }

  /**
   * Handle before unload event
   */
  private handleBeforeUnload(): void {
    // Synchronously flush remaining clicks
    if (this.clickQueue.length > 0) {
      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        const data = JSON.stringify({ clicks: this.clickQueue });
        navigator.sendBeacon('/api/clicks/batch', data);
      }
    }
  }

  /**
   * Get analytics data for the current session
   */
  public getSessionAnalytics(): {
    sessionId: string;
    duration: number;
    clickCount: number;
    startTime: Date;
    lastActivity: Date;
  } | null {
    if (!this.sessionData) {
      return null;
    }

    return {
      sessionId: this.sessionData.sessionId,
      duration:
        this.sessionData.lastActivity.getTime() -
        this.sessionData.startTime.getTime(),
      clickCount: this.sessionData.clickCount,
      startTime: this.sessionData.startTime,
      lastActivity: this.sessionData.lastActivity,
    };
  }

  /**
   * Clear session data and start fresh
   */
  public clearSession(): void {
    if (this.config.enableLocalStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem('clickTracking_session');
    }
    this.sessionData = null;
    this.initializeSession();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ClickTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (!this.config.enableTracking) {
      this.destroy();
    } else {
      // Restart flush timer with new interval
      this.startFlushTimer();
    }
  }

  /**
   * Destroy the service and clean up
   */
  public destroy(): void {
    if (this.flushTimer) {
      window.clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining clicks
    this.flushClickQueue();

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
    window.removeEventListener(
      'beforeunload',
      this.handleBeforeUnload.bind(this)
    );
  }
}

// Create and export singleton instance
export const clickTrackingService = new ClickTrackingService();

// Export utility functions for analytics data aggregation
export class ClickAnalytics {
  /**
   * Calculate click-through rate
   */
  static calculateCTR(clicks: number, impressions: number): number {
    if (impressions === 0) return 0;
    return (clicks / impressions) * 100;
  }

  /**
   * Calculate conversion rate
   */
  static calculateConversionRate(conversions: number, clicks: number): number {
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
  }

  /**
   * Group clicks by time period
   */
  static groupClicksByPeriod(
    clicks: ClickTrackingData[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    clicks.forEach((click) => {
      const date = new Date(click.timestamp);
      let key: string;

      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  /**
   * Get top performing links
   */
  static getTopLinks(
    clicks: ClickTrackingData[],
    limit: number = 10
  ): Array<{ linkId: string; clicks: number }> {
    const linkCounts: Record<string, number> = {};

    clicks.forEach((click) => {
      linkCounts[click.linkId] = (linkCounts[click.linkId] || 0) + 1;
    });

    return Object.entries(linkCounts)
      .map(([linkId, clicks]) => ({ linkId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  }

  /**
   * Calculate session metrics
   */
  static calculateSessionMetrics(sessions: SessionData[]): {
    averageSessionDuration: number;
    averageClicksPerSession: number;
    totalSessions: number;
    bounceRate: number;
  } {
    if (sessions.length === 0) {
      return {
        averageSessionDuration: 0,
        averageClicksPerSession: 0,
        totalSessions: 0,
        bounceRate: 0,
      };
    }

    const totalDuration = sessions.reduce((sum, session) => {
      return (
        sum + (session.lastActivity.getTime() - session.startTime.getTime())
      );
    }, 0);

    const totalClicks = sessions.reduce(
      (sum, session) => sum + session.clickCount,
      0
    );
    const bouncedSessions = sessions.filter(
      (session) => session.clickCount === 0
    ).length;

    return {
      averageSessionDuration: totalDuration / sessions.length,
      averageClicksPerSession: totalClicks / sessions.length,
      totalSessions: sessions.length,
      bounceRate: (bouncedSessions / sessions.length) * 100,
    };
  }
}
