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
 * Clear the session cookie from the browser
 * Used when the backend rejects a session as invalid/expired
 */
function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  
  try {
    // Set cookie with empty value and immediate expiration
    document.cookie = 'session=; Max-Age=0; Path=/; Domain=.ecent.online; Secure; SameSite=None;';
    // Also try localhost for development
    document.cookie = 'session=; Max-Age=0; Path=/;';
    console.log('[clearSessionCookie] Cleared invalid session cookie');
  } catch (err) {
    console.warn('[clearSessionCookie] Error clearing cookie:', err);
  }
}

/**
 * Get current session from backend
 * Cookie-based auth - session cookie is automatically sent
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    console.log('[getSession] Fetching from:', `${API_BASE_URL}/auth/session`);
    console.log('[getSession] API_BASE_URL:', API_BASE_URL);
    
    // Debug: check if cookies exist
    if (typeof document !== 'undefined') {
      try {
        const cookieString = document.cookie;
        console.log('[getSession] Document has cookies:', cookieString.length > 0);
        console.log('[getSession] document.cookie:', cookieString);
      } catch (cookieError) {
        console.warn('[getSession] Unable to read document.cookie:', cookieError);
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[getSession] Response status:', response.status);
    try {
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('[getSession] Response headers set-cookie:', setCookieHeader);
    } catch (headersError) {
      console.warn(
        '[getSession] Unable to read set-cookie header (CORS restrictions):',
        headersError
      );
    }
    
    if (!response.ok) {
      console.log('[getSession] Response not OK, status:', response.status);
      clearSessionCookie();
      return { user: null };
    }
    
    const data = await response.json() as { user: RawAuthUser | null };
    console.log('[getSession] Got response:', data);
    
    // If backend returns no user, the session is invalid - clear the cookie
    if (!data.user) {
      console.log('[getSession] Backend returned null user, clearing invalid session cookie');
      clearSessionCookie();
    }
    
    return {
      user: data.user ? normalizeAuthUser(data.user) : null,
    };
  } catch (err) {
    console.error('[getSession] Error:', err);
    clearSessionCookie();
    return { user: null };
  }
}

/**
 * Get OAuth sign-in URL for a provider
 * User will be redirected to this URL to start OAuth flow
 * @param provider - OAuth provider ('google' or 'azure')
 * @param redirectPath - Optional path to redirect to after auth (e.g. '/today')
 * @param mode - 'signin' or 'signup' (default: 'signin')
 */
export function getSignInUrl(provider: 'google' | 'azure', redirectPath?: string | null, mode: 'signin' | 'signup' = 'signin'): string {
  const baseUrl = `${API_BASE_URL}/auth/signin/${provider}`;
  const params = new URLSearchParams();
  
  if (mode === 'signup') {
    params.append('mode', 'signup');
  }
  
  if (redirectPath) {
    // Build full redirect URL from the frontend origin
    const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullRedirectUrl = `${frontendOrigin}${redirectPath}`;
    params.append('redirect_uri', fullRedirectUrl);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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
