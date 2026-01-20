/**
 * Blob Upload API Route Handler
 * POST /api/blobs/upload - Upload a new blob
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { R2Bucket } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import {
  uploadBlob,
  isAllowedMimeType,
  validateFileSize,
} from "@/lib/storage";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * POST /api/blobs/upload
 * Upload a new blob
 *
 * Request: multipart/form-data with:
 * - file: The file to upload
 * - metadata: Optional JSON metadata
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get R2 bucket from Cloudflare context
    const ctx = await getCloudflareContext();
    const bucket = (ctx.env as unknown as { BLOBS?: R2Bucket }).BLOBS;

    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not available" },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        {
          error: `File type not allowed: ${mimeType}`,
          allowedTypes: [
            "audio/*",
            "image/*",
            "application/pdf",
            "application/zip",
          ],
        },
        { status: 400 }
      );
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.size, mimeType);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Parse optional metadata
    let metadata: Record<string, unknown> | undefined;
    const metadataStr = formData.get("metadata");
    if (metadataStr && typeof metadataStr === "string") {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        return NextResponse.json(
          { error: "Invalid metadata JSON" },
          { status: 400 }
        );
      }
    }

    // Read file into ArrayBuffer
    const data = await file.arrayBuffer();

    // Upload to R2
    const result = await uploadBlob(bucket, {
      userId,
      filename: file.name,
      mimeType,
      data,
      metadata,
    });

    return NextResponse.json({
      success: true,
      blob: {
        id: result.id,
        url: result.url,
        sizeBytes: result.sizeBytes,
        mimeType,
        filename: file.name,
      },
    });
  } catch (error) {
    console.error("Blob upload error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/blobs/upload
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

