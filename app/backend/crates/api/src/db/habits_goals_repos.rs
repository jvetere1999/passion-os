//! Habits and Goals repositories
//!
//! Database operations for habit tracking and goal management.

use chrono::{NaiveDate, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::gamification_models::AwardPointsInput;
use super::gamification_repos::GamificationRepo;
use super::habits_goals_models::*;
use crate::error::AppError;

// ============================================================================
// HABITS REPOSITORY
// ============================================================================

pub struct HabitsRepo;

impl HabitsRepo {
    /// Create a new habit
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateHabitRequest,
    ) -> Result<Habit, AppError> {
        let habit = sqlx::query_as::<_, Habit>(
            r#"INSERT INTO habits (user_id, name, description, frequency, target_count, custom_days, icon, color)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id, user_id, name, description, frequency, target_count, custom_days,
                         icon, color, is_active, current_streak, longest_streak,
                         last_completed_at, sort_order, created_at, updated_at"#,
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.frequency)
        .bind(req.target_count)
        .bind(&req.custom_days)
        .bind(&req.icon)
        .bind(&req.color)
        .fetch_one(pool)
        .await?;

        Ok(habit)
    }

    /// Get a habit by ID
    pub async fn get_by_id(
        pool: &PgPool,
        habit_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<Habit>, AppError> {
        let habit = sqlx::query_as::<_, Habit>(
            r#"SELECT id, user_id, name, description, frequency, target_count, custom_days,
                      icon, color, is_active, current_streak, longest_streak,
                      last_completed_at, sort_order, created_at, updated_at
               FROM habits WHERE id = $1 AND user_id = $2"#,
        )
        .bind(habit_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(habit)
    }

    /// List active habits with today's completion status
    pub async fn list_active(pool: &PgPool, user_id: Uuid) -> Result<HabitsListResponse, AppError> {
        let today = Utc::now().date_naive();

        // Get habits with today's completion status
        let habits = sqlx::query_as::<_, Habit>(
            r#"SELECT id, user_id, name, description, frequency, target_count, custom_days,
                      icon, color, is_active, current_streak, longest_streak,
                      last_completed_at, sort_order, created_at, updated_at
               FROM habits
               WHERE user_id = $1 AND is_active = true
               ORDER BY sort_order, name"#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        // Get today's completions
        let completions = sqlx::query_scalar::<_, Uuid>(
            r#"SELECT habit_id FROM habit_logs
               WHERE user_id = $1 AND completed_date = $2"#,
        )
        .bind(user_id)
        .bind(today)
        .fetch_all(pool)
        .await?;

        let completed_ids: std::collections::HashSet<_> = completions.into_iter().collect();

        let responses = habits
            .into_iter()
            .map(|h| HabitResponse {
                completed_today: completed_ids.contains(&h.id),
                id: h.id,
                name: h.name,
                description: h.description,
                frequency: h.frequency,
                target_count: h.target_count,
                icon: h.icon,
                color: h.color,
                is_active: h.is_active,
                current_streak: h.current_streak,
                longest_streak: h.longest_streak,
                last_completed_at: h.last_completed_at,
                sort_order: h.sort_order,
            })
            .collect();

        Ok(HabitsListResponse { habits: responses })
    }

    /// Complete a habit for today
    pub async fn complete_habit(
        pool: &PgPool,
        habit_id: Uuid,
        user_id: Uuid,
        notes: Option<&str>,
    ) -> Result<CompleteHabitResult, AppError> {
        let habit = Self::get_by_id(pool, habit_id, user_id).await?;
        let habit = habit.ok_or_else(|| AppError::NotFound("Habit not found".to_string()))?;

        let today = Utc::now().date_naive();

        // Check if already completed today
        let already_completed = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM habit_logs WHERE habit_id = $1 AND completed_date = $2",
        )
        .bind(habit_id)
        .bind(today)
        .fetch_one(pool)
        .await?;

        if already_completed > 0 {
            // Already completed, return current state
            return Ok(CompleteHabitResult {
                habit: HabitResponse {
                    id: habit.id,
                    name: habit.name,
                    description: habit.description,
                    frequency: habit.frequency,
                    target_count: habit.target_count,
                    icon: habit.icon,
                    color: habit.color,
                    is_active: habit.is_active,
                    current_streak: habit.current_streak,
                    longest_streak: habit.longest_streak,
                    last_completed_at: habit.last_completed_at,
                    completed_today: true,
                    sort_order: habit.sort_order,
                },
                new_streak: habit.current_streak,
                xp_awarded: 0,
                streak_bonus: false,
            });
        }

        // Get last completion date
        let last_date = sqlx::query_scalar::<_, NaiveDate>(
            r#"SELECT completed_date FROM habit_logs
               WHERE habit_id = $1 ORDER BY completed_date DESC LIMIT 1"#,
        )
        .bind(habit_id)
        .fetch_optional(pool)
        .await?;

        // Calculate new streak
        let yesterday = today.pred_opt().unwrap_or(today);
        let new_streak = match last_date {
            None => 1,
            Some(last) if last == yesterday => habit.current_streak + 1,
            Some(_) => 1, // Streak broken
        };

        // Calculate XP and streak bonus
        let mut xp = 5;
        let streak_bonus = matches!(new_streak, 7 | 14 | 30 | 60 | 100 | 365);
        if streak_bonus {
            xp += new_streak;
        }

        // Insert log
        sqlx::query(
            r#"INSERT INTO habit_logs (habit_id, user_id, completed_date, notes)
               VALUES ($1, $2, $3, $4)"#,
        )
        .bind(habit_id)
        .bind(user_id)
        .bind(today)
        .bind(notes)
        .execute(pool)
        .await?;

        // Update habit
        let updated = sqlx::query_as::<_, Habit>(
            r#"UPDATE habits
               SET current_streak = $1,
                   longest_streak = GREATEST(longest_streak, $1),
                   last_completed_at = NOW()
               WHERE id = $2
               RETURNING id, user_id, name, description, frequency, target_count, custom_days,
                         icon, color, is_active, current_streak, longest_streak,
                         last_completed_at, sort_order, created_at, updated_at"#,
        )
        .bind(new_streak)
        .bind(habit_id)
        .fetch_one(pool)
        .await?;

        // Award XP
        let idempotency_key = format!("habit_complete_{}_{}", habit_id, today);
        GamificationRepo::award_points(
            pool,
            user_id,
            &AwardPointsInput {
                xp: Some(xp),
                coins: None,
                skill_stars: None,
                skill_key: None,
                event_type: "habit_complete".to_string(),
                event_id: Some(habit_id),
                reason: Some(format!("Completed habit: {}", updated.name)),
                idempotency_key: Some(idempotency_key),
            },
        )
        .await?;

        Ok(CompleteHabitResult {
            habit: HabitResponse {
                id: updated.id,
                name: updated.name,
                description: updated.description,
                frequency: updated.frequency,
                target_count: updated.target_count,
                icon: updated.icon,
                color: updated.color,
                is_active: updated.is_active,
                current_streak: updated.current_streak,
                longest_streak: updated.longest_streak,
                last_completed_at: updated.last_completed_at,
                completed_today: true,
                sort_order: updated.sort_order,
            },
            new_streak,
            xp_awarded: xp,
            streak_bonus,
        })
    }
}

// ============================================================================
// GOALS REPOSITORY
// ============================================================================

pub struct GoalsRepo;

impl GoalsRepo {
    /// Create a new goal
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateGoalRequest,
    ) -> Result<Goal, AppError> {
        let goal = sqlx::query_as::<_, Goal>(
            r#"INSERT INTO goals (user_id, title, description, category, target_date, priority, started_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())
               RETURNING id, user_id, title, description, category, target_date, started_at,
                         completed_at, status, progress, priority, sort_order, created_at, updated_at"#,
        )
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.category)
        .bind(req.target_date)
        .bind(req.priority.unwrap_or(0))
        .fetch_one(pool)
        .await?;

        Ok(goal)
    }

    /// Get a goal by ID with milestones
    pub async fn get_by_id(
        pool: &PgPool,
        goal_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<GoalResponse>, AppError> {
        let goal = sqlx::query_as::<_, Goal>(
            r#"SELECT id, user_id, title, description, category, target_date, started_at,
                      completed_at, status, progress, priority, sort_order, created_at, updated_at
               FROM goals WHERE id = $1 AND user_id = $2"#,
        )
        .bind(goal_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        match goal {
            None => Ok(None),
            Some(goal) => {
                let milestones = sqlx::query_as::<_, GoalMilestone>(
                    r#"SELECT id, goal_id, title, description, is_completed, completed_at, sort_order
                       FROM goal_milestones WHERE goal_id = $1 ORDER BY sort_order"#,
                )
                .bind(goal_id)
                .fetch_all(pool)
                .await?;

                let total = milestones.len() as i32;
                let completed = milestones.iter().filter(|m| m.is_completed).count() as i32;

                Ok(Some(GoalResponse {
                    id: goal.id,
                    title: goal.title,
                    description: goal.description,
                    category: goal.category,
                    target_date: goal.target_date,
                    started_at: goal.started_at,
                    completed_at: goal.completed_at,
                    status: goal.status,
                    progress: goal.progress,
                    priority: goal.priority,
                    milestones,
                    total_milestones: total,
                    completed_milestones: completed,
                }))
            }
        }
    }

    /// List goals for user
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        status_filter: Option<&str>,
    ) -> Result<GoalsListResponse, AppError> {
        let goals = if let Some(status) = status_filter {
            sqlx::query_as::<_, Goal>(
                r#"SELECT id, user_id, title, description, category, target_date, started_at,
                          completed_at, status, progress, priority, sort_order, created_at, updated_at
                   FROM goals WHERE user_id = $1 AND status = $2
                   ORDER BY priority DESC, sort_order, title"#,
            )
            .bind(user_id)
            .bind(status)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Goal>(
                r#"SELECT id, user_id, title, description, category, target_date, started_at,
                          completed_at, status, progress, priority, sort_order, created_at, updated_at
                   FROM goals WHERE user_id = $1
                   ORDER BY priority DESC, sort_order, title"#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        let total = goals.len() as i64;

        // Get milestones for all goals
        let goal_ids: Vec<Uuid> = goals.iter().map(|g| g.id).collect();

        let milestones = if !goal_ids.is_empty() {
            sqlx::query_as::<_, GoalMilestone>(
                r#"SELECT id, goal_id, title, description, is_completed, completed_at, sort_order
                   FROM goal_milestones WHERE goal_id = ANY($1) ORDER BY sort_order"#,
            )
            .bind(&goal_ids)
            .fetch_all(pool)
            .await?
        } else {
            vec![]
        };

        // Group milestones by goal
        let mut milestone_map: std::collections::HashMap<Uuid, Vec<GoalMilestone>> =
            std::collections::HashMap::new();
        for m in milestones {
            milestone_map.entry(m.goal_id).or_default().push(m);
        }

        let responses = goals
            .into_iter()
            .map(|g| {
                let ms = milestone_map.get(&g.id).cloned().unwrap_or_default();
                let total_m = ms.len() as i32;
                let completed_m = ms.iter().filter(|m| m.is_completed).count() as i32;

                GoalResponse {
                    id: g.id,
                    title: g.title,
                    description: g.description,
                    category: g.category,
                    target_date: g.target_date,
                    started_at: g.started_at,
                    completed_at: g.completed_at,
                    status: g.status,
                    progress: g.progress,
                    priority: g.priority,
                    milestones: ms,
                    total_milestones: total_m,
                    completed_milestones: completed_m,
                }
            })
            .collect();

        Ok(GoalsListResponse {
            goals: responses,
            total,
        })
    }

    /// Add milestone to goal
    pub async fn add_milestone(
        pool: &PgPool,
        goal_id: Uuid,
        user_id: Uuid,
        req: &CreateMilestoneRequest,
    ) -> Result<GoalMilestone, AppError> {
        // Verify goal belongs to user
        let goal = Self::get_by_id(pool, goal_id, user_id).await?;
        if goal.is_none() {
            return Err(AppError::NotFound("Goal not found".to_string()));
        }

        let milestone = sqlx::query_as::<_, GoalMilestone>(
            r#"INSERT INTO goal_milestones (goal_id, title, description)
               VALUES ($1, $2, $3)
               RETURNING id, goal_id, title, description, is_completed, completed_at, sort_order"#,
        )
        .bind(goal_id)
        .bind(&req.title)
        .bind(&req.description)
        .fetch_one(pool)
        .await?;

        Ok(milestone)
    }

    /// Complete milestone
    pub async fn complete_milestone(
        pool: &PgPool,
        milestone_id: Uuid,
        user_id: Uuid,
    ) -> Result<CompleteMilestoneResult, AppError> {
        // Get milestone and verify ownership
        let milestone = sqlx::query_as::<_, GoalMilestone>(
            r#"SELECT gm.id, gm.goal_id, gm.title, gm.description, gm.is_completed, gm.completed_at, gm.sort_order
               FROM goal_milestones gm
               JOIN goals g ON gm.goal_id = g.id
               WHERE gm.id = $1 AND g.user_id = $2"#,
        )
        .bind(milestone_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let milestone =
            milestone.ok_or_else(|| AppError::NotFound("Milestone not found".to_string()))?;

        // Update milestone
        let updated = sqlx::query_as::<_, GoalMilestone>(
            r#"UPDATE goal_milestones
               SET is_completed = true, completed_at = NOW()
               WHERE id = $1
               RETURNING id, goal_id, title, description, is_completed, completed_at, sort_order"#,
        )
        .bind(milestone_id)
        .fetch_one(pool)
        .await?;

        // Calculate new goal progress
        let (total, completed): (i64, i64) = sqlx::query_as(
            r#"SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed)
               FROM goal_milestones WHERE goal_id = $1"#,
        )
        .bind(milestone.goal_id)
        .fetch_one(pool)
        .await?;

        let progress = if total > 0 {
            ((completed * 100) / total) as i32
        } else {
            0
        };

        let goal_completed = progress == 100;

        // Update goal
        sqlx::query(
            r#"UPDATE goals
               SET progress = $1,
                   status = CASE WHEN $2 THEN 'completed' ELSE status END,
                   completed_at = CASE WHEN $2 THEN NOW() ELSE completed_at END
               WHERE id = $3"#,
        )
        .bind(progress)
        .bind(goal_completed)
        .bind(milestone.goal_id)
        .execute(pool)
        .await?;

        // Award XP for milestone completion
        let idempotency_key = format!("milestone_complete_{}", milestone_id);
        GamificationRepo::award_points(
            pool,
            user_id,
            &AwardPointsInput {
                xp: Some(10),
                coins: if goal_completed { Some(20) } else { None },
                skill_stars: None,
                skill_key: None,
                event_type: "milestone_complete".to_string(),
                event_id: Some(milestone_id),
                reason: Some(format!("Completed milestone: {}", updated.title)),
                idempotency_key: Some(idempotency_key),
            },
        )
        .await?;

        Ok(CompleteMilestoneResult {
            milestone: updated,
            goal_progress: progress,
            goal_completed,
        })
    }
}
