/**
 * Activity Events Service
 * Handles event-driven XP/coin distribution and quest progress
 */

import type { D1Database } from "@cloudflare/workers-types";
import { touchUserActivity } from "./users";

export type ActivityEventType =
  | "focus_start"
  | "focus_complete"
  | "workout_start"
  | "workout_complete"
  | "lesson_start"
  | "lesson_complete"
  | "review_complete"
  | "habit_complete"
  | "quest_complete"
  | "goal_milestone"
  | "planner_task_complete";

interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: ActivityEventType;
  entity_type?: string;
  entity_id?: string;
  xp_earned: number;
  coins_earned: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const EVENT_REWARDS: Record<ActivityEventType, { xp: number; coins: number; skill?: string }> = {
  focus_start: { xp: 5, coins: 2, skill: "knowledge" },
  focus_complete: { xp: 25, coins: 10, skill: "knowledge" },
  workout_start: { xp: 10, coins: 5, skill: "guts" },
  workout_complete: { xp: 50, coins: 25, skill: "guts" },
  lesson_start: { xp: 5, coins: 2, skill: "knowledge" },
  lesson_complete: { xp: 30, coins: 15, skill: "knowledge" },
  review_complete: { xp: 15, coins: 5, skill: "knowledge" },
  habit_complete: { xp: 10, coins: 5, skill: "proficiency" },
  quest_complete: { xp: 0, coins: 0 },
  goal_milestone: { xp: 40, coins: 20, skill: "proficiency" },
  planner_task_complete: { xp: 15, coins: 5, skill: "proficiency" },
};

/**
 * Check if an activity event already exists for a given entity
 * Used for idempotency to prevent duplicate rewards
 */
export async function hasActivityEvent(
  db: D1Database,
  userId: string,
  eventType: ActivityEventType,
  entityType: string,
  entityId: string
): Promise<boolean> {
  const existing = await db
    .prepare(`SELECT id FROM activity_events WHERE user_id = ? AND event_type = ? AND entity_type = ? AND entity_id = ? LIMIT 1`)
    .bind(userId, eventType, entityType, entityId)
    .first<{ id: string }>();
  return existing !== null;
}

/**
 * Log an activity event and process rewards
 */
export async function logActivityEvent(
  db: D1Database,
  userId: string,
  eventType: ActivityEventType,
  options?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    customXp?: number;
    customCoins?: number;
    skillId?: string;
  }
): Promise<ActivityEvent> {
  const now = new Date().toISOString();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const rewards = EVENT_REWARDS[eventType];
  const xpEarned = options?.customXp ?? rewards.xp;
  const coinsEarned = options?.customCoins ?? rewards.coins;
  const skillId = options?.skillId ?? rewards.skill;

  // Insert activity event
  await db
    .prepare(`INSERT INTO activity_events (id, user_id, event_type, entity_type, entity_id, xp_earned, coins_earned, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(eventId, userId, eventType, options?.entityType || null, options?.entityId || null, xpEarned, coinsEarned, options?.metadata ? JSON.stringify(options.metadata) : null, now)
    .run();

  // Update user's last activity timestamp (best-effort, does not throw)
  await touchUserActivity(db, userId, now);

  // Update user progress
  if (xpEarned > 0 || coinsEarned > 0) {
    await updateUserProgress(db, userId, xpEarned, coinsEarned, skillId);
  }

  // Update quest progress
  await updateQuestProgress(db, userId, eventType);

  // Update streaks
  await updateStreaks(db, userId, eventType);

  // Check and unlock achievements (best-effort, does not throw)
  try {
    await checkAndUnlockAchievements(db, userId, eventType);
  } catch (e) {
    console.error("Failed to check achievements:", e);
  }

  return {
    id: eventId,
    user_id: userId,
    event_type: eventType,
    entity_type: options?.entityType,
    entity_id: options?.entityId,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
    metadata: options?.metadata,
    created_at: now,
  };
}

async function updateUserProgress(db: D1Database, userId: string, xpEarned: number, coinsEarned: number, skillId?: string): Promise<void> {
  await db
    .prepare(`INSERT INTO user_progress (id, user_id, total_xp, current_level, coins, created_at, updated_at) VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now')) ON CONFLICT(user_id) DO UPDATE SET total_xp = total_xp + ?, coins = coins + ?, updated_at = datetime('now')`)
    .bind(`prog_${userId}`, userId, xpEarned, coinsEarned, xpEarned, coinsEarned)
    .run();

  if (skillId && xpEarned > 0) {
    await db
      .prepare(`INSERT INTO user_skills (id, user_id, skill_id, xp, level, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now')) ON CONFLICT(user_id, skill_id) DO UPDATE SET xp = xp + ?, updated_at = datetime('now')`)
      .bind(`skill_${userId}_${skillId}`, userId, skillId, xpEarned, xpEarned)
      .run();
  }

  const progress = await db.prepare(`SELECT total_xp FROM user_progress WHERE user_id = ?`).bind(userId).first<{ total_xp: number }>();
  if (progress) {
    const newLevel = calculateLevel(progress.total_xp);
    await db.prepare(`UPDATE user_progress SET current_level = ? WHERE user_id = ?`).bind(newLevel, userId).run();
  }
}

function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpRequired = 0;
  while (totalXp >= xpRequired + level * 100) {
    xpRequired += level * 100;
    level++;
  }
  return level;
}

async function updateQuestProgress(db: D1Database, userId: string, eventType: ActivityEventType): Promise<void> {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const quests = await db
    .prepare(`SELECT id, title, type, target, xp_reward, coin_reward, skill_id FROM universal_quests WHERE is_active = 1`)
    .all<{ id: string; title: string; type: string; target: number; xp_reward: number; coin_reward: number; skill_id: string | null }>();

  for (const quest of quests.results || []) {
    const questEventTypes = getQuestEventTypes(quest.title);
    if (!questEventTypes.includes(eventType)) continue;

    const progress = await db
      .prepare(`SELECT id, progress, completed, completed_at FROM user_quest_progress WHERE user_id = ? AND quest_id = ?`)
      .bind(userId, quest.id)
      .first<{ id: string; progress: number; completed: number; completed_at: string | null }>();

    if (progress?.completed) {
      if (quest.type === "daily" && progress.completed_at) {
        const completedDate = progress.completed_at.split("T")[0];
        if (completedDate !== today) {
          await db.prepare(`UPDATE user_quest_progress SET progress = 1, completed = 0, completed_at = NULL, updated_at = ? WHERE id = ?`).bind(now, progress.id).run();
        }
      }
      continue;
    }

    const newProgress = (progress?.progress || 0) + 1;
    const isComplete = newProgress >= quest.target;

    if (progress) {
      await db.prepare(`UPDATE user_quest_progress SET progress = ?, completed = ?, completed_at = ?, updated_at = ? WHERE id = ?`)
        .bind(newProgress, isComplete ? 1 : 0, isComplete ? now : null, now, progress.id).run();
    } else {
      await db.prepare(`INSERT INTO user_quest_progress (id, user_id, quest_id, progress, completed, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(`uqp_${Date.now()}`, userId, quest.id, newProgress, isComplete ? 1 : 0, isComplete ? now : null, now, now).run();
    }

    if (isComplete) {
      await updateUserProgress(db, userId, quest.xp_reward, quest.coin_reward, quest.skill_id || undefined);
    }
  }
}

function getQuestEventTypes(questTitle: string): ActivityEventType[] {
  const lowerTitle = questTitle.toLowerCase();
  const eventTypes: ActivityEventType[] = [];

  if (lowerTitle.includes("focus") || lowerTitle.includes("session")) eventTypes.push("focus_complete");
  if (lowerTitle.includes("workout") || lowerTitle.includes("exercise") || lowerTitle.includes("active")) eventTypes.push("workout_complete");
  if (lowerTitle.includes("learn") || lowerTitle.includes("lesson") || lowerTitle.includes("course")) eventTypes.push("lesson_complete");
  if (lowerTitle.includes("review") || lowerTitle.includes("card") || lowerTitle.includes("flashcard")) eventTypes.push("review_complete");
  if (lowerTitle.includes("habit") || lowerTitle.includes("streak")) eventTypes.push("habit_complete");
  if (lowerTitle.includes("plan") || lowerTitle.includes("task") || lowerTitle.includes("event")) eventTypes.push("planner_task_complete");

  return eventTypes;
}

async function updateStreaks(db: D1Database, userId: string, eventType: ActivityEventType): Promise<void> {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const streakTypeMap: Record<string, string> = {
    focus_complete: "focus",
    workout_complete: "workout",
    habit_complete: "daily_activity",
  };

  const streakType = streakTypeMap[eventType];
  if (!streakType) return;

  const streak = await db.prepare(`SELECT * FROM user_streaks WHERE user_id = ? AND streak_type = ?`).bind(userId, streakType)
    .first<{ id: string; current_streak: number; longest_streak: number; last_activity_date: string | null }>();

  if (streak) {
    const lastDate = streak.last_activity_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (lastDate === today) return;

    const newStreak = lastDate === yesterday ? streak.current_streak + 1 : 1;
    const longestStreak = Math.max(newStreak, streak.longest_streak);

    await db.prepare(`UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = ? WHERE id = ?`)
      .bind(newStreak, longestStreak, today, now, streak.id).run();
  } else {
    await db.prepare(`INSERT INTO user_streaks (id, user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_shields, created_at, updated_at) VALUES (?, ?, ?, 1, 1, ?, 0, ?, ?)`)
      .bind(`streak_${userId}_${streakType}`, userId, streakType, today, now, now).run();
  }
}

export async function getActivityEvents(db: D1Database, userId: string, options?: { startDate?: string; endDate?: string; eventType?: ActivityEventType; limit?: number }): Promise<ActivityEvent[]> {
  let query = `SELECT * FROM activity_events WHERE user_id = ?`;
  const params: (string | number)[] = [userId];

  if (options?.startDate) { query += ` AND created_at >= ?`; params.push(options.startDate); }
  if (options?.endDate) { query += ` AND created_at <= ?`; params.push(options.endDate); }
  if (options?.eventType) { query += ` AND event_type = ?`; params.push(options.eventType); }

  query += ` ORDER BY created_at DESC`;
  if (options?.limit) { query += ` LIMIT ?`; params.push(options.limit); }

  const result = await db.prepare(query).bind(...params).all<ActivityEvent>();
  return result.results || [];
}

export async function getUserStreaks(db: D1Database, userId: string): Promise<Record<string, { current: number; longest: number; lastDate: string | null }>> {
  const result = await db.prepare(`SELECT streak_type, current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ?`).bind(userId)
    .all<{ streak_type: string; current_streak: number; longest_streak: number; last_activity_date: string | null }>();

  const streaks: Record<string, { current: number; longest: number; lastDate: string | null }> = {};
  for (const row of result.results || []) {
    streaks[row.streak_type] = { current: row.current_streak, longest: row.longest_streak, lastDate: row.last_activity_date };
  }
  return streaks;
}

/**
 * Get the most recent activity date across all activity types for a user
 * Used to detect if user has been inactive for reduced mode
 */
export async function getLastActivityDate(db: D1Database, userId: string): Promise<string | null> {
  // Check user_streaks for most recent last_activity_date
  const streakResult = await db
    .prepare(`SELECT MAX(last_activity_date) as last_date FROM user_streaks WHERE user_id = ?`)
    .bind(userId)
    .first<{ last_date: string | null }>();

  if (streakResult?.last_date) {
    return streakResult.last_date;
  }

  // Fallback: check activity_events for most recent created_at
  const eventResult = await db
    .prepare(`SELECT MAX(created_at) as last_date FROM activity_events WHERE user_id = ?`)
    .bind(userId)
    .first<{ last_date: string | null }>();

  return eventResult?.last_date || null;
}

/**
 * Check if user should see reduced mode (inactive for > 48 hours)
 */
export async function shouldShowReducedMode(db: D1Database, userId: string): Promise<boolean> {
  const lastActivityDate = await getLastActivityDate(db, userId);

  if (!lastActivityDate) {
    // No activity recorded - could be new user, show normal mode
    return false;
  }

  const lastActivity = new Date(lastActivityDate);
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  return hoursSinceActivity > 48;
}

/**
 * Check and unlock achievements based on activity event
 */
async function checkAndUnlockAchievements(
  db: D1Database,
  userId: string,
  eventType: ActivityEventType
): Promise<void> {
  // Get all non-hidden achievements
  const achievements = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE is_hidden = 0`)
    .all<{
      id: string;
      condition_type: string;
      condition_json: string;
    }>();

  for (const achievement of achievements.results || []) {
    // Check if already unlocked
    const existing = await db
      .prepare(`SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`)
      .bind(userId, achievement.id)
      .first<{ id: string }>();

    if (existing) continue;

    // Parse condition
    let condition: { event_type?: string; count?: number; streak_type?: string; days?: number } = {};
    try {
      condition = JSON.parse(achievement.condition_json || "{}");
    } catch {
      continue;
    }

    let shouldUnlock = false;

    switch (achievement.condition_type) {
      case "first":
        // First time event
        if (condition.event_type === eventType) {
          shouldUnlock = true;
        }
        break;

      case "count":
        // Reach a count of events
        if (condition.event_type === eventType) {
          const count = await db
            .prepare(`SELECT COUNT(*) as count FROM activity_events WHERE user_id = ? AND event_type = ?`)
            .bind(userId, condition.event_type)
            .first<{ count: number }>();
          if (count && count.count >= (condition.count || 1)) {
            shouldUnlock = true;
          }
        }
        break;

      case "streak":
        // Reach a streak
        if (condition.streak_type) {
          const streak = await db
            .prepare(`SELECT current_streak FROM user_streaks WHERE user_id = ? AND streak_type = ?`)
            .bind(userId, condition.streak_type)
            .first<{ current_streak: number }>();
          if (streak && streak.current_streak >= (condition.days || 1)) {
            shouldUnlock = true;
          }
        }
        break;
    }

    if (shouldUnlock) {
      // Get achievement details for rewards
      const achievementDef = await db
        .prepare(`SELECT reward_coins, reward_xp, reward_skill_stars, reward_skill_id, name FROM achievement_definitions WHERE id = ?`)
        .bind(achievement.id)
        .first<{ reward_coins: number; reward_xp: number; reward_skill_stars: number; reward_skill_id: string | null; name: string }>();

      if (!achievementDef) continue;

      const now = new Date().toISOString();
      const achId = `ach_${userId}_${achievement.id}`;

      // Insert user achievement
      await db
        .prepare(`INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at, notified) VALUES (?, ?, ?, ?, 0)`)
        .bind(achId, userId, achievement.id, now)
        .run();

      // Award rewards using updateUserProgress
      if (achievementDef.reward_xp > 0 || achievementDef.reward_coins > 0) {
        await updateUserProgress(db, userId, achievementDef.reward_xp, achievementDef.reward_coins);
      }
    }
  }
}
