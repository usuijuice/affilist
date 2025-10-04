import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinkForm } from '../LinkForm';
import { categoriesApi } from '../../services';
import type { AffiliateLink, Category } from '../../types';

// Mock the services
vi.mock('../../services', () => ({
  categoriesApi: {
    getAllCategories: vi.fn(),
  },
}));

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Web development tools and services',
    color: '#3B82F6',
    linkCount: 5,
  },
  {
    id: '2',
    name: 'Design Tools',
    slug: 'design-tools',
    description: 'Design and creative tools',
    color: '#EF4444',
    linkCount: 3,
  },
];

const mockAffiliateLink: AffiliateLink = {
  id: '1',
  title: 'Test Link',
  description: 'Test description for affiliate link',
  url: 'https://example.com',
  affiliateUrl: 'https://affiliate.example.com/ref=123',
  category: mockCategories[0],
  tags: ['web', 'development'],
  imageUrl: 'https://example.com/logo.png',
  commissionRate: 5.5,
  featured: true,
  clickCount: 100,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  status: 'active',
};

describe('LinkForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful categories API response
    vi.mocked(categoriesApi.getAllCategories).mockResolvedValue({
      success: true,
      data: mockCategories,
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders form fields correctly', async () => {
    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /category/i })
      ).toBeInTheDocument();
    });

    // Check all required fields are present
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/original url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/affiliate url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commission rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/featured link/i)).toBeInTheDocument();

    // Check buttons
    expect(
      screen.getByRole('button', { name: /create link/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('loads categories on mount', async () => {
    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(categoriesApi.getAllCategories).toHaveBeenCalledTimes(1);
    });

    // Check categories are loaded in select
    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    expect(categorySelect).toHaveDisplayValue('');

    // Check options are present
    expect(
      screen.getByRole('option', { name: 'Web Development' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Design Tools' })
    ).toBeInTheDocument();
  });

  it('populates form when editing existing link', async () => {
    render(
      <LinkForm
        link={mockAffiliateLink}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Link')).toBeInTheDocument();
    });

    // Check all fields are populated
    expect(screen.getByDisplayValue('Test Link')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Test description for affiliate link')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://affiliate.example.com/ref=123')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/logo.png')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('5.5')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /featured link/i })
    ).toBeChecked();

    // Check tags are displayed
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();

    // Check button text changes for editing
    expect(
      screen.getByRole('button', { name: /update link/i })
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);

    // Check validation errors appear
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('URL is required')).toBeInTheDocument();
      expect(screen.getByText('Affiliate URL is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    // Form should not be submitted
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates URL formats', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /category/i })
      ).toBeInTheDocument();
    });

    // Fill required fields with valid data first, then invalid URLs
    await user.type(screen.getByLabelText(/title/i), 'Test Title');
    await user.type(
      screen.getByLabelText(/description/i),
      'Test description that is long enough'
    );

    // Select category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, '1');

    // Enter invalid URLs
    const urlInput = screen.getByLabelText(/original url/i);
    const affiliateUrlInput = screen.getByLabelText(/affiliate url/i);
    const imageUrlInput = screen.getByLabelText(/image url/i);

    await user.type(urlInput, 'invalid-url');
    await user.type(affiliateUrlInput, 'also-invalid');
    await user.type(imageUrlInput, 'not-a-url');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);

    // Check URL validation errors
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      expect(
        screen.getByText('Please enter a valid affiliate URL')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please enter a valid image URL')
      ).toBeInTheDocument();
    });
  });

  it('validates field lengths', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Enter text that's too short/long
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(titleInput, 'ab'); // Too short
    await user.type(descriptionInput, 'short'); // Too short

    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Title must be at least 3 characters')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Description must be at least 10 characters')
      ).toBeInTheDocument();
    });
  });

  it('validates commission rate', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /category/i })
      ).toBeInTheDocument();
    });

    // Fill required fields with valid data first
    await user.type(screen.getByLabelText(/title/i), 'Test Title');
    await user.type(
      screen.getByLabelText(/description/i),
      'Test description that is long enough'
    );
    await user.type(
      screen.getByLabelText(/original url/i),
      'https://example.com'
    );
    await user.type(
      screen.getByLabelText(/affiliate url/i),
      'https://affiliate.example.com'
    );
    await user.selectOptions(screen.getByLabelText(/category/i), '1');

    const commissionInput = screen.getByLabelText(/commission rate/i);

    // Test invalid commission rate
    await user.type(commissionInput, '150'); // Too high

    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Commission rate must be between 0 and 100')
      ).toBeInTheDocument();
    });
  });

  it('handles tag management', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Add a tag
    await user.type(tagInput, 'javascript');
    await user.click(addButton);

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    // Add tag with Enter key
    await user.type(tagInput, 'react');
    await user.keyboard('{Enter}');

    expect(screen.getByText('react')).toBeInTheDocument();

    // Remove a tag
    const removeButton = screen.getAllByRole('button')[0]; // First remove button
    await user.click(removeButton);

    expect(screen.queryByText('javascript')).not.toBeInTheDocument();
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Add a tag
    await user.type(tagInput, 'javascript');
    await user.click(addButton);

    // Try to add the same tag again
    await user.type(tagInput, 'javascript');
    await user.click(addButton);

    // Should only have one instance
    const tags = screen.getAllByText('javascript');
    expect(tags).toHaveLength(1);
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /category/i })
      ).toBeInTheDocument();
    });

    // Fill out form
    await user.type(screen.getByLabelText(/title/i), 'Test Affiliate Link');
    await user.type(
      screen.getByLabelText(/description/i),
      'This is a test affiliate link description'
    );
    await user.type(
      screen.getByLabelText(/original url/i),
      'https://example.com'
    );
    await user.type(
      screen.getByLabelText(/affiliate url/i),
      'https://affiliate.example.com/ref=123'
    );
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.type(screen.getByLabelText(/commission rate/i), '5.5');
    await user.click(screen.getByLabelText(/featured link/i));

    // Add a tag
    await user.type(screen.getByPlaceholderText('Add a tag'), 'test');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Affiliate Link',
        description: 'This is a test affiliate link description',
        url: 'https://example.com',
        affiliateUrl: 'https://affiliate.example.com/ref=123',
        categoryId: '1',
        tags: ['test'],
        imageUrl: undefined,
        commissionRate: 5.5,
        featured: true,
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during submission', async () => {
    render(
      <LinkForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /creating/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Creating...')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('saves and loads draft data', async () => {
    const user = userEvent.setup();

    // First render - enter some data
    const { unmount } = render(
      <LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await user.type(screen.getByLabelText(/title/i), 'Draft Title');
    await user.type(
      screen.getByLabelText(/description/i),
      'Draft description content'
    );

    // Wait for draft to be saved
    await waitFor(() => {
      expect(screen.getByText('Draft saved automatically')).toBeInTheDocument();
    });

    unmount();

    // Second render - should load draft
    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Draft Title')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Draft description content')
      ).toBeInTheDocument();
      expect(screen.getByText('Draft saved automatically')).toBeInTheDocument();
    });
  });

  it('clears draft when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Enter some data to create draft
    await user.type(screen.getByLabelText(/title/i), 'Draft Title');

    await waitFor(() => {
      expect(screen.getByText('Draft saved automatically')).toBeInTheDocument();
    });

    // Clear draft
    const clearButton = screen.getByRole('button', { name: /clear draft/i });
    await user.click(clearButton);

    // Draft should be cleared
    expect(
      screen.queryByText('Draft saved automatically')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    vi.mocked(categoriesApi.getAllCategories).mockRejectedValue(
      new Error('API Error')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<LinkForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load categories:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
