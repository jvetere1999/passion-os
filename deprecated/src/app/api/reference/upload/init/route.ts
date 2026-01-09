/**
 * Reference Track Upload Init API
 * POST /api/reference/upload/init - Initialize upload and get R2 key
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const dynamic = "force-dynamic";

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
];

/**
 * POST /api/reference/upload/init
 * Initialize an upload and return the R2 key
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as {
    filename?: string;
    mimeType?: string;
    bytes?: number;
  };

  // Validate required fields
  if (!body.filename || !body.mimeType || !body.bytes) {
    return NextResponse.json(
      { error: "Missing required fields: filename, mimeType, bytes" },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(body.mimeType)) {
    return NextResponse.json(
      { error: `Invalid MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate file size
  if (body.bytes > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Generate R2 key
  // Format: reference-tracks/{userId}/{timestamp}_{sanitizedFilename}
  const timestamp = Date.now();
  const sanitizedFilename = body.filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 100);
  const r2Key = `reference-tracks/${ctx.dbUser.id}/${timestamp}_${sanitizedFilename}`;

  // Generate a temporary upload ID
  const uploadId = `upload_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

  return NextResponse.json({
    uploadId,
    r2Key,
    // The client should POST the file to /api/reference/upload with this info
    uploadUrl: "/api/reference/upload",
    maxBytes: MAX_FILE_SIZE,
    expiresIn: 3600, // 1 hour to complete upload
  });
});

