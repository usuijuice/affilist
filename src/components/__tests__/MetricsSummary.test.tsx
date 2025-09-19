import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  MetricsSummary, 
  ClickMetrics, 
  RevenueMetrics, 
  PerformanceMetrics, 
  ComparisonMetrics 
} from '../MetricsSummary';

describe('MetricsSummary', () => {
  const mockMetrics = [
    {
      value: 1500,
      label: 'Total Clicks',
      change: 15.5,
      icon: '👆',
      format: 'number' as const,
    },
    {
      value: 2500.50,
      label: 'Total Revenue',
      change: -5.2,
      icon: '💰',
      format: 'currency' as const,
    },
    {
      value: 3.75,
      label: 'Conversion Rate',
      icon: '🎯',
      format: 'percentage' as const,
    },
  ];

  it('should render metrics cards', () => {
    render(<MetricsSummary metrics={mockMetrics} />);

    expect(screen.getByText('Total Clicks')).toBeInTheDocument();
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('👆')).toBeInTheDocument();

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText(/\$2,50[01]/)).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();

    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('3.75%')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<MetricsSummary metrics={mockMetrics} loading={true} />);

    // Should show skeleton cards
    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('should format numbers correctly', () => {
    const largeNumberMetrics = [
      { value: 1500000, label: 'Large Number', format: 'number' as const },
      { value: 2500000.50, label: 'Large Currency', format: 'currency' as const },
      { value: 99.99, label: 'Percentage', format: 'percentage' as const },
    ];

    render(<MetricsSummary metrics={largeNumberMetrics} />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
    expect(screen.getByText('$2,500,000.5')).toBeInTheDocument();
    expect(screen.getByText('99.99%')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MetricsSummary metrics={mockMetrics} className="custom-metrics" />
    );

    expect(container.firstChild).toHaveClass('custom-metrics');
  });

  it('should handle empty metrics array', () => {
    render(<MetricsSummary metrics={[]} />);

    // Should render empty grid
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(0);
  });
});

describe('ClickMetrics', () => {
  const mockClickTrend = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 120 },
  ];

  it('should render click metrics', () => {
    render(
      <ClickMetrics 
        totalClicks={1500} 
        uniqueClicks={1200} 
        clickTrend={mockClickTrend} 
      />
    );

    expect(screen.getByText('Total Clicks')).toBeInTheDocument();
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('👆')).toBeInTheDocument();

    expect(screen.getByText('Unique Clicks')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();

    expect(screen.getByText('Click-Through Rate')).toBeInTheDocument();
    expect(screen.getByText('80.00%')).toBeInTheDocument(); // 1200/1500 * 100
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('should handle zero clicks', () => {
    render(<ClickMetrics totalClicks={0} uniqueClicks={0} />);

    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ClickMetrics totalClicks={1500} uniqueClicks={1200} loading={true} />);

    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });
});

describe('RevenueMetrics', () => {
  const mockRevenueTrend = [
    { date: '2024-01-01', value: 1000 },
    { date: '2024-01-02', value: 1500 },
    { date: '2024-01-03', value: 1200 },
  ];

  it('should render revenue metrics', () => {
    render(
      <RevenueMetrics 
        totalRevenue={2500.50} 
        estimatedRevenue={3000.00} 
        revenueTrend={mockRevenueTrend} 
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$2,500.5')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();

    expect(screen.getByText('Estimated Revenue')).toBeInTheDocument();
    expect(screen.getByText('$3,000')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<RevenueMetrics totalRevenue={2500} estimatedRevenue={3000} loading={true} />);

    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });
});

describe('PerformanceMetrics', () => {
  it('should render performance metrics', () => {
    render(
      <PerformanceMetrics 
        conversionRate={5.25} 
        averageOrderValue={125.50} 
        topLinkClicks={850} 
      />
    );

    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('5.25%')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();

    expect(screen.getByText('Avg. Order Value')).toBeInTheDocument();
    expect(screen.getByText('$125.5')).toBeInTheDocument();
    expect(screen.getByText('🛒')).toBeInTheDocument();

    expect(screen.getByText('Top Link Clicks')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('🔗')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <PerformanceMetrics 
        conversionRate={5.25} 
        averageOrderValue={125.50} 
        topLinkClicks={850} 
        loading={true} 
      />
    );

    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });
});

describe('ComparisonMetrics', () => {
  const mockCurrentPeriod = {
    clicks: 1500,
    revenue: 2500,
    conversions: 75,
  };

  const mockPreviousPeriod = {
    clicks: 1200,
    revenue: 2000,
    conversions: 60,
  };

  it('should render comparison metrics with positive changes', () => {
    render(
      <ComparisonMetrics 
        currentPeriod={mockCurrentPeriod} 
        previousPeriod={mockPreviousPeriod} 
      />
    );

    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('👆')).toBeInTheDocument();

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();

    expect(screen.getByText('Conversions')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should handle zero previous period values', () => {
    const zeroPreviousPeriod = {
      clicks: 0,
      revenue: 0,
      conversions: 0,
    };

    render(
      <ComparisonMetrics 
        currentPeriod={mockCurrentPeriod} 
        previousPeriod={zeroPreviousPeriod} 
      />
    );

    // Should still render without errors
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Conversions')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <ComparisonMetrics 
        currentPeriod={mockCurrentPeriod} 
        previousPeriod={mockPreviousPeriod} 
        loading={true} 
      />
    );

    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });
});