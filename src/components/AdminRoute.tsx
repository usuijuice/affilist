import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from './AdminLayout';
import type { AdminUser } from '../types';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminUser['role'];
  title?: string;
  subtitle?: string;
  fallbackPath?: string;
  showLayout?: boolean;
}

export function AdminRoute({ 
  children, 
  requiredRole,
  title,
  subtitle,
  fallbackPath = '/admin/login',
  showLayout = true
}: AdminRouteProps) {
  return (
    <ProtectedRoute requiredRole={requiredRole} fallbackPath={fallbackPath}>
      {showLayout ? (
        <AdminLayout title={title} subtitle={subtitle}>
          {children}
        </AdminLayout>
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}

// Convenience components for specific roles
export function AdminOnlyRoute(props: Omit<AdminRouteProps, 'requiredRole'>) {
  return <AdminRoute {...props} requiredRole="admin" />;
}

export function EditorRoute(props: Omit<AdminRouteProps, 'requiredRole'>) {
  return <AdminRoute {...props} requiredRole="editor" />;
}

// Higher-order component for creating admin pages
export function withAdminRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: AdminUser['role'];
    title?: string;
    subtitle?: string;
    fallbackPath?: string;
    showLayout?: boolean;
  } = {}
) {
  return function AdminWrappedComponent(props: P) {
    return (
      <AdminRoute {...options}>
        <Component {...props} />
      </AdminRoute>
    );
  };
}