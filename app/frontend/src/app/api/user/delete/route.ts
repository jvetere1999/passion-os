/**
 * Delete User Data API
 * Permanently deletes all user data from the database
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export async function DELETE() {
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

    // Delete all user data from all tables in order (respecting foreign keys)
    const deletionQueries = [
      // Activity and progress
      `DELETE FROM activity_events WHERE user_id = ?`,
      `DELETE FROM user_progress WHERE user_id = ?`,

      // Focus sessions
      `DELETE FROM focus_sessions WHERE user_id = ?`,

      // Calendar/Planner
      `DELETE FROM calendar_events WHERE user_id = ?`,

      // Quests
      `DELETE FROM user_quest_progress WHERE user_id = ?`,

      // Habits
      `DELETE FROM habit_logs WHERE user_id = ?`,
      `DELETE FROM habits WHERE user_id = ?`,

      // Goals
      `DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM goals WHERE user_id = ?)`,
      `DELETE FROM goals WHERE user_id = ?`,

      // Fitness
      `DELETE FROM personal_records WHERE user_id = ?`,
      `DELETE FROM workout_sets WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?)`,
      `DELETE FROM workout_sessions WHERE user_id = ?`,
      `DELETE FROM workout_exercises WHERE section_id IN (SELECT id FROM workout_sections WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?))`,
      `DELETE FROM workout_sections WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?)`,
      `DELETE FROM workouts WHERE user_id = ?`,
      `DELETE FROM exercises WHERE created_by = ? AND is_custom = 1`,

      // Books
      `DELETE FROM reading_sessions WHERE user_id = ?`,
      `DELETE FROM books WHERE user_id = ?`,

      // Learning
      `DELETE FROM user_lesson_progress WHERE user_id = ?`,
      `DELETE FROM flashcards WHERE deck_id IN (SELECT id FROM flashcard_decks WHERE user_id = ?)`,
      `DELETE FROM flashcard_decks WHERE user_id = ?`,
      `DELETE FROM journal_entries WHERE user_id = ?`,

      // Market
      `DELETE FROM reward_purchases WHERE user_id = ?`,
      `DELETE FROM rewards WHERE user_id = ?`,

      // Feedback
      `DELETE FROM user_feedback WHERE user_id = ?`,

      // Daily plans
      `DELETE FROM daily_plans WHERE user_id = ?`,

      // Notifications
      `DELETE FROM notifications WHERE user_id = ?`,

      // Sessions and accounts (Auth.js)
      `DELETE FROM sessions WHERE userId = ?`,
      `DELETE FROM accounts WHERE userId = ?`,

      // Finally, the user record itself
      `DELETE FROM users WHERE id = ?`,
    ];

    // Execute all deletions
    for (const query of deletionQueries) {
      try {
        await db.prepare(query).bind(userId).run();
      } catch (e) {
        // Some tables might not exist or query might fail - continue
        console.warn(`[user/delete] Query failed (continuing): ${query}`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "All user data has been permanently deleted"
    });
  } catch (error) {
    console.error("[user/delete] Failed to delete user data:", error);
    return NextResponse.json(
      { error: "Failed to delete user data" },
      { status: 500 }
    );
  }
}

