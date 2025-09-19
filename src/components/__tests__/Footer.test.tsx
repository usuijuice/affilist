import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../Footer';
import { createMockCategories } from '../../test/factories';

// Wrapper component to provide router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Footer', () => {
  const mockCategories = createMockCategories(8);

  it('renders the brand section with logo and description', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('Affiliate Links')).toBeInTheDocument();
    expect(screen.getByText(/Discover the best affiliate opportunities/)).toBeInTheDocument();
  });

  it('renders categories section with category links', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Should show first 6 categories
    mockCategories.slice(0, 6).forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
      expect(screen.getByText(`(${category.linkCount})`)).toBeInTheDocument();
    });
  });

  it('shows "View all categories" link when more than 6 categories', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('View all categories →')).toBeInTheDocument();
  });

  it('does not show "View all categories" link when 6 or fewer categories', () => {
    const fewCategories = createMockCategories(4);
    
    render(
      <RouterWrapper>
        <Footer categories={fewCategories} />
      </RouterWrapper>
    );

    expect(screen.queryByText('View all categories →')).not.toBeInTheDocument();
  });

  it('renders quick links section', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /featured links/i })).toBeInTheDocument();
    
    // Use getAllByRole to handle multiple "All Categories" links
    const allCategoriesLinks = screen.getAllByRole('link', { name: /all categories/i });
    expect(allCategoriesLinks.length).toBeGreaterThan(0);
    
    expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('renders social media links with proper aria labels', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Affiliate Links. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders bottom section with copyright and tagline', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    expect(screen.getByText('Built with ❤️ for affiliate marketers')).toBeInTheDocument();
  });

  it('handles empty categories array gracefully', () => {
    render(
      <RouterWrapper>
        <Footer categories={[]} />
      </RouterWrapper>
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.queryByText('View all categories →')).not.toBeInTheDocument();
  });
});