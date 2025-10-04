import type { SortOption } from '../types';

interface SortControlsProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  className?: string;
}

const sortOptions: Array<{
  value: SortOption;
  label: string;
  description: string;
}> = [
  {
    value: 'popularity',
    label: 'Most Popular',
    description: 'Sort by click count',
  },
  {
    value: 'newest',
    label: 'Newest',
    description: 'Recently added',
  },
  {
    value: 'commission',
    label: 'Highest Commission',
    description: 'Best earning potential',
  },
  {
    value: 'alphabetical',
    label: 'A-Z',
    description: 'Alphabetical order',
  },
];

export function SortControls({
  sortBy,
  onSortChange,
  className = '',
}: SortControlsProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Sort By</h3>

        <div className="space-y-2">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="relative">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={() => onSortChange(option.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border-2 rounded-full transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  {sortBy === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-xs text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
