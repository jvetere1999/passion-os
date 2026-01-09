//! Admin repositories
//!
//! Database operations for admin-only functionality.

use sqlx::PgPool;
use uuid::Uuid;

use super::admin_models::*;
use crate::error::AppError;

// ============================================
// User Management Repository
// ============================================

pub struct AdminUserRepo;

impl AdminUserRepo {
    /// List all users with their stats
    pub async fn list_users(pool: &PgPool) -> Result<AdminUsersResponse, AppError> {
        let rows = sqlx::query_as::<_, AdminUserRow>(
            r#"
            SELECT 
                u.id,
                u.email,
                u.name,
                u.image,
                u.role,
                u.approved,
                u.tos_accepted,
                u.last_activity_at,
                u.created_at,
                up.level,
                up.total_xp
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            ORDER BY u.created_at DESC
            LIMIT 1000
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch users: {}", e)))?;

        let total = rows.len() as i64;
        let users = rows.into_iter().map(|r| r.into()).collect();

        Ok(AdminUsersResponse { users, total })
    }

    /// Get a single user by ID
    pub async fn get_user(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<AdminUserWithStats>, AppError> {
        let row = sqlx::query_as::<_, AdminUserRow>(
            r#"
            SELECT 
                u.id,
                u.email,
                u.name,
                u.image,
                u.role,
                u.approved,
                u.tos_accepted,
                u.last_activity_at,
                u.created_at,
                up.level,
                up.total_xp
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch user: {}", e)))?;

        Ok(row.map(|r| r.into()))
    }

    /// Delete a user and all their data
    pub async fn delete_user(pool: &PgPool, user_id: Uuid) -> Result<DeleteUserResponse, AppError> {
        let mut tables_cleaned = 0;

        // Delete in order to respect foreign keys
        // Activity and progress
        sqlx::query("DELETE FROM activity_events WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM user_progress WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Focus sessions
        sqlx::query("DELETE FROM focus_sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Calendar
        sqlx::query("DELETE FROM calendar_events WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Quests
        sqlx::query("DELETE FROM user_quest_progress WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Habits
        sqlx::query("DELETE FROM habit_logs WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM habits WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Goals
        sqlx::query("DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM goals WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Ideas
        sqlx::query("DELETE FROM ideas WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Books
        sqlx::query("DELETE FROM reading_sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM books WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Feedback
        sqlx::query("DELETE FROM feedback WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Onboarding
        sqlx::query("DELETE FROM user_onboarding_responses WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM user_onboarding_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // User settings
        sqlx::query("DELETE FROM user_settings WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Wallet
        sqlx::query("DELETE FROM points_ledger WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM user_wallet WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Sessions and accounts
        sqlx::query("DELETE FROM sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        sqlx::query("DELETE FROM accounts WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .ok();
        tables_cleaned += 1;

        // Finally delete the user
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to delete user: {}", e)))?;

        Ok(DeleteUserResponse {
            success: true,
            message: format!("User {} deleted successfully", user_id),
            tables_cleaned,
        })
    }
}

// ============================================
// Stats Repository
// ============================================

pub struct AdminStatsRepo;

#[derive(sqlx::FromRow)]
struct CountRow {
    count: Option<i64>,
}

impl AdminStatsRepo {
    /// Get comprehensive platform statistics
    pub async fn get_stats(pool: &PgPool) -> Result<AdminStatsResponse, AppError> {
        // User stats
        let user_stats = Self::get_user_stats(pool).await.unwrap_or_default();

        // Content stats
        let content_stats = Self::get_content_stats(pool).await.unwrap_or_default();

        // Activity stats
        let activity_stats = Self::get_activity_stats(pool).await.unwrap_or_default();

        // Gamification stats
        let gamification_stats = Self::get_gamification_stats(pool).await.unwrap_or_default();

        // Recent users
        let recent_users = sqlx::query_as::<_, RecentUser>(
            r#"
            SELECT id, name, email, created_at, last_activity_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
            "#,
        )
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        Ok(AdminStatsResponse {
            users: user_stats,
            content: content_stats,
            activity: activity_stats,
            gamification: gamification_stats,
            recent_users,
            recent_events: vec![], // Simplified for now
        })
    }

    async fn get_user_stats(pool: &PgPool) -> Result<UserStats, AppError> {
        let total = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM users")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let tos = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM users WHERE tos_accepted = true",
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

        let admins = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

        let active_7d = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM users WHERE last_activity_at > NOW() - INTERVAL '7 days'"
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

        let active_30d = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM users WHERE last_activity_at > NOW() - INTERVAL '30 days'"
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

        Ok(UserStats {
            total_users: total,
            tos_accepted: tos,
            admins,
            active_7d,
            active_30d,
        })
    }

    async fn get_content_stats(pool: &PgPool) -> Result<ContentStats, AppError> {
        let exercises = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM exercises")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let universal_quests =
            sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM universal_quests")
                .fetch_one(pool)
                .await
                .map(|r| r.count.unwrap_or(0))
                .unwrap_or(0);

        let user_quests = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM quests")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let market_items =
            sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM market_items")
                .fetch_one(pool)
                .await
                .map(|r| r.count.unwrap_or(0))
                .unwrap_or(0);

        Ok(ContentStats {
            exercises,
            learn_topics: 0,
            learn_lessons: 0,
            learn_drills: 0,
            universal_quests,
            user_quests,
            market_items,
        })
    }

    async fn get_activity_stats(pool: &PgPool) -> Result<ActivityStats, AppError> {
        let focus = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM focus_sessions")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let completed = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM focus_sessions WHERE status = 'completed'",
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

        let habits = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM habit_logs")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let goals = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM goals")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let ideas = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM ideas")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        let books = sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM books")
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        Ok(ActivityStats {
            total_focus_sessions: focus,
            completed_focus: completed,
            total_focus_minutes: 0,
            total_events: 0,
            events_24h: 0,
            habit_completions: habits,
            total_goals: goals,
            total_ideas: ideas,
            total_books: books,
            reference_tracks: 0,
        })
    }

    async fn get_gamification_stats(pool: &PgPool) -> Result<GamificationStats, AppError> {
        let purchases =
            sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM user_purchases")
                .fetch_one(pool)
                .await
                .map(|r| r.count.unwrap_or(0))
                .unwrap_or(0);

        let achievements =
            sqlx::query_as::<_, CountRow>("SELECT COUNT(*) as count FROM user_achievements")
                .fetch_one(pool)
                .await
                .map(|r| r.count.unwrap_or(0))
                .unwrap_or(0);

        Ok(GamificationStats {
            total_coins_distributed: 0,
            total_xp_distributed: 0,
            achievements_earned: achievements,
            total_purchases: purchases,
        })
    }
}

// ============================================
// Feedback Repository
// ============================================

pub struct AdminFeedbackRepo;

impl AdminFeedbackRepo {
    /// List all feedback with user info
    pub async fn list_feedback(pool: &PgPool) -> Result<AdminFeedbackResponse, AppError> {
        let feedback = sqlx::query_as::<_, AdminFeedback>(
            r#"
            SELECT 
                f.id,
                f.user_id,
                u.email as user_email,
                f.feedback_type,
                f.title,
                f.description,
                f.status,
                f.priority,
                f.admin_response,
                f.resolved_by,
                f.resolved_at,
                f.created_at
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY 
                CASE f.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
                f.created_at DESC
            LIMIT 500
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch feedback: {}", e)))?;

        Ok(AdminFeedbackResponse { feedback })
    }

    /// Update feedback status/response
    pub async fn update_feedback(
        pool: &PgPool,
        feedback_id: Uuid,
        admin_id: Uuid,
        update: UpdateFeedbackRequest,
    ) -> Result<AdminFeedback, AppError> {
        // Build update query dynamically
        let mut set_parts = vec!["updated_at = NOW()".to_string()];

        if let Some(status) = &update.status {
            set_parts.push(format!("status = '{}'", status));
            if status == "resolved" {
                set_parts.push(format!("resolved_by = '{}'", admin_id));
                set_parts.push("resolved_at = NOW()".to_string());
            }
        }

        if let Some(priority) = &update.priority {
            set_parts.push(format!("priority = '{}'", priority));
        }

        if let Some(response) = &update.admin_response {
            set_parts.push(format!(
                "admin_response = '{}'",
                response.replace('\'', "''")
            ));
        }

        let query = format!(
            "UPDATE feedback SET {} WHERE id = $1 RETURNING *",
            set_parts.join(", ")
        );

        // Re-fetch with join since we can't return user_email from UPDATE
        sqlx::query(&query)
            .bind(feedback_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to update feedback: {}", e)))?;

        let feedback = sqlx::query_as::<_, AdminFeedback>(
            r#"
            SELECT 
                f.id, f.user_id, u.email as user_email, f.feedback_type, f.title,
                f.description, f.status, f.priority, f.admin_response,
                f.resolved_by, f.resolved_at, f.created_at
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.id = $1
            "#,
        )
        .bind(feedback_id)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch updated feedback: {}", e)))?;

        Ok(feedback)
    }
}

// ============================================
// Quest Repository
// ============================================

pub struct AdminQuestRepo;

impl AdminQuestRepo {
    /// List all universal quests
    pub async fn list_quests(pool: &PgPool) -> Result<AdminQuestsResponse, AppError> {
        let quests = sqlx::query_as::<_, AdminQuest>(
            r#"
            SELECT 
                id,
                title,
                description,
                quest_type,
                xp_reward,
                coin_reward,
                target,
                skill_id,
                is_active,
                created_at
            FROM universal_quests
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch quests: {}", e)))?;

        Ok(AdminQuestsResponse { quests })
    }

    /// Get a single quest
    pub async fn get_quest(pool: &PgPool, quest_id: Uuid) -> Result<Option<AdminQuest>, AppError> {
        let quest = sqlx::query_as::<_, AdminQuest>(
            r#"
            SELECT id, title, description, quest_type, xp_reward, coin_reward,
                   target, skill_id, is_active, created_at
            FROM universal_quests
            WHERE id = $1
            "#,
        )
        .bind(quest_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch quest: {}", e)))?;

        Ok(quest)
    }

    /// Create a new universal quest
    pub async fn create_quest(
        pool: &PgPool,
        admin_id: Uuid,
        request: CreateQuestRequest,
    ) -> Result<AdminQuest, AppError> {
        let id = Uuid::new_v4();
        let quest_type = request.quest_type.unwrap_or_else(|| "daily".to_string());
        let xp_reward = request.xp_reward.unwrap_or(25);
        let coin_reward = request.coin_reward.unwrap_or(10);
        let target = request.target.unwrap_or(1);

        let quest = sqlx::query_as::<_, AdminQuest>(
            r#"
            INSERT INTO universal_quests 
                (id, title, description, quest_type, xp_reward, coin_reward, target, skill_id, is_active, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, NOW(), NOW())
            RETURNING id, title, description, quest_type, xp_reward, coin_reward, target, skill_id, is_active, created_at
            "#,
        )
        .bind(id)
        .bind(&request.title)
        .bind(&request.description)
        .bind(&quest_type)
        .bind(xp_reward)
        .bind(coin_reward)
        .bind(target)
        .bind(&request.skill_id)
        .bind(admin_id)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create quest: {}", e)))?;

        Ok(quest)
    }

    /// Update a quest
    pub async fn update_quest(
        pool: &PgPool,
        quest_id: Uuid,
        request: UpdateQuestRequest,
    ) -> Result<AdminQuest, AppError> {
        let mut set_parts = vec!["updated_at = NOW()".to_string()];

        if let Some(title) = &request.title {
            set_parts.push(format!("title = '{}'", title.replace('\'', "''")));
        }
        if let Some(desc) = &request.description {
            set_parts.push(format!("description = '{}'", desc.replace('\'', "''")));
        }
        if let Some(qt) = &request.quest_type {
            set_parts.push(format!("quest_type = '{}'", qt));
        }
        if let Some(xp) = request.xp_reward {
            set_parts.push(format!("xp_reward = {}", xp));
        }
        if let Some(coin) = request.coin_reward {
            set_parts.push(format!("coin_reward = {}", coin));
        }
        if let Some(t) = request.target {
            set_parts.push(format!("target = {}", t));
        }
        if let Some(active) = request.is_active {
            set_parts.push(format!("is_active = {}", active));
        }

        let query = format!(
            r#"
            UPDATE universal_quests SET {}
            WHERE id = $1
            RETURNING id, title, description, quest_type, xp_reward, coin_reward, target, skill_id, is_active, created_at
            "#,
            set_parts.join(", ")
        );

        let quest = sqlx::query_as::<_, AdminQuest>(&query)
            .bind(quest_id)
            .fetch_one(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to update quest: {}", e)))?;

        Ok(quest)
    }

    /// Delete a quest
    pub async fn delete_quest(pool: &PgPool, quest_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM universal_quests WHERE id = $1")
            .bind(quest_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to delete quest: {}", e)))?;

        Ok(result.rows_affected() > 0)
    }
}

// ============================================
// Skill Repository
// ============================================

pub struct AdminSkillRepo;

impl AdminSkillRepo {
    /// List all skill definitions
    pub async fn list_skills(pool: &PgPool) -> Result<AdminSkillsResponse, AppError> {
        let skills = sqlx::query_as::<_, AdminSkill>(
            r#"
            SELECT 
                id, name, description, color, max_level,
                xp_scaling_base, xp_scaling_multiplier, display_order, is_active
            FROM skill_definitions
            ORDER BY display_order ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch skills: {}", e)))?;

        Ok(AdminSkillsResponse { skills })
    }

    /// Get a single skill
    pub async fn get_skill(pool: &PgPool, skill_id: &str) -> Result<Option<AdminSkill>, AppError> {
        let skill = sqlx::query_as::<_, AdminSkill>(
            r#"
            SELECT id, name, description, color, max_level,
                   xp_scaling_base, xp_scaling_multiplier, display_order, is_active
            FROM skill_definitions
            WHERE id = $1
            "#,
        )
        .bind(skill_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch skill: {}", e)))?;

        Ok(skill)
    }

    /// Create or update a skill
    pub async fn upsert_skill(
        pool: &PgPool,
        request: CreateSkillRequest,
    ) -> Result<AdminSkill, AppError> {
        let color = request.color.unwrap_or_else(|| "#8b5cf6".to_string());
        let max_level = request.max_level.unwrap_or(10);
        let xp_base = request.xp_scaling_base.unwrap_or(100);
        let xp_mult = request.xp_scaling_multiplier.unwrap_or(1.5);

        // Get next display order
        let order_row = sqlx::query_as::<_, CountRow>(
            "SELECT COALESCE(MAX(display_order), 0) + 1 as count FROM skill_definitions",
        )
        .fetch_one(pool)
        .await
        .map(|r| r.count.unwrap_or(0) as i32)
        .unwrap_or(0);

        let skill = sqlx::query_as::<_, AdminSkill>(
            r#"
            INSERT INTO skill_definitions 
                (id, name, description, color, max_level, xp_scaling_base, xp_scaling_multiplier, display_order, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                color = EXCLUDED.color,
                max_level = EXCLUDED.max_level,
                xp_scaling_base = EXCLUDED.xp_scaling_base,
                xp_scaling_multiplier = EXCLUDED.xp_scaling_multiplier,
                updated_at = NOW()
            RETURNING id, name, description, color, max_level, xp_scaling_base, xp_scaling_multiplier, display_order, is_active
            "#,
        )
        .bind(&request.id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(&color)
        .bind(max_level)
        .bind(xp_base)
        .bind(xp_mult)
        .bind(order_row)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to upsert skill: {}", e)))?;

        Ok(skill)
    }

    /// Update a skill
    pub async fn update_skill(
        pool: &PgPool,
        skill_id: &str,
        request: UpdateSkillRequest,
    ) -> Result<AdminSkill, AppError> {
        let mut set_parts = vec!["updated_at = NOW()".to_string()];

        if let Some(name) = &request.name {
            set_parts.push(format!("name = '{}'", name.replace('\'', "''")));
        }
        if let Some(desc) = &request.description {
            set_parts.push(format!("description = '{}'", desc.replace('\'', "''")));
        }
        if let Some(color) = &request.color {
            set_parts.push(format!("color = '{}'", color));
        }
        if let Some(ml) = request.max_level {
            set_parts.push(format!("max_level = {}", ml));
        }
        if let Some(xb) = request.xp_scaling_base {
            set_parts.push(format!("xp_scaling_base = {}", xb));
        }
        if let Some(xm) = request.xp_scaling_multiplier {
            set_parts.push(format!("xp_scaling_multiplier = {}", xm));
        }
        if let Some(active) = request.is_active {
            set_parts.push(format!("is_active = {}", active));
        }
        if let Some(order) = request.display_order {
            set_parts.push(format!("display_order = {}", order));
        }

        let query = format!(
            r#"
            UPDATE skill_definitions SET {}
            WHERE id = $1
            RETURNING id, name, description, color, max_level, xp_scaling_base, xp_scaling_multiplier, display_order, is_active
            "#,
            set_parts.join(", ")
        );

        let skill = sqlx::query_as::<_, AdminSkill>(&query)
            .bind(skill_id)
            .fetch_one(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to update skill: {}", e)))?;

        Ok(skill)
    }

    /// Delete a skill
    pub async fn delete_skill(pool: &PgPool, skill_id: &str) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM skill_definitions WHERE id = $1")
            .bind(skill_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to delete skill: {}", e)))?;

        Ok(result.rows_affected() > 0)
    }
}

// ============================================
// Database Health Repository
// ============================================

pub struct AdminDbRepo;

impl AdminDbRepo {
    /// Check database health and get table stats
    pub async fn get_health(pool: &PgPool) -> Result<DbHealthResponse, AppError> {
        // Verify connectivity
        sqlx::query("SELECT 1")
            .fetch_one(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Database unhealthy: {}", e)))?;

        // Get table counts for key tables
        let tables = vec![
            "users",
            "sessions",
            "accounts",
            "focus_sessions",
            "habits",
            "goals",
            "quests",
            "universal_quests",
            "feedback",
            "ideas",
            "books",
        ];

        let mut table_infos = Vec::new();
        for table in tables {
            let count =
                sqlx::query_as::<_, CountRow>(&format!("SELECT COUNT(*) as count FROM {}", table))
                    .fetch_one(pool)
                    .await
                    .map(|r| r.count.unwrap_or(0))
                    .unwrap_or(0);

            table_infos.push(TableInfo {
                name: table.to_string(),
                row_count: count,
            });
        }

        Ok(DbHealthResponse {
            status: "healthy".to_string(),
            tables: table_infos,
            total_size_estimate: "N/A".to_string(),
        })
    }
}

// ============================================
// Audit Log Repository
// ============================================

pub struct AdminAuditRepo;

/// Row for audit log with user join
#[derive(sqlx::FromRow)]
struct AuditLogRow {
    id: Uuid,
    user_id: Option<Uuid>,
    user_email: Option<String>,
    event_type: String,
    resource_type: Option<String>,
    resource_id: Option<String>,
    action: String,
    status: String,
    details: Option<serde_json::Value>,
    ip_address: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

impl AdminAuditRepo {
    /// List audit log entries with filters
    pub async fn list_entries(
        pool: &PgPool,
        query: &AuditLogQuery,
    ) -> Result<AuditLogResponse, AppError> {
        let limit = query.limit.unwrap_or(100).min(500);
        let offset = query.offset.unwrap_or(0);

        // Build dynamic WHERE clause
        let mut conditions = vec!["1=1".to_string()];

        if let Some(ref et) = query.event_type {
            conditions.push(format!("a.event_type = '{}'", et.replace('\'', "''")));
        }
        if let Some(uid) = query.user_id {
            conditions.push(format!("a.user_id = '{}'", uid));
        }
        if let Some(ref rt) = query.resource_type {
            conditions.push(format!("a.resource_type = '{}'", rt.replace('\'', "''")));
        }
        if let Some(ref st) = query.status {
            conditions.push(format!("a.status = '{}'", st.replace('\'', "''")));
        }

        let where_clause = conditions.join(" AND ");

        // Get total count
        let count_query = format!(
            "SELECT COUNT(*) as count FROM audit_log a WHERE {}",
            where_clause
        );
        let total = sqlx::query_as::<_, CountRow>(&count_query)
            .fetch_one(pool)
            .await
            .map(|r| r.count.unwrap_or(0))
            .unwrap_or(0);

        // Get entries with user email
        let entries_query = format!(
            r#"
            SELECT 
                a.id,
                a.user_id,
                u.email as user_email,
                a.event_type,
                a.resource_type,
                a.resource_id,
                a.action,
                a.status,
                a.details,
                a.ip_address::text as ip_address,
                a.created_at
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE {}
            ORDER BY a.created_at DESC
            LIMIT {} OFFSET {}
            "#,
            where_clause, limit, offset
        );

        let rows = sqlx::query_as::<_, AuditLogRow>(&entries_query)
            .fetch_all(pool)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to fetch audit log: {}", e)))?;

        let entries = rows
            .into_iter()
            .map(|r| AuditLogEntryWithUser {
                id: r.id,
                user_id: r.user_id,
                user_email: r.user_email,
                event_type: r.event_type,
                resource_type: r.resource_type,
                resource_id: r.resource_id,
                action: r.action,
                status: r.status,
                details: r.details,
                ip_address: r.ip_address,
                created_at: r.created_at,
            })
            .collect();

        Ok(AuditLogResponse { entries, total })
    }

    /// Get distinct event types for filter dropdown
    pub async fn get_event_types(pool: &PgPool) -> Result<Vec<String>, AppError> {
        let rows = sqlx::query_as::<_, (String,)>(
            "SELECT DISTINCT event_type FROM audit_log ORDER BY event_type",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch event types: {}", e)))?;

        Ok(rows.into_iter().map(|r| r.0).collect())
    }
}
