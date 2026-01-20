/**
 * Onboarding Skip API
 * POST /api/onboarding/skip - Skip onboarding (can resume later)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { skipOnboarding, getUserOnboardingState } from "@/lib/db/repositories/onboarding";

export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/skip
 * Skip onboarding for now (can resume later)
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

    // Get current state
    const state = await getUserOnboardingState(db, userId);
    if (!state) {
      return NextResponse.json({ error: "No onboarding state found" }, { status: 400 });
    }

    if (state.status === "completed") {
      return NextResponse.json({ error: "Onboarding already completed" }, { status: 400 });
    }

    // Skip onboarding
    await skipOnboarding(db, userId);

    // Set soft landing in user_settings (expires in 1 hour)
    const softLandingUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db
      .prepare(`UPDATE user_settings SET soft_landing_until = ?, updated_at = ? WHERE user_id = ?`)
      .bind(softLandingUntil, new Date().toISOString(), userId)
      .run();

    return NextResponse.json({
      success: true,
      message: "Onboarding skipped. You can resume from Settings anytime.",
      softLandingUntil,
    });
  } catch (error) {
    console.error("[onboarding] skip error:", error);
    return NextResponse.json({ error: "Failed to skip onboarding" }, { status: 500 });
  }
}

