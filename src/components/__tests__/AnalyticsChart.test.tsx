import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsChart, TrendIndicator, MiniChart } from '../AnalyticsChart';

describe('AnalyticsChart', () => {
  const mockData = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 120 },
    { date: '2024-01-04', value: 180 },
    { date: '2024-01-05', value: 200 },
  ];

  it('should render line chart with data', () => {
    render(<AnalyticsChart data={mockData} type="line" />);
    
    // Should render SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Should show data points count
    expect(screen.getByText('5 data points')).toBeInTheDocument();
  });

  it('should render area chart', () => {
    render(<AnalyticsChart data={mockData} type="area" />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Area chart should have filled path
    const path = document.querySelector('path');
    expect(path).toHaveAttribute('fill');
  });

  it('should render bar chart', () => {
    render(<AnalyticsChart data={mockData} type="bar" />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Bar chart should have rectangles
    const rects = document.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('should show empty state when no data', () => {
    render(<AnalyticsChart data={[]} type="line" />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should apply custom height and color', () => {
    render(<AnalyticsChart data={mockData} type="line" height={300} color="#FF0000" />);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('height', '300');
    
    const path = document.querySelector('path');
    expect(path).toHaveAttribute('stroke', '#FF0000');
  });

  it('should show grid lines when enabled', () => {
    render(<AnalyticsChart data={mockData} type="line" showGrid={true} />);
    
    const gridLines = document.querySelectorAll('line[stroke-dasharray="2,2"]');
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('should hide grid lines when disabled', () => {
    render(<AnalyticsChart data={mockData} type="line" showGrid={false} />);
    
    const gridLines = document.querySelectorAll('line[stroke-dasharray="2,2"]');
    expect(gridLines.length).toBe(0);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AnalyticsChart data={mockData} type="line" className="custom-chart" />
    );
    
    expect(container.firstChild).toHaveClass('custom-chart');
  });
});

describe('TrendIndicator', () => {
  it('should show upward trend', () => {
    const upwardData = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 150 },
    ];
    
    render(<TrendIndicator data={upwardData} />);
    
    expect(screen.getByText('↗️')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('should show downward trend', () => {
    const downwardData = [
      { date: '2024-01-01', value: 150 },
      { date: '2024-01-02', value: 100 },
    ];
    
    render(<TrendIndicator data={downwardData} />);
    
    expect(screen.getByText('↘️')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('should show neutral trend for no change', () => {
    const neutralData = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 100 },
    ];
    
    render(<TrendIndicator data={neutralData} />);
    
    expect(screen.getByText('➡️')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<TrendIndicator data={[]} />);
    
    expect(screen.getByText('➡️')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should handle single data point', () => {
    const singleData = [{ date: '2024-01-01', value: 100 }];
    
    render(<TrendIndicator data={singleData} />);
    
    expect(screen.getByText('➡️')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});

describe('MiniChart', () => {
  const mockData = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 120 },
  ];

  it('should render mini chart with data', () => {
    render(<MiniChart data={mockData} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('height', '40');
    
    const path = document.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('should show placeholder when no data', () => {
    const { container } = render(<MiniChart data={[]} />);
    
    const placeholder = container.querySelector('div[style*="height"]');
    expect(placeholder).toBeInTheDocument();
  });

  it('should apply custom color and height', () => {
    render(<MiniChart data={mockData} color="#00FF00" height={60} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('height', '60');
    
    const path = document.querySelector('path');
    expect(path).toHaveAttribute('stroke', '#00FF00');
  });

  it('should handle single data point', () => {
    const singleData = [{ date: '2024-01-01', value: 100 }];
    
    render(<MiniChart data={singleData} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});