import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../authService';
import { apiClient } from '../apiClient';
import type { LoginCredentials, AuthResponse, AdminUser } from '../../types';

// Mock the apiClient
vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
};

Object.defineProperty(console, 'warn', { value: mockConsole.warn });
Object.defineProperty(console, 'error', { value: mockConsole.error });

describe('AuthService', () => {
  const mockUser: AdminUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    lastLogin: new Date('2024-01-20T10:00:00Z'),
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    token: 'mock-jwt-token',
    expiresAt: new Date('2024-01-21T10:00:00Z'),
  };

  const mockCredentials: LoginCredentials = {
    email: 'admin@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store token and user', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: mockAuthResponse.token, user: mockAuthResponse.user },
        success: true,
      });

      const result = await authService.login(mockCredentials);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login',
        mockCredentials
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'affiliate_admin_token',
        mockAuthResponse.token
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'affiliate_admin_user',
        JSON.stringify(mockUser)
      );
      expect(apiClient.setAuthToken).toHaveBeenCalledWith(
        mockAuthResponse.token
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error(errorMessage));

      await expect(authService.login(mockCredentials)).rejects.toThrow(
        errorMessage
      );
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(apiClient.setAuthToken).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: mockAuthResponse.token, user: mockAuthResponse.user },
        success: true,
      });
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await authService.login(mockCredentials);

      expect(result).toEqual(mockAuthResponse);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to store token in localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
    });

    it('should logout successfully and clear stored data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {},
        success: true,
      });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });

    it('should clear data even if logout API call fails', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Network error')
      );

      await authService.logout();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Logout API call failed:',
        expect.any(Error)
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });

    it('should handle logout when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await authService.logout();

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: mockAuthResponse.token, user: mockAuthResponse.user },
        success: true,
      });

      const result = await authService.refreshToken();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'affiliate_admin_token',
        mockAuthResponse.token
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'affiliate_admin_user',
        JSON.stringify(mockUser)
      );
      expect(apiClient.setAuthToken).toHaveBeenCalledWith(
        mockAuthResponse.token
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('should clear data when refresh fails', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Token expired')
      );

      await expect(authService.refreshToken()).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { user: mockUser },
        success: true,
      });

      const result = await authService.verifyToken();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/verify');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'affiliate_admin_user',
        JSON.stringify(mockUser)
      );
      expect(result).toEqual(mockUser);
    });

    it('should clear data when verification fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Invalid token')
      );

      await expect(authService.verifyToken()).rejects.toThrow(
        'Token verification failed'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    it('should return stored token', () => {
      const token = 'stored-token';
      mockLocalStorage.getItem.mockReturnValue(token);

      const result = authService.getToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'affiliate_admin_token'
      );
      expect(result).toBe(token);
    });

    it('should return null when no token stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = authService.getToken();

      expect(result).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to get token from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('getUser', () => {
    it('should return stored user', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = authService.getUser();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'affiliate_admin_user'
      );
      // Compare without the date object since JSON.parse converts dates to strings
      expect(result).toEqual({
        ...mockUser,
        lastLogin: mockUser.lastLogin.toISOString(),
      });
    });

    it('should return null when no user stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getUser();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = authService.getUser();

      expect(result).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to get user from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token and user exist', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('token')
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when token is missing', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when user is missing', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('token')
        .mockReturnValueOnce(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when token is expired', () => {
      // Create a JWT token with expired timestamp
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      const result = authService.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false when token is valid', () => {
      // Create a JWT token with future timestamp
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = authService.isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true when token format is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      const result = authService.isTokenExpired();

      expect(result).toBe(true);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to decode token:',
        expect.any(Error)
      );
    });
  });

  describe('initialize', () => {
    it('should return null when no token or user stored', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await authService.initialize();

      expect(result).toBeNull();
      expect(apiClient.setAuthToken).not.toHaveBeenCalled();
    });

    it('should refresh token when expired and return user', async () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

      mockLocalStorage.getItem
        .mockReturnValueOnce(expiredToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: mockAuthResponse.token, user: mockAuthResponse.user },
        success: true,
      });

      const result = await authService.initialize();

      expect(apiClient.setAuthToken).toHaveBeenCalledWith(expiredToken);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual(mockUser);
    });

    it('should verify token when not expired and return user', async () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

      mockLocalStorage.getItem
        .mockReturnValueOnce(validToken)
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce(validToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { user: mockUser },
        success: true,
      });

      const result = await authService.initialize();

      expect(apiClient.setAuthToken).toHaveBeenCalledWith(validToken);
      expect(apiClient.get).toHaveBeenCalledWith('/auth/verify');
      expect(result).toEqual(mockUser);
    });

    it('should return null when refresh fails', async () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

      mockLocalStorage.getItem
        .mockReturnValueOnce(expiredToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Refresh failed')
      );

      const result = await authService.initialize();

      expect(result).toBeNull();
    });

    it('should return null when verification fails', async () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

      mockLocalStorage.getItem
        .mockReturnValueOnce(validToken)
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce(validToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Verification failed')
      );

      const result = await authService.initialize();

      expect(result).toBeNull();
    });
  });
});
