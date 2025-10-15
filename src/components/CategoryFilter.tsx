import { useState } from 'react';
import type { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryIds: string[]) => void;
  className?: string;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  className = '',
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);

    if (isSelected) {
      onCategoryChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      onCategoryChange([]);
    } else {
      onCategoryChange(categories.map((cat) => cat.id));
    }
  };

  const handleClearAll = () => {
    onCategoryChange([]);
  };

  const allSelected = selectedCategories.length === categories.length;
  const someSelected = selectedCategories.length > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">カテゴリ</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            aria-label={isExpanded ? 'カテゴリを閉じる' : 'カテゴリを開く'}
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

        {/* Selected count and controls */}
        {someSelected && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {categories.length}件中 {selectedCategories.length}件を選択
            </span>
            <button
              onClick={handleClearAll}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              すべて解除
            </button>
          </div>
        )}
      </div>

      {/* Category list */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 space-y-3">
          {/* Select All option */}
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border-2 rounded transition-colors ${
                  allSelected
                    ? 'bg-blue-600 border-blue-600'
                    : someSelected
                      ? 'bg-blue-100 border-blue-600'
                      : 'border-gray-300 group-hover:border-gray-400'
                }`}
              >
                {allSelected && (
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
                {someSelected && !allSelected && (
                  <div className="w-2 h-2 bg-blue-600 rounded-sm absolute top-1 left-1" />
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              すべてのカテゴリ
            </span>
          </label>

          {/* Individual categories */}
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);

            return (
              <label
                key={category.id}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border-2 rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}
                  >
                    {isSelected && (
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

                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {/* Category color indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />

                  {/* Category name */}
                  <span className="text-sm text-gray-900 truncate">
                    {category.name}
                  </span>

                  {/* Link count */}
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({category.linkCount})
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
