/**
 * Progress API Routes
 * Track user learning progress
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/learn/progress - Update progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      entityType?: string;
      entityId?: string;
      status?: string;
      progressPct?: number;
      notes?: string;
      confidence?: number;
    };
    const { entityType, entityId, status, progressPct, notes, confidence } = body;

    // Validate required fields
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Validate entityType
    const validTypes = ["course", "module", "lesson", "exercise", "project"];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entityType" },
        { status: 400 }
      );
    }

    // In production, this would save to D1
    const progress = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      entityType,
      entityId,
      status: status || "in_progress",
      progressPct: progressPct || 0,
      notes: notes || null,
      confidence: confidence || null,
      startedAt: new Date().toISOString(),
      completedAt: status === "completed" ? new Date().toISOString() : null,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error("POST /api/learn/progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/learn/progress - Get user progress
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    // Return mock progress for now
    const progress = {
      items: [],
      stats: {
        lessonsCompleted: 0,
        lessonsInProgress: 0,
        exercisesCompleted: 0,
        projectsCompleted: 0,
      },
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error("GET /api/learn/progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

