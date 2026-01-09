/**
 * Quests API Route
 * GET /api/quests - List universal quests for all users
 *
 * Optimized with:
 * - createAPIHandler for timing instrumentation
 * - Parallel DB queries for quests and user progress
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const dynamic = "force-dynamic";

/**
 * GET /api/quests
 * List active universal quests
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  // Run both queries in parallel for better performance
  const [questsResult, progressResult] = await Promise.all([
    ctx.db
      .prepare(`
        SELECT 
          id,
          title,
          description,
          type,
          xp_reward as xpReward,
          coin_reward as coinReward,
          target,
          skill_id as skillId
        FROM universal_quests
        WHERE is_active = 1
        ORDER BY type, created_at DESC
      `)
      .all(),
    ctx.db
      .prepare(`
        SELECT quest_id, progress, completed, completed_at
        FROM user_quest_progress 
        WHERE user_id = ?
      `)
      .bind(ctx.dbUser.id)
      .all<{ quest_id: string; progress: number; completed: number; completed_at: string | null }>(),
  ]);

  const progressMap: Record<string, { progress: number; completed: boolean }> = {};
  (progressResult.results || []).forEach((p) => {
    progressMap[p.quest_id] = { progress: p.progress, completed: p.completed === 1 };
  });

  return NextResponse.json({ quests: questsResult.results || [], userProgress: progressMap });
});

/**
 * POST /api/quests
 * Update quest progress or complete a quest
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await ctx.request.json();
  const { type, questId, progress, xpReward, coinReward, skillId } = body;

  const userId = ctx.dbUser.id;
  const now = new Date().toISOString();

  if (type === "progress") {
    // Update quest progress in user_quest_progress table
    const existing = await ctx.db
      .prepare(`SELECT * FROM user_quest_progress WHERE user_id = ? AND quest_id = ?`)
      .bind(userId, questId)
      .first();

    if (existing) {
      await ctx.db
        .prepare(`UPDATE user_quest_progress SET progress = ?, updated_at = ? WHERE user_id = ? AND quest_id = ?`)
        .bind(progress, now, userId, questId)
        .run();
    } else {
      await ctx.db
        .prepare(`INSERT INTO user_quest_progress (id, user_id, quest_id, progress, completed, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)`)
        .bind(`uqp_${Date.now()}`, userId, questId, progress, now, now)
        .run();
    }

    return NextResponse.json({ success: true, persisted: true });
  }

  if (type === "complete") {
    // Mark quest as completed
    await ctx.db
      .prepare(`
        INSERT INTO user_quest_progress (id, user_id, quest_id, progress, completed, completed_at, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(user_id, quest_id) DO UPDATE SET 
          completed = 1, 
          completed_at = ?,
          updated_at = ?
      `)
      .bind(`uqp_${Date.now()}`, userId, questId, progress || 1, now, now, now, now, now)
      .run();

    // Award XP to skill
    if (xpReward && skillId) {
      const skillResult = await ctx.db
        .prepare(`SELECT xp FROM user_skills WHERE user_id = ? AND skill_id = ?`)
        .bind(userId, skillId)
        .first<{ xp: number }>();

      const currentXp = skillResult?.xp || 0;
      const newXp = currentXp + xpReward;

      await ctx.db
        .prepare(`
          INSERT INTO user_skills (id, user_id, skill_id, xp, level, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, ?, ?)
          ON CONFLICT(user_id, skill_id) DO UPDATE SET
            xp = ?,
            updated_at = ?
        `)
        .bind(`skill_${Date.now()}`, userId, skillId, newXp, now, now, newXp, now)
        .run();
    }

    // Add to reward ledger
    if (xpReward) {
      await ctx.db
        .prepare(`INSERT INTO reward_ledger (id, user_id, domain_id, reward_type, amount, reason, created_at) VALUES (?, ?, 'quests', 'xp', ?, ?, ?)`)
        .bind(`reward_${Date.now()}_xp`, userId, xpReward, `Quest completed: ${questId}`, now)
        .run();
    }

    if (coinReward) {
      await ctx.db
        .prepare(`INSERT INTO reward_ledger (id, user_id, domain_id, reward_type, amount, reason, created_at) VALUES (?, ?, 'quests', 'coins', ?, ?, ?)`)
        .bind(`reward_${Date.now()}_coins`, userId, coinReward, `Quest completed: ${questId}`, now)
        .run();
    }

    return NextResponse.json({ success: true, persisted: true, xpAwarded: xpReward, coinsAwarded: coinReward });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
});

