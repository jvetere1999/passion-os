/**
 * Blob Storage types
 *
 * Mirrors Rust types in:
 * - app/backend/crates/api/src/storage/types.rs
 * - app/backend/crates/api/src/routes/blobs.rs
 */
import type { UUID, ISOTimestamp } from './common.js';
/**
 * Blob category for organizing storage
 * Matches Rust BlobCategory
 */
export type BlobCategory = 'audio' | 'images' | 'exports' | 'other';
/**
 * Allowed MIME types for uploads
 * Matches ALLOWED_MIME_TYPES in Rust
 */
export declare const ALLOWED_MIME_TYPES: readonly ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav", "audio/ogg", "audio/flac", "audio/aac", "audio/m4a", "audio/x-m4a", "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf", "application/json", "text/plain", "application/zip", "application/x-zip-compressed"];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
/**
 * File size limits in bytes
 */
export declare const SIZE_LIMITS: {
    readonly MAX_FILE_SIZE: number;
    readonly MAX_AUDIO_SIZE: number;
    readonly MAX_IMAGE_SIZE: number;
};
/**
 * Signed URL expiry times in seconds
 */
export declare const SIGNED_URL_EXPIRY: {
    readonly DOWNLOAD: 3600;
    readonly UPLOAD: 300;
};
/**
 * Check if MIME type is allowed
 */
export declare function isAllowedMimeType(mime: string): mime is AllowedMimeType;
/**
 * Get category from MIME type
 */
export declare function getCategoryFromMimeType(mimeType: string): BlobCategory;
/**
 * Get max file size for MIME type
 */
export declare function getMaxSizeForMime(mimeType: string): number;
/**
 * Request signed upload URL
 * POST /api/blobs/upload-url
 */
export interface UploadUrlRequest {
    filename: string;
    mime_type: string;
}
/**
 * Upload response
 * POST /api/blobs/upload
 */
export interface UploadResponse {
    id: UUID;
    key: string;
    size_bytes: number;
    mime_type: string;
    category: BlobCategory;
}
/**
 * Blob info response
 * GET /api/blobs/:id/info
 */
export interface BlobInfo {
    id: UUID;
    key: string;
    size_bytes: number;
    mime_type: string;
    category: BlobCategory;
    filename: string;
    uploaded_at: ISOTimestamp;
    etag?: string;
}
/**
 * Signed URL response
 * GET /api/blobs/:id/download-url
 * POST /api/blobs/upload-url
 */
export interface SignedUrlResponse {
    url: string;
    expires_at: ISOTimestamp;
    method: 'GET' | 'PUT';
}
/**
 * Delete response
 * DELETE /api/blobs/:id
 */
export interface DeleteBlobResponse {
    success: boolean;
}
/**
 * Storage usage response
 * GET /api/blobs/usage
 */
export interface StorageUsageResponse {
    total_bytes: number;
    formatted: string;
}
/**
 * List blobs response
 * GET /api/blobs
 */
export type ListBlobsResponse = BlobInfo[];
/**
 * List query parameters
 */
export interface ListBlobsQuery {
    category?: BlobCategory;
}
//# sourceMappingURL=storage.d.ts.map