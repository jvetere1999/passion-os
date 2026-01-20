/**
 * Onboarding Reset API (Admin/Debug)
 * POST /api/onboarding/reset - Reset user's onboarding to start fresh
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/reset
 * Reset onboarding state to allow re-running onboarding
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    // Delete existing onboarding state
    await db
      .prepare(`DELETE FROM user_onboarding_state WHERE user_id = ?`)
      .bind(userId)
      .run();

    // Create fresh onboarding state with all required columns
    await db
      .prepare(`
        INSERT INTO user_onboarding_state (id, user_id, flow_id, status, can_resume, created_at, updated_at)
        VALUES (?, ?, 'flow_main_v1', 'not_started', 1, ?, ?)
      `)
      .bind(`onboarding_${userId}`, userId, now, now)
      .run();

    return NextResponse.json({
      success: true,
      message: "Onboarding reset. Refresh the page to start onboarding."
    });
  } catch (error) {
    console.error("[onboarding] reset error:", error);
    return NextResponse.json({ error: "Failed to reset onboarding" }, { status: 500 });
  }
}

