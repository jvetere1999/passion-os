/**
 * Learning API Routes
 * Endpoints for learning suite data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/learn - Get dashboard data
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock dashboard data for now
    const dashboardData = {
      continueItem: null,
      dueReviewCount: 0,
      estimatedReviewMinutes: 0,
      weakAreas: [],
      recentActivity: [],
      streak: {
        current: 0,
        longest: 0,
        isActiveToday: false,
      },
      stats: {
        lessonsCompleted: 0,
        exercisesCompleted: 0,
        projectsCompleted: 0,
        reviewCardsTotal: 0,
        avgRetention: 0,
      },
      diagnosticCompleted: false,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("GET /api/learn error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

