/**
 * Error types for API responses
 *
 * Re-exports from common.ts plus additional error utilities
 */
export { type ApiError, type ApiErrorType, isSuccess, isClientError, isServerError, } from './common.js';
/**
 * Custom error class for API errors
 */
export declare class ApiClientError extends Error {
    readonly type: string;
    readonly status: number;
    readonly details: Record<string, unknown> | undefined;
    constructor(error: {
        error: {
            type: string;
            message: string;
            details?: Record<string, unknown>;
        };
    }, status?: number);
    /**
     * Check if this is a specific error type
     */
    isType(type: string): boolean;
    /**
     * Check if this is an authentication error
     */
    isAuthError(): boolean;
    /**
     * Check if this is a validation error
     */
    isValidationError(): boolean;
    /**
     * Check if this is a not found error
     */
    isNotFound(): boolean;
    /**
     * Check if this is a CSRF error
     */
    isCsrfError(): boolean;
}
/**
 * Type guard for ApiClientError
 */
export declare function isApiClientError(error: unknown): error is ApiClientError;
/**
 * Extract error message from unknown error
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=errors.d.ts.map