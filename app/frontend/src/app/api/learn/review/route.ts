/**
 * Review API Routes
 * Spaced repetition card management
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/learn/review - Get review session
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return mock review session for now
    const reviewSession = {
      cards: [],
      newCardsToday: 0,
      reviewCardsToday: 0,
      estimatedMinutes: 0,
    };

    return NextResponse.json(reviewSession);
  } catch (error) {
    console.error("GET /api/learn/review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/learn/review - Grade a card
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      cardId?: string;
      grade?: number;
      timeTakenMs?: number;
    };
    const { cardId, grade } = body;

    // Validate required fields
    if (cardId === undefined || grade === undefined) {
      return NextResponse.json(
        { error: "cardId and grade are required" },
        { status: 400 }
      );
    }

    // Validate grade is 0-3
    if (typeof grade !== "number" || grade < 0 || grade > 3) {
      return NextResponse.json(
        { error: "grade must be 0, 1, 2, or 3" },
        { status: 400 }
      );
    }

    // SM-2 algorithm calculations would go here
    // For now, return success
    const result = {
      cardId,
      grade,
      newInterval: calculateNewInterval(grade),
      newEase: calculateNewEase(grade, 2.5),
      nextDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/learn/review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// SM-2 helper functions
function calculateNewInterval(grade: number, currentInterval: number = 1): number {
  if (grade === 0) return 1; // Again - reset
  if (grade === 1) return Math.max(1, currentInterval * 1.2); // Hard
  if (grade === 2) return currentInterval * 2.5; // Good
  return currentInterval * 2.5 * 1.3; // Easy
}

function calculateNewEase(grade: number, currentEase: number): number {
  const minEase = 1.3;
  if (grade === 0) return Math.max(minEase, currentEase - 0.2);
  if (grade === 1) return Math.max(minEase, currentEase - 0.15);
  if (grade === 2) return currentEase;
  return currentEase + 0.15;
}

