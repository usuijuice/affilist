import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SortControls } from '../SortControls';
import type { SortOption } from '../../types';

describe('SortControls', () => {
  const mockOnSortChange = vi.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  it('renders all sort options', () => {
    render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText('Sort by click count')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Recently added')).toBeInTheDocument();
    expect(screen.getByText('Highest Commission')).toBeInTheDocument();
    expect(screen.getByText('Best earning potential')).toBeInTheDocument();
    expect(screen.getByText('A-Z')).toBeInTheDocument();
    expect(screen.getByText('Alphabetical order')).toBeInTheDocument();
  });

  it('shows selected sort option as checked', () => {
    render(
      <SortControls
        sortBy="newest"
        onSortChange={mockOnSortChange}
      />
    );

    const radioButtons = screen.getAllByRole('radio', { hidden: true });
    expect(radioButtons[0]).not.toBeChecked(); // Most Popular
    expect(radioButtons[1]).toBeChecked(); // Newest
    expect(radioButtons[2]).not.toBeChecked(); // Highest Commission
    expect(radioButtons[3]).not.toBeChecked(); // A-Z
  });

  it('calls onSortChange when option is selected', () => {
    render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
      />
    );

    fireEvent.click(screen.getByText('Highest Commission'));

    expect(mockOnSortChange).toHaveBeenCalledWith('commission');
  });

  it('handles all sort options correctly', () => {
    const { rerender } = render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
      />
    );

    const optionLabels = {
      popularity: 'Most Popular',
      newest: 'Newest',
      commission: 'Highest Commission',
      alphabetical: 'A-Z'
    };

    // Test newest
    fireEvent.click(screen.getByText(optionLabels.newest));
    expect(mockOnSortChange).toHaveBeenNthCalledWith(1, 'newest');

    // Test commission
    fireEvent.click(screen.getByText(optionLabels.commission));
    expect(mockOnSortChange).toHaveBeenNthCalledWith(2, 'commission');

    // Test alphabetical
    fireEvent.click(screen.getByText(optionLabels.alphabetical));
    expect(mockOnSortChange).toHaveBeenNthCalledWith(3, 'alphabetical');

    // Test popularity by re-rendering with different selected value first
    rerender(
      <SortControls
        sortBy="newest"
        onSortChange={mockOnSortChange}
      />
    );

    fireEvent.click(screen.getByText(optionLabels.popularity));
    expect(mockOnSortChange).toHaveBeenNthCalledWith(4, 'popularity');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper radio button grouping', () => {
    render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
      />
    );

    const radioButtons = screen.getAllByRole('radio', { hidden: true });
    
    // All radio buttons should have the same name attribute for proper grouping
    radioButtons.forEach((radio) => {
      expect(radio).toHaveAttribute('name', 'sort');
    });
  });

  it('has proper accessibility structure', () => {
    render(
      <SortControls
        sortBy="popularity"
        onSortChange={mockOnSortChange}
      />
    );

    // Check that each option has proper label structure
    const popularityLabel = screen.getByText('Most Popular').closest('label');
    expect(popularityLabel).toBeInTheDocument();
    
    const newestLabel = screen.getByText('Newest').closest('label');
    expect(newestLabel).toBeInTheDocument();
  });

  it('shows correct visual state for selected option', () => {
    render(
      <SortControls
        sortBy="commission"
        onSortChange={mockOnSortChange}
      />
    );

    // Find the commission option's radio button container
    const commissionLabel = screen.getByText('Highest Commission').closest('label');
    const radioContainer = commissionLabel?.querySelector('div > div');
    
    expect(radioContainer).toHaveClass('bg-blue-600', 'border-blue-600');
  });
});