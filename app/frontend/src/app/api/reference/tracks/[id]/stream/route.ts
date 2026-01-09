/**
 * Track Stream API
 * GET /api/reference/tracks/[id]/stream - Stream audio from R2
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reference/tracks/[id]/stream
 * Stream the audio file from R2
 */
export async function GET(request: Request, routeParams: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await routeParams.params;
  const trackId = params.id;

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }

  try {
    const cfContext = await getCloudflareContext();
    const env = cfContext.env as unknown as CloudflareEnv;
    const bucket = env.BLOBS;
    const db = env.DB;

    if (!bucket || !db) {
      return NextResponse.json({ error: "Storage not available" }, { status: 503 });
    }

    // Get track from D1 to verify ownership and get R2 key
    const track = await db
      .prepare(`SELECT r2_key, mime_type FROM reference_tracks WHERE id = ? AND user_id = ?`)
      .bind(trackId, session.user.id)
      .first<{ r2_key: string; mime_type: string }>();

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Get the object from R2
    const object = await bucket.get(track.r2_key);
    if (!object) {
      return NextResponse.json({ error: "Audio file not found in storage" }, { status: 404 });
    }

    // Handle range requests for seeking
    const rangeHeader = request.headers.get("range");
    const objectSize = object.size;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : objectSize - 1;
      const chunkSize = end - start + 1;

      // For range requests, we need to slice the body
      const body = object.body;

      return new Response(body, {
        status: 206,
        headers: {
          "Content-Type": track.mime_type,
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${objectSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Full file response
    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": track.mime_type,
        "Content-Length": String(objectSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Failed to stream track:", err);
    return NextResponse.json({ error: "Failed to stream track" }, { status: 500 });
  }
}

