/**
 * API Client Core
 *
 * Single source of truth for all API requests.
 * Used by both frontend and admin applications.
 */
import type { ApiError, ApiErrorType } from '@ignition/api-types';
import type { ApiClientConfig } from './config.js';
/**
 * API Client Error
 */
export declare class ApiClientError extends Error {
    readonly type: ApiErrorType;
    readonly status: number;
    readonly details: Record<string, unknown> | undefined;
    constructor(message: string, type: ApiErrorType, status: number, details?: Record<string, unknown>);
    static fromApiError(error: ApiError, status: number): ApiClientError;
    isAuthError(): boolean;
    isValidationError(): boolean;
    isNotFound(): boolean;
    isCsrfError(): boolean;
    isForbidden(): boolean;
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
export declare class ApiClient {
    private config;
    constructor(config?: Partial<ApiClientConfig>);
    /**
     * Update client configuration
     */
    configure(config: Partial<ApiClientConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<ApiClientConfig>;
    /**
     * Build full URL with query parameters
     */
    private buildUrl;
    /**
     * Build request headers
     */
    private buildHeaders;
    /**
     * Execute a fetch request with error handling
     */
    private execute;
    /**
     * GET request
     */
    get<T>(path: string, options?: ApiRequestOptions): Promise<T>;
    /**
     * POST request
     */
    post<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T>;
    /**
     * PUT request
     */
    put<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T>;
    /**
     * PATCH request
     */
    patch<T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions): Promise<T>;
    /**
     * DELETE request
     */
    delete<T>(path: string, options?: ApiRequestOptions): Promise<T>;
    /**
     * Upload file via multipart form data
     */
    upload<T>(path: string, file: File | Blob, fieldName?: string, additionalFields?: Record<string, string>, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>;
}
/**
 * Get or create the default API client
 */
export declare function getApiClient(): ApiClient;
/**
 * Configure the default API client
 */
export declare function configureApiClient(config: Partial<ApiClientConfig>): void;
/**
 * Convenience methods using default client
 */
export declare const api: {
    get: <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
    post: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) => Promise<T>;
    put: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) => Promise<T>;
    patch: <T, B = unknown>(path: string, body?: B, options?: ApiRequestOptions) => Promise<T>;
    delete: <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
    upload: <T>(path: string, file: File | Blob, fieldName?: string, additionalFields?: Record<string, string>, options?: Omit<ApiRequestOptions, "body">) => Promise<T>;
};
//# sourceMappingURL=client.d.ts.map