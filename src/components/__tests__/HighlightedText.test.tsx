import { render, screen } from '@testing-library/react';
import { HighlightedText } from '../HighlightedText';

describe('HighlightedText', () => {
  it('renders text without highlighting when no search query', () => {
    render(<HighlightedText text="Hello world" searchQuery="" />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('highlights matching text case-insensitively', () => {
    render(<HighlightedText text="Hello World" searchQuery="world" />);
    
    const container = screen.getByText(/Hello/).parentElement;
    expect(container?.innerHTML).toContain('<mark class="bg-yellow-200 px-1 rounded">World</mark>');
  });

  it('highlights multiple matches', () => {
    render(<HighlightedText text="Hello world, wonderful world" searchQuery="world" />);
    
    const container = screen.getByText(/Hello/).parentElement;
    const matches = container?.innerHTML.match(/<mark[^>]*>world<\/mark>/gi);
    expect(matches).toHaveLength(2);
  });

  it('handles special regex characters in search query', () => {
    render(<HighlightedText text="Price: $10.99 (special)" searchQuery="$10.99" />);
    
    const container = screen.getByText(/Price/).parentElement;
    expect(container?.innerHTML).toContain('<mark class="bg-yellow-200 px-1 rounded">$10.99</mark>');
  });

  it('handles parentheses in search query', () => {
    render(<HighlightedText text="Price: $10.99 (special)" searchQuery="(special)" />);
    
    const container = screen.getByText(/Price/).parentElement;
    expect(container?.innerHTML).toContain('<mark class="bg-yellow-200 px-1 rounded">(special)</mark>');
  });

  it('applies custom className', () => {
    render(<HighlightedText text="Hello world" searchQuery="world" className="custom-class" />);
    
    const element = screen.getByText(/Hello/);
    expect(element).toHaveClass('custom-class');
  });

  it('handles empty text', () => {
    const { container } = render(<HighlightedText text="" searchQuery="test" />);
    
    const element = container.querySelector('span');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('');
  });

  it('handles whitespace-only search query', () => {
    render(<HighlightedText text="Hello world" searchQuery="   " />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('preserves original text when no match found', () => {
    render(<HighlightedText text="Hello world" searchQuery="xyz" />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('handles partial word matches', () => {
    render(<HighlightedText text="JavaScript is awesome" searchQuery="Script" />);
    
    const container = screen.getByText(/Java/).parentElement;
    expect(container?.innerHTML).toContain('<mark class="bg-yellow-200 px-1 rounded">Script</mark>');
  });
});