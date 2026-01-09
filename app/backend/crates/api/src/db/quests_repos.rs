//! Quests repositories
//!
//! Database operations for quest system.

use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use super::gamification_models::AwardPointsInput;
use super::gamification_repos::GamificationRepo;
use super::quests_models::*;
use crate::error::AppError;

// ============================================================================
// QUESTS REPOSITORY
// ============================================================================

pub struct QuestsRepo;

impl QuestsRepo {
    /// Create a new user quest
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateQuestRequest,
    ) -> Result<Quest, AppError> {
        // Calculate rewards based on difficulty
        let (default_xp, default_coins) = match req.difficulty.as_str() {
            "starter" => (10, 5),
            "easy" => (25, 10),
            "medium" => (50, 25),
            "hard" => (100, 50),
            "epic" => (250, 100),
            _ => (10, 5),
        };

        let xp = req.xp_reward.unwrap_or(default_xp);
        let coins = req.coin_reward.unwrap_or(default_coins);

        let quest = sqlx::query_as::<_, Quest>(
            r#"INSERT INTO quests
               (user_id, title, description, category, difficulty, xp_reward, coin_reward,
                is_repeatable, repeat_frequency, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available')
               RETURNING id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                         status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                         expires_at, is_repeatable, repeat_frequency, last_completed_date,
                         streak_count, created_at, updated_at"#,
        )
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.category)
        .bind(&req.difficulty)
        .bind(xp)
        .bind(coins)
        .bind(req.is_repeatable.unwrap_or(false))
        .bind(&req.repeat_frequency)
        .fetch_one(pool)
        .await?;

        Ok(quest)
    }

    /// Get quest by ID
    pub async fn get_by_id(
        pool: &PgPool,
        quest_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<Quest>, AppError> {
        let quest = sqlx::query_as::<_, Quest>(
            r#"SELECT id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                      status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                      expires_at, is_repeatable, repeat_frequency, last_completed_date,
                      streak_count, created_at, updated_at
               FROM quests WHERE id = $1 AND user_id = $2"#,
        )
        .bind(quest_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(quest)
    }

    /// List quests for user
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        status_filter: Option<&str>,
    ) -> Result<QuestsListResponse, AppError> {
        let quests = if let Some(status) = status_filter {
            sqlx::query_as::<_, Quest>(
                r#"SELECT id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                          status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                          expires_at, is_repeatable, repeat_frequency, last_completed_date,
                          streak_count, created_at, updated_at
                   FROM quests
                   WHERE user_id = $1 AND status = $2 AND is_active = true
                   ORDER BY created_at DESC"#,
            )
            .bind(user_id)
            .bind(status)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Quest>(
                r#"SELECT id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                          status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                          expires_at, is_repeatable, repeat_frequency, last_completed_date,
                          streak_count, created_at, updated_at
                   FROM quests
                   WHERE user_id = $1 AND is_active = true
                   ORDER BY created_at DESC"#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        let total = quests.len() as i64;

        Ok(QuestsListResponse {
            quests: quests.into_iter().map(|q| q.into()).collect(),
            total,
        })
    }

    /// Accept a quest
    pub async fn accept_quest(
        pool: &PgPool,
        quest_id: Uuid,
        user_id: Uuid,
    ) -> Result<Quest, AppError> {
        let quest = Self::get_by_id(pool, quest_id, user_id).await?;
        let quest = quest.ok_or_else(|| AppError::NotFound("Quest not found".to_string()))?;

        if quest.status != "available" {
            return Err(AppError::BadRequest(format!(
                "Quest cannot be accepted (status: {})",
                quest.status
            )));
        }

        let updated = sqlx::query_as::<_, Quest>(
            r#"UPDATE quests
               SET status = 'accepted', accepted_at = NOW()
               WHERE id = $1 AND user_id = $2
               RETURNING id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                         status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                         expires_at, is_repeatable, repeat_frequency, last_completed_date,
                         streak_count, created_at, updated_at"#,
        )
        .bind(quest_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(updated)
    }

    /// Complete a quest
    pub async fn complete_quest(
        pool: &PgPool,
        quest_id: Uuid,
        user_id: Uuid,
    ) -> Result<CompleteQuestResult, AppError> {
        let quest = Self::get_by_id(pool, quest_id, user_id).await?;
        let quest = quest.ok_or_else(|| AppError::NotFound("Quest not found".to_string()))?;

        if quest.status != "accepted" && quest.status != "available" {
            return Err(AppError::BadRequest(format!(
                "Quest cannot be completed (status: {})",
                quest.status
            )));
        }

        let today = Utc::now().date_naive();

        // Calculate streak for repeatable quests
        let new_streak = if quest.is_repeatable {
            let yesterday = today.pred_opt().unwrap_or(today);
            match quest.last_completed_date {
                None => 1,
                Some(last) if last == yesterday => quest.streak_count + 1,
                Some(_) => 1,
            }
        } else {
            0
        };

        // Update quest
        let updated = sqlx::query_as::<_, Quest>(
            r#"UPDATE quests
               SET status = 'completed', completed_at = NOW(),
                   last_completed_date = $1, streak_count = $2
               WHERE id = $3 AND user_id = $4
               RETURNING id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                         status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                         expires_at, is_repeatable, repeat_frequency, last_completed_date,
                         streak_count, created_at, updated_at"#,
        )
        .bind(today)
        .bind(new_streak)
        .bind(quest_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Award points with idempotency
        let idempotency_key = format!("quest_complete_{}_{}", quest_id, today);
        let award_result = GamificationRepo::award_points(
            pool,
            user_id,
            &AwardPointsInput {
                xp: Some(quest.xp_reward),
                coins: Some(quest.coin_reward),
                skill_stars: None,
                skill_key: None,
                event_type: "quest_complete".to_string(),
                event_id: Some(quest_id),
                reason: Some(format!("Completed quest: {}", quest.title)),
                idempotency_key: Some(idempotency_key),
            },
        )
        .await?;

        Ok(CompleteQuestResult {
            quest: updated.into(),
            xp_awarded: quest.xp_reward,
            coins_awarded: quest.coin_reward,
            leveled_up: award_result.leveled_up.unwrap_or(false),
            new_level: award_result.new_level,
        })
    }

    /// Abandon a quest
    pub async fn abandon_quest(
        pool: &PgPool,
        quest_id: Uuid,
        user_id: Uuid,
    ) -> Result<Quest, AppError> {
        let quest = Self::get_by_id(pool, quest_id, user_id).await?;
        let quest = quest.ok_or_else(|| AppError::NotFound("Quest not found".to_string()))?;

        if quest.status == "completed" || quest.status == "abandoned" {
            return Err(AppError::BadRequest(format!(
                "Quest cannot be abandoned (status: {})",
                quest.status
            )));
        }

        let updated = sqlx::query_as::<_, Quest>(
            r#"UPDATE quests
               SET status = 'abandoned'
               WHERE id = $1 AND user_id = $2
               RETURNING id, user_id, title, description, category, difficulty, xp_reward, coin_reward,
                         status, is_active, is_universal, source_quest_id, accepted_at, completed_at,
                         expires_at, is_repeatable, repeat_frequency, last_completed_date,
                         streak_count, created_at, updated_at"#,
        )
        .bind(quest_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(updated)
    }
}
