import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import type { AdminUser, LoginCredentials } from '../../types';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    initialize: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
  },
}));

// Test component that uses the auth context
function TestComponent() {
  const { state, login, logout, clearError } = useAuth();

  return (
    <div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="authenticated">{state.isAuthenticated.toString()}</div>
      <div data-testid="user">{state.user?.name || 'null'}</div>
      <div data-testid="error">{state.error || 'null'}</div>
      <button
        onClick={() =>
          login({ email: 'test@example.com', password: 'password' })
        }
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser: AdminUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    lastLogin: new Date('2024-01-20T10:00:00Z'),
  };

  const mockCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'password',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loading should be true
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('error')).toHaveTextContent('null');

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(authService.initialize).toHaveBeenCalledOnce();
  });

  it('should initialize with existing user', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(mockUser);
    vi.mocked(authService.getToken).mockReturnValue('mock-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });
  });

  it('should handle initialization failure', async () => {
    vi.mocked(authService.initialize).mockRejectedValueOnce(
      new Error('Init failed')
    );

    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Auth initialization failed:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should handle successful login', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(null);
    vi.mocked(authService.login).mockResolvedValueOnce({
      user: mockUser,
      token: 'new-token',
      expiresAt: new Date(),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Trigger login
    act(() => {
      screen.getByText('Login').click();
    });

    // Should show loading during login
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });

    expect(authService.login).toHaveBeenCalledWith(mockCredentials);
  });

  it('should handle login failure', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(null);
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Trigger login
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  it('should handle successful logout', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(mockUser);
    vi.mocked(authService.getToken).mockReturnValue('mock-token');
    vi.mocked(authService.logout).mockResolvedValueOnce();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization with user
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Trigger logout
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(authService.logout).toHaveBeenCalledOnce();
  });

  it('should handle logout failure gracefully', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(mockUser);
    vi.mocked(authService.getToken).mockReturnValue('mock-token');
    vi.mocked(authService.logout).mockRejectedValueOnce(
      new Error('Logout failed')
    );

    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization with user
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Trigger logout
    act(() => {
      screen.getByText('Logout').click();
    });

    // Should still logout even if API call fails
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should clear error', async () => {
    vi.mocked(authService.initialize).mockResolvedValueOnce(null);
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error('Login error')
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Trigger login to create error
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Login error');
    });

    // Clear error
    act(() => {
      screen.getByText('Clear Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('should throw error when used outside provider', () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
