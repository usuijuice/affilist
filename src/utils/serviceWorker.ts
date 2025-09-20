// Service Worker registration and management

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config;
  }

  async register(
    swUrl: string = '/sw.js'
  ): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      console.log('Registering service worker:', swUrl);

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('New content is available; please refresh.');
              this.config.onUpdate?.(registration);
            } else {
              // Content is cached for offline use
              console.log('Content is cached for offline use.');
              this.config.onSuccess?.(registration);
            }
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener(
        'message',
        this.handleMessage.bind(this)
      );

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.warn('No service worker registration to update');
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration?.active) {
      console.warn('No active service worker to cache URLs');
      return;
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }

  private handleMessage(event: MessageEvent): void {
    console.log('Message from service worker:', event.data);

    // Handle different message types
    switch (event.data?.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', event.data.urls);
        break;
      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        break;
      default:
        console.log('Unknown message type:', event.data?.type);
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  async isControlled(): Promise<boolean> {
    return !!navigator.serviceWorker.controller;
  }

  async getNetworkStatus(): Promise<boolean> {
    return navigator.onLine;
  }
}

// Global service worker manager instance
export const serviceWorkerManager = new ServiceWorkerManager({
  onUpdate: (registration) => {
    // Show update available notification
    if (window.confirm('New version available! Click OK to update.')) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('App is ready for offline use');
  },
  onError: (error) => {
    console.error('Service worker error:', error);
  },
});

// React hook for service worker
export function useServiceWorker() {
  const [isSupported] = React.useState(() =>
    serviceWorkerManager.isSupported()
  );
  const [registration, setRegistration] =
    React.useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);

  React.useEffect(() => {
    // Register service worker
    if (isSupported && import.meta.env.PROD) {
      serviceWorkerManager.register().then(setRegistration);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported]);

  const updateServiceWorker = React.useCallback(async () => {
    await serviceWorkerManager.update();
  }, []);

  const skipWaiting = React.useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
  }, []);

  const cacheUrls = React.useCallback(async (urls: string[]) => {
    await serviceWorkerManager.cacheUrls(urls);
  }, []);

  return {
    isSupported,
    registration,
    isOnline,
    updateServiceWorker,
    skipWaiting,
    cacheUrls,
  };
}

// Utility functions
export async function precacheResources(urls: string[]): Promise<void> {
  if (!serviceWorkerManager.isSupported()) {
    console.warn('Service Worker not supported, skipping precache');
    return;
  }

  await serviceWorkerManager.cacheUrls(urls);
}

export async function clearCache(): Promise<void> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window) || !('storage' in navigator)) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

// Export types
export type { ServiceWorkerConfig };

// Import React for the hook
import React from 'react';
