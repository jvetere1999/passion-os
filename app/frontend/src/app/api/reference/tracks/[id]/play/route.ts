/**
 * Track Playback URL API
 * GET /api/reference/tracks/[id]/play - Get signed URL for playback
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { getTrackById } from "@/lib/db/repositories/referenceTracks";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reference/tracks/[id]/play
 * Get a temporary URL for streaming the track
 */
export const GET = createAPIHandler(async (ctx: APIContext, routeParams?: RouteParams) => {
  const params = routeParams?.params ? await routeParams.params : null;
  const trackId = params?.id;

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }

  // Verify track belongs to user
  const track = await getTrackById(ctx.db, trackId, ctx.dbUser.id);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  try {
    const cfContext = await getCloudflareContext();
    const bucket = (cfContext.env as unknown as CloudflareEnv).BLOBS;

    if (!bucket) {
      return NextResponse.json({ error: "Storage not available" }, { status: 503 });
    }

    // Get the object to verify it exists
    const object = await bucket.head(track.r2_key);
    if (!object) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }

    // For R2, we need to create a presigned URL or use a worker to serve the content
    // Since R2 doesn't have built-in presigned URLs like S3, we'll return info
    // to construct a proxy request

    // Option 1: Return the R2 key for a separate streaming endpoint
    // Option 2: Use a Worker to proxy the audio

    // For simplicity, we'll return info that can be used with a proxy endpoint
    return NextResponse.json({
      trackId: track.id,
      mimeType: track.mime_type,
      bytes: track.bytes,
      durationSeconds: track.duration_seconds,
      // The client can use /api/reference/tracks/[id]/stream to get the actual audio
      streamUrl: `/api/reference/tracks/${track.id}/stream`,
    });
  } catch (err) {
    console.error("Failed to get track URL:", err);
    return NextResponse.json({ error: "Failed to get track URL" }, { status: 500 });
  }
});

