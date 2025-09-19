import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Header } from '../Header';

// Wrapper component to provide router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Header', () => {
  const mockOnSearch = vi.fn();
  const defaultProps = {
    onSearch: mockOnSearch,
    searchQuery: '',
  };

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders the brand logo and title', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('Affiliate Links')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /featured/i })).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    const searchInputs = screen.getAllByPlaceholderText('Search affiliate links...');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
  });

  it('calls onSearch when search input changes', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    const searchInput = screen.getAllByPlaceholderText('Search affiliate links...')[0];
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('displays the current search query in input', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} searchQuery="existing query" />
      </RouterWrapper>
    );

    const searchInputs = screen.getAllByDisplayValue('existing query');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Initially should only have desktop navigation (1 Home link)
    expect(screen.getAllByText('Home')).toHaveLength(1);
    
    // Click to open menu
    fireEvent.click(menuButton);
    
    // Mobile menu links should now be visible (desktop + mobile = 2 Home links)
    const mobileHomeLinks = screen.getAllByText('Home');
    expect(mobileHomeLinks.length).toBe(2); // Desktop + mobile versions
  });

  it('closes mobile menu when a navigation link is clicked', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Open mobile menu
    fireEvent.click(menuButton);
    
    // Click on a mobile navigation link
    const mobileLinks = screen.getAllByText('Home');
    const mobileHomeLink = mobileLinks[mobileLinks.length - 1]; // Get the mobile version
    fireEvent.click(mobileHomeLink);
    
    // Menu should close (button text should change back)
    expect(screen.getByRole('button', { name: /open main menu/i })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <Header {...defaultProps} />
      </RouterWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});