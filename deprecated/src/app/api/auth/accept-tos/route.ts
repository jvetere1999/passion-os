/**
 * Accept TOS API
 * Records user acceptance of Terms of Service
 *
 * Optimized with createAPIHandler for timing instrumentation
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { isAdminEmail } from "@/lib/admin";

// Current TOS version
const CURRENT_TOS_VERSION = "1.0";

export const POST = createAPIHandler(async (ctx: APIContext) => {
  const now = new Date().toISOString();

  await ctx.db
    .prepare(`UPDATE users SET tos_accepted = 1, tos_accepted_at = ?, tos_version = ?, updated_at = ? WHERE id = ?`)
    .bind(now, CURRENT_TOS_VERSION, now, ctx.session.user.id)
    .run();

  return NextResponse.json({
    success: true,
    version: CURRENT_TOS_VERSION,
    acceptedAt: now
  });
});

export const GET = createAPIHandler(async (ctx: APIContext) => {
  // Admins never need to accept TOS
  if (isAdminEmail(ctx.session.user.email)) {
    return NextResponse.json({
      accepted: true,
      needsAcceptance: false,
      version: CURRENT_TOS_VERSION,
      isAdmin: true
    });
  }

  const user = await ctx.db
    .prepare(`SELECT tos_accepted, tos_version FROM users WHERE id = ?`)
    .bind(ctx.session.user.id)
    .first<{ tos_accepted: number; tos_version: string | null }>();

  const hasAcceptedCurrentTOS = user?.tos_accepted === 1 && user?.tos_version === CURRENT_TOS_VERSION;

  // Show TOS if user hasn't accepted current version
  const needsAcceptance = !hasAcceptedCurrentTOS;

  return NextResponse.json({
    accepted: hasAcceptedCurrentTOS,
    version: user?.tos_version,
    currentVersion: CURRENT_TOS_VERSION,
    needsAcceptance,
  });
});

