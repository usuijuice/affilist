import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AffiliateLinkCard } from '../AffiliateLinkCard';
import {
  createMockAffiliateLink,
  createMockCategory,
} from '../../test/factories';

// Mock useClickTracking hook
const mockTrackClick = vi.fn();
vi.mock('../../hooks/useClickTracking', () => ({
  useClickTracking: () => ({
    trackClick: mockTrackClick,
  }),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('AffiliateLinkCard', () => {
  const mockOnLinkClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTrackClick.mockResolvedValue(undefined);
  });

  const defaultLink = createMockAffiliateLink({
    title: 'Test Affiliate Link',
    description: 'This is a test description for the affiliate link',
    commissionRate: 15.5,
    clickCount: 42,
    tags: ['test', 'affiliate', 'link'],
    imageUrl: 'https://example.com/image.jpg',
    category: createMockCategory({
      name: 'Web Development',
      color: '#3B82F6',
      icon: '💻',
    }),
  });

  it('renders affiliate link information correctly', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    expect(screen.getByText('Test Affiliate Link')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test description for the affiliate link')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Web Development')).toHaveLength(2); // Badge and placeholder
    expect(screen.getByText('15.5% commission')).toBeInTheDocument();
    expect(screen.getByText('42 clicks')).toBeInTheDocument();
  });

  it('displays category badge with correct color', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const categoryBadges = screen.getAllByText('Web Development');
    const categoryBadge = categoryBadges.find(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full')
    );
    expect(categoryBadge).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });
  });

  it('renders tags correctly and limits display to 3', () => {
    const linkWithManyTags = createMockAffiliateLink({
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    });

    render(
      <AffiliateLinkCard
        link={linkWithManyTags}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('handles click events correctly', async () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    // Wait for async trackClick to complete
    await waitFor(() => {
      expect(mockTrackClick).toHaveBeenCalledWith(
        defaultLink.id,
        expect.any(Object)
      );
    });

    expect(mockOnLinkClick).toHaveBeenCalledWith(defaultLink.id);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      defaultLink.affiliateUrl,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handles keyboard navigation (Enter key)', async () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    // Wait for async trackClick to complete
    await waitFor(() => {
      expect(mockTrackClick).toHaveBeenCalledWith(
        defaultLink.id,
        expect.any(Object)
      );
    });

    expect(mockOnLinkClick).toHaveBeenCalledWith(defaultLink.id);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      defaultLink.affiliateUrl,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handles keyboard navigation (Space key)', async () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    // Wait for async trackClick to complete
    await waitFor(() => {
      expect(mockTrackClick).toHaveBeenCalledWith(
        defaultLink.id,
        expect.any(Object)
      );
    });

    expect(mockOnLinkClick).toHaveBeenCalledWith(defaultLink.id);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      defaultLink.affiliateUrl,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('ignores other keyboard keys', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Tab' });

    expect(mockOnLinkClick).not.toHaveBeenCalled();
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it('displays featured badge when featured prop is true', () => {
    render(
      <AffiliateLinkCard
        link={defaultLink}
        onLinkClick={mockOnLinkClick}
        featured={true}
      />
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('displays featured badge when link.featured is true', () => {
    const featuredLink = createMockAffiliateLink({ featured: true });
    render(
      <AffiliateLinkCard link={featuredLink} onLinkClick={mockOnLinkClick} />
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not display featured badge when not featured', () => {
    const regularLink = createMockAffiliateLink({ featured: false });
    render(
      <AffiliateLinkCard link={regularLink} onLinkClick={mockOnLinkClick} />
    );

    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const image = screen.getByAltText('Test Affiliate Link');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('renders placeholder when no imageUrl is provided', () => {
    const linkWithoutImage = createMockAffiliateLink({
      imageUrl: undefined,
      category: createMockCategory({ icon: '🔗', name: 'Test Category' }),
    });

    render(
      <AffiliateLinkCard
        link={linkWithoutImage}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.getByText('🔗')).toBeInTheDocument();
    expect(screen.getAllByText('Test Category')).toHaveLength(2); // Badge and placeholder
  });

  it('handles image load error gracefully', async () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const image = screen.getByAltText('Test Affiliate Link');

    // Simulate image load error
    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveStyle({ display: 'none' });
    });
  });

  it('formats commission rate correctly', () => {
    const linkWithCommission = createMockAffiliateLink({
      commissionRate: 25.75,
    });
    render(
      <AffiliateLinkCard
        link={linkWithCommission}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.getByText('25.75% commission')).toBeInTheDocument();
  });

  it('does not display commission when not provided', () => {
    const linkWithoutCommission = createMockAffiliateLink({
      commissionRate: undefined,
    });
    render(
      <AffiliateLinkCard
        link={linkWithoutCommission}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.queryByText(/commission/)).not.toBeInTheDocument();
  });

  it('formats click count correctly for large numbers', () => {
    const linkWithManyClicks = createMockAffiliateLink({ clickCount: 1500 });
    render(
      <AffiliateLinkCard
        link={linkWithManyClicks}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.getByText('1.5k clicks')).toBeInTheDocument();
  });

  it('formats click count correctly for small numbers', () => {
    const linkWithFewClicks = createMockAffiliateLink({ clickCount: 42 });
    render(
      <AffiliateLinkCard
        link={linkWithFewClicks}
        onLinkClick={mockOnLinkClick}
      />
    );

    expect(screen.getByText('42 clicks')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Visit Test Affiliate Link');
  });

  it('applies hover styles correctly', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass(
      'hover:shadow-lg',
      'transition-shadow',
      'duration-200'
    );
  });

  it('applies featured styling when featured', () => {
    render(
      <AffiliateLinkCard
        link={defaultLink}
        onLinkClick={mockOnLinkClick}
        featured={true}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('ring-2', 'ring-blue-500', 'ring-opacity-50');
  });

  it('does not apply featured styling when not featured', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    expect(card).not.toHaveClass('ring-2', 'ring-blue-500', 'ring-opacity-50');
  });

  it('renders external link icon', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    expect(screen.getByText('Visit')).toBeInTheDocument();

    // Check for SVG icon
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-3', 'h-3');
  });

  it('handles empty tags array', () => {
    const linkWithoutTags = createMockAffiliateLink({ tags: [] });
    render(
      <AffiliateLinkCard link={linkWithoutTags} onLinkClick={mockOnLinkClick} />
    );

    // Should not render any tag elements
    const tagElements = screen.queryAllByText(/tag/);
    expect(tagElements).toHaveLength(0);
  });

  it('prevents default behavior on click', () => {
    render(
      <AffiliateLinkCard link={defaultLink} onLinkClick={mockOnLinkClick} />
    );

    const card = screen.getByRole('button');
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    fireEvent(card, clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
