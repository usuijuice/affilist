import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AdvancedFilters } from '../AdvancedFilters';
import type { FilterState } from '../../types';

describe('AdvancedFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const defaultFilters: FilterState = {
    categories: [],
    commissionRateMin: undefined,
    commissionRateMax: undefined,
    featuredOnly: false,
    searchQuery: '',
    sortBy: 'popularity'
  };

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders advanced filters section', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Commission Rate (%)')).toBeInTheDocument();
    expect(screen.getByText('Featured Links Only')).toBeInTheDocument();
  });

  it('shows commission rate inputs with labels', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByLabelText('Minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('100')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const filtersWithValues: FilterState = {
      ...defaultFilters,
      commissionRateMin: 5,
      commissionRateMax: 25,
      featuredOnly: true
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { hidden: true })).toBeChecked();
  });

  it('calls onFiltersChange when minimum commission changes', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum');
    fireEvent.change(minInput, { target: { value: '10' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ commissionRateMin: 10 });
  });

  it('calls onFiltersChange when maximum commission changes', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const maxInput = screen.getByLabelText('Maximum');
    fireEvent.change(maxInput, { target: { value: '50' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ commissionRateMax: 50 });
  });

  it('handles empty commission rate inputs', () => {
    const filtersWithValues: FilterState = {
      ...defaultFilters,
      commissionRateMin: 5,
      commissionRateMax: 25
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum');
    fireEvent.change(minInput, { target: { value: '' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ commissionRateMin: undefined });
  });

  it('handles invalid commission rate inputs', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum');
    fireEvent.change(minInput, { target: { value: 'invalid' } });

    // Should not call onFiltersChange for invalid input
    expect(mockOnFiltersChange).not.toHaveBeenCalled();
  });

  it('toggles featured only filter', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('Featured Links Only'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ featuredOnly: true });
  });

  it('shows active filters summary when filters are applied', () => {
    const filtersWithValues: FilterState = {
      ...defaultFilters,
      commissionRateMin: 5,
      commissionRateMax: 25,
      featuredOnly: true
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByText('Min: 5%')).toBeInTheDocument();
    expect(screen.getByText('Max: 25%')).toBeInTheDocument();
    expect(screen.getByText('Featured Only')).toBeInTheDocument();
  });

  it('shows commission range summary when both min and max are set', () => {
    const filtersWithRange: FilterState = {
      ...defaultFilters,
      commissionRateMin: 10,
      commissionRateMax: 30
    };

    render(
      <AdvancedFilters
        filters={filtersWithRange}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Showing 10% - 30% commission')).toBeInTheDocument();
  });

  it('shows clear button when filters are active', () => {
    const filtersWithValues: FilterState = {
      ...defaultFilters,
      commissionRateMin: 5,
      featuredOnly: true
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('clears all advanced filters when clear button is clicked', () => {
    const filtersWithValues: FilterState = {
      ...defaultFilters,
      commissionRateMin: 5,
      commissionRateMax: 25,
      featuredOnly: true
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('Clear'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false
    });
  });

  it('does not show clear button when no filters are active', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles decimal commission rates', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum');
    fireEvent.change(minInput, { target: { value: '2.5' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ commissionRateMin: 2.5 });
  });

  it('prevents negative commission rates', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum');
    fireEvent.change(minInput, { target: { value: '-5' } });

    // Should not call onFiltersChange for negative values
    expect(mockOnFiltersChange).not.toHaveBeenCalled();
  });
});