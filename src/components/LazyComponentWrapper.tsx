import React, { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function LazyComponentWrapper({
  fallback,
  className = '',
  children,
}: LazyComponentWrapperProps) {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size="md" />
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <LazyComponentWrapper fallback={fallback}>
        <Component {...props} />
      </LazyComponentWrapper>
    );
  };
}

// Hook for dynamic imports with error handling
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
) {
  const [component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const module = await importFn();

        if (!cancelled) {
          setComponent(module.default);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to load component')
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { component, loading, error };
}
