/**
 * Track Analysis Cache API
 * GET - Retrieve cached analysis by content hash
 * POST - Save analysis to cache
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import {
  getAnalysisByHash,
  saveAnalysis,
  type CachedTrackAnalysis,
} from "@/lib/db/repositories/track-analysis";

// Force dynamic rendering (Cloudflare Workers already runs on edge)
export const dynamic = "force-dynamic";

/**
 * Helper to get D1 database from Cloudflare context
 */
async function getDB(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { DB?: D1Database }).DB ?? null;
  } catch {
    try {
      const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
      return env?.DB ?? null;
    } catch {
      return null;
    }
  }
}

/**
 * GET /api/analysis?hash=<contentHash>
 * Retrieve cached analysis by content hash
 */
export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Missing hash parameter" },
      { status: 400 }
    );
  }

  try {
    const db = await getDB();

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const analysis = await getAnalysisByHash(db, hash);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Failed to get analysis:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analysis" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis
 * Save analysis to cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      contentHash,
      name,
      durationMs,
      bpm,
      key,
      peakDb,
      rmsDb,
      lufs,
      frequencyProfile,
      waveformData,
    } = body as Partial<CachedTrackAnalysis>;

    if (!id || !contentHash || !name) {
      return NextResponse.json(
        { error: "Missing required fields: id, contentHash, name" },
        { status: 400 }
      );
    }

    const db = await getDB();

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const saved = await saveAnalysis(db, {
      id,
      contentHash,
      name,
      durationMs,
      bpm,
      key,
      peakDb,
      rmsDb,
      lufs,
      frequencyProfile,
      waveformData,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save analysis:", error);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 }
    );
  }
}


