/**
 * API Client Core
 *
 * Single source of truth for all API requests.
 * Used by both frontend and admin applications.
 */
import { getDefaultConfig } from './config.js';
/**
 * API Client Error
 */
export class ApiClientError extends Error {
    type;
    status;
    details;
    constructor(message, type, status, details) {
        super(message);
        this.name = 'ApiClientError';
        this.type = type;
        this.status = status;
        this.details = details;
    }
    static fromApiError(error, status) {
        return new ApiClientError(error.error.message, error.error.type, status, error.error.details);
    }
    isAuthError() {
        return this.type === 'unauthorized' || this.type === 'session_expired';
    }
    isValidationError() {
        return this.type === 'validation_error' || this.type === 'bad_request';
    }
    isNotFound() {
        return this.type === 'not_found';
    }
    isCsrfError() {
        return this.type === 'csrf_violation' || this.type === 'invalid_origin';
    }
    isForbidden() {
        return this.type === 'forbidden';
    }
}
/**
 * API Client class
 */
export class ApiClient {
    config;
    constructor(config) {
        this.config = { ...getDefaultConfig(), ...config };
    }
    /**
     * Update client configuration
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Build full URL with query parameters
     */
    buildUrl(path, params) {
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
    buildHeaders(method, customHeaders) {
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
    async execute(method, path, options = {}) {
        const { body, params, noRetry, timeout, headers: customHeaders, ...fetchOptions } = options;
        const url = this.buildUrl(path, params);
        const headers = this.buildHeaders(method, customHeaders);
        let requestInit = {
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
        const timeoutId = setTimeout(() => controller.abort(), timeout ?? this.config.timeout);
        try {
            const response = await fetch(url, {
                ...requestInit,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            // Handle non-OK responses
            if (!response.ok) {
                let errorBody;
                try {
                    errorBody = await response.json();
                }
                catch {
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
                return undefined;
            }
            // Parse JSON response
            const result = await response.json();
            // Handle wrapped responses (with data property) and unwrapped
            if (result && typeof result === 'object' && 'data' in result) {
                return result.data;
            }
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            // Handle abort (timeout)
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 'internal_error', 0);
            }
            // Re-throw ApiClientError
            if (error instanceof ApiClientError) {
                throw error;
            }
            // Wrap unknown errors
            throw new ApiClientError(error instanceof Error ? error.message : 'Unknown error', 'internal_error', 0);
        }
    }
    /**
     * GET request
     */
    async get(path, options) {
        return this.execute('GET', path, options);
    }
    /**
     * POST request
     */
    async post(path, body, options) {
        return this.execute('POST', path, { ...options, body });
    }
    /**
     * PUT request
     */
    async put(path, body, options) {
        return this.execute('PUT', path, { ...options, body });
    }
    /**
     * PATCH request
     */
    async patch(path, body, options) {
        return this.execute('PATCH', path, { ...options, body });
    }
    /**
     * DELETE request
     */
    async delete(path, options) {
        return this.execute('DELETE', path, options);
    }
    /**
     * Upload file via multipart form data
     */
    async upload(path, file, fieldName = 'file', additionalFields, options) {
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
            let errorBody;
            try {
                errorBody = await response.json();
            }
            catch {
                errorBody = {
                    error: {
                        type: 'internal_error',
                        message: `Upload failed: HTTP ${response.status}`,
                    },
                };
            }
            throw ApiClientError.fromApiError(errorBody, response.status);
        }
        const result = await response.json();
        return 'data' in result ? result.data : result;
    }
}
/**
 * Default API client instance
 */
let defaultClient = null;
/**
 * Get or create the default API client
 */
export function getApiClient() {
    if (!defaultClient) {
        defaultClient = new ApiClient();
    }
    return defaultClient;
}
/**
 * Configure the default API client
 */
export function configureApiClient(config) {
    getApiClient().configure(config);
}
/**
 * Convenience methods using default client
 */
export const api = {
    get: (path, options) => getApiClient().get(path, options),
    post: (path, body, options) => getApiClient().post(path, body, options),
    put: (path, body, options) => getApiClient().put(path, body, options),
    patch: (path, body, options) => getApiClient().patch(path, body, options),
    delete: (path, options) => getApiClient().delete(path, options),
    upload: (path, file, fieldName, additionalFields, options) => getApiClient().upload(path, file, fieldName, additionalFields, options),
};
//# sourceMappingURL=client.js.map