/**
 * R2 Storage Types
 * Type definitions for blob storage operations
 */

/**
 * Supported MIME types for uploads
 */
export const ALLOWED_MIME_TYPES = [
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/json",
  "text/plain",
  // Archives (for exports)
  "application/zip",
  "application/x-zip-compressed",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Blob categories for organizing storage
 */
export type BlobCategory = "audio" | "images" | "exports" | "other";

/**
 * Get category from MIME type
 */
export function getCategoryFromMimeType(mimeType: string): BlobCategory {
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType.includes("zip")) return "exports";
  return "other";
}

/**
 * Blob metadata stored in D1
 */
export interface BlobMetadata {
  id: string;
  userId: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: BlobCategory;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Upload request
 */
export interface UploadRequest {
  userId: string;
  filename: string;
  mimeType: string;
  data: ArrayBuffer | ReadableStream<Uint8Array>;
  metadata?: Record<string, unknown>;
}

/**
 * Upload result
 */
export interface UploadResult {
  id: string;
  key: string;
  url: string;
  sizeBytes: number;
}

/**
 * Presigned URL options
 */
export interface PresignedUrlOptions {
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Size limits
 */
export const SIZE_LIMITS = {
  // Max single file upload: 100MB
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  // Max audio file: 50MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024,
  // Max image file: 10MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  // Multipart threshold: 5MB
  MULTIPART_THRESHOLD: 5 * 1024 * 1024,
} as const;

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Get size limit for MIME type
 */
export function getSizeLimit(mimeType: string): number {
  if (mimeType.startsWith("audio/")) return SIZE_LIMITS.MAX_AUDIO_SIZE;
  if (mimeType.startsWith("image/")) return SIZE_LIMITS.MAX_IMAGE_SIZE;
  return SIZE_LIMITS.MAX_FILE_SIZE;
}

/**
 * Validate file size
 */
export function validateFileSize(
  sizeBytes: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const limit = getSizeLimit(mimeType);
  if (sizeBytes > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds limit of ${limitMB}MB for ${mimeType}`,
    };
  }
  return { valid: true };
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "audio/aac": "aac",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/json": "json",
    "text/plain": "txt",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
  };
  return extensions[mimeType] || "bin";
}

