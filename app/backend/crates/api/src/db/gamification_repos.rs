//! Gamification repositories
//!
//! Database operations for XP, coins, wallet, achievements, skills, and streaks.
//! Implements idempotency for safe retries.

use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use super::gamification_models::*;
use crate::error::AppError;

// ============================================================================
// CONSTANTS
// ============================================================================

/// XP required for a level (simple formula: 100 * level^1.5)
fn xp_for_level(level: i32) -> i32 {
    (100.0 * (level as f64).powf(1.5)).floor() as i32
}

// ============================================================================
// USER PROGRESS REPOSITORY
// ============================================================================

pub struct UserProgressRepo;

impl UserProgressRepo {
    /// Get or create user progress
    pub async fn get_or_create(pool: &PgPool, user_id: Uuid) -> Result<UserProgress, AppError> {
        // Try to get existing
        let existing = sqlx::query_as::<_, UserProgress>(
            r#"SELECT id, user_id, total_xp, current_level, xp_to_next_level,
                      total_skill_stars, created_at, updated_at
               FROM user_progress WHERE user_id = $1"#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some(progress) = existing {
            return Ok(progress);
        }

        // Create new
        let progress = sqlx::query_as::<_, UserProgress>(
            r#"INSERT INTO user_progress (user_id, total_xp, current_level, xp_to_next_level, total_skill_stars)
               VALUES ($1, 0, 1, 100, 0)
               RETURNING id, user_id, total_xp, current_level, xp_to_next_level,
                         total_skill_stars, created_at, updated_at"#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(progress)
    }

    /// Award XP with level-up handling
    pub async fn award_xp(
        pool: &PgPool,
        user_id: Uuid,
        xp: i32,
        event_type: &str,
        event_id: Option<Uuid>,
        reason: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<AwardResult, AppError> {
        // Check idempotency
        if let Some(key) = idempotency_key {
            let existing = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM points_ledger WHERE idempotency_key = $1",
            )
            .bind(key)
            .fetch_one(pool)
            .await?;

            if existing > 0 {
                let progress = Self::get_or_create(pool, user_id).await?;
                return Ok(AwardResult {
                    success: true,
                    already_awarded: true,
                    new_balance: progress.total_xp,
                    leveled_up: Some(false),
                    new_level: Some(progress.current_level),
                });
            }
        }

        // Ensure progress exists
        let progress = Self::get_or_create(pool, user_id).await?;

        // Calculate new XP and level
        let mut new_xp = progress.total_xp + xp as i64;
        let mut new_level = progress.current_level;
        let mut leveled_up = false;

        // Check for level-up
        loop {
            let xp_needed = xp_for_level(new_level) as i64;
            if new_xp >= xp_needed {
                new_xp -= xp_needed;
                new_level += 1;
                leveled_up = true;
            } else {
                break;
            }
        }

        let new_xp_to_next = xp_for_level(new_level);

        // Update progress
        sqlx::query(
            r#"UPDATE user_progress
               SET total_xp = $1, current_level = $2, xp_to_next_level = $3, updated_at = NOW()
               WHERE user_id = $4"#,
        )
        .bind(new_xp)
        .bind(new_level)
        .bind(new_xp_to_next)
        .bind(user_id)
        .execute(pool)
        .await?;

        // Record in ledger
        sqlx::query(
            r#"INSERT INTO points_ledger (user_id, event_type, event_id, xp, reason, idempotency_key)
               VALUES ($1, $2, $3, $4, $5, $6)"#,
        )
        .bind(user_id)
        .bind(event_type)
        .bind(event_id)
        .bind(xp)
        .bind(reason)
        .bind(idempotency_key)
        .execute(pool)
        .await?;

        Ok(AwardResult {
            success: true,
            already_awarded: false,
            new_balance: new_xp,
            leveled_up: Some(leveled_up),
            new_level: Some(new_level),
        })
    }
}

// ============================================================================
// USER WALLET REPOSITORY
// ============================================================================

pub struct UserWalletRepo;

impl UserWalletRepo {
    /// Get or create user wallet
    pub async fn get_or_create(pool: &PgPool, user_id: Uuid) -> Result<UserWallet, AppError> {
        // Try to get existing
        let existing = sqlx::query_as::<_, UserWallet>(
            r#"SELECT id, user_id, coins, total_earned, total_spent, created_at, updated_at
               FROM user_wallet WHERE user_id = $1"#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some(wallet) = existing {
            return Ok(wallet);
        }

        // Create new
        let wallet = sqlx::query_as::<_, UserWallet>(
            r#"INSERT INTO user_wallet (user_id, coins, total_earned, total_spent)
               VALUES ($1, 0, 0, 0)
               RETURNING id, user_id, coins, total_earned, total_spent, created_at, updated_at"#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(wallet)
    }

    /// Award coins
    pub async fn award_coins(
        pool: &PgPool,
        user_id: Uuid,
        coins: i32,
        event_type: &str,
        event_id: Option<Uuid>,
        reason: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<AwardResult, AppError> {
        // Check idempotency
        if let Some(key) = idempotency_key {
            let existing = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM points_ledger WHERE idempotency_key = $1",
            )
            .bind(key)
            .fetch_one(pool)
            .await?;

            if existing > 0 {
                let wallet = Self::get_or_create(pool, user_id).await?;
                return Ok(AwardResult {
                    success: true,
                    already_awarded: true,
                    new_balance: wallet.coins,
                    leveled_up: None,
                    new_level: None,
                });
            }
        }

        // Ensure wallet exists
        Self::get_or_create(pool, user_id).await?;

        // Update wallet
        let new_balance = sqlx::query_scalar::<_, i64>(
            r#"UPDATE user_wallet
               SET coins = coins + $1,
                   total_earned = CASE WHEN $1 > 0 THEN total_earned + $1 ELSE total_earned END,
                   updated_at = NOW()
               WHERE user_id = $2
               RETURNING coins"#,
        )
        .bind(coins as i64)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Record in ledger
        sqlx::query(
            r#"INSERT INTO points_ledger (user_id, event_type, event_id, coins, reason, idempotency_key)
               VALUES ($1, $2, $3, $4, $5, $6)"#,
        )
        .bind(user_id)
        .bind(event_type)
        .bind(event_id)
        .bind(coins)
        .bind(reason)
        .bind(idempotency_key)
        .execute(pool)
        .await?;

        Ok(AwardResult {
            success: true,
            already_awarded: false,
            new_balance,
            leveled_up: None,
            new_level: None,
        })
    }

    /// Spend coins (with balance check)
    pub async fn spend_coins(
        pool: &PgPool,
        user_id: Uuid,
        amount: i32,
        reason: &str,
        purchase_id: Option<Uuid>,
    ) -> Result<SpendResult, AppError> {
        // Get current balance with lock
        let wallet = Self::get_or_create(pool, user_id).await?;

        if wallet.coins < amount as i64 {
            return Ok(SpendResult {
                success: false,
                error: Some("Insufficient coins".to_string()),
                new_balance: wallet.coins,
            });
        }

        // Deduct coins
        let new_balance = sqlx::query_scalar::<_, i64>(
            r#"UPDATE user_wallet
               SET coins = coins - $1, total_spent = total_spent + $1, updated_at = NOW()
               WHERE user_id = $2
               RETURNING coins"#,
        )
        .bind(amount as i64)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Record in ledger (negative amount)
        sqlx::query(
            r#"INSERT INTO points_ledger (user_id, event_type, event_id, coins, reason)
               VALUES ($1, 'spend', $2, $3, $4)"#,
        )
        .bind(user_id)
        .bind(purchase_id)
        .bind(-amount)
        .bind(reason)
        .execute(pool)
        .await?;

        Ok(SpendResult {
            success: true,
            error: None,
            new_balance,
        })
    }
}

// ============================================================================
// STREAKS REPOSITORY
// ============================================================================

pub struct StreaksRepo;

impl StreaksRepo {
    /// Get user streak
    pub async fn get_streak(
        pool: &PgPool,
        user_id: Uuid,
        streak_type: &str,
    ) -> Result<Option<UserStreak>, AppError> {
        let streak = sqlx::query_as::<_, UserStreak>(
            r#"SELECT id, user_id, streak_type, current_streak, longest_streak,
                      last_activity_date, created_at, updated_at
               FROM user_streaks WHERE user_id = $1 AND streak_type = $2"#,
        )
        .bind(user_id)
        .bind(streak_type)
        .fetch_optional(pool)
        .await?;

        Ok(streak)
    }

    /// Update streak for today
    pub async fn update_streak(
        pool: &PgPool,
        user_id: Uuid,
        streak_type: &str,
    ) -> Result<StreakUpdateResult, AppError> {
        let today = Utc::now().date_naive();

        // Get or create streak
        let existing = Self::get_streak(pool, user_id, streak_type).await?;

        match existing {
            None => {
                // Create new streak
                sqlx::query(
                    r#"INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
                       VALUES ($1, $2, 1, 1, $3)"#,
                )
                .bind(user_id)
                .bind(streak_type)
                .bind(today)
                .execute(pool)
                .await?;

                Ok(StreakUpdateResult {
                    current_streak: 1,
                    is_new_day: true,
                    streak_broken: false,
                })
            }
            Some(streak) => {
                // Check if same day
                if streak.last_activity_date == Some(today) {
                    return Ok(StreakUpdateResult {
                        current_streak: streak.current_streak,
                        is_new_day: false,
                        streak_broken: false,
                    });
                }

                // Check if yesterday
                let yesterday = today.pred_opt().unwrap_or(today);
                let (new_streak, streak_broken) = if streak.last_activity_date == Some(yesterday) {
                    (streak.current_streak + 1, false)
                } else {
                    (1, streak.last_activity_date.is_some())
                };

                let new_longest = std::cmp::max(streak.longest_streak, new_streak);

                sqlx::query(
                    r#"UPDATE user_streaks
                       SET current_streak = $1, longest_streak = $2, last_activity_date = $3, updated_at = NOW()
                       WHERE user_id = $4 AND streak_type = $5"#,
                )
                .bind(new_streak)
                .bind(new_longest)
                .bind(today)
                .bind(user_id)
                .bind(streak_type)
                .execute(pool)
                .await?;

                Ok(StreakUpdateResult {
                    current_streak: new_streak,
                    is_new_day: true,
                    streak_broken,
                })
            }
        }
    }

    /// Get max current streak for user
    pub async fn get_max_current_streak(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
        let max_streak = sqlx::query_scalar::<_, Option<i32>>(
            "SELECT MAX(current_streak) FROM user_streaks WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(max_streak.unwrap_or(0))
    }

    /// Get max longest streak for user
    pub async fn get_max_longest_streak(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
        let max_streak = sqlx::query_scalar::<_, Option<i32>>(
            "SELECT MAX(longest_streak) FROM user_streaks WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(max_streak.unwrap_or(0))
    }
}

// ============================================================================
// ACHIEVEMENTS REPOSITORY
// ============================================================================

pub struct AchievementsRepo;

impl AchievementsRepo {
    /// Get all achievement definitions
    pub async fn get_definitions(pool: &PgPool) -> Result<Vec<AchievementDefinition>, AppError> {
        let achievements = sqlx::query_as::<_, AchievementDefinition>(
            r#"SELECT id, key, name, description, category, icon, trigger_type, trigger_config,
                      reward_coins, reward_xp, is_hidden, sort_order, created_at
               FROM achievement_definitions ORDER BY category, sort_order"#,
        )
        .fetch_all(pool)
        .await?;

        Ok(achievements)
    }

    /// Get user achievements
    pub async fn get_user_achievements(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Vec<UserAchievement>, AppError> {
        let achievements = sqlx::query_as::<_, UserAchievement>(
            r#"SELECT id, user_id, achievement_key, earned_at, notified
               FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC"#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(achievements)
    }

    /// Check if user has achievement
    pub async fn has_achievement(
        pool: &PgPool,
        user_id: Uuid,
        achievement_key: &str,
    ) -> Result<bool, AppError> {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND achievement_key = $2",
        )
        .bind(user_id)
        .bind(achievement_key)
        .fetch_one(pool)
        .await?;

        Ok(count > 0)
    }

    /// Unlock achievement
    pub async fn unlock_achievement(
        pool: &PgPool,
        user_id: Uuid,
        achievement_key: &str,
    ) -> Result<bool, AppError> {
        // Check if already unlocked
        if Self::has_achievement(pool, user_id, achievement_key).await? {
            return Ok(false);
        }

        // Insert
        sqlx::query(
            r#"INSERT INTO user_achievements (user_id, achievement_key, earned_at, notified)
               VALUES ($1, $2, NOW(), false)"#,
        )
        .bind(user_id)
        .bind(achievement_key)
        .execute(pool)
        .await?;

        Ok(true)
    }

    /// Get achievement count for user
    pub async fn get_achievement_count(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }
}

// ============================================================================
// GAMIFICATION SUMMARY
// ============================================================================

pub struct GamificationRepo;

impl GamificationRepo {
    /// Get complete gamification summary for a user
    pub async fn get_summary(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<GamificationSummary, AppError> {
        // Ensure records exist
        let progress = UserProgressRepo::get_or_create(pool, user_id).await?;
        let wallet = UserWalletRepo::get_or_create(pool, user_id).await?;
        let achievement_count = AchievementsRepo::get_achievement_count(pool, user_id).await?;
        let current_streak = StreaksRepo::get_max_current_streak(pool, user_id).await?;
        let longest_streak = StreaksRepo::get_max_longest_streak(pool, user_id).await?;

        // Calculate XP progress percentage
        let xp_progress_percent = if progress.xp_to_next_level > 0 {
            ((progress.total_xp as f64 / progress.xp_to_next_level as f64) * 100.0) as i32
        } else {
            0
        };

        Ok(GamificationSummary {
            total_xp: progress.total_xp,
            current_level: progress.current_level,
            xp_to_next_level: progress.xp_to_next_level,
            xp_progress_percent,
            coins: wallet.coins,
            total_skill_stars: progress.total_skill_stars,
            achievement_count,
            current_streak,
            longest_streak,
        })
    }

    /// Get next achievement teaser
    pub async fn get_achievement_teaser(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<AchievementTeaser>, AppError> {
        // Get all non-hidden achievements
        let achievements = sqlx::query_as::<_, AchievementDefinition>(
            r#"SELECT id, key, name, description, category, icon, trigger_type, trigger_config,
                      reward_coins, reward_xp, is_hidden, sort_order, created_at
               FROM achievement_definitions
               WHERE is_hidden = false
               ORDER BY reward_coins ASC"#,
        )
        .fetch_all(pool)
        .await?;

        // Get user's unlocked achievements
        let unlocked = AchievementsRepo::get_user_achievements(pool, user_id).await?;
        let unlocked_keys: std::collections::HashSet<_> = unlocked
            .iter()
            .map(|a| a.achievement_key.as_str())
            .collect();

        // Get user stats for progress calculation
        let summary = Self::get_summary(pool, user_id).await?;

        // Count various activities
        let focus_count = sqlx::query_scalar::<_, i64>(
            r#"SELECT COUNT(*) FROM points_ledger
               WHERE user_id = $1 AND event_type = 'focus_complete'"#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let quest_count = sqlx::query_scalar::<_, i64>(
            r#"SELECT COUNT(*) FROM points_ledger
               WHERE user_id = $1 AND event_type = 'quest_complete'"#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        // Find first unachieved achievement with progress
        for achievement in achievements {
            if unlocked_keys.contains(achievement.key.as_str()) {
                continue;
            }

            let trigger_config = achievement.trigger_config.as_ref();

            let (progress, progress_max, progress_label) = match achievement.trigger_type.as_str() {
                "count" => {
                    let event_type = trigger_config
                        .and_then(|c| c.get("event_type"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let count = trigger_config
                        .and_then(|c| c.get("count"))
                        .and_then(|v| v.as_i64())
                        .unwrap_or(1) as i32;

                    let progress = match event_type {
                        "focus_complete" => focus_count as i32,
                        "quest_complete" => quest_count as i32,
                        _ => 0,
                    };

                    let label = match event_type {
                        "focus_complete" => format!("{}/{} focus sessions", progress, count),
                        "quest_complete" => format!("{}/{} quests", progress, count),
                        _ => format!("{}/{}", progress, count),
                    };

                    (progress, count, label)
                }
                "streak" => {
                    let days = trigger_config
                        .and_then(|c| c.get("days"))
                        .and_then(|v| v.as_i64())
                        .unwrap_or(1) as i32;

                    (
                        summary.current_streak,
                        days,
                        format!("{}/{} day streak", summary.current_streak, days),
                    )
                }
                "milestone" => {
                    let level = trigger_config
                        .and_then(|c| c.get("level"))
                        .and_then(|v| v.as_i64())
                        .unwrap_or(1) as i32;

                    (
                        summary.current_level,
                        level,
                        format!("Level {}/{}", summary.current_level, level),
                    )
                }
                "first" => {
                    let event_type = trigger_config
                        .and_then(|c| c.get("event_type"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");

                    let done = match event_type {
                        "focus_complete" => focus_count > 0,
                        "quest_complete" => quest_count > 0,
                        _ => false,
                    };

                    let label = if done {
                        "Complete!".to_string()
                    } else {
                        match event_type {
                            "focus_complete" => "Complete a focus session".to_string(),
                            "quest_complete" => "Complete a quest".to_string(),
                            _ => "Complete the action".to_string(),
                        }
                    };

                    (if done { 1 } else { 0 }, 1, label)
                }
                _ => continue,
            };

            if progress < progress_max {
                return Ok(Some(AchievementTeaser {
                    achievement,
                    progress,
                    progress_max,
                    progress_label,
                }));
            }
        }

        Ok(None)
    }

    /// Award points (unified method for awarding XP and/or coins)
    pub async fn award_points(
        pool: &PgPool,
        user_id: Uuid,
        input: &AwardPointsInput,
    ) -> Result<AwardResult, AppError> {
        let mut result = AwardResult {
            success: true,
            already_awarded: false,
            new_balance: 0,
            leveled_up: None,
            new_level: None,
        };

        // Award XP if specified
        if let Some(xp) = input.xp {
            if xp > 0 {
                let xp_result = UserProgressRepo::award_xp(
                    pool,
                    user_id,
                    xp,
                    &input.event_type,
                    input.event_id,
                    input.reason.as_deref(),
                    input.idempotency_key.as_deref(),
                )
                .await?;

                result.already_awarded = xp_result.already_awarded;
                result.leveled_up = xp_result.leveled_up;
                result.new_level = xp_result.new_level;
            }
        }

        // Award coins if specified
        if let Some(coins) = input.coins {
            if coins > 0 {
                let coins_result = UserWalletRepo::award_coins(
                    pool,
                    user_id,
                    coins,
                    &input.event_type,
                    input.event_id,
                    input.reason.as_deref(),
                    input.idempotency_key.as_deref(),
                )
                .await?;

                result.new_balance = coins_result.new_balance;
                if coins_result.already_awarded {
                    result.already_awarded = true;
                }
            }
        }

        // Update daily activity streak
        let _ = StreaksRepo::update_streak(pool, user_id, "daily_activity").await;

        Ok(result)
    }
}
