import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../Footer';
import { createMockCategories } from '../../test/factories';
import { describe, expect, it } from 'vitest';

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
    expect(screen.getByText('アフィリスト')).toBeInTheDocument();
    expect(
      screen.getByText(/カテゴリ別に厳選されたアフィリエイト案件/)
    ).toBeInTheDocument();
  });

  it('renders categories section with category links', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('カテゴリ')).toBeInTheDocument();

    // Should show first 6 categories
    mockCategories.slice(0, 6).forEach((category) => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });

    // Check that link counts are displayed (using getAllByText for duplicates)
    const linkCounts = mockCategories.slice(0, 6).map((cat) => cat.linkCount);
    const uniqueCounts = [...new Set(linkCounts)];
    uniqueCounts.forEach((count) => {
      const elements = screen.getAllByText(`(${count})`);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows "View all categories" link when more than 6 categories', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('すべてのカテゴリを見る →')).toBeInTheDocument();
  });

  it('does not show "View all categories" link when 6 or fewer categories', () => {
    const fewCategories = createMockCategories(4);

    render(
      <RouterWrapper>
        <Footer categories={fewCategories} />
      </RouterWrapper>
    );

    expect(
      screen.queryByText('すべてのカテゴリを見る →')
    ).not.toBeInTheDocument();
  });

  it('renders quick links section', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText('クイックリンク')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '注目リンク' })
    ).toBeInTheDocument();

    // Use getAllByRole to handle multiple "All Categories" links
    const allCategoriesLinks = screen.getAllByRole('link', {
      name: 'すべてのカテゴリ',
    });
    expect(allCategoriesLinks.length).toBeGreaterThan(0);

    expect(
      screen.getByRole('link', { name: '運営者情報' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'お問い合わせ' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'プライバシーポリシー' })
    ).toBeInTheDocument();
  });

  it('renders social media links with proper aria labels', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByLabelText('X（旧Twitter）')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} アフィリスト. 無断転載を禁じます。`)
    ).toBeInTheDocument();
  });

  it('renders bottom section with copyright and tagline', () => {
    render(
      <RouterWrapper>
        <Footer categories={mockCategories} />
      </RouterWrapper>
    );

    expect(screen.getByText(/無断転載を禁じます/)).toBeInTheDocument();
    expect(
      screen.getByText('アフィリエイトを愛するすべての方のために作られました')
    ).toBeInTheDocument();
  });

  it('handles empty categories array gracefully', () => {
    render(
      <RouterWrapper>
        <Footer categories={[]} />
      </RouterWrapper>
    );

    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(
      screen.queryByText('すべてのカテゴリを見る →')
    ).not.toBeInTheDocument();
  });
});
