/**
 * Authentication Utilities
 * 
 * Helper functions for working with authentication tokens, sessions,
 * and API requests with automatic token management.
 */

import { AuthApiError, AuthTokens } from './types';

/**
 * Parse JWT token payload (without verification)
 * Note: Only use for reading claims, not for security decisions
 */
export function parseJwtToken<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = atob(parts[1]);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwtToken<{ exp?: number }>(token);
  if (!payload || !payload.exp) return true;

  // Check if expiration is within 1 minute (refresh if close to expiry)
  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  return expiresAt <= Date.now() + 60000; // 1 minute buffer
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiresIn(token: string): number {
  const payload = parseJwtToken<{ exp?: number }>(token);
  if (!payload || !payload.exp) return 0;

  const expiresAt = payload.exp * 1000;
  const secondsUntilExpiry = (expiresAt - Date.now()) / 1000;
  return Math.max(0, secondsUntilExpiry);
}

/**
 * Format API error response
 */
export function formatAuthError(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === 'object' && error !== null) {
    const apiError = error as AuthApiError;
    return apiError.message || 'An authentication error occurred';
  }

  return 'An unexpected error occurred';
}

/**
 * Parse API error response
 */
export function parseAuthError(response: Response, data: unknown): AuthApiError {
  if (typeof data === 'object' && data !== null && 'code' in data) {
    return data as AuthApiError;
  }

  return {
    code: `HTTP_${response.status}`,
    message: `Request failed with status ${response.status}`,
  };
}

/**
 * Check if error is a 401 Unauthorized error
 */
export function is401Error(error: unknown): boolean {
  if (error instanceof Response) return error.status === 401;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as AuthApiError).code === 'HTTP_401' || (error as AuthApiError).code === 'UNAUTHORIZED';
  }
  return false;
}

/**
 * Check if error is a 403 Forbidden error
 */
export function is403Error(error: unknown): boolean {
  if (error instanceof Response) return error.status === 403;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as AuthApiError).code === 'HTTP_403' || (error as AuthApiError).code === 'FORBIDDEN';
  }
  return false;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Returns: { isValid, strength: 'weak' | 'medium' | 'strong' }
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  messages: string[];
} {
  const messages: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    messages.push('Password must be at least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain lowercase letters');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain numbers');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    messages.push('Password should contain special characters');
  }

  const strength = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';
  const isValid = score >= 3; // Require at least 3 criteria

  return { isValid, strength, messages };
}

/**
 * Encode URL parameter
 */
export function encodeUrlParam(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Decode URL parameter
 */
export function decodeUrlParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Build login redirect URL with return path
 */
export function buildLoginRedirectUrl(returnPath?: string): string {
  const loginUrl = '/login';
  if (!returnPath) return loginUrl;

  return `${loginUrl}?from=${encodeUrlParam(returnPath)}`;
}

/**
 * Extract return path from query parameters
 */
export function getReturnPath(searchParams: URLSearchParams, defaultPath: string = '/'): string {
  const from = searchParams.get('from');
  if (!from) return defaultPath;

  // Validate that the path is safe (prevent open redirect)
  if (from.startsWith('/')) {
    return from;
  }

  return defaultPath;
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get auth header for API requests
 */
export function getAuthHeader(accessToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Safely store sensitive data
 * In production, consider using httpOnly cookies instead
 */
export const SessionStorage = {
  set(key: string, value: string): void {
    if (isBrowser()) {
      sessionStorage.setItem(key, value);
    }
  },

  get(key: string): string | null {
    if (isBrowser()) {
      return sessionStorage.getItem(key);
    }
    return null;
  },

  remove(key: string): void {
    if (isBrowser()) {
      sessionStorage.removeItem(key);
    }
  },

  clear(): void {
    if (isBrowser()) {
      sessionStorage.clear();
    }
  },
};

/**
 * Session expiration handler
 * Monitors token expiration and triggers refresh or logout
 */
export class SessionMonitor {
  private refreshTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;

  constructor(
    private onExpiringSoon: () => void,
    private onExpired: () => void
  ) {}

  /**
   * Start monitoring token expiration
   */
  start(expiresIn: number): void {
    this.clear();

    if (expiresIn <= 0) {
      this.onExpired();
      return;
    }

    // Warn 5 minutes before expiration
    const warningTime = (expiresIn - 300) * 1000;
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.onExpiringSoon();
      }, warningTime);
    }

    // Logout when expired
    this.refreshTimer = setTimeout(() => {
      this.onExpired();
    }, expiresIn * 1000);
  }

  /**
   * Stop monitoring
   */
  clear(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    this.refreshTimer = null;
    this.warningTimer = null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clear();
  }
}
