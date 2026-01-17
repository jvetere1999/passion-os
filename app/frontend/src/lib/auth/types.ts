/**
 * Authentication Type Definitions
 * 
 * Core types for authentication system, user state, roles, permissions,
 * and auth-related responses.
 */

/**
 * User roles in the application
 * Controls access to protected routes and features
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * User authentication state and profile
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Authentication token pair (access + refresh)
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiration
}

/**
 * Authentication response from backend
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Authentication state context value
 */
export interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth tokens (not exposed to UI, only for internal use)
  accessToken: string | null;
  refreshToken: string | null;

  // Methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;

  // Check role/permissions
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Signup request payload
 */
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * API error response
 */
export interface AuthApiError {
  code: string;
  message: string;
  details?: Record<string, string | string[]>;
}

/**
 * Route metadata for route protection
 */
export interface RouteMeta {
  requiresAuth: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string; // Redirect if not authorized
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  name: string;
  meta: RouteMeta;
  component?: React.ComponentType<any>;
  children?: RouteConfig[];
}

/**
 * Session info for monitoring
 */
export interface SessionInfo {
  createdAt: number; // Timestamp when session started
  expiresAt: number; // Timestamp when session expires
  refreshedAt: number; // Timestamp of last token refresh
  isValid: boolean; // Whether session is still valid
}

/**
 * Auth state for storage/persistence
 */
export interface PersistedAuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}
