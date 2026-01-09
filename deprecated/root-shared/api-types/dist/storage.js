/**
 * Blob Storage types
 *
 * Mirrors Rust types in:
 * - app/backend/crates/api/src/storage/types.rs
 * - app/backend/crates/api/src/routes/blobs.rs
 */
// ============================================
// Constants
// ============================================
/**
 * Allowed MIME types for uploads
 * Matches ALLOWED_MIME_TYPES in Rust
 */
export const ALLOWED_MIME_TYPES = [
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/json',
    'text/plain',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
];
/**
 * File size limits in bytes
 */
export const SIZE_LIMITS = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
    MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50 MB
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB
};
/**
 * Signed URL expiry times in seconds
 */
export const SIGNED_URL_EXPIRY = {
    DOWNLOAD: 3600, // 1 hour
    UPLOAD: 300, // 5 minutes
};
// ============================================
// Helper Functions
// ============================================
/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mime) {
    return ALLOWED_MIME_TYPES.includes(mime);
}
/**
 * Get category from MIME type
 */
export function getCategoryFromMimeType(mimeType) {
    if (mimeType.startsWith('audio/'))
        return 'audio';
    if (mimeType.startsWith('image/'))
        return 'images';
    if (mimeType.includes('zip'))
        return 'exports';
    return 'other';
}
/**
 * Get max file size for MIME type
 */
export function getMaxSizeForMime(mimeType) {
    if (mimeType.startsWith('audio/'))
        return SIZE_LIMITS.MAX_AUDIO_SIZE;
    if (mimeType.startsWith('image/'))
        return SIZE_LIMITS.MAX_IMAGE_SIZE;
    return SIZE_LIMITS.MAX_FILE_SIZE;
}
//# sourceMappingURL=storage.js.map