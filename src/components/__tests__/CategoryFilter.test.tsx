import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryFilter } from '../CategoryFilter';
import { createMockCategory } from '../../test/factories';

describe('CategoryFilter', () => {
  const mockOnCategoryChange = vi.fn();
  const mockCategories = [
    createMockCategory({
      id: 'cat1',
      name: 'Web Development',
      linkCount: 5,
      color: '#3B82F6',
    }),
    createMockCategory({
      id: 'cat2',
      name: 'Design',
      linkCount: 3,
      color: '#EF4444',
    }),
    createMockCategory({
      id: 'cat3',
      name: 'Marketing',
      linkCount: 8,
      color: '#10B981',
    }),
  ];

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders category list with counts', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('(8)')).toBeInTheDocument();
  });

  it('shows selected categories as checked', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat3']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
    expect(checkboxes[1]).toBeChecked(); // Web Development (index 1, after "All Categories")
    expect(checkboxes[2]).not.toBeChecked(); // Design
    expect(checkboxes[3]).toBeChecked(); // Marketing
  });

  it('calls onCategoryChange when category is toggled', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Click on Design category
    fireEvent.click(screen.getByText('Design'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith(['cat1', 'cat2']);
  });

  it('removes category when already selected category is clicked', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat2']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Click on Web Development (already selected)
    fireEvent.click(screen.getByText('Web Development'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith(['cat2']);
  });

  it('handles select all functionality', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Click "All Categories"
    fireEvent.click(screen.getByText('All Categories'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith(['cat1', 'cat2', 'cat3']);
  });

  it('handles deselect all when all categories are selected', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat2', 'cat3']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Click "All Categories" when all are selected
    fireEvent.click(screen.getByText('All Categories'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith([]);
  });

  it('shows selection count and clear button when categories are selected', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat2']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('clears all selections when clear button is clicked', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat2']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    fireEvent.click(screen.getByText('Clear all'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith([]);
  });

  it('shows indeterminate state for "All Categories" when some are selected', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1']}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // The "All Categories" checkbox should show indeterminate state
    const allCategoriesCheckbox = screen.getAllByRole('checkbox', {
      hidden: true,
    })[0];
    expect(allCategoriesCheckbox).not.toBeChecked();

    // Check for indeterminate visual indicator (the small square)
    const container = allCategoriesCheckbox.parentElement;
    expect(
      container?.querySelector('.bg-blue-600.rounded-sm')
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={mockOnCategoryChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty categories list', () => {
    render(
      <CategoryFilter
        categories={[]}
        selectedCategories={[]}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    // Should not show selection count when no categories
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Check that checkboxes have proper labels
    const webDevLabel = screen.getByText('Web Development').closest('label');
    expect(webDevLabel).toBeInTheDocument();

    // Check that color indicators are hidden from screen readers
    const colorIndicators = document.querySelectorAll('[aria-hidden="true"]');
    expect(colorIndicators.length).toBeGreaterThan(0);
  });
});
