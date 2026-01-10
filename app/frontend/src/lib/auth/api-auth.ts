/**
 * Auth API Client
 *
 * Calls the Rust backend for all auth operations.
 * Frontend performs 0% auth logic beyond storing and forwarding cookies.
 *
 * Backend endpoints:
 * - GET  /auth/providers     - List available OAuth providers
 * - GET  /auth/signin/google - Start Google OAuth flow
 * - GET  /auth/signin/azure  - Start Azure OAuth flow
 * - GET  /auth/session       - Get current session
 * - POST /auth/signout       - Destroy session
 * - POST /auth/verify-age    - Verify age (COPPA)
 * - POST /auth/accept-tos    - Accept Terms of Service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

/**
 * User session from backend
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  entitlements: string[];
  ageVerified: boolean;
  tosAccepted: boolean;
}

/**
 * Session response from backend
 */
export interface SessionResponse {
  user: AuthUser | null;
}

/**
 * OAuth provider info
 */
export interface AuthProvider {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * Get available OAuth providers from backend
 */
export async function getProviders(): Promise<AuthProvider[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/providers`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

/**
 * Get current session from backend
 * Cookie-based auth - session cookie is automatically sent
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return { user: null };
    }
    return response.json();
  } catch {
    return { user: null };
  }
}

/**
 * Get OAuth sign-in URL for a provider
 * User will be redirected to this URL to start OAuth flow
 * @param provider - OAuth provider ('google' or 'azure')
 * @param redirectPath - Optional path to redirect to after auth (e.g. '/today')
 */
export function getSignInUrl(provider: 'google' | 'azure', redirectPath?: string | null): string {
  const baseUrl = `${API_BASE_URL}/auth/signin/${provider}`;
  if (redirectPath) {
    // Build full redirect URL from the frontend origin
    const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullRedirectUrl = `${frontendOrigin}${redirectPath}`;
    return `${baseUrl}?redirect_uri=${encodeURIComponent(fullRedirectUrl)}`;
  }
  return baseUrl;
}

/**
 * Sign out - destroy session on backend
 */
export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Ignore errors - redirect anyway
  }
  // Redirect to home page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

/**
 * Verify age (COPPA compliance)
 */
export async function verifyAge(is13OrOlder: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-age`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_13_or_older: is13OrOlder }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Accept Terms of Service
 */
export async function acceptTos(version: string = '1.0'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/accept-tos`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted: true, version }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
