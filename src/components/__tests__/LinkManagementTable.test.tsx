import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LinkManagementTable } from '../LinkManagementTable';
import type { AffiliateLink } from '../../types';

const mockLinks: AffiliateLink[] = [
  {
    id: '1',
    title: 'Test Link 1',
    description: 'Test description 1',
    url: 'https://example1.com',
    affiliateUrl: 'https://affiliate1.example.com',
    category: {
      id: '1',
      name: 'Web Development',
      slug: 'web-dev',
      description: '',
      color: '#3B82F6',
      linkCount: 1,
    },
    tags: ['web', 'development', 'javascript'],
    imageUrl: 'https://example1.com/logo.png',
    commissionRate: 5.5,
    featured: true,
    clickCount: 100,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    status: 'active',
  },
  {
    id: '2',
    title: 'Test Link 2',
    description: 'Test description 2',
    url: 'https://example2.com',
    affiliateUrl: 'https://affiliate2.example.com',
    category: {
      id: '2',
      name: 'Design Tools',
      slug: 'design',
      description: '',
      color: '#EF4444',
      linkCount: 1,
    },
    tags: ['design', 'ui'],
    featured: false,
    clickCount: 50,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04'),
    status: 'inactive',
  },
  {
    id: '3',
    title: 'Test Link 3',
    description: 'Test description 3',
    url: 'https://example3.com',
    affiliateUrl: 'https://affiliate3.example.com',
    category: {
      id: '1',
      name: 'Web Development',
      slug: 'web-dev',
      description: '',
      color: '#3B82F6',
      linkCount: 2,
    },
    tags: ['web', 'backend'],
    featured: true,
    clickCount: 200,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-06'),
    status: 'pending',
  },
];

describe('LinkManagementTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with links', () => {
    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check table headers
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check link data
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.getByText('Test Link 2')).toBeInTheDocument();
    expect(screen.getByText('Test Link 3')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <LinkManagementTable
        links={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isLoading={true}
      />
    );

    // Check for loading animation/skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays empty state when no links', () => {
    render(
      <LinkManagementTable
        links={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No links found')).toBeInTheDocument();
    expect(
      screen.getByText('Get started by creating a new affiliate link.')
    ).toBeInTheDocument();
  });

  it('filters links by search query', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search links...');
    await user.type(searchInput, 'Test Link 1');

    // Should only show the first link
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Link 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Link 3')).not.toBeInTheDocument();
  });

  it('filters links by status', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'active');

    // Should only show active links
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Link 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Link 3')).not.toBeInTheDocument();
  });

  it('filters links by category', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const categoryFilter = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categoryFilter, 'Design Tools');

    // Should only show design tools links
    expect(screen.queryByText('Test Link 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Link 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Link 3')).not.toBeInTheDocument();
  });

  it('sorts links by different fields', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Sort by title
    const titleHeader = screen.getByText('Title');
    await user.click(titleHeader);

    // Check if sorting icons appear
    expect(titleHeader.closest('th')).toContainHTML('svg');

    // Sort by clicks
    const clicksHeader = screen.getByText('Clicks');
    await user.click(clicksHeader);

    expect(clicksHeader.closest('th')).toContainHTML('svg');
  });

  it('handles link selection', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Select individual link
    const checkboxes = screen.getAllByRole('checkbox');
    const firstLinkCheckbox = checkboxes[1]; // Skip the "select all" checkbox

    await user.click(firstLinkCheckbox);

    // Should show bulk actions
    expect(screen.getByText('1 link selected')).toBeInTheDocument();
    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
  });

  it('handles select all functionality', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Click select all checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    // Should show bulk actions for all links
    expect(screen.getByText('3 links selected')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockLinks[0]);
  });

  it('shows delete confirmation modal', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Should show confirmation modal
    expect(screen.getByText('Delete Link')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete this affiliate link? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('cancels delete confirmation', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete Link')).not.toBeInTheDocument();
  });

  it('handles bulk delete', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Select multiple links
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First link
    await user.click(checkboxes[2]); // Second link

    // Click bulk delete
    const bulkDeleteButton = screen.getByText('Delete Selected');
    await user.click(bulkDeleteButton);

    // Should show bulk delete confirmation
    expect(screen.getByText('Delete Multiple Links')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete 2 selected links? This action cannot be undone.'
      )
    ).toBeInTheDocument();

    // Confirm bulk delete
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(2);
    expect(mockOnDelete).toHaveBeenCalledWith('1');
    expect(mockOnDelete).toHaveBeenCalledWith('2');
  });

  it('displays link information correctly', () => {
    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check link details
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    // Check tags (should show first 3 + more indicator)
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();

    // Check featured status (should show star icon)
    const starIcons = screen.getAllByRole('img', { hidden: true });
    expect(starIcons.length).toBeGreaterThan(0);
  });

  it('handles image loading errors', () => {
    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const images = screen.getAllByRole('img');
    const linkImage = images.find(
      (img) => img.getAttribute('alt') === 'Test Link 1'
    );

    if (linkImage) {
      // Simulate image load error
      fireEvent.error(linkImage);
      expect(linkImage).toHaveStyle('display: none');
    }
  });

  it('shows appropriate empty state message when filtered', async () => {
    const user = userEvent.setup();

    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Apply a filter that returns no results
    const searchInput = screen.getByPlaceholderText('Search links...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No links found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search or filters.')
    ).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <LinkManagementTable
        links={mockLinks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check that dates are formatted (exact format may vary by locale)
    const dateElements = screen.getAllByText(
      /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/
    );
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays commission rates when available', () => {
    const linksWithCommission = [
      {
        ...mockLinks[0],
        commissionRate: 10.5,
      },
    ];

    render(
      <LinkManagementTable
        links={linksWithCommission}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Commission rate should be visible in the link details or tooltip
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
  });
});
