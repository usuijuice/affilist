import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AffiliateLinkGrid } from '../AffiliateLinkGrid';
import {
  createMockAffiliateLinks,
  createMockAffiliateLink,
} from '../../test/factories';

// Mock the AffiliateLinkCard component
vi.mock('../AffiliateLinkCard', () => ({
  AffiliateLinkCard: ({ link, onLinkClick, featured }: any) => (
    <div
      data-testid={`affiliate-card-${link.id}`}
      onClick={() => onLinkClick(link.id)}
      className={featured ? 'featured' : ''}
    >
      <h3>{link.title}</h3>
      <p>{link.description}</p>
    </div>
  ),
}));

describe('AffiliateLinkGrid', () => {
  const mockOnLinkClick = vi.fn();
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('renders skeleton loading state when loading with no links', () => {
      render(
        <AffiliateLinkGrid
          links={[]}
          loading={true}
          onLinkClick={mockOnLinkClick}
        />
      );

      // Should render 8 skeleton cards
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons).toHaveLength(8);
    });

    it('renders loading more state when loading with existing links', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={true}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Should render existing links
      expect(
        screen.getByTestId(`affiliate-card-${links[0].id}`)
      ).toBeInTheDocument();

      // Should render additional skeleton cards
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows loading indicator when loading more without hasMore', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={true}
          onLinkClick={mockOnLinkClick}
          hasMore={false}
        />
      );

      expect(
        screen.getByText('追加のリンクを読み込んでいます...')
      ).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders empty state when no links and not loading', () => {
      render(
        <AffiliateLinkGrid
          links={[]}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      expect(
        screen.getByText('アフィリエイトリンクが見つかりませんでした')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          '検索条件を変更するか、他のカテゴリを試してみてください。'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      const customMessage = 'No results for your search query.';

      render(
        <AffiliateLinkGrid
          links={[]}
          loading={false}
          onLinkClick={mockOnLinkClick}
          emptyMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Link Rendering', () => {
    it('renders affiliate link cards correctly', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      links.forEach((link) => {
        expect(
          screen.getByTestId(`affiliate-card-${link.id}`)
        ).toBeInTheDocument();
        expect(screen.getByText(link.title)).toBeInTheDocument();
      });
    });

    it('handles link clicks correctly', () => {
      const links = createMockAffiliateLinks(2);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      fireEvent.click(screen.getByTestId(`affiliate-card-${links[0].id}`));
      expect(mockOnLinkClick).toHaveBeenCalledWith(links[0].id);
    });

    it('passes featured prop correctly to cards', () => {
      const featuredLink = createMockAffiliateLink({ featured: true });
      const regularLink = createMockAffiliateLink({ featured: false });

      render(
        <AffiliateLinkGrid
          links={[featuredLink, regularLink]}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      expect(
        screen.getByTestId(`affiliate-card-${featuredLink.id}`)
      ).toHaveClass('featured');
      expect(
        screen.getByTestId(`affiliate-card-${regularLink.id}`)
      ).not.toHaveClass('featured');
    });
  });

  describe('Pagination', () => {
    it('renders load more button when hasMore is true', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.getByText('さらに読み込む')).toBeInTheDocument();
    });

    it('does not render load more button when hasMore is false', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={false}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.queryByText('さらに読み込む')).not.toBeInTheDocument();
    });

    it('does not render load more button when onLoadMore is not provided', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
        />
      );

      expect(screen.queryByText('さらに読み込む')).not.toBeInTheDocument();
    });

    it('handles load more button click', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      fireEvent.click(screen.getByText('さらに読み込む'));
      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('shows loading skeletons when loading with existing links', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={true}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Should show existing links
      links.forEach((link) => {
        expect(
          screen.getByTestId(`affiliate-card-${link.id}`)
        ).toBeInTheDocument();
      });

      // Should show skeleton loading cards
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Grid', () => {
    it('applies correct grid classes', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      const gridContainer = screen.getByTestId(
        `affiliate-card-${links[0].id}`
      ).parentElement;
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        'gap-6'
      );
    });

    it('applies custom className', () => {
      const links = createMockAffiliateLinks(1);
      const customClass = 'custom-grid-class';

      const { container } = render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          className={customClass}
        />
      );

      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('has proper button attributes for load more', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      const loadMoreButton = screen.getByRole('button', {
        name: 'さらに読み込む',
      });
      expect(loadMoreButton).toBeInTheDocument();
      expect(loadMoreButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('provides proper loading state feedback', () => {
      const links = createMockAffiliateLinks(3);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Click load more to test the loading button state
      fireEvent.click(screen.getByText('さらに読み込む'));

      // Re-render with loading state
      render(
        <AffiliateLinkGrid
          links={links}
          loading={true}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Should show skeleton loading cards
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty links array gracefully', () => {
      render(
        <AffiliateLinkGrid
          links={[]}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      expect(screen.getByText('No affiliate links found')).toBeInTheDocument();
    });

    it('handles single link correctly', () => {
      const link = createMockAffiliateLink();

      render(
        <AffiliateLinkGrid
          links={[link]}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      expect(
        screen.getByTestId(`affiliate-card-${link.id}`)
      ).toBeInTheDocument();
      expect(
        screen.queryByText('No affiliate links found')
      ).not.toBeInTheDocument();
    });

    it('handles large number of links', () => {
      const links = createMockAffiliateLinks(50);

      render(
        <AffiliateLinkGrid
          links={links}
          loading={false}
          onLinkClick={mockOnLinkClick}
        />
      );

      // Should render all links
      links.forEach((link) => {
        expect(
          screen.getByTestId(`affiliate-card-${link.id}`)
        ).toBeInTheDocument();
      });
    });

    it('maintains state during loading transitions', async () => {
      const initialLinks = createMockAffiliateLinks(3);

      const { rerender } = render(
        <AffiliateLinkGrid
          links={initialLinks}
          loading={false}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Initial state
      expect(screen.getByText('さらに読み込む')).toBeInTheDocument();

      // Start loading
      rerender(
        <AffiliateLinkGrid
          links={initialLinks}
          loading={true}
          onLinkClick={mockOnLinkClick}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      // Should show loading skeletons and keep existing links
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);

      initialLinks.forEach((link) => {
        expect(
          screen.getByTestId(`affiliate-card-${link.id}`)
        ).toBeInTheDocument();
      });
    });
  });
});
