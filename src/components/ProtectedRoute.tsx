import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AdminUser } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminUser['role'];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = '/admin/login' 
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated || !state.user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access if required role is specified
  if (requiredRole && state.user.role !== requiredRole) {
    // If user doesn't have required role, show unauthorized page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required role: <span className="font-medium">{requiredRole}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your role: <span className="font-medium">{state.user.role}</span>
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role, render children
  return <>{children}</>;
}

// Higher-order component version for class components or other use cases
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: AdminUser['role'],
  fallbackPath?: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole} fallbackPath={fallbackPath}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking permissions in components
export function usePermissions() {
  const { state } = useAuth();

  const hasRole = (role: AdminUser['role']): boolean => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles: AdminUser['role'][]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  const canAccess = (requiredRole?: AdminUser['role']): boolean => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }
    
    if (!requiredRole) {
      return true;
    }
    
    return hasRole(requiredRole);
  };

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    hasRole,
    hasAnyRole,
    canAccess,
  };
}