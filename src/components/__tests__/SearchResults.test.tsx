import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchResults } from '../SearchResults';
import { createMockAffiliateLink } from '../../test/factories';

// Mock the AffiliateLinkCard component
vi.mock('../AffiliateLinkCard', () => ({
  AffiliateLinkCard: ({ link, searchQuery }: any) => (
    <div data-testid={`link-card-${link.id}`}>
      {link.title} - {searchQuery}
    </div>
  )
}));

describe('SearchResults', () => {
  const mockOnLinkClick = vi.fn();
  const mockLinks = [
    createMockAffiliateLink({ id: '1', title: 'Link 1' }),
    createMockAffiliateLink({ id: '2', title: 'Link 2' }),
    createMockAffiliateLink({ id: '3', title: 'Link 3' })
  ];

  beforeEach(() => {
    mockOnLinkClick.mockClear();
  });

  it('renders loading state', () => {
    render(
      <SearchResults 
        links={[]} 
        searchQuery="" 
        onLinkClick={mockOnLinkClick} 
        loading={true}
      />
    );
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument(); // spinner
  });

  it('renders links when not loading', () => {
    render(
      <SearchResults 
        links={mockLinks} 
        searchQuery="test" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.getByTestId('link-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-3')).toBeInTheDocument();
  });

  it('passes search query to link cards', () => {
    render(
      <SearchResults 
        links={mockLinks} 
        searchQuery="test query" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.getByText('Link 1 - test query')).toBeInTheDocument();
    expect(screen.getByText('Link 2 - test query')).toBeInTheDocument();
    expect(screen.getByText('Link 3 - test query')).toBeInTheDocument();
  });

  it('shows empty state when no results and has search query', () => {
    render(
      <SearchResults 
        links={[]} 
        searchQuery="nonexistent" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find any affiliate links matching "nonexistent"/)).toBeInTheDocument();
  });

  it('shows helpful suggestions in empty state', () => {
    render(
      <SearchResults 
        links={[]} 
        searchQuery="test" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.getByText('Try:')).toBeInTheDocument();
    expect(screen.getByText('• Checking your spelling')).toBeInTheDocument();
    expect(screen.getByText('• Using different keywords')).toBeInTheDocument();
    expect(screen.getByText('• Searching for more general terms')).toBeInTheDocument();
    expect(screen.getByText('• Browsing categories instead')).toBeInTheDocument();
  });

  it('does not show empty state when no search query', () => {
    render(
      <SearchResults 
        links={[]} 
        searchQuery="" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('does not show empty state when search query is only whitespace', () => {
    render(
      <SearchResults 
        links={[]} 
        searchQuery="   " 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('renders grid layout for results', () => {
    render(
      <SearchResults 
        links={mockLinks} 
        searchQuery="test" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    const grid = screen.getByTestId('link-card-1').parentElement;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('handles single result correctly', () => {
    const singleLink = [createMockAffiliateLink({ id: '1', title: 'Single Link' })];
    
    render(
      <SearchResults 
        links={singleLink} 
        searchQuery="test" 
        onLinkClick={mockOnLinkClick}
      />
    );
    
    expect(screen.getByTestId('link-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('link-card-2')).not.toBeInTheDocument();
  });
});