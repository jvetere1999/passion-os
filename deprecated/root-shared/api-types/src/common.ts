/**
 * Common types used across all API domains
 *
 * These mirror the Rust types in:
 * - app/backend/crates/api/src/db/models.rs
 * - app/backend/crates/api/src/error.rs
 */

// ============================================
// Primitive Type Aliases
// ============================================

/**
 * UUID string (matches Rust Uuid serialized to JSON)
 */
export type UUID = string;

/**
 * ISO 8601 timestamp string (matches Rust DateTime<Utc>)
 */
export type ISOTimestamp = string;

/**
 * JSON-serialized object (for flexible metadata)
 */
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// ============================================
// API Response Envelope
// ============================================

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

/**
 * Response metadata (pagination, etc.)
 */
export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: Required<Pick<ApiMeta, 'page' | 'per_page' | 'total' | 'total_pages'>>;
}

// ============================================
// API Error Response
// ============================================

/**
 * Standard API error response
 * Matches backend AppError serialization
 */
export interface ApiError {
  error: {
    type: ApiErrorType;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Error types matching backend AppError variants
 */
export type ApiErrorType =
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'csrf_violation'
  | 'invalid_origin'
  | 'bad_request'
  | 'validation_error'
  | 'oauth_error'
  | 'session_expired'
  | 'database_error'
  | 'internal_error'
  | 'config_error';

// ============================================
// HTTP Status Helpers
// ============================================

/**
 * Check if response is success (2xx)
 */
export function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Check if response is client error (4xx)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if response is server error (5xx)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

