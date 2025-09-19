import React, { useState } from 'react';
import { useAnalytics, useClickAnalytics, useRevenueAnalytics, useLinkPerformance } from '../hooks';
import { AnalyticsParams } from '../services';

interface AnalyticsDashboardProps {
  className?: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Default to last 30 days
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const analyticsParams: AnalyticsParams = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  };

  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics({
    params: analyticsParams,
  });

  const { clickAnalytics, loading: clickLoading, refetch: refetchClicks } = useClickAnalytics(analyticsParams);
  const { revenueAnalytics, loading: revenueLoading, refetch: refetchRevenue } = useRevenueAnalytics(analyticsParams);
  const { linkPerformance, loading: linksLoading, refetch: refetchLinks } = useLinkPerformance(analyticsParams);

  const isLoading = analyticsLoading || clickLoading || revenueLoading || linksLoading;

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handleRefresh = () => {
    refetchAnalytics();
    refetchClicks();
    refetchRevenue();
    refetchLinks();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track performance and insights for your affiliate links
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </div>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {analyticsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="mt-1 text-sm text-red-700">{analyticsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Clicks"
          value={formatNumber(analytics?.totalClicks || 0)}
          change={clickAnalytics ? calculateGrowth(clickAnalytics.clicksByDate) : null}
          icon="👆"
          loading={isLoading}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          change={revenueAnalytics ? calculateGrowth(revenueAnalytics.revenueByDate) : null}
          icon="💰"
          loading={isLoading}
        />
        <MetricCard
          title="Top Links"
          value={analytics?.topLinks?.length?.toString() || '0'}
          icon="🔗"
          loading={isLoading}
        />
        <MetricCard
          title="Unique Clicks"
          value={formatNumber(clickAnalytics?.uniqueClicks || 0)}
          change={clickAnalytics ? calculateUniqueGrowth(clickAnalytics.clicksByDate) : null}
          icon="👥"
          loading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time Chart */}
        <ChartCard
          title="Clicks Over Time"
          loading={clickLoading}
          data={clickAnalytics?.clicksByDate}
          type="line"
        />
        
        {/* Revenue Over Time Chart */}
        <ChartCard
          title="Revenue Over Time"
          loading={revenueLoading}
          data={revenueAnalytics?.revenueByDate}
          type="area"
        />
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <PerformanceTable
          title="Top Performing Links"
          data={linkPerformance}
          loading={linksLoading}
          type="links"
        />
        
        {/* Top Categories */}
        <PerformanceTable
          title="Top Categories"
          data={clickAnalytics?.clicksByCategory}
          loading={clickLoading}
          type="categories"
        />
      </div>
    </div>
  );
}

// Helper component for metric cards
interface MetricCardProps {
  title: string;
  value: string;
  change?: number | null;
  icon: string;
  loading: boolean;
}

function MetricCard({ title, value, change, icon, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="text-2xl">{icon}</div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change !== null && change !== undefined && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

// Helper component for charts
interface ChartCardProps {
  title: string;
  loading: boolean;
  data?: Array<{ date: string; clicks?: number; revenue?: number }>;
  type: 'line' | 'area';
}

function ChartCard({ title, loading, data, type }: ChartCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">Chart visualization would go here</p>
          <p className="text-sm text-gray-400 mt-1">
            {data?.length || 0} data points
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component for performance tables
interface PerformanceTableProps {
  title: string;
  data?: any[];
  loading: boolean;
  type: 'links' | 'categories';
}

function PerformanceTable({ title, data, loading, type }: PerformanceTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data && data.length > 0 ? (
          data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {type === 'links' ? item.title || `Link ${item.linkId}` : item.categoryName}
                </p>
                {type === 'links' && (
                  <p className="text-xs text-gray-500">
                    CTR: {item.ctr?.toFixed(2)}% | Conv: {item.conversionRate?.toFixed(2)}%
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {item.clicks} clicks
                </p>
                {type === 'links' && item.revenue && (
                  <p className="text-xs text-green-600">
                    {formatCurrency(item.revenue)}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function calculateGrowth(data?: Array<{ date: string; clicks?: number; revenue?: number }>): number | null {
  if (!data || data.length < 2) return null;
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const midpoint = Math.floor(sortedData.length / 2);
  
  const firstHalf = sortedData.slice(0, midpoint);
  const secondHalf = sortedData.slice(midpoint);
  
  const firstHalfSum = firstHalf.reduce((sum, item) => sum + (item.clicks || item.revenue || 0), 0);
  const secondHalfSum = secondHalf.reduce((sum, item) => sum + (item.clicks || item.revenue || 0), 0);
  
  if (firstHalfSum === 0) return secondHalfSum > 0 ? 100 : 0;
  
  return ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
}

function calculateUniqueGrowth(data?: Array<{ date: string; uniqueClicks?: number }>): number | null {
  if (!data || data.length < 2) return null;
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const midpoint = Math.floor(sortedData.length / 2);
  
  const firstHalf = sortedData.slice(0, midpoint);
  const secondHalf = sortedData.slice(midpoint);
  
  const firstHalfSum = firstHalf.reduce((sum, item) => sum + (item.uniqueClicks || 0), 0);
  const secondHalfSum = secondHalf.reduce((sum, item) => sum + (item.uniqueClicks || 0), 0);
  
  if (firstHalfSum === 0) return secondHalfSum > 0 ? 100 : 0;
  
  return ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}