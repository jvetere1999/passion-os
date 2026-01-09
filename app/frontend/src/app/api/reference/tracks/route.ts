/**
 * Reference Tracks API
 * GET /api/reference/tracks - List user's tracks
 * POST /api/reference/tracks - Create track after upload
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { getUserTracks, createReferenceTrack, searchTracks } from "@/lib/db/repositories/referenceTracks";

export const dynamic = "force-dynamic";

/**
 * GET /api/reference/tracks
 * List all tracks for the user
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const query = searchParams.get("q");

  let tracks;
  if (query) {
    tracks = await searchTracks(ctx.db, ctx.dbUser.id, query);
  } else {
    tracks = await getUserTracks(ctx.db, ctx.dbUser.id);
  }

  return NextResponse.json({
    tracks: tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      mimeType: track.mime_type,
      bytes: track.bytes,
      durationSeconds: track.duration_seconds,
      tags: track.tags_json ? JSON.parse(track.tags_json) : [],
      createdAt: track.created_at,
    })),
  });
});

/**
 * POST /api/reference/tracks
 * Finalize track creation after R2 upload
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as {
    title?: string;
    artist?: string;
    r2Key?: string;
    mimeType?: string;
    bytes?: number;
    sha256?: string;
    durationSeconds?: number;
    tags?: string[];
  };

  // Validate required fields
  if (!body.title || !body.r2Key || !body.mimeType || !body.bytes) {
    return NextResponse.json(
      { error: "Missing required fields: title, r2Key, mimeType, bytes" },
      { status: 400 }
    );
  }

  // Validate MIME type
  const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/aac", "audio/ogg", "audio/flac"];
  if (!allowedMimeTypes.includes(body.mimeType)) {
    return NextResponse.json(
      { error: `Invalid MIME type. Allowed: ${allowedMimeTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate file size (100MB max)
  const maxBytes = 100 * 1024 * 1024;
  if (body.bytes > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${maxBytes / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  const track = await createReferenceTrack(ctx.db, ctx.dbUser.id, {
    title: body.title,
    artist: body.artist,
    r2_key: body.r2Key,
    mime_type: body.mimeType,
    bytes: body.bytes,
    sha256: body.sha256,
    duration_seconds: body.durationSeconds,
    tags: body.tags,
  });

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
  });
});

