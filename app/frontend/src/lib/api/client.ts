/**
 * API Client Wrapper
 *
 * Single source of truth for all API communication.
 * Eliminates duplicated fetch logic across API modules.
 *
 * MIGRATION: Extracted from individual API modules January 2026
 */

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

/**
 * API Error with typed details
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    type: string = 'api_error',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.details = details;
  }

  isAuthError(): boolean {
    return this.type === 'unauthorized' || this.status === 401;
  }

  isNotFound(): boolean {
    return this.type === 'not_found' || this.status === 404;
  }

  isForbidden(): boolean {
    return this.type === 'forbidden' || this.status === 403;
  }

  isValidation(): boolean {
    return this.type === 'validation_error' || this.status === 400;
  }
}

/**
 * Clear all client data on session expiry (401)
 * This function handles cleanup when backend session is invalid
 */
async function clearAllClientData(): Promise<void> {
  // Clear any localStorage data that might contain session info
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const keysToRemove = Array.from(localStorage.keys()).filter(key =>
        key.includes('session') || key.includes('auth') || key.includes('token')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('[API] Error clearing localStorage:', error);
    }
  }

  // Try to call signOut from API (this will clear server-side session)
  if (typeof window !== 'undefined') {
    try {
      const { signOut: apiSignOut } = await import('@/lib/auth/api-auth');
      await apiSignOut();
    } catch (error) {
      console.error('[API] Error calling API signOut:', error);
      // Continue anyway - we'll redirect
    }
  }
}

/**
 * Handle 401 Unauthorized response - session expired or invalid
 */
async function handle401(): Promise<void> {
  console.warn('[API] 401 Unauthorized - Session expired, clearing client data');

  // Clear all client-side session data
  await clearAllClientData();

  // Show error notification
  if (typeof window !== 'undefined') {
    try {
      const { useErrorStore } = await import('@/lib/hooks/useErrorNotification');
      const store = useErrorStore.getState();
      store.addError({
        id: `session-expired-${Date.now()}`,
        timestamp: new Date(),
        message: 'Your session has expired. Please log in again.',
        endpoint: '/login',
        method: 'REDIRECT',
        status: 401,
        type: 'error',
        details: { reason: 'session_expired' },
      });
    } catch (error) {
      console.error('[API] Error showing notification:', error);
    }

    // Redirect to login after brief delay to allow notification to display
    setTimeout(() => {
      window.location.href = '/login?session_expired=true';
    }, 1000);
  }
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json() as {
      error?: { message?: string; type?: string; details?: Record<string, unknown> };
      message?: string;
    };
    return new ApiError(
      body.error?.message || body.message || `API error: ${response.status}`,
      response.status,
      body.error?.type || 'api_error',
      body.error?.details
    );
  } catch {
    return new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request headers */
  headers?: Record<string, string>;
  /** Skip credentials (cookies) */
  noCredentials?: boolean;
  /** Request timeout in ms */
  timeout?: number;
}

/**
 * Build URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Execute fetch with standard configuration
 * Automatically tracks errors via error notification system if available
 */
async function executeFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = buildUrl(path, options.params);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Origin header for CSRF protection on state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    if (typeof window !== 'undefined') {
      headers['Origin'] = window.location.origin;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: options.noCredentials ? 'omit' : 'include',
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Apply timeout
  const controller = new AbortController();
  const timeoutId = options.timeout
    ? setTimeout(() => controller.abort(), options.timeout)
    : undefined;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Handle 401 Unauthorized - Session expired or invalid
    if (response.status === 401) {
      await handle401();
      throw new ApiError('Session expired', 401, 'unauthorized');
    }

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    
    let apiError: ApiError;
    
    if (error instanceof ApiError) {
      apiError = error;
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      apiError = new ApiError('Request timeout', 408, 'timeout');
    } else {
      apiError = new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'network_error'
      );
    }

    // Track error in notification system if available
    if (typeof window !== 'undefined') {
      try {
        // Dynamically import to avoid circular dependencies
        const { useErrorStore } = await import('@/lib/hooks/useErrorNotification');
        const store = useErrorStore.getState();
        store.addError({
          id: `api-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          message: apiError.message,
          endpoint: path,
          method,
          status: apiError.status,
          type: 'error',
          details: apiError.details,
        });
      } catch {
        // Error notification system not available, silently continue
      }
    }

    throw apiError;
  }
}

// ============================================
// HTTP Methods
// ============================================

/**
 * GET request
 */
export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return executeFetch<T>('GET', path, undefined, options);
}

/**
 * POST request
 */
export async function apiPost<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return executeFetch<T>('POST', path, body, options);
}

/**
 * PUT request
 */
export async function apiPut<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return executeFetch<T>('PUT', path, body, options);
}

/**
 * PATCH request
 */
export async function apiPatch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return executeFetch<T>('PATCH', path, body, options);
}

/**
 * DELETE request
 */
export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return executeFetch<T>('DELETE', path, undefined, options);
}

// ============================================
// Convenience Exports
// ============================================

export { API_BASE_URL };
