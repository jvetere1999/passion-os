/**
 * Complete Focus Session API Route
 * POST /api/focus/[id]/complete - Complete a focus session
 */

import { NextRequest, NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { completeFocusSession } from "@/lib/db";
import { ensureUserExists } from "@/lib/db/repositories/users";
import { logActivityEvent } from "@/lib/db/repositories/activity-events";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const { id } = await params;
    const focusSession = await completeFocusSession(db, id, dbUser.id);

    if (!focusSession) {
      return NextResponse.json(
        { error: "Session not found or already completed" },
        { status: 404 }
      );
    }

    // Log activity event for XP/coins and automatic quest progress
    await logActivityEvent(db, dbUser.id, "focus_complete", {
      entityType: "focus_session",
      entityId: id,
      metadata: {
        duration: focusSession.planned_duration,
        mode: focusSession.mode,
      },
    });

    return NextResponse.json({ session: focusSession });
  } catch (error) {
    console.error("POST /api/focus/[id]/complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

