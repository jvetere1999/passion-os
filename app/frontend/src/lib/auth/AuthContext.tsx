/**
 * Authentication Context & Provider
 * 
 * Provides authentication state and methods to entire application.
 * Manages user session, tokens, and role-based access.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AuthContextValue,
  User,
  AuthResponse,
  AuthApiError,
  LoginRequest,
  SignupRequest,
  PersistedAuthState,
  UserRole,
} from './types';

/**
 * Create the auth context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider component
 * Wraps application and provides authentication state
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize auth from stored session
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to load persisted auth state
        const stored = localStorage.getItem('auth_state');
        if (stored) {
          const state: PersistedAuthState = JSON.parse(stored);

          // Check if token is expired
          if (state.expiresAt && state.expiresAt > Date.now()) {
            setUser(state.user);
            setAccessToken(state.accessToken);
            setRefreshToken(state.refreshToken);
          } else if (state.refreshToken) {
            // Try to refresh expired token
            await refreshAccessToken();
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Clear invalid stored state
        localStorage.removeItem('auth_state');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Persist auth state to localStorage
   */
  const persistAuthState = useCallback((
    user: User | null,
    accessToken: string | null,
    refreshToken: string | null,
    expiresIn?: number
  ) => {
    const state: PersistedAuthState = {
      user,
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
    };
    localStorage.setItem('auth_state', JSON.stringify(state));
  }, []);

  /**
   * Handle login
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password } as LoginRequest),
      });

      if (!response.ok) {
        const err: AuthApiError = await response.json();
        throw new Error(err.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      setUser(data.user);
      setAccessToken(data.tokens.accessToken);
      setRefreshToken(data.tokens.refreshToken);
      persistAuthState(data.user, data.tokens.accessToken, data.tokens.refreshToken, data.tokens.expiresIn);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuthState]);

  /**
   * Handle logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call logout endpoint to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors, clear local state anyway
      });
    } finally {
      // Clear client state regardless of server response
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('auth_state');
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle signup
   */
  const signup = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name } as SignupRequest),
      });

      if (!response.ok) {
        const err: AuthApiError = await response.json();
        throw new Error(err.message || 'Signup failed');
      }

      const data: AuthResponse = await response.json();
      setUser(data.user);
      setAccessToken(data.tokens.accessToken);
      setRefreshToken(data.tokens.refreshToken);
      persistAuthState(data.user, data.tokens.accessToken, data.tokens.refreshToken, data.tokens.expiresIn);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuthState]);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      setError('No refresh token available');
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Refresh failed, clear auth
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('auth_state');
        throw new Error('Token refresh failed');
      }

      const data: AuthResponse = await response.json();
      setAccessToken(data.tokens.accessToken);
      setRefreshToken(data.tokens.refreshToken);
      persistAuthState(user, data.tokens.accessToken, data.tokens.refreshToken, data.tokens.expiresIn);
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setError('Session expired');
    }
  }, [refreshToken, user, persistAuthState]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err: AuthApiError = await response.json();
        throw new Error(err.message || 'Profile update failed');
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      persistAuthState(updatedUser, accessToken, refreshToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshToken, persistAuthState]);

  /**
   * Check if user has required role(s)
   */
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (typeof role === 'string') return user.role === role;
    return role.includes(user.role);
  }, [user]);

  /**
   * Check if user has required permission
   * (Can be extended with permission system)
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Define role-based permissions
    const rolePermissions: Record<UserRole, string[]> = {
      user: ['read', 'comment'],
      moderator: ['read', 'comment', 'moderate'],
      admin: ['*'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission) || permissions.includes('*');
  }, [user]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    accessToken,
    refreshToken,
    login,
    logout,
    signup,
    refreshAccessToken,
    updateProfile,
    hasRole,
    hasPermission,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 * 
 * @throws Error if used outside AuthProvider
 * @returns Auth context value with state and methods
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
