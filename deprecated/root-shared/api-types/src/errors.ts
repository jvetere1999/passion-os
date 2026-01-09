/**
 * Error types for API responses
 *
 * Re-exports from common.ts plus additional error utilities
 */

export {
  type ApiError,
  type ApiErrorType,
  isSuccess,
  isClientError,
  isServerError,
} from './common.js';

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  public readonly type: string;
  public readonly status: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(error: { error: { type: string; message: string; details?: Record<string, unknown> } }, status: number = 400) {
    super(error.error.message);
    this.name = 'ApiClientError';
    this.type = error.error.type;
    this.status = status;
    this.details = error.error.details;
  }

  /**
   * Check if this is a specific error type
   */
  isType(type: string): boolean {
    return this.type === type;
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.type === 'unauthorized' || this.type === 'session_expired';
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.type === 'validation_error' || this.type === 'bad_request';
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return this.type === 'not_found';
  }

  /**
   * Check if this is a CSRF error
   */
  isCsrfError(): boolean {
    return this.type === 'csrf_violation' || this.type === 'invalid_origin';
  }
}

/**
 * Type guard for ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
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

