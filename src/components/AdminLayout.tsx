import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './ProtectedRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AdminLayout({
  children,
  title = '管理ダッシュボード',
  subtitle,
}: AdminLayoutProps) {
  const { logout } = useAuth();
  const { user } = usePermissions();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                アフィリスト管理
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        {(title || subtitle) && (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="px-4 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
