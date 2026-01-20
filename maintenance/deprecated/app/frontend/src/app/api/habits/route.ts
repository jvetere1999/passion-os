/**
 * Habits API Route
 * CRUD for habits and habit logging
 *
 * Optimized with:
 * - createAPIHandler for timing instrumentation
 * - Parallel DB queries for habits, logs, and streaks
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";
import { logActivityEvent } from "@/lib/db/repositories/activity-events";

export const dynamic = "force-dynamic";

interface Habit {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  target_count: number;
  category: string;
  xp_reward: number;
  coin_reward: number;
  skill_id: string | null;
  is_active: number;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
}

/**
 * GET /api/habits
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const today = new Date().toISOString().split("T")[0];

  // Run all three queries in parallel for better performance
  const [habits, todayLogs, streaks] = await Promise.all([
    ctx.db
      .prepare(`SELECT * FROM habits WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC`)
      .bind(ctx.dbUser.id)
      .all<Habit>(),
    ctx.db
      .prepare(`SELECT * FROM habit_logs WHERE user_id = ? AND completed_at >= ? AND completed_at < date(?, '+1 day')`)
      .bind(ctx.dbUser.id, today, today)
      .all<HabitLog>(),
    ctx.db
      .prepare(`SELECT streak_type, current_streak, longest_streak FROM user_streaks WHERE user_id = ?`)
      .bind(ctx.dbUser.id)
      .all<{ streak_type: string; current_streak: number; longest_streak: number }>(),
  ]);

  const streakMap: Record<string, { current: number; longest: number }> = {};
  for (const s of streaks.results || []) {
    streakMap[s.streak_type] = { current: s.current_streak, longest: s.longest_streak };
  }

  return NextResponse.json({
    habits: habits.results || [],
    todayLogs: todayLogs.results || [],
    streaks: streakMap
  });
});

/**
 * POST /api/habits
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as {
    action: string;
    id?: string;
    habit_id?: string;
    title?: string;
    description?: string;
    frequency?: string;
    target_count?: number;
    category?: string;
    xp_reward?: number;
    coin_reward?: number;
    skill_id?: string;
    notes?: string;
  };
  const now = new Date().toISOString();

  if (body.action === "create") {
    const id = `habit_${Date.now()}`;
    await ctx.db
      .prepare(`INSERT INTO habits (id, user_id, title, description, frequency, target_count, category, xp_reward, coin_reward, skill_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .bind(id, ctx.dbUser.id, body.title, body.description || null, body.frequency || "daily", body.target_count || 1, body.category || "general", body.xp_reward || 10, body.coin_reward || 5, body.skill_id || null, now, now)
      .run();
    return NextResponse.json({ success: true, id });
  }

  if (body.action === "log") {
    const logId = `hlog_${Date.now()}`;
    await ctx.db
      .prepare(`INSERT INTO habit_logs (id, habit_id, user_id, completed_at, notes) VALUES (?, ?, ?, ?, ?)`)
      .bind(logId, body.habit_id, ctx.dbUser.id, now, body.notes || null)
      .run();

    const habit = await ctx.db.prepare(`SELECT * FROM habits WHERE id = ?`).bind(body.habit_id).first<Habit>();
    if (habit) {
      await logActivityEvent(ctx.db, ctx.dbUser.id, "habit_complete", {
        entityType: "habit",
        entityId: body.habit_id,
        customXp: habit.xp_reward,
        customCoins: habit.coin_reward,
        skillId: habit.skill_id || undefined,
        metadata: { habitTitle: habit.title },
      });
    }
    return NextResponse.json({ success: true, id: logId });
  }

  if (body.action === "update") {
    await ctx.db
      .prepare(`UPDATE habits SET title = ?, description = ?, frequency = ?, target_count = ?, category = ?, xp_reward = ?, coin_reward = ?, skill_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
      .bind(body.title, body.description || null, body.frequency || "daily", body.target_count || 1, body.category || "general", body.xp_reward || 10, body.coin_reward || 5, body.skill_id || null, now, body.id, ctx.dbUser.id)
      .run();
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete") {
    await ctx.db.prepare(`UPDATE habits SET is_active = 0, updated_at = ? WHERE id = ? AND user_id = ?`).bind(now, body.id, ctx.dbUser.id).run();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
