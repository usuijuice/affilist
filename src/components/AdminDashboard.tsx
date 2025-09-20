import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { LinkManagementTable } from './LinkManagementTable';
import { LinkForm } from './LinkForm';
import { useAuth } from '../contexts/AuthContext';
import { affiliateLinksApi } from '../services';
import type { AffiliateLink, CreateLinkRequest } from '../types';

type ViewMode = 'dashboard' | 'links' | 'create' | 'edit';

interface AdminDashboardProps {
  initialView?: ViewMode;
}

export function AdminDashboard({
  initialView = 'dashboard',
}: AdminDashboardProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(initialView);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalClicks: 0,
    featuredLinks: 0,
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await affiliateLinksApi.getAllLinks();
      if (response.success) {
        setLinks(response.data);

        // Calculate stats
        const totalLinks = response.data.length;
        const activeLinks = response.data.filter(
          (link) => link.status === 'active'
        ).length;
        const totalClicks = response.data.reduce(
          (sum, link) => sum + link.clickCount,
          0
        );
        const featuredLinks = response.data.filter(
          (link) => link.featured
        ).length;

        setStats({
          totalLinks,
          activeLinks,
          totalClicks,
          featuredLinks,
        });
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('An error occurred while loading data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async (linkData: CreateLinkRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await affiliateLinksApi.createLink(linkData);
      if (response.success) {
        await loadDashboardData(); // Refresh data
        setCurrentView('links');
      } else {
        setError('Failed to create link');
      }
    } catch (err) {
      setError('An error occurred while creating the link');
      console.error('Link creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLink = async (linkData: CreateLinkRequest) => {
    if (!editingLink) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await affiliateLinksApi.updateLink(
        editingLink.id,
        linkData
      );
      if (response.success) {
        await loadDashboardData(); // Refresh data
        setEditingLink(null);
        setCurrentView('links');
      } else {
        setError('Failed to update link');
      }
    } catch (err) {
      setError('An error occurred while updating the link');
      console.error('Link update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await affiliateLinksApi.deleteLink(linkId);
      if (response.success) {
        await loadDashboardData(); // Refresh data
      } else {
        setError('Failed to delete link');
      }
    } catch (err) {
      setError('An error occurred while deleting the link');
      console.error('Link deletion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLink = (link: AffiliateLink) => {
    setEditingLink(link);
    setCurrentView('edit');
  };

  const handleCancelForm = () => {
    setEditingLink(null);
    setCurrentView('links');
  };

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="flex space-x-8">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            currentView === 'dashboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Dashboard
          </div>
        </button>

        <button
          onClick={() => setCurrentView('links')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            currentView === 'links'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Manage Links
          </div>
        </button>
      </div>
    </nav>
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Links
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalLinks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Links
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeLinks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clicks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalClicks.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Featured Links
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.featuredLinks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setCurrentView('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Link
            </button>

            <button
              onClick={() => setCurrentView('links')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage Links
            </button>
          </div>
        </div>
      </div>

      {/* Recent Links */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Links
          </h3>
          {links.length > 0 ? (
            <div className="space-y-3">
              {links
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                )
                .slice(0, 5)
                .map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {link.title}
                        </p>
                        {link.featured && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            link.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : link.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {link.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {link.category.name} • {link.clickCount} clicks
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditLink(link)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No links created yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadDashboardData}
                  className="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return renderDashboardOverview();

      case 'links':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Links
              </h2>
              <button
                onClick={() => setCurrentView('create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Link
              </button>
            </div>
            <LinkManagementTable
              links={links}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
              isLoading={isLoading}
            />
          </div>
        );

      case 'create':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Link
              </h2>
              <p className="text-sm text-gray-600">
                Add a new affiliate link to your collection
              </p>
            </div>
            <LinkForm
              onSubmit={handleCreateLink}
              onCancel={handleCancelForm}
              isLoading={isLoading}
            />
          </div>
        );

      case 'edit':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Link</h2>
              <p className="text-sm text-gray-600">
                Update the affiliate link information
              </p>
            </div>
            <LinkForm
              link={editingLink || undefined}
              onSubmit={handleUpdateLink}
              onCancel={handleCancelForm}
              isLoading={isLoading}
            />
          </div>
        );

      default:
        return renderDashboardOverview();
    }
  };

  return (
    <AdminLayout
      title={
        currentView === 'dashboard'
          ? 'Admin Dashboard'
          : currentView === 'links'
            ? 'Manage Links'
            : currentView === 'create'
              ? 'Create New Link'
              : currentView === 'edit'
                ? 'Edit Link'
                : 'Admin Dashboard'
      }
      subtitle={
        currentView === 'dashboard'
          ? `Welcome back, ${user?.name}`
          : currentView === 'links'
            ? 'Manage your affiliate links'
            : currentView === 'create'
              ? 'Add a new affiliate link'
              : currentView === 'edit'
                ? 'Update affiliate link information'
                : undefined
      }
    >
      {renderNavigation()}
      {renderContent()}
    </AdminLayout>
  );
}
