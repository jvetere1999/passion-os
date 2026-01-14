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
  approved: boolean;
  ageVerified: boolean;
  tosAccepted: boolean;
}

/**
 * Session response from backend
 */
export interface SessionResponse {
  user: AuthUser | null;
}

interface RawAuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  entitlements?: string[];
  approved?: boolean;
  age_verified?: boolean;
  ageVerified?: boolean;
  tos_accepted?: boolean;
  tosAccepted?: boolean;
}

function normalizeAuthUser(raw: RawAuthUser): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    image: raw.image ?? null,
    role: raw.role,
    entitlements: raw.entitlements ?? [],
    approved: raw.approved ?? false,
    ageVerified: raw.age_verified ?? raw.ageVerified ?? false,
    tosAccepted: raw.tos_accepted ?? raw.tosAccepted ?? false,
  };
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
    console.log('[getSession] Fetching from:', `${API_BASE_URL}/auth/session`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[getSession] Response not OK, status:', response.status);
      return { user: null };
    }
    
    const data = await response.json() as { user: RawAuthUser | null };
    console.log('[getSession] Got response:', data);
    return {
      user: data.user ? normalizeAuthUser(data.user) : null,
    };
  } catch (err) {
    console.error('[getSession] Error:', err);
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
 * 
 * @param redirect - Whether to redirect to home page after sign out (default: true)
 *                   Set to false when called from handle401() to avoid double redirect
 */
export async function signOut(redirect: boolean = true): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('[Auth] Backend session destroyed');
  } catch (error) {
    console.error('[Auth] Error calling signout:', error);
    // Continue anyway - we may still redirect
  }
  
  // Only redirect if requested (e.g., user-initiated logout)
  if (redirect && typeof window !== 'undefined') {
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
