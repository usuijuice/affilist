import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute, usePermissions } from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthState, AdminUser } from '../../types';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom Navigate component
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

describe('ProtectedRoute', () => {
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

  it('should show loading spinner when authentication is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: { ...defaultAuthState, isLoading: true },
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: defaultAuthState,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      ['/admin/dashboard']
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/admin/login');
    expect(navigate).toHaveAttribute(
      'data-state',
      JSON.stringify({ from: '/admin/dashboard' })
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to custom fallback path when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: defaultAuthState,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute fallbackPath="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/custom-login');
  });

  it('should render children when authenticated', () => {
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
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should render children when authenticated with correct role', () => {
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
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should show access denied when user has wrong role', () => {
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
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to access this page.")
    ).toBeInTheDocument();
    expect(screen.getByText('Required role:')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Your role:')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should show go back button in access denied page', () => {
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

    // Mock window.history.back
    const mockBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true,
    });

    renderWithRouter(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    const goBackButton = screen.getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();

    goBackButton.click();
    expect(mockBack).toHaveBeenCalled();
  });

  it('should redirect when user is null but isAuthenticated is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: {
        ...defaultAuthState,
        isAuthenticated: true,
        user: null, // This shouldn't happen but we handle it
      },
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/admin/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('usePermissions', () => {
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

  // Test component that uses usePermissions
  function TestComponent() {
    const { user, isAuthenticated, hasRole, hasAnyRole, canAccess } =
      usePermissions();

    return (
      <div>
        <div data-testid="user">{user?.name || 'null'}</div>
        <div data-testid="authenticated">{isAuthenticated.toString()}</div>
        <div data-testid="has-admin">{hasRole('admin').toString()}</div>
        <div data-testid="has-editor">{hasRole('editor').toString()}</div>
        <div data-testid="has-any-role">
          {hasAnyRole(['admin', 'editor']).toString()}
        </div>
        <div data-testid="can-access-admin">
          {canAccess('admin').toString()}
        </div>
        <div data-testid="can-access-any">{canAccess().toString()}</div>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct values when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: defaultAuthState,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('has-editor')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any-role')).toHaveTextContent('false');
    expect(screen.getByTestId('can-access-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('can-access-any')).toHaveTextContent('false');
  });

  it('should return correct values for admin user', () => {
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

    render(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('has-editor')).toHaveTextContent('false');
    expect(screen.getByTestId('has-any-role')).toHaveTextContent('true');
    expect(screen.getByTestId('can-access-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('can-access-any')).toHaveTextContent('true');
  });

  it('should return correct values for editor user', () => {
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

    render(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('has-editor')).toHaveTextContent('true');
    expect(screen.getByTestId('has-any-role')).toHaveTextContent('true');
    expect(screen.getByTestId('can-access-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('can-access-any')).toHaveTextContent('true');
  });
});
