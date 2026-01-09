/**
 * API Client Core
 *
 * Single source of truth for all API requests.
 * Used by both frontend and admin applications.
 */

import type {
  ApiResponse,
  ApiError,
  ApiErrorType,
} from '@ignition/api-types';

import type { ApiClientConfig } from './config.js';
import { getDefaultConfig } from './config.js';

/**
 * API Client Error
 */
export class ApiClientError extends Error {
  public readonly type: ApiErrorType;
  public readonly status: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    type: ApiErrorType,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.type = type;
    this.status = status;
    this.details = details;
  }

  static fromApiError(error: ApiError, status: number): ApiClientError {
    return new ApiClientError(
      error.error.message,
      error.error.type,
      status,
      error.error.details
    );
  }

  isAuthError(): boolean {
    return this.type === 'unauthorized' || this.type === 'session_expired';
  }

  isValidationError(): boolean {
    return this.type === 'validation_error' || this.type === 'bad_request';
  }

  isNotFound(): boolean {
    return this.type === 'not_found';
  }

  isCsrfError(): boolean {
    return this.type === 'csrf_violation' || this.type === 'invalid_origin';
  }

  isForbidden(): boolean {
    return this.type === 'forbidden';
  }
}

/**
 * Request options extending standard RequestInit
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip automatic retry */
  noRetry?: boolean;
  /** Custom timeout for this request */
  timeout?: number;
}

/**
 * API Client class
 */
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }

  /**
   * Update client configuration
   */
  configure(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ApiClientConfig> {
    return { ...this.config };
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);

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
   * Build request headers
   */
  private buildHeaders(method: string, customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    // Always set Content-Type for JSON
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add custom headers from config
    Object.entries(this.config.headers).forEach(([key, value]) => {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    });

    // Add Origin header for CSRF protection on state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (typeof window !== 'undefined' && !headers.has('Origin')) {
        headers.set('Origin', window.location.origin);
      }
    }

    return headers;
  }

  /**
   * Execute a fetch request with error handling
   */
  private async execute<T>(
    method: string,
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { body, params, noRetry, timeout, headers: customHeaders, ...fetchOptions } = options;

    const url = this.buildUrl(path, params);
    const headers = this.buildHeaders(method, customHeaders);

    let requestInit: RequestInit = {
      ...fetchOptions,
      method,
      headers,
      credentials: this.config.credentials,
    };

    // Add body if present
    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    // Apply request hook
    if (this.config.onRequest) {
      requestInit = await this.config.onRequest(requestInit, url);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
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

        const error = ApiClientError.fromApiError(errorBody, response.status);

        // Call error hooks
        if (error.isAuthError() && this.config.onAuthError) {
          await this.config.onAuthError();
        }
        if (error.isCsrfError() && this.config.onCsrfError) {
          await this.config.onCsrfError();
        }

        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('Content-Type');
      if (!contentType?.includes('application/json')) {
        return undefined as T;
      }

      // Parse JSON response
      const result = await response.json() as ApiResponse<T>;

      // Handle wrapped responses (with data property) and unwrapped
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data;
      }

      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError(
          'Request timeout',
          'internal_error',
          0
        );
      }

      // Re-throw ApiClientError
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Wrap unknown errors
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        'internal_error',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.execute<T>('GET', path, options);
  }

  /**
   * POST request
   */
  async post<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T> {
    return this.execute<T>('POST', path, { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T> {
    return this.execute<T>('PUT', path, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T> {
    return this.execute<T>('PATCH', path, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.execute<T>('DELETE', path, options);
  }

  /**
   * Upload file via multipart form data
   */
  async upload<T>(
    path: string,
    file: File | Blob,
    fieldName: string = 'file',
    additionalFields?: Record<string, string>,
    options?: Omit<ApiRequestOptions, 'body'>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const { headers: customHeaders, ...fetchOptions } = options ?? {};
    const headers = new Headers(customHeaders);

    // Don't set Content-Type - let browser set it with boundary
    headers.delete('Content-Type');

    // Add Origin for CSRF
    if (typeof window !== 'undefined') {
      headers.set('Origin', window.location.origin);
    }

    const url = this.buildUrl(path, undefined);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: this.config.credentials,
      ...fetchOptions,
    });

    if (!response.ok) {
      let errorBody: ApiError;
      try {
        errorBody = await response.json() as ApiError;
      } catch {
        errorBody = {
          error: {
            type: 'internal_error',
            message: `Upload failed: HTTP ${response.status}`,
          },
        };
      }
      throw ApiClientError.fromApiError(errorBody, response.status);
    }

    const result = await response.json() as ApiResponse<T>;
    return 'data' in result ? result.data : result as T;
  }
}

/**
 * Default API client instance
 */
let defaultClient: ApiClient | null = null;

/**
 * Get or create the default API client
 */
export function getApiClient(): ApiClient {
  if (!defaultClient) {
    defaultClient = new ApiClient();
  }
  return defaultClient;
}

/**
 * Configure the default API client
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  getApiClient().configure(config);
}

/**
 * Convenience methods using default client
 */
export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    getApiClient().get<T>(path, options),

  post: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) =>
    getApiClient().post<T, B>(path, body, options),

  put: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) =>
    getApiClient().put<T, B>(path, body, options),

  patch: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) =>
    getApiClient().patch<T, B>(path, body, options),

  delete: <T>(path: string, options?: ApiRequestOptions) =>
    getApiClient().delete<T>(path, options),

  upload: <T>(
    path: string,
    file: File | Blob,
    fieldName?: string,
    additionalFields?: Record<string, string>,
    options?: Omit<ApiRequestOptions, 'body'>
  ) => getApiClient().upload<T>(path, file, fieldName, additionalFields, options),
};

