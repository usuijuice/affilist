import React from 'react';
import { MiniChart, TrendIndicator } from './AnalyticsChart';

interface MetricData {
  value: number;
  label: string;
  change?: number;
  trend?: Array<{ date: string; value: number }>;
  format?: 'number' | 'currency' | 'percentage';
  icon?: string;
}

interface MetricsSummaryProps {
  metrics: MetricData[];
  loading?: boolean;
  className?: string;
}

export function MetricsSummary({ metrics, loading = false, className = '' }: MetricsSummaryProps) {
  const formatValue = (value: number, format: MetricData['format'] = 'number'): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(2)}%`;
      
      case 'number':
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString();
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 4 }, (_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}

interface MetricCardProps {
  metric: MetricData;
}

function MetricCard({ metric }: MetricCardProps) {
  const { value, label, change, trend, format, icon } = metric;

  const formatValue = (value: number, format: MetricData['format'] = 'number'): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(2)}%`;
      
      case 'number':
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 mr-3">
              <div className="text-2xl">{icon}</div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        </div>
        
        {trend && trend.length > 0 && (
          <div className="w-16 h-8">
            <MiniChart data={trend} height={32} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value, format)}
          </p>
          
          {change !== undefined && (
            <div className="mt-1">
              <TrendIndicator 
                data={trend || [{ date: '', value: 0 }, { date: '', value: change }]} 
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="w-16 h-8 bg-gray-200 rounded"></div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

// Specialized metric cards for common use cases
interface ClickMetricsProps {
  totalClicks: number;
  uniqueClicks: number;
  clickTrend?: Array<{ date: string; value: number }>;
  loading?: boolean;
}

export function ClickMetrics({ totalClicks, uniqueClicks, clickTrend, loading }: ClickMetricsProps) {
  const ctr = totalClicks > 0 ? (uniqueClicks / totalClicks) * 100 : 0;

  const metrics: MetricData[] = [
    {
      value: totalClicks,
      label: 'Total Clicks',
      trend: clickTrend,
      icon: '👆',
      format: 'number',
    },
    {
      value: uniqueClicks,
      label: 'Unique Clicks',
      trend: clickTrend?.map(d => ({ ...d, value: d.value * 0.7 })), // Approximate unique ratio
      icon: '👥',
      format: 'number',
    },
    {
      value: ctr,
      label: 'Click-Through Rate',
      icon: '📊',
      format: 'percentage',
    },
  ];

  return <MetricsSummary metrics={metrics} loading={loading} />;
}

interface RevenueMetricsProps {
  totalRevenue: number;
  estimatedRevenue: number;
  revenueTrend?: Array<{ date: string; value: number }>;
  loading?: boolean;
}

export function RevenueMetrics({ totalRevenue, estimatedRevenue, revenueTrend, loading }: RevenueMetricsProps) {
  const metrics: MetricData[] = [
    {
      value: totalRevenue,
      label: 'Total Revenue',
      trend: revenueTrend,
      icon: '💰',
      format: 'currency',
    },
    {
      value: estimatedRevenue,
      label: 'Estimated Revenue',
      trend: revenueTrend?.map(d => ({ ...d, value: d.value * 1.2 })), // Estimated is typically higher
      icon: '📈',
      format: 'currency',
    },
  ];

  return <MetricsSummary metrics={metrics} loading={loading} />;
}

interface PerformanceMetricsProps {
  conversionRate: number;
  averageOrderValue: number;
  topLinkClicks: number;
  loading?: boolean;
}

export function PerformanceMetrics({ 
  conversionRate, 
  averageOrderValue, 
  topLinkClicks, 
  loading 
}: PerformanceMetricsProps) {
  const metrics: MetricData[] = [
    {
      value: conversionRate,
      label: 'Conversion Rate',
      icon: '🎯',
      format: 'percentage',
    },
    {
      value: averageOrderValue,
      label: 'Avg. Order Value',
      icon: '🛒',
      format: 'currency',
    },
    {
      value: topLinkClicks,
      label: 'Top Link Clicks',
      icon: '🔗',
      format: 'number',
    },
  ];

  return <MetricsSummary metrics={metrics} loading={loading} />;
}

// Comparison metrics component
interface ComparisonMetricsProps {
  currentPeriod: {
    clicks: number;
    revenue: number;
    conversions: number;
  };
  previousPeriod: {
    clicks: number;
    revenue: number;
    conversions: number;
  };
  loading?: boolean;
}

export function ComparisonMetrics({ currentPeriod, previousPeriod, loading }: ComparisonMetricsProps) {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const metrics: MetricData[] = [
    {
      value: currentPeriod.clicks,
      label: 'Clicks',
      change: calculateChange(currentPeriod.clicks, previousPeriod.clicks),
      icon: '👆',
      format: 'number',
    },
    {
      value: currentPeriod.revenue,
      label: 'Revenue',
      change: calculateChange(currentPeriod.revenue, previousPeriod.revenue),
      icon: '💰',
      format: 'currency',
    },
    {
      value: currentPeriod.conversions,
      label: 'Conversions',
      change: calculateChange(currentPeriod.conversions, previousPeriod.conversions),
      icon: '🎯',
      format: 'number',
    },
  ];

  return <MetricsSummary metrics={metrics} loading={loading} />;
}