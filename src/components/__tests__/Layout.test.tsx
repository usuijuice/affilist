import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Layout } from '../Layout';
import { createMockCategories } from '../../test/factories';

// Wrapper component to provide router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout', () => {
  const mockCategories = createMockCategories(5);
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders header, main content, and footer', () => {
    render(
      <RouterWrapper>
        <Layout 
          categories={mockCategories}
          onSearch={mockOnSearch}
          searchQuery=""
        >
          <div data-testid="main-content">Test Content</div>
        </Layout>
      </RouterWrapper>
    );

    // Header should be present (check for brand - there are multiple instances)
    expect(screen.getAllByText('Affiliate Links').length).toBeGreaterThan(0);
    
    // Main content should be rendered
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    // Footer should be present (check for copyright)
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('passes search props to header correctly', () => {
    render(
      <RouterWrapper>
        <Layout 
          categories={mockCategories}
          onSearch={mockOnSearch}
          searchQuery="test search"
        >
          <div>Content</div>
        </Layout>
      </RouterWrapper>
    );

    // Search query should be displayed in header
    expect(screen.getAllByDisplayValue('test search')).toHaveLength(2); // Desktop and mobile
  });

  it('passes categories to footer correctly', () => {
    render(
      <RouterWrapper>
        <Layout 
          categories={mockCategories}
          onSearch={mockOnSearch}
          searchQuery=""
        >
          <div>Content</div>
        </Layout>
      </RouterWrapper>
    );

    // Categories should be displayed in footer
    mockCategories.slice(0, 6).forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('uses default props when not provided', () => {
    render(
      <RouterWrapper>
        <Layout>
          <div data-testid="main-content">Test Content</div>
        </Layout>
      </RouterWrapper>
    );

    // Should still render without errors
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getAllByText('Affiliate Links').length).toBeGreaterThan(0);
  });

  it('has proper layout structure with flex classes', () => {
    const { container } = render(
      <RouterWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </RouterWrapper>
    );

    // Check for proper CSS classes on the main container
    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'flex-col');
  });

  it('renders main element with flex-1 class for proper layout', () => {
    render(
      <RouterWrapper>
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      </RouterWrapper>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('flex-1');
    expect(mainElement).toContainElement(screen.getByTestId('content'));
  });
});