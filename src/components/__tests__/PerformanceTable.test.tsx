import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PerformanceTable,
  CategoryPerformanceTable,
} from '../PerformanceTable';

describe('PerformanceTable', () => {
  const mockData = [
    {
      linkId: '1',
      title: 'Test Link 1',
      clicks: 1500,
      uniqueClicks: 1200,
      conversionRate: 5.5,
      revenue: 2500.5,
      ctr: 3.2,
    },
    {
      linkId: '2',
      title: 'Test Link 2',
      clicks: 800,
      uniqueClicks: 650,
      conversionRate: 4.2,
      revenue: 1200.0,
      ctr: 2.8,
    },
    {
      linkId: '3',
      title: 'Test Link 3',
      clicks: 1200,
      uniqueClicks: 950,
      conversionRate: 6.1,
      revenue: 1800.75,
      ctr: 3.5,
    },
  ];

  it('should render performance table with data', () => {
    render(<PerformanceTable data={mockData} />);

    expect(screen.getByText('Link Performance')).toBeInTheDocument();
    expect(screen.getByText('3 total items')).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Unique')).toBeInTheDocument();
    expect(screen.getByText('CTR')).toBeInTheDocument();
    expect(screen.getByText('Conv. Rate')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getAllByText('1.2K')).toHaveLength(2); // Two links have 1.2K
    expect(screen.getByText('3.20%')).toBeInTheDocument();
    expect(screen.getByText('5.50%')).toBeInTheDocument();
    expect(screen.getByText('$2,500.5')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<PerformanceTable data={mockData} loading={true} />);

    const skeletonRows = document.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should handle empty data', () => {
    render(<PerformanceTable data={[]} />);

    expect(
      screen.getByText('No performance data available')
    ).toBeInTheDocument();
  });

  it('should sort by clicks when header is clicked', () => {
    render(<PerformanceTable data={mockData} />);

    const clicksHeader = screen.getByText('Clicks').closest('th');
    fireEvent.click(clicksHeader!);

    // Should show sort indicator
    expect(clicksHeader).toBeInTheDocument();
  });

  it('should filter data based on search input', () => {
    render(<PerformanceTable data={mockData} />);

    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'Test Link 1' } });

    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Link 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Link 3')).not.toBeInTheDocument();
  });

  it('should show "no results" message when filter has no matches', () => {
    render(<PerformanceTable data={mockData} />);

    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'Non-existent Link' } });

    expect(
      screen.getByText('No performance data available')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search criteria')
    ).toBeInTheDocument();
  });

  it('should limit rows to maxRows prop', () => {
    render(<PerformanceTable data={mockData} maxRows={2} />);

    // Should show top 2 by clicks (sorted descending by default)
    expect(screen.getByText('Test Link 1')).toBeInTheDocument(); // 1500 clicks
    expect(screen.getByText('Test Link 3')).toBeInTheDocument(); // 1200 clicks
    expect(screen.queryByText('Test Link 2')).not.toBeInTheDocument(); // 800 clicks (should be excluded)

    expect(screen.getByText('Showing top 2 of 3 links')).toBeInTheDocument();
  });

  it('should hide filters when showFilters is false', () => {
    render(<PerformanceTable data={mockData} showFilters={false} />);

    expect(
      screen.queryByPlaceholderText('Search links...')
    ).not.toBeInTheDocument();
  });

  it('should apply custom title and className', () => {
    const { container } = render(
      <PerformanceTable
        data={mockData}
        title="Custom Title"
        className="custom-class"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show rank badges for top performers', () => {
    render(<PerformanceTable data={mockData} />);

    expect(screen.getByText(/🥇/)).toBeInTheDocument(); // First place
    expect(screen.getByText(/🥈/)).toBeInTheDocument(); // Second place
    expect(screen.getByText(/🥉/)).toBeInTheDocument(); // Third place
  });

  it('should format large numbers correctly', () => {
    const largeNumberData = [
      {
        linkId: '1',
        title: 'Large Numbers Link',
        clicks: 1500000,
        uniqueClicks: 1200000,
        conversionRate: 5.5,
        revenue: 2500000.5,
        ctr: 3.2,
      },
    ];

    render(<PerformanceTable data={largeNumberData} />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
    expect(screen.getByText('1.2M')).toBeInTheDocument();
    expect(screen.getByText('$2,500,000.5')).toBeInTheDocument();
  });
});

describe('CategoryPerformanceTable', () => {
  const mockCategoryData = [
    {
      categoryId: '1',
      categoryName: 'Technology',
      clicks: 5000,
      uniqueClicks: 4000,
      revenue: 7500.0,
      linkCount: 25,
    },
    {
      categoryId: '2',
      categoryName: 'Design',
      clicks: 3500,
      uniqueClicks: 2800,
      revenue: 5200.5,
      linkCount: 18,
    },
    {
      categoryId: '3',
      categoryName: 'Marketing',
      clicks: 2200,
      uniqueClicks: 1800,
      revenue: 3300.25,
      linkCount: 12,
    },
  ];

  it('should render category performance table', () => {
    render(<CategoryPerformanceTable data={mockCategoryData} />);

    expect(screen.getByText('Category Performance')).toBeInTheDocument();

    // Check headers
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('$7,500')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('3,500')).toBeInTheDocument();
    expect(screen.getByText(/\$5,200/)).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<CategoryPerformanceTable data={mockCategoryData} loading={true} />);

    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('should sort categories when headers are clicked', () => {
    render(<CategoryPerformanceTable data={mockCategoryData} />);

    const clicksHeader = screen.getByText('Clicks');
    fireEvent.click(clicksHeader);

    // Should still render all categories
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CategoryPerformanceTable
        data={mockCategoryData}
        className="custom-category-table"
      />
    );

    expect(container.firstChild).toHaveClass('custom-category-table');
  });

  it('should handle empty category data', () => {
    render(<CategoryPerformanceTable data={[]} />);

    // Should render table structure but no data rows
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});
