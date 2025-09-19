import { apiClient } from './apiClient';
import type { LoginCredentials, AuthResponse, AdminUser } from '../types';

class AuthService {
  private readonly TOKEN_KEY = 'affiliate_admin_token';
  private readonly USER_KEY = 'affiliate_admin_user';

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Store token and user data
      this.setToken(response.token);
      this.setUser(response.user);
      
      // Set token in API client for future requests
      apiClient.setAuthToken(response.token);
      
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  /**
   * Logout and clear stored data
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      const token = this.getToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local data
      this.clearToken();
      this.clearUser();
      apiClient.clearAuthToken();
    }
  }

  /**
   * Refresh the current token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh');
      
      // Update stored token and user data
      this.setToken(response.token);
      this.setUser(response.user);
      
      // Update token in API client
      apiClient.setAuthToken(response.token);
      
      return response;
    } catch (error) {
      // If refresh fails, clear stored data
      this.clearToken();
      this.clearUser();
      apiClient.clearAuthToken();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Verify current token is valid
   */
  async verifyToken(): Promise<AdminUser> {
    try {
      const response = await apiClient.get<{ user: AdminUser }>('/auth/verify');
      this.setUser(response.user);
      return response.user;
    } catch (error) {
      // If verification fails, clear stored data
      this.clearToken();
      this.clearUser();
      apiClient.clearAuthToken();
      throw new Error('Token verification failed');
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  getUser(): AdminUser | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get user from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return true;
    }
  }

  /**
   * Initialize authentication state on app start
   */
  async initialize(): Promise<AdminUser | null> {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return null;
    }

    // Set token in API client
    apiClient.setAuthToken(token);

    // Check if token is expired
    if (this.isTokenExpired()) {
      try {
        // Try to refresh token
        const authResponse = await this.refreshToken();
        return authResponse.user;
      } catch (error) {
        // refreshToken already clears data on failure
        return null;
      }
    }

    // Verify token is still valid
    try {
      return await this.verifyToken();
    } catch (error) {
      // verifyToken already clears data on failure
      return null;
    }
  }

  /**
   * Store token in localStorage
   */
  private setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store token in localStorage:', error);
    }
  }

  /**
   * Store user data in localStorage
   */
  private setUser(user: AdminUser): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to store user in localStorage:', error);
    }
  }

  /**
   * Clear stored token
   */
  private clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear token from localStorage:', error);
    }
  }

  /**
   * Clear stored user data
   */
  private clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.warn('Failed to clear user from localStorage:', error);
    }
  }
}

export const authService = new AuthService();