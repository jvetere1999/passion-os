/**
 * Storage module barrel export
 */

// Storage Keys (centralized constants)
export {
  SESSION_KEYS,
  LOCAL_KEYS,
  TIME_CONSTANTS,
  type SessionKey,
  type LocalKey,
} from "./keys";

// Types
export {
  ALLOWED_MIME_TYPES,
  SIZE_LIMITS,
  type AllowedMimeType,
  type BlobCategory,
  type BlobMetadata,
  type UploadRequest,
  type UploadResult,
  type PresignedUrlOptions,
  getCategoryFromMimeType,
  getExtensionFromMimeType,
  isAllowedMimeType,
  getSizeLimit,
  validateFileSize,
} from "./types";

// R2 Client
export {
  generateBlobKey,
  parseBlobKey,
  uploadBlob,
  getBlob,
  getBlobById,
  deleteBlob,
  deleteBlobById,
  listBlobs,
  blobExists,
  getBlobMetadata,
  copyBlob,
  getUserStorageUsage,
  type ListBlobsOptions,
  type ListBlobsResult,
} from "./r2";

