import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLayout } from '../AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../ProtectedRoute';
import type { AdminUser } from '../../types';

// Mock the hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../ProtectedRoute', () => ({
  usePermissions: vi.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('AdminLayout', () => {
  const mockLogout = vi.fn();
  const mockUser: AdminUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'John Admin',
    role: 'admin',
    lastLogin: new Date('2024-01-20T10:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      state: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      login: vi.fn(),
      logout: mockLogout,
      clearError: vi.fn(),
    });
    vi.mocked(usePermissions).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      canAccess: vi.fn(),
    });
  });

  it('should render admin layout with default title', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Affiliate Link Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with custom title and subtitle', () => {
    render(
      <AdminLayout title="Custom Title" subtitle="Custom subtitle">
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });

  it('should display user information', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('John Admin')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument(); // User initial
  });

  it('should handle logout', async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });
  });

  it('should handle logout failure gracefully', async () => {
    mockLogout.mockRejectedValueOnce(new Error('Logout failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Logout failed:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should not render page header when no title or subtitle', () => {
    render(
      <AdminLayout title="" subtitle="">
        <div>Test Content</div>
      </AdminLayout>
    );

    // Should not render the page header section
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('should render user initial correctly for different names', () => {
    const userWithDifferentName = { ...mockUser, name: 'alice smith' };
    vi.mocked(usePermissions).mockReturnValue({
      user: userWithDifferentName,
      isAuthenticated: true,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      canAccess: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('A')).toBeInTheDocument(); // Should uppercase the first letter
  });

  it('should handle editor role display', () => {
    const editorUser = { ...mockUser, role: 'editor' as const };
    vi.mocked(usePermissions).mockReturnValue({
      user: editorUser,
      isAuthenticated: true,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      canAccess: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('editor')).toBeInTheDocument();
  });
});
