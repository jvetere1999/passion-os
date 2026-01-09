/**
 * R2 Blob Storage Client
 * Provides type-safe access to Cloudflare R2 storage
 */

import type { R2Bucket, R2Object } from "@cloudflare/workers-types";
import {
  type BlobMetadata,
  type BlobCategory,
  type UploadRequest,
  type UploadResult,
  getCategoryFromMimeType,
  getExtensionFromMimeType,
  isAllowedMimeType,
  validateFileSize,
} from "./types";

/**
 * Generate a unique blob key
 * Format: {userId}/{category}/{uuid}.{ext}
 */
export function generateBlobKey(
  userId: string,
  category: BlobCategory,
  extension: string
): string {
  const uuid = crypto.randomUUID();
  return `${userId}/${category}/${uuid}.${extension}`;
}

/**
 * Parse blob key to extract components
 */
export function parseBlobKey(key: string): {
  userId: string;
  category: BlobCategory;
  filename: string;
} | null {
  const parts = key.split("/");
  if (parts.length !== 3) return null;

  const [userId, category, filename] = parts;
  if (!["audio", "images", "exports", "other"].includes(category)) return null;

  return {
    userId,
    category: category as BlobCategory,
    filename,
  };
}

/**
 * Upload a blob to R2
 */
export async function uploadBlob(
  bucket: R2Bucket,
  request: UploadRequest
): Promise<UploadResult> {
  // Validate MIME type
  if (!isAllowedMimeType(request.mimeType)) {
    throw new Error(`MIME type not allowed: ${request.mimeType}`);
  }

  // Get data as ArrayBuffer for size check
  let data: ArrayBuffer;
  if (request.data instanceof ArrayBuffer) {
    data = request.data;
  } else {
    // Read stream into buffer
    const reader = request.data.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    data = combined.buffer;
  }

  // Validate size
  const sizeValidation = validateFileSize(data.byteLength, request.mimeType);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }

  // Generate key
  const category = getCategoryFromMimeType(request.mimeType);
  const extension = getExtensionFromMimeType(request.mimeType);
  const key = generateBlobKey(request.userId, category, extension);
  const id = key.split("/").pop()?.split(".")[0] || crypto.randomUUID();

  // Upload to R2
  await bucket.put(key, data, {
    httpMetadata: {
      contentType: request.mimeType,
    },
    customMetadata: {
      userId: request.userId,
      filename: request.filename,
      uploadedAt: new Date().toISOString(),
      ...(request.metadata
        ? { metadata: JSON.stringify(request.metadata) }
        : {}),
    },
  });

  return {
    id,
    key,
    url: `/api/blobs/${id}`,
    sizeBytes: data.byteLength,
  };
}

/**
 * Get a blob from R2
 */
export async function getBlob(
  bucket: R2Bucket,
  key: string
): Promise<R2Object | null> {
  return bucket.get(key);
}

/**
 * Get blob by ID (searches for key matching ID)
 */
export async function getBlobById(
  bucket: R2Bucket,
  userId: string,
  blobId: string
): Promise<R2Object | null> {
  // Search in all categories for the blob
  const categories: BlobCategory[] = ["audio", "images", "exports", "other"];

  for (const category of categories) {
    const prefix = `${userId}/${category}/${blobId}`;
    const listed = await bucket.list({ prefix, limit: 1 });

    if (listed.objects.length > 0) {
      const key = listed.objects[0].key;
      return bucket.get(key);
    }
  }

  return null;
}

/**
 * Delete a blob from R2
 */
export async function deleteBlob(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/**
 * Delete blob by ID
 */
export async function deleteBlobById(
  bucket: R2Bucket,
  userId: string,
  blobId: string
): Promise<boolean> {
  const categories: BlobCategory[] = ["audio", "images", "exports", "other"];

  for (const category of categories) {
    const prefix = `${userId}/${category}/${blobId}`;
    const listed = await bucket.list({ prefix, limit: 1 });

    if (listed.objects.length > 0) {
      await bucket.delete(listed.objects[0].key);
      return true;
    }
  }

  return false;
}

/**
 * List blobs for a user
 */
export interface ListBlobsOptions {
  category?: BlobCategory;
  limit?: number;
  cursor?: string;
}

export interface ListBlobsResult {
  blobs: Array<{
    key: string;
    size: number;
    uploaded: Date;
    etag: string;
  }>;
  cursor?: string;
  truncated: boolean;
}

export async function listBlobs(
  bucket: R2Bucket,
  userId: string,
  options: ListBlobsOptions = {}
): Promise<ListBlobsResult> {
  const prefix = options.category
    ? `${userId}/${options.category}/`
    : `${userId}/`;

  const listed = await bucket.list({
    prefix,
    limit: options.limit || 100,
    cursor: options.cursor,
  });

  return {
    blobs: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      etag: obj.etag,
    })),
    cursor: listed.truncated ? listed.cursor : undefined,
    truncated: listed.truncated,
  };
}

/**
 * Check if a blob exists
 */
export async function blobExists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const head = await bucket.head(key);
  return head !== null;
}

/**
 * Get blob metadata without downloading content
 */
export async function getBlobMetadata(
  bucket: R2Bucket,
  key: string
): Promise<BlobMetadata | null> {
  const head = await bucket.head(key);
  if (!head) return null;

  const parsed = parseBlobKey(key);
  if (!parsed) return null;

  const customMetadata = head.customMetadata || {};

  return {
    id: parsed.filename.split(".")[0],
    userId: parsed.userId,
    key,
    filename: customMetadata.filename || parsed.filename,
    mimeType: head.httpMetadata?.contentType || "application/octet-stream",
    sizeBytes: head.size,
    category: parsed.category,
    createdAt: customMetadata.uploadedAt || head.uploaded.toISOString(),
    metadata: customMetadata.metadata
      ? JSON.parse(customMetadata.metadata)
      : undefined,
  };
}

/**
 * Copy a blob to a new key
 */
export async function copyBlob(
  bucket: R2Bucket,
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const source = await bucket.get(sourceKey);
  if (!source) {
    throw new Error(`Source blob not found: ${sourceKey}`);
  }

  await bucket.put(destinationKey, source.body, {
    httpMetadata: source.httpMetadata,
    customMetadata: source.customMetadata,
  });
}

/**
 * Get total storage used by a user
 */
export async function getUserStorageUsage(
  bucket: R2Bucket,
  userId: string
): Promise<{ totalBytes: number; blobCount: number }> {
  let totalBytes = 0;
  let blobCount = 0;
  let cursor: string | undefined;

  do {
    const result = await bucket.list({
      prefix: `${userId}/`,
      cursor,
    });

    for (const obj of result.objects) {
      totalBytes += obj.size;
      blobCount++;
    }

    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return { totalBytes, blobCount };
}

