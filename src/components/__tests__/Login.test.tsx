import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthState } from '../../types';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('Login', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  const defaultAuthState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      state: defaultAuthState,
      login: mockLogin,
      logout: vi.fn(),
      clearError: mockClearError,
    });
  });

  it('should render login form', () => {
    render(<Login />);

    expect(screen.getByText('管理者ログイン')).toBeInTheDocument();
    expect(
      screen.getByText('管理画面にアクセスするにはログインしてください')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ログイン' })
    ).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    expect(
      screen.getByText('メールアドレスを入力してください')
    ).toBeInTheDocument();
    expect(
      screen.getByText('パスワードを入力してください')
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(
      screen.getByText('有効なメールアドレスを入力してください')
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    expect(
      screen.getByText('パスワードは6文字以上で入力してください')
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should submit valid form', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show loading state during login', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: { ...defaultAuthState, isLoading: true },
      login: mockLogin,
      logout: vi.fn(),
      clearError: mockClearError,
    });

    render(<Login />);

    const submitButton = screen.getByRole('button', {
      name: 'ログインしています...',
    });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('ログインしています...')).toBeInTheDocument();

    // Check that inputs are disabled during loading
    expect(screen.getByLabelText('メールアドレス')).toBeDisabled();
    expect(screen.getByLabelText('パスワード')).toBeDisabled();
  });

  it('should display auth error', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: { ...defaultAuthState, error: 'Invalid credentials' },
      login: mockLogin,
      logout: vi.fn(),
      clearError: mockClearError,
    });

    render(<Login />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should clear field errors when user types', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    // Trigger validation error
    await user.click(submitButton);
    expect(
      screen.getByText('メールアドレスを入力してください')
    ).toBeInTheDocument();

    // Start typing to clear error
    await user.type(emailInput, 'test');
    expect(
      screen.queryByText('メールアドレスを入力してください')
    ).not.toBeInTheDocument();
  });

  it('should clear auth error when user makes changes', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      state: { ...defaultAuthState, error: 'Invalid credentials' },
      login: mockLogin,
      logout: vi.fn(),
      clearError: mockClearError,
    });

    render(<Login />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();

    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText('パスワード');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSuccess callback after successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<Login onSuccess={onSuccess} />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should redirect after successful login', async () => {
    const user = userEvent.setup();
    const redirectTo = '/admin/dashboard';
    mockLogin.mockResolvedValueOnce(undefined);

    render(<Login redirectTo={redirectTo} />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.location.href).toBe(redirectTo);
    });
  });

  it('should handle login failure', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLogin.mockRejectedValueOnce(new Error('Login failed'));

    render(<Login />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Login failed:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('should clear error on component unmount', () => {
    const { unmount } = render(<Login />);

    unmount();

    expect(mockClearError).toHaveBeenCalled();
  });
});
