/**
 * Focus Sessions API Route
 * GET /api/focus - List focus sessions
 * POST /api/focus - Create focus session
 *
 * Optimized with createAPIHandler for timing instrumentation
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import {
  createFocusSession,
  listFocusSessions,
  getFocusStats,
  type CreateFocusSessionInput,
  type FocusMode,
  type FocusSessionStatus,
} from "@/lib/db";
import { logActivityEvent, hasActivityEvent } from "@/lib/db/repositories/activity-events";

export const dynamic = "force-dynamic";

interface CreateFocusBody {
  mode?: FocusMode;
  planned_duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/focus
 * List focus sessions or get stats
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const stats = searchParams.get("stats") === "true";

  if (stats) {
    const period = searchParams.get("period") || "day";
    let startDate: string | undefined;

    const now = new Date();
    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString();
    } else if (period === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString();
    }

    const focusStats = await getFocusStats(ctx.db, ctx.dbUser.id, startDate);
    return NextResponse.json(focusStats);
  }

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const result = await listFocusSessions(ctx.db, ctx.dbUser.id, {
    page,
    pageSize,
  });

  return NextResponse.json(result);
});

/**
 * POST /api/focus
 * Create a new focus session
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = (await ctx.request.json()) as CreateFocusBody;
  const plannedDuration = body.planned_duration || 25 * 60; // Default 25 minutes in seconds

  // Calculate expiry time - 2x planned duration for buffer
  const expiryBuffer = plannedDuration * 2;
  const expiresAt = new Date(Date.now() + expiryBuffer * 1000).toISOString();

  const input: CreateFocusSessionInput = {
    user_id: ctx.dbUser.id,
    started_at: new Date().toISOString(),
    planned_duration: plannedDuration,
    status: "active" as FocusSessionStatus,
    mode: body.mode || "focus",
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    expires_at: expiresAt,
    linked_library_id: null, // Can be set later if user links a library
  };

  const focusSession = await createFocusSession(ctx.db, input);

  // Log focus_start event with idempotency check
  // Only award XP for focus mode, not breaks
  if (focusSession.mode === "focus") {
    const alreadyAwarded = await hasActivityEvent(
      ctx.db,
      ctx.dbUser.id,
      "focus_start",
      "focus_session",
      focusSession.id
    );

    if (!alreadyAwarded) {
      await logActivityEvent(ctx.db, ctx.dbUser.id, "focus_start", {
        entityType: "focus_session",
        entityId: focusSession.id,
        metadata: {
          planned_duration: plannedDuration,
          mode: focusSession.mode,
        },
      });
    }
  }

  return NextResponse.json({ success: true, session: focusSession }, { status: 201 });
});

