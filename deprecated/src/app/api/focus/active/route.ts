/**
 * Get Active Focus Session API Route
 * GET /api/focus/active - Get current active session
 *
 * This is a hot path - polled every 30s by BottomBar and FocusIndicator
 * Optimized with:
 * - Single auth() call (memoized)
 * - Single getCloudflareContext() call
 * - Timing instrumentation via x-perf-debug=1
 */

import { NextResponse } from "next/server";
import { createAPIHandler } from "@/lib/perf";
import { getActiveFocusSession } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = createAPIHandler(async (ctx) => {
  const activeSession = await getActiveFocusSession(ctx.db, ctx.dbUser.id);
  return NextResponse.json({ session: activeSession });
});

