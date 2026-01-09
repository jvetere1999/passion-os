/**
 * Common types used across all API domains
 *
 * These mirror the Rust types in:
 * - app/backend/crates/api/src/db/models.rs
 * - app/backend/crates/api/src/error.rs
 */
// ============================================
// HTTP Status Helpers
// ============================================
/**
 * Check if response is success (2xx)
 */
export function isSuccess(status) {
    return status >= 200 && status < 300;
}
/**
 * Check if response is client error (4xx)
 */
export function isClientError(status) {
    return status >= 400 && status < 500;
}
/**
 * Check if response is server error (5xx)
 */
export function isServerError(status) {
    return status >= 500 && status < 600;
}
//# sourceMappingURL=common.js.map