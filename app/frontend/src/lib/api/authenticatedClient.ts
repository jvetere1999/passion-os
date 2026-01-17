/**
 * Authenticated API Client
 * 
 * Wrapper for fetch that automatically handles authentication headers,
 * token refresh, and 401 error responses. Integrates with AuthProvider.
 */

'use client';

import { useAuth } from './AuthProvider';
import { useCallback, useRef } from 'react';

export interface ApiClientOptions extends RequestInit {
  // Optional: custom base URL (defaults to /api)
  baseUrl?: string;
  // Optional: retry on 401 (defaults to true)
  retryOnUnauth?: boolean;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Hook to get authenticated API client
 * 
 * Usage:
 * ```tsx
 * const api = useApiClient();
 * const response = await api.get('/users/me');
 * ```
 */
export function useApiClient() {
  const { refresh } = useAuth();
  const isRefreshingRef = useRef(false);

  /**
   * Make authenticated API request
   */
  const request = useCallback(
    async <T,>(
      path: string,
      options: ApiClientOptions = {}
    ): Promise<ApiResponse<T>> => {
      const {
        baseUrl = '/api',
        retryOnUnauth = true,
        headers: customHeaders = {},
        ...fetchOptions
      } = options;

      const url = `${baseUrl}${path}`;

      // Prepare headers with credentials
      const headers = new Headers(customHeaders as HeadersInit);
      headers.set('Content-Type', 'application/json');

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          credentials: 'include', // Important: send cookies with requests
          headers,
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && retryOnUnauth) {
          // Prevent multiple simultaneous refresh attempts
          if (!isRefreshingRef.current) {
            isRefreshingRef.current = true;
            try {
              await refresh();
              isRefreshingRef.current = false;

              // Retry the original request
              return request<T>(path, options);
            } catch (err) {
              isRefreshingRef.current = false;
              console.error('Failed to refresh auth:', err);
              // Redirect to login - let AuthProvider handle this
              return {
                ok: false,
                status: 401,
                error: 'Authentication failed',
              };
            }
          }
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        return {
          ok: response.ok,
          status: response.status,
          data: response.ok ? data : undefined,
          error: !response.ok ? data?.message || data : undefined,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        console.error(`API request failed for ${path}:`, message);
        return {
          ok: false,
          status: 0,
          error: message,
        };
      }
    },
    [refresh]
  );

  /**
   * GET request
   */
  const get = useCallback(
    <T,>(path: string, options?: ApiClientOptions) =>
      request<T>(path, { ...options, method: 'GET' }),
    [request]
  );

  /**
   * POST request
   */
  const post = useCallback(
    <T,>(path: string, body?: any, options?: ApiClientOptions) =>
      request<T>(path, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  );

  /**
   * PUT request
   */
  const put = useCallback(
    <T,>(path: string, body?: any, options?: ApiClientOptions) =>
      request<T>(path, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  );

  /**
   * PATCH request
   */
  const patch = useCallback(
    <T,>(path: string, body?: any, options?: ApiClientOptions) =>
      request<T>(path, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  );

  /**
   * DELETE request
   */
  const deleteRequest = useCallback(
    <T,>(path: string, options?: ApiClientOptions) =>
      request<T>(path, { ...options, method: 'DELETE' }),
    [request]
  );

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
  };
}

/**
 * Simple authenticated fetch wrapper (server-safe)
 * For use in server components that need auth token
 */
export async function authenticatedFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const url = `/api${path}`;

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}
