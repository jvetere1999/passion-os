/**
 * Gamification Service
 * Handles points, achievements, streaks, and rewards
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  Currency,
  UserWallet,
  UserAchievement,
  AchievementDefinition,
  UserSkill,
} from "../types";

// ============================================
// Wallet Operations
// ============================================

/**
 * Get user wallet
 */
export async function getUserWallet(
  db: D1Database,
  userId: string
): Promise<UserWallet | null> {
  return db
    .prepare(`SELECT * FROM user_wallet WHERE user_id = ?`)
    .bind(userId)
    .first<UserWallet>();
}

/**
 * Create wallet for new user
 */
export async function createUserWallet(
  db: D1Database,
  userId: string
): Promise<UserWallet> {
  const id = `wallet_${userId}`;
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO user_wallet (id, user_id, coins, xp, level, xp_to_next_level, total_skill_stars, updated_at)
      VALUES (?, ?, 0, 0, 1, 100, 0, ?)
    `)
    .bind(id, userId, now)
    .run();

  return {
    id,
    user_id: userId,
    coins: 0,
    xp: 0,
    level: 1,
    xp_to_next_level: 100,
    total_skill_stars: 0,
    updated_at: now,
  };
}

/**
 * Award points to user (idempotent with source_id)
 */
export async function awardPoints(
  db: D1Database,
  userId: string,
  currency: Currency,
  amount: number,
  reason: string,
  sourceType?: string,
  sourceId?: string,
  skillId?: string
): Promise<{ success: boolean; alreadyAwarded: boolean; newBalance: number }> {
  const now = new Date().toISOString();

  // Check for idempotency if source provided
  if (sourceType && sourceId) {
    const existing = await db
      .prepare(`
        SELECT id FROM points_ledger 
        WHERE user_id = ? AND currency = ? AND source_type = ? AND source_id = ?
      `)
      .bind(userId, currency, sourceType, sourceId)
      .first<{ id: string }>();

    if (existing) {
      // Already awarded - get current balance and return
      const wallet = await getUserWallet(db, userId);
      const balance = currency === "coins" ? wallet?.coins || 0 :
                      currency === "xp" ? wallet?.xp || 0 :
                      wallet?.total_skill_stars || 0;
      return { success: true, alreadyAwarded: true, newBalance: balance };
    }
  }

  // Insert ledger entry
  const ledgerId = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO points_ledger (id, user_id, currency, amount, reason, source_type, source_id, skill_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(ledgerId, userId, currency, amount, reason, sourceType || null, sourceId || null, skillId || null, now)
    .run();

  // Update wallet
  let newBalance = 0;
  if (currency === "coins") {
    await db
      .prepare(`UPDATE user_wallet SET coins = coins + ?, updated_at = ? WHERE user_id = ?`)
      .bind(amount, now, userId)
      .run();
    const wallet = await getUserWallet(db, userId);
    newBalance = wallet?.coins || 0;
  } else if (currency === "xp") {
    // Update XP and check for level up
    await db
      .prepare(`UPDATE user_wallet SET xp = xp + ?, updated_at = ? WHERE user_id = ?`)
      .bind(amount, now, userId)
      .run();

    // Check for level up
    await checkAndProcessLevelUp(db, userId);

    const wallet = await getUserWallet(db, userId);
    newBalance = wallet?.xp || 0;
  } else if (currency === "skill_stars" && skillId) {
    // Update skill stars
    await db
      .prepare(`UPDATE user_wallet SET total_skill_stars = total_skill_stars + ?, updated_at = ? WHERE user_id = ?`)
      .bind(amount, now, userId)
      .run();

    // Update specific skill
    await addSkillStars(db, userId, skillId, amount);

    const wallet = await getUserWallet(db, userId);
    newBalance = wallet?.total_skill_stars || 0;
  }

  return { success: true, alreadyAwarded: false, newBalance };
}

/**
 * Spend coins (for market purchases)
 */
export async function spendCoins(
  db: D1Database,
  userId: string,
  amount: number,
  reason: string,
  purchaseId?: string
): Promise<{ success: boolean; error?: string; newBalance: number }> {
  const wallet = await getUserWallet(db, userId);
  if (!wallet) {
    return { success: false, error: "Wallet not found", newBalance: 0 };
  }

  if (wallet.coins < amount) {
    return { success: false, error: "Insufficient coins", newBalance: wallet.coins };
  }

  const now = new Date().toISOString();
  const ledgerId = crypto.randomUUID();

  // Insert negative ledger entry
  await db
    .prepare(`
      INSERT INTO points_ledger (id, user_id, currency, amount, reason, source_type, source_id, created_at)
      VALUES (?, ?, 'coins', ?, ?, 'purchase', ?, ?)
    `)
    .bind(ledgerId, userId, -amount, reason, purchaseId || null, now)
    .run();

  // Update wallet
  await db
    .prepare(`UPDATE user_wallet SET coins = coins - ?, updated_at = ? WHERE user_id = ?`)
    .bind(amount, now, userId)
    .run();

  return { success: true, newBalance: wallet.coins - amount };
}

// ============================================
// Level System
// ============================================

/**
 * Calculate XP required for a level
 */
function xpForLevel(level: number): number {
  // Simple exponential curve: 100, 150, 225, 338, 506, ...
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Check and process level ups
 */
async function checkAndProcessLevelUp(db: D1Database, userId: string): Promise<number> {
  const wallet = await getUserWallet(db, userId);
  if (!wallet) return 0;

  let currentLevel = wallet.level;
  let currentXp = wallet.xp;
  let xpNeeded = wallet.xp_to_next_level;
  let levelsGained = 0;

  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    currentLevel++;
    xpNeeded = xpForLevel(currentLevel);
    levelsGained++;
  }

  if (levelsGained > 0) {
    const now = new Date().toISOString();
    await db
      .prepare(`
        UPDATE user_wallet 
        SET level = ?, xp = ?, xp_to_next_level = ?, updated_at = ?
        WHERE user_id = ?
      `)
      .bind(currentLevel, currentXp, xpNeeded, now, userId)
      .run();

    // Log level up event
    await db
      .prepare(`
        INSERT INTO activity_events (id, user_id, event_type, metadata_json, created_at)
        VALUES (?, ?, 'level_up', ?, ?)
      `)
      .bind(
        crypto.randomUUID(),
        userId,
        JSON.stringify({ new_level: currentLevel, levels_gained: levelsGained }),
        now
      )
      .run();
  }

  return levelsGained;
}

// ============================================
// Skills
// ============================================

/**
 * Get user skill progress
 */
export async function getUserSkill(
  db: D1Database,
  userId: string,
  skillId: string
): Promise<UserSkill | null> {
  return db
    .prepare(`SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?`)
    .bind(userId, skillId)
    .first<UserSkill>();
}

/**
 * Get all user skills
 */
export async function getUserSkills(
  db: D1Database,
  userId: string
): Promise<UserSkill[]> {
  const result = await db
    .prepare(`SELECT * FROM user_skills WHERE user_id = ?`)
    .bind(userId)
    .all<UserSkill>();
  return result.results || [];
}

/**
 * Add skill stars
 */
async function addSkillStars(
  db: D1Database,
  userId: string,
  skillId: string,
  amount: number
): Promise<void> {
  const now = new Date().toISOString();

  // Get or create skill progress
  const existing = await getUserSkill(db, userId, skillId);

  if (existing) {
    // Get skill definition for level calculation
    const skillDef = await db
      .prepare(`SELECT stars_per_level FROM skill_definitions WHERE id = ?`)
      .bind(skillId)
      .first<{ stars_per_level: number }>();

    const starsPerLevel = skillDef?.stars_per_level || 20;
    const newStars = existing.current_stars + amount;
    const newLevel = Math.floor(newStars / starsPerLevel);

    await db
      .prepare(`
        UPDATE user_skills 
        SET current_stars = ?, current_level = ?, updated_at = ?
        WHERE user_id = ? AND skill_id = ?
      `)
      .bind(newStars, newLevel, now, userId, skillId)
      .run();
  } else {
    const id = `skill_${userId}_${skillId}`;
    await db
      .prepare(`
        INSERT INTO user_skills (id, user_id, skill_id, current_stars, current_level, updated_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `)
      .bind(id, userId, skillId, amount, now)
      .run();
  }
}

// ============================================
// Achievements
// ============================================

/**
 * Get all achievement definitions
 */
export async function getAchievementDefinitions(
  db: D1Database
): Promise<AchievementDefinition[]> {
  const result = await db
    .prepare(`SELECT * FROM achievement_definitions ORDER BY category, name`)
    .all<AchievementDefinition>();
  return result.results || [];
}

/**
 * Get user achievements
 */
export async function getUserAchievements(
  db: D1Database,
  userId: string
): Promise<UserAchievement[]> {
  const result = await db
    .prepare(`SELECT * FROM user_achievements WHERE user_id = ? ORDER BY unlocked_at DESC`)
    .bind(userId)
    .all<UserAchievement>();
  return result.results || [];
}

/**
 * Check if user has achievement
 */
export async function hasAchievement(
  db: D1Database,
  userId: string,
  achievementId: string
): Promise<boolean> {
  const existing = await db
    .prepare(`SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`)
    .bind(userId, achievementId)
    .first<{ id: string }>();
  return !!existing;
}

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(
  db: D1Database,
  userId: string,
  achievementId: string
): Promise<{ success: boolean; alreadyUnlocked: boolean; rewards?: { coins: number; xp: number; skillStars: number } }> {
  // Check if already unlocked
  if (await hasAchievement(db, userId, achievementId)) {
    return { success: true, alreadyUnlocked: true };
  }

  // Get achievement definition
  const achievement = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE id = ?`)
    .bind(achievementId)
    .first<AchievementDefinition>();

  if (!achievement) {
    return { success: false, alreadyUnlocked: false };
  }

  const now = new Date().toISOString();
  const id = `ach_${userId}_${achievementId}`;

  // Insert user achievement
  await db
    .prepare(`
      INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at, notified)
      VALUES (?, ?, ?, ?, 0)
    `)
    .bind(id, userId, achievementId, now)
    .run();

  // Award rewards
  if (achievement.reward_coins > 0) {
    await awardPoints(db, userId, "coins", achievement.reward_coins, `Achievement: ${achievement.name}`, "achievement", achievementId);
  }
  if (achievement.reward_xp > 0) {
    await awardPoints(db, userId, "xp", achievement.reward_xp, `Achievement: ${achievement.name}`, "achievement", achievementId);
  }
  if (achievement.reward_skill_stars > 0 && achievement.reward_skill_id) {
    await awardPoints(db, userId, "skill_stars", achievement.reward_skill_stars, `Achievement: ${achievement.name}`, "achievement", achievementId, achievement.reward_skill_id);
  }

  // Log activity event
  await db
    .prepare(`
      INSERT INTO activity_events (id, user_id, event_type, entity_type, entity_id, coins_earned, xp_earned, skill_stars_earned, created_at)
      VALUES (?, ?, 'achievement_unlocked', 'achievement', ?, ?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      userId,
      achievementId,
      achievement.reward_coins,
      achievement.reward_xp,
      achievement.reward_skill_stars,
      now
    )
    .run();

  return {
    success: true,
    alreadyUnlocked: false,
    rewards: {
      coins: achievement.reward_coins,
      xp: achievement.reward_xp,
      skillStars: achievement.reward_skill_stars,
    },
  };
}

/**
 * Check achievements based on an event
 */
export async function checkAchievements(
  db: D1Database,
  userId: string,
  eventType: string,
  _metadata?: Record<string, unknown>
): Promise<AchievementDefinition[]> {
  const unlockedAchievements: AchievementDefinition[] = [];

  // Get all achievement definitions
  const achievements = await getAchievementDefinitions(db);

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (await hasAchievement(db, userId, achievement.id)) {
      continue;
    }

    try {
      const condition = JSON.parse(achievement.condition_json);
      let shouldUnlock = false;

      switch (achievement.condition_type) {
        case "first":
          // First time doing something
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
            if (count && count.count >= condition.count) {
              shouldUnlock = true;
            }
          }
          break;

        case "streak":
          // Reach a streak
          const streak = await db
            .prepare(`SELECT current_streak FROM user_streaks WHERE user_id = ? AND streak_type = ?`)
            .bind(userId, condition.streak_type)
            .first<{ current_streak: number }>();
          if (streak && streak.current_streak >= condition.days) {
            shouldUnlock = true;
          }
          break;

        case "milestone":
          // Custom milestone check
          // This would need specific implementation per milestone type
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(db, userId, achievement.id);
        unlockedAchievements.push(achievement);
      }
    } catch (e) {
      console.error(`Failed to check achievement ${achievement.id}:`, e);
    }
  }

  return unlockedAchievements;
}

// ============================================
// Streaks
// ============================================

/**
 * Update user streak
 */
export async function updateStreak(
  db: D1Database,
  userId: string,
  streakType: string = "daily_activity"
): Promise<{ currentStreak: number; isNewDay: boolean; streakBroken: boolean }> {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Get existing streak
  const existing = await db
    .prepare(`SELECT * FROM user_streaks WHERE user_id = ? AND streak_type = ?`)
    .bind(userId, streakType)
    .first<{ id: string; current_streak: number; longest_streak: number; last_activity_date: string | null }>();

  if (!existing) {
    // Create new streak
    const id = `streak_${userId}_${streakType}`;
    await db
      .prepare(`
        INSERT INTO user_streaks (id, user_id, streak_type, current_streak, longest_streak, last_activity_date, created_at, updated_at)
        VALUES (?, ?, ?, 1, 1, ?, ?, ?)
      `)
      .bind(id, userId, streakType, today, now.toISOString(), now.toISOString())
      .run();
    return { currentStreak: 1, isNewDay: true, streakBroken: false };
  }

  if (existing.last_activity_date === today) {
    // Already logged today
    return { currentStreak: existing.current_streak, isNewDay: false, streakBroken: false };
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  let streakBroken = false;

  if (existing.last_activity_date === yesterdayStr) {
    // Continue streak
    newStreak = existing.current_streak + 1;
  } else {
    // Streak broken - reset
    newStreak = 1;
    streakBroken = true;
  }

  const newLongest = Math.max(existing.longest_streak, newStreak);

  await db
    .prepare(`
      UPDATE user_streaks 
      SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = ?
      WHERE user_id = ? AND streak_type = ?
    `)
    .bind(newStreak, newLongest, today, now.toISOString(), userId, streakType)
    .run();

  return { currentStreak: newStreak, isNewDay: true, streakBroken };
}

/**
 * Get user streak info
 */
export async function getUserStreak(
  db: D1Database,
  userId: string,
  streakType: string = "daily_activity"
): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: string | null } | null> {
  const streak = await db
    .prepare(`SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ? AND streak_type = ?`)
    .bind(userId, streakType)
    .first<{ current_streak: number; longest_streak: number; last_activity_date: string | null }>();

  if (!streak) return null;

  return {
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    lastActivityDate: streak.last_activity_date,
  };
}

/**
 * Get next achievable achievement for reward teaser
 * Returns an achievement the user hasn't unlocked that's closest to being earned
 */
export async function getNextAchievementTeaser(
  db: D1Database,
  userId: string
): Promise<{
  achievement: AchievementDefinition;
  progress: number;
  progressMax: number;
  progressLabel: string;
} | null> {
  // Get all achievement definitions
  const allAchievementsResult = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE is_hidden = 0 ORDER BY reward_coins ASC`)
    .all<AchievementDefinition>();
  const allAchievements = allAchievementsResult.results || [];

  // Get user's unlocked achievements
  const unlockedResult = await db
    .prepare(`SELECT achievement_id FROM user_achievements WHERE user_id = ?`)
    .bind(userId)
    .all<{ achievement_id: string }>();
  const unlockedIds = new Set((unlockedResult.results || []).map(a => a.achievement_id));

  // Get user stats for progress calculation
  const wallet = await getUserWallet(db, userId);
  const streak = await getUserStreak(db, userId, "daily_activity");

  // Count various activities
  const focusCount = await db
    .prepare(`SELECT COUNT(*) as count FROM activity_events WHERE user_id = ? AND event_type = 'focus_complete'`)
    .bind(userId)
    .first<{ count: number }>();

  const questCount = await db
    .prepare(`SELECT COUNT(*) as count FROM activity_events WHERE user_id = ? AND event_type = 'quest_complete'`)
    .bind(userId)
    .first<{ count: number }>();

  // Find the best candidate
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    // Parse trigger condition from condition_json
    let trigger: { type?: string; event_type?: string; count?: number; threshold?: number } = {};
    try {
      trigger = JSON.parse(achievement.condition_json || "{}");
    } catch {
      continue;
    }

    let progress = 0;
    const progressMax = trigger.count || trigger.threshold || 1;
    let progressLabel = "";

    // Match condition type to progress
    switch (achievement.condition_type) {
      case "count":
        if (trigger.event_type === "focus_complete") {
          progress = focusCount?.count || 0;
          progressLabel = `${progress}/${progressMax} focus sessions`;
        } else if (trigger.event_type === "quest_complete") {
          progress = questCount?.count || 0;
          progressLabel = `${progress}/${progressMax} quests`;
        }
        break;
      case "streak":
        progress = streak?.currentStreak || 0;
        progressLabel = `${progress}/${progressMax} day streak`;
        break;
      case "milestone":
        progress = wallet?.level || 1;
        progressLabel = `Level ${progress}/${progressMax}`;
        break;
      case "first":
        // First-time achievements - check if event happened
        if (trigger.event_type === "focus_complete") {
          progress = focusCount?.count || 0;
          progressLabel = progress > 0 ? "Complete!" : "Complete a focus session";
        } else if (trigger.event_type === "quest_complete") {
          progress = questCount?.count || 0;
          progressLabel = progress > 0 ? "Complete!" : "Complete a quest";
        }
        break;
      default:
        continue;
    }

    // Return first unachieved achievement with progress
    if (progress < progressMax) {
      return {
        achievement,
        progress,
        progressMax,
        progressLabel,
      };
    }
  }

  return null;
}
