import { useState } from 'react';
import type { Category, FilterState, SortOption } from '../types';
import { CategoryFilter } from './CategoryFilter';
import { SortControls } from './SortControls';
import { AdvancedFilters } from './AdvancedFilters';

interface FilterPanelProps {
  categories: Category[];
  filters: FilterState;
  onCategoryChange: (categoryIds: string[]) => void;
  onSortChange: (sortBy: SortOption) => void;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function FilterPanel({
  categories,
  filters,
  onCategoryChange,
  onSortChange,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  className = '',
}: FilterPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile filter button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          フィルター
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              適用中
            </span>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  フィルター
                </h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onClearFilters();
                    setIsMobileOpen(false);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  フィルターをすべて解除
                </button>
              )}
            </div>
            <div className="p-4 space-y-6">
              <CategoryFilter
                categories={categories}
                selectedCategories={filters.categories}
                onCategoryChange={onCategoryChange}
              />
              <SortControls
                sortBy={filters.sortBy}
                onSortChange={onSortChange}
              />
              <AdvancedFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:block space-y-6 ${className}`}>
        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">適用中のフィルター</span>
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              すべて解除
            </button>
          </div>
        )}

        <CategoryFilter
          categories={categories}
          selectedCategories={filters.categories}
          onCategoryChange={onCategoryChange}
        />

        <SortControls sortBy={filters.sortBy} onSortChange={onSortChange} />

        <AdvancedFilters filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </>
  );
}
