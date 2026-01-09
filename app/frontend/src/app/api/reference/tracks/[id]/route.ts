/**
 * Reference Track Detail API
 * GET /api/reference/tracks/[id] - Get track with analysis
 * PATCH /api/reference/tracks/[id] - Update track
 * DELETE /api/reference/tracks/[id] - Delete track
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { getTrackWithAnalysis, updateTrack, deleteTrack } from "@/lib/db/repositories/referenceTracks";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reference/tracks/[id]
 * Get track with analysis
 */
export const GET = createAPIHandler(async (ctx: APIContext, routeParams?: RouteParams) => {
  const params = routeParams?.params ? await routeParams.params : null;
  const trackId = params?.id;

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }

  const result = await getTrackWithAnalysis(ctx.db, trackId, ctx.dbUser.id);
  if (!result) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const { track, analysis } = result;

  return NextResponse.json({
    track: {
      id: track.id,
      title: track.title,
      artist: track.artist,
      mimeType: track.mime_type,
      bytes: track.bytes,
      durationSeconds: track.duration_seconds,
      tags: track.tags_json ? JSON.parse(track.tags_json) : [],
      createdAt: track.created_at,
    },
    analysis: analysis
      ? {
          bpm: analysis.bpm,
          key: analysis.key,
          energy: analysis.energy,
          danceability: analysis.danceability,
          sections: analysis.sections_json ? JSON.parse(analysis.sections_json) : null,
          waveform: analysis.waveform_json ? JSON.parse(analysis.waveform_json) : null,
          analyzedAt: analysis.analyzed_at,
        }
      : null,
  });
});

/**
 * PATCH /api/reference/tracks/[id]
 * Update track metadata
 */
export const PATCH = createAPIHandler(async (ctx: APIContext, routeParams?: RouteParams) => {
  const params = routeParams?.params ? await routeParams.params : null;
  const trackId = params?.id;

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }

  const body = await ctx.request.json() as {
    title?: string;
    artist?: string;
    durationSeconds?: number;
    tags?: string[];
  };

  const updated = await updateTrack(ctx.db, trackId, ctx.dbUser.id, {
    title: body.title,
    artist: body.artist,
    duration_seconds: body.durationSeconds,
    tags: body.tags,
  });

  if (!updated) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/reference/tracks/[id]
 * Delete track (also removes from R2)
 */
export const DELETE = createAPIHandler(async (ctx: APIContext, routeParams?: RouteParams) => {
  const params = routeParams?.params ? await routeParams.params : null;
  const trackId = params?.id;

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }

  const result = await deleteTrack(ctx.db, trackId, ctx.dbUser.id);

  if (!result.deleted) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Delete from R2 if we have the key
  if (result.r2_key) {
    try {
      const cfContext = await getCloudflareContext();
      const bucket = (cfContext.env as unknown as CloudflareEnv).BLOBS;
      if (bucket) {
        await bucket.delete(result.r2_key);
      }
    } catch (err) {
      // Log but don't fail - the track is already deleted from D1
      console.error("Failed to delete from R2:", err);
    }
  }

  return NextResponse.json({ success: true });
});

