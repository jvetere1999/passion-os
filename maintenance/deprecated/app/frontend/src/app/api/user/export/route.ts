/**
 * Export User Data API
 * Exports all user data as JSON
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userId: userId,
      email: session.user.email,
    };

    // Export user data from each table
    const tables = [
      { name: "user_progress", query: `SELECT * FROM user_progress WHERE user_id = ?` },
      { name: "focus_sessions", query: `SELECT * FROM focus_sessions WHERE user_id = ?` },
      { name: "calendar_events", query: `SELECT * FROM calendar_events WHERE user_id = ?` },
      { name: "habits", query: `SELECT * FROM habits WHERE user_id = ?` },
      { name: "habit_logs", query: `SELECT * FROM habit_logs WHERE user_id = ?` },
      { name: "goals", query: `SELECT * FROM goals WHERE user_id = ?` },
      { name: "user_quest_progress", query: `SELECT * FROM user_quest_progress WHERE user_id = ?` },
      { name: "workouts", query: `SELECT * FROM workouts WHERE user_id = ?` },
      { name: "workout_sessions", query: `SELECT * FROM workout_sessions WHERE user_id = ?` },
      { name: "personal_records", query: `SELECT * FROM personal_records WHERE user_id = ?` },
      { name: "books", query: `SELECT * FROM books WHERE user_id = ?` },
      { name: "reading_sessions", query: `SELECT * FROM reading_sessions WHERE user_id = ?` },
      { name: "flashcard_decks", query: `SELECT * FROM flashcard_decks WHERE user_id = ?` },
      { name: "journal_entries", query: `SELECT * FROM journal_entries WHERE user_id = ?` },
      { name: "user_lesson_progress", query: `SELECT * FROM user_lesson_progress WHERE user_id = ?` },
      { name: "reward_purchases", query: `SELECT * FROM reward_purchases WHERE user_id = ?` },
      { name: "activity_events", query: `SELECT * FROM activity_events WHERE user_id = ?` },
    ];

    for (const table of tables) {
      try {
        const result = await db.prepare(table.query).bind(userId).all();
        exportData[table.name] = result.results || [];
      } catch (e) {
        console.warn(`[user/export] Table ${table.name} not found:`, e);
        exportData[table.name] = [];
      }
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("[user/export] Failed to export user data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

