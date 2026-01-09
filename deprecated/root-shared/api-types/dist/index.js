/**
 * @ignition/api-types
 *
 * Shared API types for Ignition frontend and admin.
 * Single source of truth for request/response types.
 *
 * @example
 * ```typescript
 * import type { User, ApiResponse, FocusSession } from '@ignition/api-types';
 * import { isAllowedMimeType, ApiClientError } from '@ignition/api-types';
 * ```
 */
export { isSuccess, isClientError, isServerError, } from './common.js';
export { ALLOWED_MIME_TYPES, SIZE_LIMITS, SIGNED_URL_EXPIRY, isAllowedMimeType, getCategoryFromMimeType, getMaxSizeForMime, } from './storage.js';
// ============================================
// Error Utilities
// ============================================
export { ApiClientError, isApiClientError, getErrorMessage, } from './errors.js';
//# sourceMappingURL=index.js.map