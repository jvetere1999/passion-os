/**
 * Gamification Teaser API Route
 * Get the next achievement teaser for Today page
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { getNextAchievementTeaser } from "@/lib/db/repositories/gamification";

export const dynamic = "force-dynamic";

/**
 * GET /api/gamification/teaser
 * Get the next achievable achievement for reward teaser
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const teaser = await getNextAchievementTeaser(ctx.db, ctx.dbUser.id);

  return NextResponse.json({ teaser });
});

