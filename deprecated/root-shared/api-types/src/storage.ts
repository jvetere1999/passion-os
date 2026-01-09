/**
 * Blob Storage types
 *
 * Mirrors Rust types in:
 * - app/backend/crates/api/src/storage/types.rs
 * - app/backend/crates/api/src/routes/blobs.rs
 */

import type { UUID, ISOTimestamp } from './common.js';

// ============================================
// Enums
// ============================================

/**
 * Blob category for organizing storage
 * Matches Rust BlobCategory
 */
export type BlobCategory = 'audio' | 'images' | 'exports' | 'other';

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
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * File size limits in bytes
 */
export const SIZE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,    // 100 MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024,    // 50 MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,    // 10 MB
} as const;

/**
 * Signed URL expiry times in seconds
 */
export const SIGNED_URL_EXPIRY = {
  DOWNLOAD: 3600,  // 1 hour
  UPLOAD: 300,     // 5 minutes
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

/**
 * Get category from MIME type
 */
export function getCategoryFromMimeType(mimeType: string): BlobCategory {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.includes('zip')) return 'exports';
  return 'other';
}

/**
 * Get max file size for MIME type
 */
export function getMaxSizeForMime(mimeType: string): number {
  if (mimeType.startsWith('audio/')) return SIZE_LIMITS.MAX_AUDIO_SIZE;
  if (mimeType.startsWith('image/')) return SIZE_LIMITS.MAX_IMAGE_SIZE;
  return SIZE_LIMITS.MAX_FILE_SIZE;
}

// ============================================
// Request Types
// ============================================

/**
 * Request signed upload URL
 * POST /api/blobs/upload-url
 */
export interface UploadUrlRequest {
  filename: string;
  mime_type: string;
}

// ============================================
// Response Types
// ============================================

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

// ============================================
// List Response
// ============================================

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

