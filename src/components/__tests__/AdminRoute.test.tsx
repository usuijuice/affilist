import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AdminRoute,
  AdminOnlyRoute,
  EditorRoute,
  withAdminRoute,
} from '../AdminRoute';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminUser, AuthState } from '../../types';

// Mock the dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: any }) => (
      <div
        data-testid="navigate"
        data-to={to}
        data-state={JSON.stringify(state)}
      >
        Navigate to {to}
      </div>
    ),
  };
});

describe('AdminRoute', () => {
  const mockUser: AdminUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    lastLogin: new Date('2024-01-20T10:00:00Z'),
  };

  const editorUser: AdminUser = {
    ...mockUser,
    role: 'editor',
  };

  const defaultAuthState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (
    component: React.ReactElement,
    initialEntries = ['/']
  ) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
    );
  };

  describe('AdminRoute', () => {
    it('should render children with admin layout when authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: mockUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminRoute title="Test Page" subtitle="Test subtitle">
          <div>Admin Content</div>
        </AdminRoute>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(screen.getByText('Affiliate Link Admin')).toBeInTheDocument(); // Admin layout header
    });

    it('should render children without layout when showLayout is false', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: mockUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminRoute showLayout={false}>
          <div>Admin Content</div>
        </AdminRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(
        screen.queryByText('Affiliate Link Admin')
      ).not.toBeInTheDocument(); // No admin layout
    });

    it('should redirect when not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: defaultAuthState,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/admin/login');
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should use custom fallback path', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: defaultAuthState,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminRoute fallbackPath="/custom-login">
          <div>Admin Content</div>
        </AdminRoute>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/custom-login');
    });

    it('should enforce role requirements', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: editorUser, // Editor trying to access admin route
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminRoute requiredRole="admin">
          <div>Admin Only Content</div>
        </AdminRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });
  });

  describe('AdminOnlyRoute', () => {
    it('should require admin role', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: editorUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminOnlyRoute>
          <div>Admin Only Content</div>
        </AdminOnlyRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });

    it('should allow admin users', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: mockUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <AdminOnlyRoute>
          <div>Admin Only Content</div>
        </AdminOnlyRoute>
      );

      expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('EditorRoute', () => {
    it('should require editor role', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: mockUser, // Admin trying to access editor-only route
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <EditorRoute>
          <div>Editor Only Content</div>
        </EditorRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Editor Only Content')).not.toBeInTheDocument();
    });

    it('should allow editor users', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: editorUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithRouter(
        <EditorRoute>
          <div>Editor Only Content</div>
        </EditorRoute>
      );

      expect(screen.getByText('Editor Only Content')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('withAdminRoute', () => {
    it('should wrap component with admin route', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: mockUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const TestComponent = ({ message }: { message: string }) => (
        <div>{message}</div>
      );

      const WrappedComponent = withAdminRoute(TestComponent, {
        title: 'Wrapped Page',
        requiredRole: 'admin',
      });

      renderWithRouter(<WrappedComponent message="Test Message" />);

      expect(screen.getByText('Wrapped Page')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
      expect(screen.getByText('Affiliate Link Admin')).toBeInTheDocument();
    });

    it('should enforce role in HOC', () => {
      vi.mocked(useAuth).mockReturnValue({
        state: {
          ...defaultAuthState,
          isAuthenticated: true,
          user: editorUser,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const TestComponent = ({ message }: { message: string }) => (
        <div>{message}</div>
      );

      const WrappedComponent = withAdminRoute(TestComponent, {
        requiredRole: 'admin',
      });

      renderWithRouter(<WrappedComponent message="Test Message" />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });
  });
});
