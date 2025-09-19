import { useState } from 'react';
import type { FilterState } from '../types';

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
}

export function AdvancedFilters({ filters, onFiltersChange, className = '' }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localMinCommission, setLocalMinCommission] = useState(
    filters.commissionRateMin?.toString() || ''
  );
  const [localMaxCommission, setLocalMaxCommission] = useState(
    filters.commissionRateMax?.toString() || ''
  );

  const handleMinCommissionChange = (value: string) => {
    setLocalMinCommission(value);
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue === undefined || (!isNaN(numValue) && numValue >= 0)) {
      onFiltersChange({ commissionRateMin: numValue });
    }
  };

  const handleMaxCommissionChange = (value: string) => {
    setLocalMaxCommission(value);
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue === undefined || (!isNaN(numValue) && numValue >= 0)) {
      onFiltersChange({ commissionRateMax: numValue });
    }
  };

  const handleFeaturedToggle = () => {
    onFiltersChange({ featuredOnly: !filters.featuredOnly });
  };

  const handleClearFilters = () => {
    setLocalMinCommission('');
    setLocalMaxCommission('');
    onFiltersChange({
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false
    });
  };

  const hasActiveFilters = 
    filters.commissionRateMin !== undefined ||
    filters.commissionRateMax !== undefined ||
    filters.featuredOnly;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter content */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 space-y-6">
          {/* Commission Rate Range */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Commission Rate (%)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="min-commission" className="block text-xs text-gray-500 mb-1">
                  Minimum
                </label>
                <input
                  id="min-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localMinCommission}
                  onChange={(e) => handleMinCommissionChange(e.target.value)}
                  placeholder="0"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="max-commission" className="block text-xs text-gray-500 mb-1">
                  Maximum
                </label>
                <input
                  id="max-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localMaxCommission}
                  onChange={(e) => handleMaxCommissionChange(e.target.value)}
                  placeholder="100"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {filters.commissionRateMin !== undefined && filters.commissionRateMax !== undefined && (
              <div className="mt-2 text-xs text-gray-600">
                Showing {filters.commissionRateMin}% - {filters.commissionRateMax}% commission
              </div>
            )}
          </div>

          {/* Featured Only Toggle */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.featuredOnly}
                  onChange={handleFeaturedToggle}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border-2 rounded transition-colors ${
                    filters.featuredOnly
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  {filters.featuredOnly && (
                    <svg
                      className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Featured Links Only
                </div>
                <div className="text-xs text-gray-500">
                  Show only highlighted affiliate links
                </div>
              </div>
            </label>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-2">
                {filters.commissionRateMin !== undefined && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Min: {filters.commissionRateMin}%
                  </span>
                )}
                {filters.commissionRateMax !== undefined && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Max: {filters.commissionRateMax}%
                  </span>
                )}
                {filters.featuredOnly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Featured Only
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}