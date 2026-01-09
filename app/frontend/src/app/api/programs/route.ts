/**
 * Training Programs API Route
 * Multi-week training plans bridging Exercise + Planner
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists } from "@/lib/db/repositories/users";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface Program {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  goal: string | null;
  difficulty: string;
  is_active: number;
  started_at: string | null;
  completed_at: string | null;
}

interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
  name: string | null;
  is_deload: number;
}

/**
 * GET /api/programs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ programs: [] });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("id");

    if (programId) {
      const program = await db.prepare(`SELECT * FROM training_programs WHERE id = ? AND user_id = ?`).bind(programId, dbUser.id).first<Program>();
      if (!program) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }

      const weeks = await db.prepare(`SELECT * FROM program_weeks WHERE program_id = ? ORDER BY week_number`).bind(programId).all<ProgramWeek>();
      return NextResponse.json({ program, weeks: weeks.results || [] });
    }

    const programs = await db.prepare(`SELECT * FROM training_programs WHERE user_id = ? ORDER BY created_at DESC`).bind(dbUser.id).all<Program>();
    return NextResponse.json({ programs: programs.results || [] });
  } catch (error) {
    console.error("GET /api/programs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/programs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true, persisted: false });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const body = await request.json() as {
      action: string;
      id?: string;
      name?: string;
      description?: string;
      duration_weeks?: number;
      goal?: string;
      difficulty?: string;
      deload_weeks?: number[];
      week_id?: string;
      workout_id?: string;
      day_of_week?: number;
      order_index?: number;
      intensity_modifier?: number;
    };
    const now = new Date().toISOString();

    if (body.action === "create") {
      const programId = `prog_${Date.now()}`;
      await db
        .prepare(`INSERT INTO training_programs (id, user_id, name, description, duration_weeks, goal, difficulty, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
        .bind(programId, dbUser.id, body.name, body.description || null, body.duration_weeks || 4, body.goal || null, body.difficulty || "intermediate", now, now)
        .run();

      for (let i = 1; i <= (body.duration_weeks || 4); i++) {
        const weekId = `week_${programId}_${i}`;
        const isDeload = body.deload_weeks?.includes(i) ? 1 : 0;
        await db.prepare(`INSERT INTO program_weeks (id, program_id, week_number, name, is_deload, notes) VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(weekId, programId, i, `Week ${i}`, isDeload, null)
          .run();
      }

      return NextResponse.json({ success: true, id: programId });
    }

    if (body.action === "add_workout") {
      const id = `pw_${Date.now()}`;
      await db
        .prepare(`INSERT INTO program_workouts (id, program_week_id, workout_id, day_of_week, order_index, intensity_modifier) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(id, body.week_id, body.workout_id, body.day_of_week ?? null, body.order_index || 0, body.intensity_modifier || 1.0)
        .run();
      return NextResponse.json({ success: true, id });
    }

    if (body.action === "start") {
      await db.prepare(`UPDATE training_programs SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1`).bind(now, dbUser.id).run();
      await db.prepare(`UPDATE training_programs SET is_active = 1, started_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`).bind(now, now, body.id, dbUser.id).run();
      return NextResponse.json({ success: true });
    }

    if (body.action === "complete") {
      await db.prepare(`UPDATE training_programs SET is_active = 0, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`).bind(now, now, body.id, dbUser.id).run();
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      await db.prepare(`DELETE FROM training_programs WHERE id = ? AND user_id = ?`).bind(body.id, dbUser.id).run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/programs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
