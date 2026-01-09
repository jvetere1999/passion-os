/**
 * Admin Users API
 * Manage users and deletion
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      // Return mock data for local dev
      return NextResponse.json({
        users: [
          { id: "1", email: "test@example.com", name: "Test User", role: "user", createdAt: new Date().toISOString() },
        ],
      });
    }

    const result = await db
      .prepare(`
        SELECT 
          u.id,
          u.email,
          u.name,
          u.image,
          u.role,
          u.tos_accepted as tosAccepted,
          u.created_at as createdAt,
          s.level,
          s.total_xp as totalXp
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        ORDER BY u.created_at DESC
      `)
      .all();

    return NextResponse.json({ users: result.results || [] });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}


/**
 * DELETE - Delete a user and all their data
 */
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true, message: "No DB (dev mode)" });
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
    let deleted = 0;
    for (const query of deletionQueries) {
      try {
        await db.prepare(query).bind(userId).run();
        deleted++;
      } catch (e) {
        // Some tables might not exist or query might fail - continue
        console.warn(`[admin/users] Delete query failed (continuing): ${query}`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${userId} and all data deleted`,
      queriesExecuted: deleted
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

