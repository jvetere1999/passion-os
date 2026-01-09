/**
 * Error types for API responses
 *
 * Re-exports from common.ts plus additional error utilities
 */
export { isSuccess, isClientError, isServerError, } from './common.js';
/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
    type;
    status;
    details;
    constructor(error, status = 400) {
        super(error.error.message);
        this.name = 'ApiClientError';
        this.type = error.error.type;
        this.status = status;
        this.details = error.error.details;
    }
    /**
     * Check if this is a specific error type
     */
    isType(type) {
        return this.type === type;
    }
    /**
     * Check if this is an authentication error
     */
    isAuthError() {
        return this.type === 'unauthorized' || this.type === 'session_expired';
    }
    /**
     * Check if this is a validation error
     */
    isValidationError() {
        return this.type === 'validation_error' || this.type === 'bad_request';
    }
    /**
     * Check if this is a not found error
     */
    isNotFound() {
        return this.type === 'not_found';
    }
    /**
     * Check if this is a CSRF error
     */
    isCsrfError() {
        return this.type === 'csrf_violation' || this.type === 'invalid_origin';
    }
}
/**
 * Type guard for ApiClientError
 */
export function isApiClientError(error) {
    return error instanceof ApiClientError;
}
/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error) {
    if (isApiClientError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}
//# sourceMappingURL=errors.js.map