/**
 * Daily Plan API Route
 * Generate and manage daily plans
 *
 * Optimized with createAPIHandler for timing instrumentation
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const dynamic = "force-dynamic";

interface PlanItem {
  id: string;
  type: "focus" | "quest" | "workout" | "learning" | "habit";
  title: string;
  description?: string;
  duration?: number;
  actionUrl: string;
  completed: boolean;
  priority: number;
}

/**
 * GET /api/daily-plan
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const existingPlan = await ctx.db
    .prepare(`SELECT id, items, completed_count, total_count FROM daily_plans WHERE user_id = ? AND plan_date = ?`)
    .bind(ctx.dbUser.id, date)
    .first<{ id: string; items: string; completed_count: number; total_count: number }>();

  if (existingPlan) {
    return NextResponse.json({
      plan: {
        id: existingPlan.id,
        date,
        items: JSON.parse(existingPlan.items) as PlanItem[],
        completedCount: existingPlan.completed_count,
        totalCount: existingPlan.total_count,
      },
    });
  }

  return NextResponse.json({ plan: null });
});

/**
 * POST /api/daily-plan
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as { action: string; item_id?: string };
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  if (body.action === "generate") {
    const items: PlanItem[] = [];
    let priority = 0;

    // Add focus session
    items.push({
      id: `plan_focus_${Date.now()}`,
      type: "focus",
      title: "Focus Session",
      description: "Complete a 25-minute focus session",
      duration: 25,
      actionUrl: "/focus",
      completed: false,
      priority: priority++,
    });

    // Add quests
    const quests = await ctx.db
      .prepare(`
        SELECT q.id, q.title, q.description
        FROM universal_quests q
        LEFT JOIN user_quest_progress p ON q.id = p.quest_id AND p.user_id = ?
        WHERE q.is_active = 1 AND (p.completed IS NULL OR p.completed = 0)
        LIMIT 3
      `)
      .bind(ctx.dbUser.id)
      .all<{ id: string; title: string; description: string }>();

    for (const quest of quests.results || []) {
      items.push({
        id: `plan_quest_${quest.id}`,
        type: "quest",
        title: quest.title,
        description: quest.description,
        actionUrl: "/quests",
        completed: false,
        priority: priority++,
      });
    }

    // Add workout if scheduled
    const workout = await ctx.db
      .prepare(`SELECT id, title FROM calendar_events WHERE user_id = ? AND event_type = 'workout' AND date(start_time) = ? LIMIT 1`)
      .bind(ctx.dbUser.id, today)
      .first<{ id: string; title: string }>();

    if (workout) {
      items.push({
        id: `plan_workout_${workout.id}`,
        type: "workout",
        title: workout.title,
        actionUrl: "/exercise",
        completed: false,
        priority: priority++,
      });
    }

    // Save plan
    const planId = `plan_${Date.now()}`;
    await ctx.db
      .prepare(`INSERT OR REPLACE INTO daily_plans (id, user_id, plan_date, items, completed_count, total_count, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`)
      .bind(planId, ctx.dbUser.id, today, JSON.stringify(items), items.length, now, now)
      .run();

    return NextResponse.json({ success: true, plan: { id: planId, date: today, items, completedCount: 0, totalCount: items.length } });
  }

  if (body.action === "complete_item") {
    const plan = await ctx.db
      .prepare(`SELECT id, items, completed_count FROM daily_plans WHERE user_id = ? AND plan_date = ?`)
      .bind(ctx.dbUser.id, today)
      .first<{ id: string; items: string; completed_count: number }>();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const items: PlanItem[] = JSON.parse(plan.items);
    const idx = items.findIndex((i) => i.id === body.item_id);
    if (idx >= 0) items[idx].completed = true;

    const completedCount = items.filter((i) => i.completed).length;
    await ctx.db
      .prepare(`UPDATE daily_plans SET items = ?, completed_count = ?, updated_at = ? WHERE id = ?`)
      .bind(JSON.stringify(items), completedCount, now, plan.id)
      .run();

    return NextResponse.json({ success: true, completedCount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
