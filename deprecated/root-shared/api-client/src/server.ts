/**
 * Server-side API client utilities
 *
 * For use in Next.js Server Components and Server Actions
 */

import type { ApiResponse, ApiError } from '@ignition/api-types';
import { ApiClientError } from './client.js';
import { DEFAULT_CONFIG } from './config.js';

/**
 * Server request options
 */
export interface ServerRequestOptions {
  /** Session cookie value */
  sessionCookie?: string;
  /** Additional cookies */
  cookies?: Record<string, string>;
  /** Cache strategy */
  cache?: RequestCache;
  /** Revalidation time in seconds */
  revalidate?: number | false;
  /** Request tags for cache invalidation */
  tags?: string[];
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create cookie header from cookies object
 */
function buildCookieHeader(
  sessionCookie?: string,
  cookies?: Record<string, string>
): string {
  const parts: string[] = [];

  if (sessionCookie) {
    parts.push(`session=${sessionCookie}`);
  }

  if (cookies) {
    Object.entries(cookies).forEach(([name, value]) => {
      parts.push(`${name}=${value}`);
    });
  }

  return parts.join('; ');
}

/**
 * Server-side API client for Server Components
 */
export class ServerApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.API_URL ?? DEFAULT_CONFIG.baseUrl;
  }

  /**
   * Execute a server-side fetch
   */
  private async execute<T>(
    method: string,
    path: string,
    options: ServerRequestOptions = {},
    body?: unknown
  ): Promise<T> {
    const url = new URL(path, this.baseUrl).toString();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add cookies
    const cookieHeader = buildCookieHeader(options.sessionCookie, options.cookies);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      method,
      headers,
      cache: options.cache ?? 'no-store',
    };

    // Add Next.js specific options
    if (options.revalidate !== undefined || options.tags) {
      fetchOptions.next = {};
      if (options.revalidate !== undefined) {
        fetchOptions.next.revalidate = options.revalidate;
      }
      if (options.tags) {
        fetchOptions.next.tags = options.tags;
      }
    }

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorBody: ApiError;
      try {
        errorBody = await response.json() as ApiError;
      } catch {
        errorBody = {
          error: {
            type: 'internal_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }
      throw ApiClientError.fromApiError(errorBody, response.status);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/json')) {
      return undefined as T;
    }

    const result = await response.json() as ApiResponse<T>;
    return 'data' in result ? result.data : result as T;
  }

  async get<T>(path: string, options?: ServerRequestOptions): Promise<T> {
    return this.execute<T>('GET', path, options);
  }

  async post<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T> {
    return this.execute<T>('POST', path, options, body);
  }

  async put<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T> {
    return this.execute<T>('PUT', path, options, body);
  }

  async patch<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T> {
    return this.execute<T>('PATCH', path, options, body);
  }

  async delete<T>(path: string, options?: ServerRequestOptions): Promise<T> {
    return this.execute<T>('DELETE', path, options);
  }
}

/**
 * Create a server API client
 */
export function createServerClient(baseUrl?: string): ServerApiClient {
  return new ServerApiClient(baseUrl);
}

