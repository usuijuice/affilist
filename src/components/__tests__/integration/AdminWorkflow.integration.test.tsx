import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppProvider } from '../../contexts/AppContext';
import { AdminDashboard } from '../AdminDashboard';
import { LinkForm } from '../LinkForm';
import { LinkManagementTable } from '../LinkManagementTable';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { createMockAffiliateLink, createMockCategory, createMockAdminUser } from '../../test/factories';

// Mock the API services
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  initialize: vi.fn(),
}));

vi.mock('../../services/affiliateLinksApi', () => ({
  createAffiliateLink: vi.fn(),
  updateAffiliateLink: vi.fn(),
  deleteAffiliateLink: vi.fn(),
  getAffiliateLinks: vi.fn(),
}));

vi.mock('../../services/analyticsApi', () => ({
  getAnalytics: vi.fn(),
}));

const mockUser = createMockAdminUser();
const mockCategories = [
  createMockCategory({ id: '1', name: 'Web Development' }),
  createMockCategory({ id: '2', name: 'Design Tools' }),
];

const mockLinks = [
  createMockAffiliateLink({ id: '1', title: 'Test Link 1', category: mockCategories[0] }),
  createMockAffiliateLink({ id: '2', title: 'Test Link 2', category: mockCategories[1] }),
];

const TestComponent = ({ initialRoute = '/admin/dashboard' }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <div>
            <AdminDashboard />
          </div>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Admin Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    vi.mocked(require('../../services/authService').getCurrentUser).mockReturnValue(mockUser);
  });

  it('should create a new affiliate link through the complete workflow', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(require('../../services/affiliateLinksApi').createAffiliateLink);
    mockCreate.mockResolvedValueOnce(mockLinks[0]);
    
    render(<TestComponent />);
    
    // Navigate to create link form
    const createButton = screen.getByRole('button', { name: /create new link/i });
    await user.click(createButton);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/title/i), 'New Test Link');
    await user.type(screen.getByLabelText(/description/i), 'A new test link description');
    await user.type(screen.getByLabelText(/url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/affiliate url/i), 'https://example.com?ref=affiliate');
    
    // Select category
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    
    // Add tags
    await user.type(screen.getByLabelText(/tags/i), 'test, example');
    
    // Set commission rate
    await user.type(screen.getByLabelText(/commission rate/i), '25');
    
    // Mark as featured
    await user.click(screen.getByLabelText(/featured/i));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'New Test Link',
        description: 'A new test link description',
        url: 'https://example.com',
        affiliateUrl: 'https://example.com?ref=affiliate',
        categoryId: '1',
        tags: ['test', 'example'],
        commissionRate: 25,
        featured: true,
      });
    });
    
    // Should show success message
    expect(screen.getByText(/link created successfully/i)).toBeInTheDocument();
  });

  it('should edit an existing affiliate link', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.mocked(require('../../services/affiliateLinksApi').updateAffiliateLink);
    mockUpdate.mockResolvedValueOnce({ ...mockLinks[0], title: 'Updated Test Link' });
    
    render(<TestComponent />);
    
    // Navigate to link management
    const manageLinksButton = screen.getByRole('button', { name: /manage links/i });
    await user.click(manageLinksButton);
    
    // Click edit on first link
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);
    
    // Update the title
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Test Link');
    
    // Submit changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        title: 'Updated Test Link',
      }));
    });
    
    // Should show success message
    expect(screen.getByText(/link updated successfully/i)).toBeInTheDocument();
  });

  it('should delete an affiliate link with confirmation', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(require('../../services/affiliateLinksApi').deleteAffiliateLink);
    mockDelete.mockResolvedValueOnce(undefined);
    
    render(<TestComponent />);
    
    // Navigate to link management
    const manageLinksButton = screen.getByRole('button', { name: /manage links/i });
    await user.click(manageLinksButton);
    
    // Click delete on first link
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(deleteButton);
    
    // Should show confirmation dialog
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
    
    // Should show success message
    expect(screen.getByText(/link deleted successfully/i)).toBeInTheDocument();
  });

  it('should handle bulk operations on multiple links', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(require('../../services/affiliateLinksApi').deleteAffiliateLink);
    mockDelete.mockResolvedValue(undefined);
    
    render(<TestComponent />);
    
    // Navigate to link management
    const manageLinksButton = screen.getByRole('button', { name: /manage links/i });
    await user.click(manageLinksButton);
    
    // Select multiple links
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Select first link
    await user.click(checkboxes[1]); // Select second link
    
    // Should show bulk actions toolbar
    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    
    // Click bulk delete
    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(bulkDeleteButton);
    
    // Confirm bulk deletion
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);
    
    // Verify API calls for both links
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledWith('1');
      expect(mockDelete).toHaveBeenCalledWith('2');
    });
  });

  it('should navigate between admin sections seamlessly', async () => {
    const user = userEvent.setup();
    
    render(<TestComponent />);
    
    // Start at dashboard
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    
    // Navigate to analytics
    const analyticsLink = screen.getByRole('link', { name: /analytics/i });
    await user.click(analyticsLink);
    
    // Should show analytics dashboard
    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    });
    
    // Navigate to link management
    const linksLink = screen.getByRole('link', { name: /links/i });
    await user.click(linksLink);
    
    // Should show link management
    await waitFor(() => {
      expect(screen.getByText(/link management/i)).toBeInTheDocument();
    });
    
    // Navigate back to dashboard
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);
    
    // Should be back at dashboard
    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });
  });

  it('should handle form validation errors gracefully', async () => {
    const user = userEvent.setup();
    
    render(<TestComponent />);
    
    // Navigate to create link form
    const createButton = screen.getByRole('button', { name: /create new link/i });
    await user.click(createButton);
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/url is required/i)).toBeInTheDocument();
      expect(screen.getByText(/affiliate url is required/i)).toBeInTheDocument();
    });
    
    // Fill in invalid URL
    await user.type(screen.getByLabelText(/url/i), 'not-a-valid-url');
    await user.click(submitButton);
    
    // Should show URL validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors and show appropriate messages', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(require('../../services/affiliateLinksApi').createAffiliateLink);
    mockCreate.mockRejectedValueOnce(new Error('Server error'));
    
    render(<TestComponent />);
    
    // Navigate to create link form and fill it out
    const createButton = screen.getByRole('button', { name: /create new link/i });
    await user.click(createButton);
    
    await user.type(screen.getByLabelText(/title/i), 'Test Link');
    await user.type(screen.getByLabelText(/url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/affiliate url/i), 'https://example.com?ref=affiliate');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create link/i)).toBeInTheDocument();
    });
  });
});