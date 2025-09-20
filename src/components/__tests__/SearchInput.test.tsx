import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        placeholder="Search affiliate links..."
      />
    );

    expect(
      screen.getByPlaceholderText('Search affiliate links...')
    ).toBeInTheDocument();
  });

  it('renders with initial value', () => {
    render(<SearchInput onSearch={mockOnSearch} initialValue="test query" />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onSearch with debounced value', async () => {
    render(<SearchInput onSearch={mockOnSearch} debounceDelay={100} />);

    // Clear the initial call
    mockOnSearch.mockClear();

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Should call after debounce delay
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 200 }
    );
  });

  it('debounces multiple rapid changes', async () => {
    render(<SearchInput onSearch={mockOnSearch} debounceDelay={100} />);

    // Clear the initial call
    mockOnSearch.mockClear();

    const input = screen.getByRole('textbox');

    // Rapid changes
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });

    // Should only call once with final value
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 200 }
    );
  });

  it('shows clear button when there is text', () => {
    render(<SearchInput onSearch={mockOnSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when input is empty', () => {
    render(<SearchInput onSearch={mockOnSearch} />);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    render(<SearchInput onSearch={mockOnSearch} debounceDelay={50} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');

    // Should call onSearch with empty string after debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('');
      },
      { timeout: 100 }
    );
  });

  it('shows result count when enabled', () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        showResultCount={true}
        resultCount={5}
        initialValue="test"
      />
    );

    expect(screen.getByText('5 results found')).toBeInTheDocument();
  });

  it('shows singular result text for one result', () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        showResultCount={true}
        resultCount={1}
        initialValue="test"
      />
    );

    expect(screen.getByText('1 result found')).toBeInTheDocument();
  });

  it('shows no results message when count is zero', () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        showResultCount={true}
        resultCount={0}
        initialValue="test"
      />
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('does not show result count when input is empty', () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        showResultCount={true}
        resultCount={5}
      />
    );

    expect(screen.queryByText('5 results found')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SearchInput onSearch={mockOnSearch} className="custom-class" />);

    const container = screen.getByRole('textbox').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<SearchInput onSearch={mockOnSearch} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search');

    const searchIcon = screen
      .getByRole('textbox')
      .parentElement?.querySelector('svg');
    expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles edge cases with whitespace', async () => {
    render(<SearchInput onSearch={mockOnSearch} debounceDelay={50} />);

    const input = screen.getByRole('textbox');

    // Test with only whitespace
    fireEvent.change(input, { target: { value: '   ' } });

    await waitFor(
      () => {
        // Should eventually be called with whitespace after debounce
        const calls = mockOnSearch.mock.calls;
        const hasWhitespaceCall = calls.some((call) => call[0] === '   ');
        expect(hasWhitespaceCall).toBe(true);
      },
      { timeout: 150 }
    );
  });

  it('calls onSearch with initial value on mount', async () => {
    render(
      <SearchInput
        onSearch={mockOnSearch}
        initialValue="initial"
        debounceDelay={50}
      />
    );

    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('initial');
      },
      { timeout: 100 }
    );
  });
});
