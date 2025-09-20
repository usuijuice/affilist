import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { SearchInput } from '../SearchInput';
import { CategoryFilter } from '../CategoryFilter';
import { AffiliateLinkGrid } from '../AffiliateLinkGrid';
import { SortControls } from '../SortControls';
import {
  createMockAffiliateLink,
  createMockCategory,
} from '../../test/factories';

// Mock the API services
vi.mock('../../services/affiliateLinksApi', () => ({
  getAffiliateLinks: vi.fn(),
  searchAffiliateLinks: vi.fn(),
}));

vi.mock('../../services/categoriesApi', () => ({
  getCategories: vi.fn(),
}));

const mockCategories = [
  createMockCategory({
    id: '1',
    name: 'Web Development',
    slug: 'web-development',
  }),
  createMockCategory({ id: '2', name: 'Design Tools', slug: 'design-tools' }),
  createMockCategory({ id: '3', name: 'Marketing', slug: 'marketing' }),
];

const mockLinks = [
  createMockAffiliateLink({
    id: '1',
    title: 'Vercel Pro',
    category: mockCategories[0],
    tags: ['hosting', 'deployment'],
    commissionRate: 25,
    clickCount: 150,
  }),
  createMockAffiliateLink({
    id: '2',
    title: 'Figma Pro',
    category: mockCategories[1],
    tags: ['design', 'ui'],
    commissionRate: 30,
    clickCount: 89,
  }),
  createMockAffiliateLink({
    id: '3',
    title: 'ConvertKit',
    category: mockCategories[2],
    tags: ['email', 'marketing'],
    commissionRate: 40,
    clickCount: 234,
  }),
];

const TestComponent = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <div>
          <SearchInput />
          <div className="flex">
            <CategoryFilter />
            <div className="flex-1">
              <SortControls />
              <AffiliateLinkGrid />
            </div>
          </div>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Search and Filter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter links by search query and category', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    // Wait for initial load
    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: /search/i })
      ).toBeInTheDocument();
    });

    // Search for "Vercel"
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchInput, 'Vercel');

    // Wait for debounced search
    await waitFor(() => {
      expect(searchInput).toHaveValue('Vercel');
    });

    // Select Web Development category
    const webDevCategory = screen.getByRole('button', {
      name: /web development/i,
    });
    await user.click(webDevCategory);

    // Verify both filters are applied
    await waitFor(() => {
      // Should show only Vercel Pro (matches search and category)
      expect(screen.getByText('Vercel Pro')).toBeInTheDocument();
      expect(screen.queryByText('Figma Pro')).not.toBeInTheDocument();
      expect(screen.queryByText('ConvertKit')).not.toBeInTheDocument();
    });
  });

  it('should sort filtered results correctly', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /sort/i })
      ).toBeInTheDocument();
    });

    // Sort by commission rate (highest first)
    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    await user.selectOptions(sortSelect, 'commission');

    await waitFor(() => {
      const linkTitles = screen
        .getAllByTestId('link-title')
        .map((el) => el.textContent);
      // Should be sorted by commission rate: ConvertKit (40%), Figma (30%), Vercel (25%)
      expect(linkTitles).toEqual(['ConvertKit', 'Figma Pro', 'Vercel Pro']);
    });
  });

  it('should clear filters and show all results', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    // Apply search filter
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchInput, 'Vercel');

    // Apply category filter
    const webDevCategory = screen.getByRole('button', {
      name: /web development/i,
    });
    await user.click(webDevCategory);

    // Clear search
    await user.clear(searchInput);

    // Clear category filter
    const clearFiltersButton = screen.getByRole('button', {
      name: /clear filters/i,
    });
    await user.click(clearFiltersButton);

    // Should show all links again
    await waitFor(() => {
      expect(screen.getByText('Vercel Pro')).toBeInTheDocument();
      expect(screen.getByText('Figma Pro')).toBeInTheDocument();
      expect(screen.getByText('ConvertKit')).toBeInTheDocument();
    });
  });

  it('should handle empty search results gracefully', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    // Search for something that doesn't exist
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchInput, 'NonexistentService');

    await waitFor(() => {
      expect(screen.getByText(/no affiliate links found/i)).toBeInTheDocument();
      expect(screen.queryByText('Vercel Pro')).not.toBeInTheDocument();
    });
  });

  it('should maintain filter state when switching between sort options', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    // Apply category filter
    const designCategory = screen.getByRole('button', {
      name: /design tools/i,
    });
    await user.click(designCategory);

    // Change sort order
    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    await user.selectOptions(sortSelect, 'alphabetical');

    // Should still show only design tools category
    await waitFor(() => {
      expect(screen.getByText('Figma Pro')).toBeInTheDocument();
      expect(screen.queryByText('Vercel Pro')).not.toBeInTheDocument();
      expect(screen.queryByText('ConvertKit')).not.toBeInTheDocument();
    });
  });

  it('should update URL parameters when filters change', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    // Apply search
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchInput, 'Vercel');

    // Check URL parameters
    await waitFor(() => {
      expect(window.location.search).toContain('search=Vercel');
    });

    // Apply category filter
    const webDevCategory = screen.getByRole('button', {
      name: /web development/i,
    });
    await user.click(webDevCategory);

    await waitFor(() => {
      expect(window.location.search).toContain('category=web-development');
    });
  });

  it('should restore filters from URL parameters on page load', async () => {
    // Set initial URL with filters
    window.history.pushState(
      {},
      '',
      '/?search=Figma&category=design-tools&sort=commission'
    );

    render(<TestComponent />);

    // Should restore search value
    await waitFor(() => {
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toHaveValue('Figma');
    });

    // Should restore category selection
    await waitFor(() => {
      const designCategory = screen.getByRole('button', {
        name: /design tools/i,
      });
      expect(designCategory).toHaveAttribute('aria-pressed', 'true');
    });

    // Should restore sort selection
    await waitFor(() => {
      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      expect(sortSelect).toHaveValue('commission');
    });
  });
});
