import React, { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  type: 'line' | 'area' | 'bar';
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function AnalyticsChart({
  data,
  type = 'line',
  height = 200,
  color = '#3B82F6',
  showGrid = true,
  showTooltip = true,
  className = '',
}: AnalyticsChartProps) {
  const { chartData, maxValue, minValue, xScale, yScale } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], maxValue: 0, minValue: 0, xScale: 0, yScale: 0 };
    }

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const values = sortedData.map(d => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    
    // Add some padding to the max value for better visualization
    const paddedMax = maxVal + (maxVal - minVal) * 0.1;
    const paddedMin = Math.max(0, minVal - (maxVal - minVal) * 0.1);

    const width = 400; // Fixed width for calculations
    const chartHeight = height - 40; // Leave space for labels

    return {
      chartData: sortedData,
      maxValue: paddedMax,
      minValue: paddedMin,
      xScale: width / (sortedData.length - 1 || 1),
      yScale: chartHeight / (paddedMax - paddedMin || 1),
    };
  }, [data, height]);

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const generatePath = (): string => {
    if (chartData.length === 0) return '';

    const points = chartData.map((point, index) => {
      const x = index * xScale;
      const y = height - 40 - (point.value - minValue) * yScale;
      return `${x},${y}`;
    });

    if (type === 'area') {
      const pathData = points.map((point, index) => 
        index === 0 ? `M ${point}` : `L ${point}`
      ).join(' ');
      
      // Close the area path
      const lastX = (chartData.length - 1) * xScale;
      return `${pathData} L ${lastX},${height - 40} L 0,${height - 40} Z`;
    } else {
      return points.map((point, index) => 
        index === 0 ? `M ${point}` : `L ${point}`
      ).join(' ');
    }
  };

  const generateBars = () => {
    if (type !== 'bar') return null;

    const barWidth = Math.max(8, xScale * 0.6);
    
    return chartData.map((point, index) => {
      const x = index * xScale - barWidth / 2;
      const barHeight = (point.value - minValue) * yScale;
      const y = height - 40 - barHeight;

      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={color}
          opacity={0.8}
          rx={2}
        />
      );
    });
  };

  const generateGridLines = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const numLines = 5;
    
    // Horizontal grid lines
    for (let i = 0; i <= numLines; i++) {
      const y = (height - 40) * (i / numLines);
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={400}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      );
    }

    return gridLines;
  };

  const generateYAxisLabels = () => {
    const labels = [];
    const numLabels = 5;
    
    for (let i = 0; i <= numLabels; i++) {
      const value = maxValue - (maxValue - minValue) * (i / numLabels);
      const y = (height - 40) * (i / numLabels) + 5;
      
      labels.push(
        <text
          key={`y-${i}`}
          x={-10}
          y={y}
          textAnchor="end"
          fontSize="12"
          fill="#6B7280"
        >
          {formatValue(value)}
        </text>
      );
    }

    return labels;
  };

  const generateXAxisLabels = () => {
    const labels = [];
    const maxLabels = Math.min(6, chartData.length);
    const step = Math.ceil(chartData.length / maxLabels);
    
    for (let i = 0; i < chartData.length; i += step) {
      const x = i * xScale;
      const point = chartData[i];
      
      labels.push(
        <text
          key={`x-${i}`}
          x={x}
          y={height - 20}
          textAnchor="middle"
          fontSize="12"
          fill="#6B7280"
        >
          {formatDate(point.date)}
        </text>
      );
    }

    return labels;
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 400 ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {generateGridLines()}
        
        {/* Y-axis labels */}
        {generateYAxisLabels()}
        
        {/* Chart content */}
        {type === 'bar' ? (
          generateBars()
        ) : (
          <path
            d={generatePath()}
            fill={type === 'area' ? color : 'none'}
            fillOpacity={type === 'area' ? 0.2 : 0}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points for line/area charts */}
        {(type === 'line' || type === 'area') && chartData.map((point, index) => {
          const x = index * xScale;
          const y = height - 40 - (point.value - minValue) * yScale;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={3}
              fill={color}
              className="hover:r-4 transition-all cursor-pointer"
            />
          );
        })}
        
        {/* X-axis labels */}
        {generateXAxisLabels()}
      </svg>
      
      {/* Tooltip placeholder */}
      {showTooltip && (
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          {chartData.length} data points
        </div>
      )}
    </div>
  );
}

// Simple trend indicator component
interface TrendIndicatorProps {
  data: DataPoint[];
  className?: string;
}

export function TrendIndicator({ data, className = '' }: TrendIndicatorProps) {
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;
    
    if (firstValue === 0) {
      return { direction: lastValue > 0 ? 'up' : 'neutral', percentage: 0 };
    }
    
    const percentage = ((lastValue - firstValue) / firstValue) * 100;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    
    return { direction, percentage: Math.abs(percentage) };
  }, [data]);

  const getIcon = () => {
    switch (trend.direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '➡️';
    }
  };

  const getColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${getColor()} ${className}`}>
      <span>{getIcon()}</span>
      <span className="text-sm font-medium">
        {trend.percentage.toFixed(1)}%
      </span>
    </div>
  );
}

// Mini chart component for cards
interface MiniChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = '#3B82F6', height = 40 }: MiniChartProps) {
  if (!data || data.length === 0) {
    return <div className="w-full bg-gray-100 rounded" style={{ height }} />;
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = height - ((point.value - minValue) / range) * height;
    return `${x},${y}`;
  });

  const pathData = points.map((point, index) => 
    index === 0 ? `M ${point}` : `L ${point}`
  ).join(' ');

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}