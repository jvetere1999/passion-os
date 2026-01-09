/**
 * Focus Pause State API Route
 * Sync focus pause state across devices
 *
 * Optimized with createAPIHandler for timing instrumentation
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const dynamic = "force-dynamic";

interface PauseState {
  mode: string;
  time_remaining: number;
  paused_at: string;
}

/**
 * GET /api/focus/pause
 * Get the current pause state for the user
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const result = await ctx.db
    .prepare(`
      SELECT mode, time_remaining, paused_at
      FROM focus_pause_state
      WHERE user_id = ?
    `)
    .bind(ctx.dbUser.id)
    .first<PauseState>();

  if (!result) {
    return NextResponse.json({ pauseState: null });
  }

  // Check if pause state is still valid (less than 1 hour old)
  const pausedAt = new Date(result.paused_at).getTime();
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (pausedAt < hourAgo) {
    // Clean up expired pause state
    await ctx.db
      .prepare(`DELETE FROM focus_pause_state WHERE user_id = ?`)
      .bind(ctx.dbUser.id)
      .run();
    return NextResponse.json({ pauseState: null });
  }

  return NextResponse.json({
    pauseState: {
      mode: result.mode,
      timeRemaining: result.time_remaining,
      pausedAt: result.paused_at,
    },
  });
});

/**
 * POST /api/focus/pause
 * Save or clear pause state
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await ctx.request.json();
  const now = new Date().toISOString();

  if (body.action === "clear") {
    await ctx.db
      .prepare(`DELETE FROM focus_pause_state WHERE user_id = ?`)
      .bind(ctx.dbUser.id)
      .run();
    return NextResponse.json({ success: true });
  }

  if (body.action === "save") {
    await ctx.db
      .prepare(`
        INSERT OR REPLACE INTO focus_pause_state (id, user_id, mode, time_remaining, paused_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        `pause_${ctx.dbUser.id}`,
        ctx.dbUser.id,
        body.mode || "focus",
        body.timeRemaining || 0,
        body.pausedAt || now,
        now,
        now
      )
      .run();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
