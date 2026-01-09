import { NextRequest, NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists } from "@/lib/db/repositories/users";

export const dynamic = "force-dynamic";

interface CloudflareEnv {
  DB?: D1Database;
}

async function getDB(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as CloudflareEnv).DB ?? null;
  } catch {
    try {
      const env = (globalThis as unknown as { env?: CloudflareEnv }).env;
      return env?.DB ?? null;
    } catch {
      return null;
    }
  }
}

// GET /api/exercise - Get exercises, workouts, sessions, records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });
    const userId = dbUser.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "exercises";
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (type === "exercises") {
      // Get built-in and user exercises
      let query = `
        SELECT * FROM exercises 
        WHERE (is_builtin = 1 OR user_id = ?)
      `;
      const params: (string | null)[] = [userId];

      if (category) {
        query += ` AND category = ?`;
        params.push(category);
      }
      if (search) {
        query += ` AND name LIKE ?`;
        params.push(`%${search}%`);
      }
      query += ` ORDER BY name ASC LIMIT 100`;

      const result = await db.prepare(query).bind(...params).all();
      return NextResponse.json({ exercises: result.results || [] });
    }

    if (type === "workouts") {
      const result = await db
        .prepare(`SELECT * FROM workouts WHERE user_id = ? ORDER BY updated_at DESC`)
        .bind(userId)
        .all();
      return NextResponse.json({ workouts: result.results || [] });
    }

    if (type === "sessions") {
      const limit = parseInt(searchParams.get("limit") || "20");
      const result = await db
        .prepare(`
          SELECT ws.*, w.name as workout_name
          FROM workout_sessions ws
          LEFT JOIN workouts w ON ws.workout_id = w.id
          WHERE ws.user_id = ?
          ORDER BY ws.started_at DESC
          LIMIT ?
        `)
        .bind(userId, limit)
        .all();
      return NextResponse.json({ sessions: result.results || [] });
    }

    if (type === "records") {
      const result = await db
        .prepare(`
          SELECT pr.*, e.name as exercise_name
          FROM personal_records pr
          JOIN exercises e ON pr.exercise_id = e.id
          WHERE pr.user_id = ?
          ORDER BY pr.achieved_at DESC
        `)
        .bind(userId)
        .all();
      return NextResponse.json({ records: result.results || [] });
    }

    if (type === "stats") {
      // Weekly stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const sessions = await db
        .prepare(`SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND started_at >= ?`)
        .bind(userId, weekAgo)
        .first<{ count: number }>();

      const sets = await db
        .prepare(`
          SELECT COUNT(*) as count FROM exercise_sets es
          JOIN workout_sessions ws ON es.workout_session_id = ws.id
          WHERE ws.user_id = ? AND es.completed_at >= ?
        `)
        .bind(userId, weekAgo)
        .first<{ count: number }>();

      const prs = await db
        .prepare(`SELECT COUNT(*) as count FROM personal_records WHERE user_id = ? AND achieved_at >= ?`)
        .bind(userId, weekAgo)
        .first<{ count: number }>();

      return NextResponse.json({
        stats: {
          workouts: sessions?.count || 0,
          sets: sets?.count || 0,
          prs: prs?.count || 0,
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/exercise error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/exercise - Create exercise, workout, session, or set
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });
    const userId = dbUser.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const type = body.type as string;
    const now = new Date().toISOString();
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (type === "exercise") {
      // Create custom exercise
      const { name, description, category, muscle_groups, equipment, instructions } = body;
      await db
        .prepare(`
          INSERT INTO exercises (id, user_id, name, description, category, muscle_groups, equipment, instructions, is_builtin, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `)
        .bind(
          id,
          userId,
          name,
          description || null,
          category || "strength",
          muscle_groups ? JSON.stringify(muscle_groups) : null,
          equipment ? JSON.stringify(equipment) : null,
          instructions || null,
          now,
          now
        )
        .run();

      return NextResponse.json({ id, success: true });
    }

    if (type === "workout") {
      // Create workout template
      const { name, description, workout_type, estimated_duration, exercises: workoutExercises } = body;

      await db
        .prepare(`
          INSERT INTO workouts (id, user_id, name, description, workout_type, estimated_duration, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(id, userId, name, description || null, workout_type || "mixed", estimated_duration || null, now, now)
        .run();

      // Add exercises to workout
      if (workoutExercises && Array.isArray(workoutExercises)) {
        for (let i = 0; i < workoutExercises.length; i++) {
          const ex = workoutExercises[i];
          const weId = `we_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
          await db
            .prepare(`
              INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              weId,
              id,
              ex.exercise_id,
              i,
              ex.target_sets || null,
              ex.target_reps || null,
              ex.target_weight || null,
              ex.rest_seconds || null,
              ex.notes || null
            )
            .run();
        }
      }

      return NextResponse.json({ id, success: true });
    }

    if (type === "session") {
      // Start a workout session
      const { workout_id, calendar_event_id } = body;

      await db
        .prepare(`
          INSERT INTO workout_sessions (id, user_id, workout_id, calendar_event_id, started_at, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'in-progress', ?)
        `)
        .bind(id, userId, workout_id || null, calendar_event_id || null, now, now)
        .run();

      return NextResponse.json({ id, success: true });
    }

    if (type === "set") {
      // Log an exercise set
      const {
        workout_session_id,
        exercise_id,
        set_number,
        reps,
        weight,
        duration,
        rpe,
        is_warmup,
        is_dropset,
        is_failure,
        notes
      } = body;

      await db
        .prepare(`
          INSERT INTO exercise_sets (id, workout_session_id, exercise_id, set_number, reps, weight, duration, rpe, is_warmup, is_dropset, is_failure, notes, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          workout_session_id,
          exercise_id,
          set_number || 1,
          reps || null,
          weight || null,
          duration || null,
          rpe || null,
          is_warmup ? 1 : 0,
          is_dropset ? 1 : 0,
          is_failure ? 1 : 0,
          notes || null,
          now
        )
        .run();

      // Check for personal record (max weight)
      if (weight && reps) {
        const currentPR = await db
          .prepare(`
            SELECT * FROM personal_records 
            WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_weight'
            ORDER BY value DESC LIMIT 1
          `)
          .bind(userId, exercise_id)
          .first<{ value: number }>();

        if (!currentPR || weight > currentPR.value) {
          const prId = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          await db
            .prepare(`
              INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, reps, achieved_at, exercise_set_id, previous_value, created_at)
              VALUES (?, ?, ?, 'max_weight', ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              prId,
              userId,
              exercise_id,
              weight,
              reps,
              now,
              id,
              currentPR?.value || null,
              now
            )
            .run();

          return NextResponse.json({ id, success: true, newPR: true, prId, weight, previousPR: currentPR?.value });
        }
      }

      return NextResponse.json({ id, success: true, newPR: false });
    }

    if (type === "complete_session") {
      // Complete a workout session
      const { session_id, notes, rating } = body;

      await db
        .prepare(`UPDATE workout_sessions SET ended_at = ?, status = 'completed', notes = ?, rating = ? WHERE id = ? AND user_id = ?`)
        .bind(now, notes || null, rating || null, session_id, userId)
        .run();

      return NextResponse.json({ success: true });
    }

    if (type === "import_exercises") {
      // Bulk import exercises from JSON
      const { exercises: importExercises } = body;
      if (!Array.isArray(importExercises)) {
        return NextResponse.json({ error: "exercises must be an array" }, { status: 400 });
      }

      let imported = 0;
      for (const ex of importExercises) {
        const exId = ex.id || `ex_${Date.now()}_${imported}_${Math.random().toString(36).slice(2, 6)}`;
        try {
          await db
            .prepare(`
              INSERT OR IGNORE INTO exercises (id, user_id, name, description, category, muscle_groups, equipment, instructions, is_builtin, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              exId,
              ex.is_builtin ? null : userId,
              ex.name,
              ex.description || null,
              ex.category || "strength",
              ex.muscle_groups || ex.primaryMuscles ? JSON.stringify(ex.muscle_groups || ex.primaryMuscles) : null,
              ex.equipment ? (typeof ex.equipment === "string" ? JSON.stringify([ex.equipment]) : JSON.stringify(ex.equipment)) : null,
              Array.isArray(ex.instructions) ? ex.instructions.join("\n") : ex.instructions || null,
              ex.is_builtin ? 1 : 0,
              now,
              now
            )
            .run();
          imported++;
        } catch (e) {
          console.error(`Failed to import exercise ${ex.name}:`, e);
        }
      }

      return NextResponse.json({ success: true, imported });
    }

    if (type === "link_to_planner") {
      // Create a calendar event linked to a workout
      const { workout_id, title, start_time, end_time, recurrence_rule, recurrence_end } = body;
      const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await db
        .prepare(`
          INSERT INTO calendar_events (id, user_id, title, event_type, start_time, end_time, workout_id, recurrence_rule, recurrence_end, created_at, updated_at)
          VALUES (?, ?, ?, 'workout', ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(eventId, userId, title, start_time, end_time, workout_id, recurrence_rule || null, recurrence_end || null, now, now)
        .run();

      return NextResponse.json({ id: eventId, success: true });
    }

    if (type === "link_to_quest") {
      // Create a quest linked to workout completion
      const { workout_id, title, description, xp_value, is_repeatable, repeat_frequency } = body;
      const questId = `quest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await db
        .prepare(`
          INSERT INTO quests (id, user_id, title, description, domain_id, status, priority, xp_value, is_repeatable, repeat_frequency, created_at, updated_at, content_hash)
          VALUES (?, ?, ?, ?, 'exercise', 'pending', 'medium', ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          questId,
          userId,
          title || "Complete Workout",
          description || `Complete the workout: ${workout_id}`,
          xp_value || 50,
          is_repeatable ? 1 : 0,
          repeat_frequency || null,
          now,
          now,
          `workout_${workout_id}`
        )
        .run();

      return NextResponse.json({ id: questId, success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/exercise error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/exercise - Delete exercise, workout, or session
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });
    const userId = dbUser.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (type === "exercise") {
      // Only delete user-created exercises
      await db
        .prepare(`DELETE FROM exercises WHERE id = ? AND user_id = ? AND is_builtin = 0`)
        .bind(id, userId)
        .run();
    } else if (type === "workout") {
      await db
        .prepare(`DELETE FROM workouts WHERE id = ? AND user_id = ?`)
        .bind(id, userId)
        .run();
    } else if (type === "session") {
      await db
        .prepare(`DELETE FROM workout_sessions WHERE id = ? AND user_id = ?`)
        .bind(id, userId)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/exercise error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

