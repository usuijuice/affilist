import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useAnalytics: vi.fn(),
  useClickAnalytics: vi.fn(),
  useRevenueAnalytics: vi.fn(),
  useLinkPerformance: vi.fn(),
}));

import {
  useAnalytics,
  useClickAnalytics,
  useRevenueAnalytics,
  useLinkPerformance,
} from '../../hooks';

describe('AnalyticsDashboard', () => {
  const mockAnalyticsData = {
    totalClicks: 1500,
    totalRevenue: 2500.5,
    topLinks: [
      { link: { id: '1', title: 'Test Link 1' }, clicks: 100, revenue: 150 },
      { link: { id: '2', title: 'Test Link 2' }, clicks: 80, revenue: 120 },
    ],
    clicksByDate: [
      { date: '2024-01-01', clicks: 50 },
      { date: '2024-01-02', clicks: 75 },
    ],
  };

  const mockClickAnalytics = {
    totalClicks: 1500,
    uniqueClicks: 1200,
    clicksByDate: [
      { date: '2024-01-01', clicks: 50, uniqueClicks: 40 },
      { date: '2024-01-02', clicks: 75, uniqueClicks: 60 },
    ],
    clicksByCategory: [
      { categoryId: '1', categoryName: 'Technology', clicks: 800 },
      { categoryId: '2', categoryName: 'Design', clicks: 700 },
    ],
    topReferrers: [
      { referrer: 'google.com', clicks: 500 },
      { referrer: 'twitter.com', clicks: 300 },
    ],
  };

  const mockRevenueAnalytics = {
    totalRevenue: 2500.5,
    estimatedRevenue: 3000.0,
    revenueByDate: [
      { date: '2024-01-01', revenue: 100 },
      { date: '2024-01-02', revenue: 150 },
    ],
    revenueByCategory: [
      { categoryId: '1', categoryName: 'Technology', revenue: 1500 },
      { categoryId: '2', categoryName: 'Design', revenue: 1000 },
    ],
  };

  const mockLinkPerformance = [
    {
      linkId: '1',
      title: 'Test Link 1',
      clicks: 100,
      uniqueClicks: 80,
      conversionRate: 5.5,
      revenue: 150,
      ctr: 2.5,
    },
    {
      linkId: '2',
      title: 'Test Link 2',
      clicks: 80,
      uniqueClicks: 65,
      conversionRate: 4.2,
      revenue: 120,
      ctr: 2.1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useAnalytics as any).mockReturnValue({
      analytics: mockAnalyticsData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useClickAnalytics as any).mockReturnValue({
      clickAnalytics: mockClickAnalytics,
      loading: false,
      refetch: vi.fn(),
    });

    (useRevenueAnalytics as any).mockReturnValue({
      revenueAnalytics: mockRevenueAnalytics,
      loading: false,
      refetch: vi.fn(),
    });

    (useLinkPerformance as any).mockReturnValue({
      linkPerformance: mockLinkPerformance,
      loading: false,
      refetch: vi.fn(),
    });
  });

  it('should render dashboard with analytics data', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('分析ダッシュボード')).toBeInTheDocument();
    expect(
      screen.getByText('アフィリエイトリンクの成果とインサイトを確認できます')
    ).toBeInTheDocument();

    // Check metric cards
    expect(screen.getByText('総クリック数')).toBeInTheDocument();
    expect(screen.getByText('1.5K')).toBeInTheDocument(); // Formatted number

    expect(screen.getByText('総収益')).toBeInTheDocument();
    expect(screen.getByText('US$2,500.50')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useAnalytics as any).mockReturnValue({
      analytics: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    (useClickAnalytics as any).mockReturnValue({
      clickAnalytics: null,
      loading: true,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useAnalytics as any).mockReturnValue({
      analytics: null,
      loading: false,
      error: 'Failed to load analytics',
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(
      screen.getByText('分析データの読み込みに失敗しました')
    ).toBeInTheDocument();
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
  });

  it('should handle date range changes', () => {
    render(<AnalyticsDashboard />);

    const startDateInput = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/)[0];
    const endDateInput = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/)[1];

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    expect(startDateInput).toHaveValue('2024-01-01');
    expect(endDateInput).toHaveValue('2024-01-31');
  });

  it('should handle refresh button click', async () => {
    const mockRefetch = vi.fn();
    (useAnalytics as any).mockReturnValue({
      analytics: mockAnalyticsData,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<AnalyticsDashboard />);

    const refreshButton = screen.getByText('更新');
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should format numbers correctly', () => {
    const largeNumberData = {
      ...mockAnalyticsData,
      totalClicks: 1500000, // 1.5M
      totalRevenue: 2500000.5, // 2.5M
    };

    (useAnalytics as any).mockReturnValue({
      analytics: largeNumberData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
    expect(screen.getByText('$2,500,000.50')).toBeInTheDocument();
  });

  it('should show chart placeholders', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Clicks Over Time')).toBeInTheDocument();
    expect(screen.getByText('Revenue Over Time')).toBeInTheDocument();
    expect(
      screen.getAllByText('Chart visualization would go here')
    ).toHaveLength(2);
  });

  it('should show performance tables', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Top Performing Links')).toBeInTheDocument();
    expect(screen.getByText('Top Categories')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    (useAnalytics as any).mockReturnValue({
      analytics: {
        totalClicks: 0,
        totalRevenue: 0,
        topLinks: [],
        clicksByDate: [],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useClickAnalytics as any).mockReturnValue({
      clickAnalytics: {
        totalClicks: 0,
        uniqueClicks: 0,
        clicksByDate: [],
        clicksByCategory: [],
        topReferrers: [],
      },
      loading: false,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getAllByText('0')).toHaveLength(3); // Multiple zero values
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Total revenue
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AnalyticsDashboard className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
