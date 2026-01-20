/**
 * Track Analysis API
 * POST /api/reference/tracks/[id]/analysis - Save browser-computed analysis
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { saveTrackAnalysis, getTrackById } from "@/lib/db/repositories/referenceTracks";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reference/tracks/[id]/analysis
 * Save analysis results computed by the browser
 */
export const POST = createAPIHandler(async (ctx: APIContext, routeParams?: RouteParams) => {
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

  const body = await ctx.request.json() as {
    bpm?: number;
    key?: string;
    energy?: number;
    danceability?: number;
    sections?: unknown[];
    waveform?: number[];
    durationSeconds?: number;
  };

  // Validate waveform size (max 1000 points to prevent abuse)
  if (body.waveform && Array.isArray(body.waveform) && body.waveform.length > 1000) {
    body.waveform = body.waveform.slice(0, 1000);
  }

  // Validate sections size
  if (body.sections && Array.isArray(body.sections) && body.sections.length > 100) {
    body.sections = body.sections.slice(0, 100);
  }

  const analysis = await saveTrackAnalysis(ctx.db, trackId, {
    bpm: typeof body.bpm === "number" ? body.bpm : undefined,
    key: typeof body.key === "string" ? body.key : undefined,
    energy: typeof body.energy === "number" ? body.energy : undefined,
    danceability: typeof body.danceability === "number" ? body.danceability : undefined,
    sections: body.sections,
    waveform: body.waveform,
  });

  // Update track duration if provided
  if (typeof body.durationSeconds === "number" && !track.duration_seconds) {
    await ctx.db
      .prepare(`UPDATE reference_tracks SET duration_seconds = ? WHERE id = ?`)
      .bind(body.durationSeconds, trackId)
      .run();
  }

  return NextResponse.json({
    analysis: {
      bpm: analysis.bpm,
      key: analysis.key,
      energy: analysis.energy,
      danceability: analysis.danceability,
      analyzedAt: analysis.analyzed_at,
    },
  });
});

