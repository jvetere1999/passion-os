/**
 * Reference Track Upload API
 * POST /api/reference/upload - Upload file to R2
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * POST /api/reference/upload
 * Upload a file to R2
 * Expects multipart form data with 'file' and 'r2Key' fields
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const r2Key = formData.get("r2Key") as string | null;
    const title = formData.get("title") as string | null;
    const artist = formData.get("artist") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!r2Key) {
      return NextResponse.json({ error: "No r2Key provided" }, { status: 400 });
    }

    // Validate the R2 key belongs to this user
    if (!r2Key.startsWith(`reference-tracks/${session.user.id}/`)) {
      return NextResponse.json({ error: "Invalid r2Key" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Get R2 bucket
    const cfContext = await getCloudflareContext();
    const env = cfContext.env as unknown as CloudflareEnv;
    const bucket = env.BLOBS;
    const db = env.DB;

    if (!bucket) {
      return NextResponse.json({ error: "Storage not available" }, { status: 503 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Create track record in D1
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const trackTitle = title || file.name.replace(/\.[^/.]+$/, "");

    await db
      .prepare(`
        INSERT INTO reference_tracks (id, user_id, title, artist, r2_key, mime_type, bytes, visibility, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'private', ?, ?)
      `)
      .bind(trackId, session.user.id, trackTitle, artist || null, r2Key, file.type, file.size, now, now)
      .run();

    return NextResponse.json({
      success: true,
      track: {
        id: trackId,
        title: trackTitle,
        artist: artist || null,
        mimeType: file.type,
        bytes: file.size,
        createdAt: now,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

