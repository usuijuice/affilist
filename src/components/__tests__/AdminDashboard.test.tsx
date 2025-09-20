import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboard } from '../AdminDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { affiliateLinksApi } from '../../services';
import type { AffiliateLink, AdminUser } from '../../types';

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../services', () => ({
  affiliateLinksApi: {
    getAllLinks: vi.fn(),
    createLink: vi.fn(),
    updateLink: vi.fn(),
    deleteLink: vi.fn(),
  },
}));

vi.mock('../AdminLayout', () => ({
  AdminLayout: ({ children, title, subtitle }: any) => (
    <div data-testid="admin-layout">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  ),
}));

vi.mock('../LinkManagementTable', () => ({
  LinkManagementTable: ({ links, onEdit, onDelete, isLoading }: any) => (
    <div data-testid="link-management-table">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <p>Links: {links.length}</p>
          {links.map((link: AffiliateLink) => (
            <div key={link.id}>
              <span>{link.title}</span>
              <button onClick={() => onEdit(link)}>Edit {link.title}</button>
              <button onClick={() => onDelete(link.id)}>
                Delete {link.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('../LinkForm', () => ({
  LinkForm: ({ link, onSubmit, onCancel, isLoading }: any) => (
    <div data-testid="link-form">
      <h2>{link ? 'Edit Link' : 'Create Link'}</h2>
      {isLoading && <div>Form Loading...</div>}
      <button
        onClick={() =>
          onSubmit({
            title: 'Test Link',
            description: 'Test Description',
            url: 'https://example.com',
            affiliateUrl: 'https://affiliate.example.com',
            categoryId: '1',
            tags: ['test'],
            featured: false,
          })
        }
      >
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUser: AdminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  lastLogin: new Date(),
};

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
    tags: ['web', 'development'],
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
    tags: ['design'],
    featured: false,
    clickCount: 50,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04'),
    status: 'inactive',
  },
];

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(affiliateLinksApi.getAllLinks).mockResolvedValue({
      success: true,
      data: mockLinks,
    });
  });

  it('renders dashboard overview by default', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText('Total Links')).toBeInTheDocument();
    expect(screen.getByText('Active Links')).toBeInTheDocument();
    expect(screen.getByText('Total Clicks')).toBeInTheDocument();
    expect(screen.getByText('Featured Links')).toBeInTheDocument();

    // Check stats values
    expect(screen.getByText('2')).toBeInTheDocument(); // Total links
    expect(screen.getAllByText('1')).toHaveLength(2); // Active links and Featured links both have 1
    expect(screen.getByText('150')).toBeInTheDocument(); // Total clicks
  });

  it('loads dashboard data on mount', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(affiliateLinksApi.getAllLinks).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates between dashboard and links view', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to links view
    const manageLinksButton = screen.getByText('Manage Links');
    await user.click(manageLinksButton);

    expect(screen.getByTestId('link-management-table')).toBeInTheDocument();
    expect(screen.getByText('Links: 2')).toBeInTheDocument();

    // Navigate back to dashboard
    const dashboardButton = screen.getByText('Dashboard');
    await user.click(dashboardButton);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('navigates to create link form', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Add New Link')).toBeInTheDocument();
    });

    const addNewLinkButton = screen.getByText('Add New Link');
    await user.click(addNewLinkButton);

    expect(screen.getByTestId('link-form')).toBeInTheDocument();
    expect(screen.getByText('Create Link')).toBeInTheDocument();
  });

  it('handles link creation', async () => {
    const user = userEvent.setup();

    vi.mocked(affiliateLinksApi.createLink).mockResolvedValue({
      success: true,
      data: mockLinks[0],
    });

    render(<AdminDashboard />);

    // Navigate to create form
    await waitFor(() => {
      expect(screen.getByText('Add New Link')).toBeInTheDocument();
    });

    const addNewLinkButton = screen.getByText('Add New Link');
    await user.click(addNewLinkButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(affiliateLinksApi.createLink).toHaveBeenCalledWith({
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        categoryId: '1',
        tags: ['test'],
        featured: false,
      });
    });

    // Should navigate back to links view
    expect(screen.getByTestId('link-management-table')).toBeInTheDocument();
  });

  it('handles link editing', async () => {
    const user = userEvent.setup();

    vi.mocked(affiliateLinksApi.updateLink).mockResolvedValue({
      success: true,
      data: { ...mockLinks[0], title: 'Updated Link' },
    });

    render(<AdminDashboard />);

    // Navigate to links view
    await waitFor(() => {
      expect(screen.getByText('Manage Links')).toBeInTheDocument();
    });

    const manageLinksButton = screen.getByText('Manage Links');
    await user.click(manageLinksButton);

    // Click edit button
    const editButton = screen.getByText('Edit Test Link 1');
    await user.click(editButton);

    expect(screen.getByTestId('link-form')).toBeInTheDocument();
    expect(screen.getByText('Edit Link')).toBeInTheDocument();

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(affiliateLinksApi.updateLink).toHaveBeenCalledWith('1', {
        title: 'Test Link',
        description: 'Test Description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com',
        categoryId: '1',
        tags: ['test'],
        featured: false,
      });
    });
  });

  it('handles link deletion', async () => {
    const user = userEvent.setup();

    vi.mocked(affiliateLinksApi.deleteLink).mockResolvedValue({
      success: true,
      data: { success: true },
    });

    render(<AdminDashboard />);

    // Navigate to links view
    await waitFor(() => {
      expect(screen.getByText('Manage Links')).toBeInTheDocument();
    });

    const manageLinksButton = screen.getByText('Manage Links');
    await user.click(manageLinksButton);

    // Click delete button
    const deleteButton = screen.getByText('Delete Test Link 1');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(affiliateLinksApi.deleteLink).toHaveBeenCalledWith('1');
    });
  });

  it('handles form cancellation', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Navigate to create form
    await waitFor(() => {
      expect(screen.getByText('Add New Link')).toBeInTheDocument();
    });

    const addNewLinkButton = screen.getByText('Add New Link');
    await user.click(addNewLinkButton);

    expect(screen.getByTestId('link-form')).toBeInTheDocument();

    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should navigate back to links view
    expect(screen.getByTestId('link-management-table')).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    vi.mocked(affiliateLinksApi.getAllLinks).mockRejectedValue(
      new Error('API Error')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('An error occurred while loading data')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows loading state', async () => {
    // Mock a delayed response
    vi.mocked(affiliateLinksApi.getAllLinks).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: mockLinks }), 100)
        )
    );

    render(<AdminDashboard />);

    // Should show loading initially
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Links')).toBeInTheDocument();
    });
  });

  it('displays recent links in dashboard', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Links')).toBeInTheDocument();
    });

    // Should show recent links
    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.getByText('Test Link 2')).toBeInTheDocument();
    expect(
      screen.getByText('Web Development • 100 clicks')
    ).toBeInTheDocument();
    expect(screen.getByText('Design Tools • 50 clicks')).toBeInTheDocument();
  });

  it('handles API errors during link operations', async () => {
    const user = userEvent.setup();

    vi.mocked(affiliateLinksApi.createLink).mockRejectedValue(
      new Error('Create failed')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminDashboard />);

    // Navigate to create form
    await waitFor(() => {
      expect(screen.getByText('Add New Link')).toBeInTheDocument();
    });

    const addNewLinkButton = screen.getByText('Add New Link');
    await user.click(addNewLinkButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An error occurred while creating the link')
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('initializes with specified view', () => {
    render(<AdminDashboard initialView="links" />);

    expect(screen.getByTestId('link-management-table')).toBeInTheDocument();
  });
});
