/**
 * Admin API Client Wrapper
 *
 * Single source of truth for all admin API communication.
 * Mirrors the frontend client pattern for consistency.
 *
 * MIGRATION: Extracted for admin app January 2026
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
 * Parse error response from API
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    return new ApiError(
      body.error?.message || body.message || `API error: ${response.status}`,
      response.status,
      body.error?.type || body.error || 'api_error',
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
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // CSRF protection for state-changing requests
      ...(options.method && options.method !== 'GET' ? { 'Origin': typeof window !== 'undefined' ? window.location.origin : '' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================
// HTTP Method Helpers
// ============================================

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Build a URL with query parameters
 */
export function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

// Re-export the base URL for modules that need it
export { API_BASE_URL };
