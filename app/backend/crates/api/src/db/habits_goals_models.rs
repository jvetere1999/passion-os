//! Habits and Goals models
//!
//! Models for habit tracking and goal management.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// HABITS
// ============================================================================

/// Habit database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Habit {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,
    pub target_count: i32,
    pub custom_days: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_active: bool,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_completed_at: Option<DateTime<Utc>>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Habit log entry
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct HabitLog {
    pub id: Uuid,
    pub habit_id: Uuid,
    pub user_id: Uuid,
    pub completed_at: DateTime<Utc>,
    pub completed_date: NaiveDate,
    pub notes: Option<String>,
}

/// Create habit request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub description: Option<String>,
    #[serde(default = "default_frequency")]
    pub frequency: String,
    #[serde(default = "default_target")]
    pub target_count: i32,
    pub custom_days: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

fn default_frequency() -> String {
    "daily".to_string()
}

fn default_target() -> i32 {
    1
}

/// Habit response with today's status
#[derive(Debug, Clone, Serialize)]
pub struct HabitResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,
    pub target_count: i32,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_active: bool,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_completed_at: Option<DateTime<Utc>>,
    pub completed_today: bool,
    pub sort_order: i32,
}

/// Complete habit result
#[derive(Debug, Clone, Serialize)]
pub struct CompleteHabitResult {
    pub habit: HabitResponse,
    pub new_streak: i32,
    pub xp_awarded: i32,
    pub streak_bonus: bool,
}

/// Habits list response
#[derive(Debug, Clone, Serialize)]
pub struct HabitsListResponse {
    pub habits: Vec<HabitResponse>,
}

// ============================================================================
// GOALS
// ============================================================================

/// Goal status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalStatus {
    Active,
    Completed,
    Abandoned,
    Paused,
}

impl GoalStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            GoalStatus::Active => "active",
            GoalStatus::Completed => "completed",
            GoalStatus::Abandoned => "abandoned",
            GoalStatus::Paused => "paused",
        }
    }
}

/// Goal database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Goal {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub target_date: Option<NaiveDate>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: String,
    pub progress: i32,
    pub priority: i32,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Goal milestone
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct GoalMilestone {
    pub id: Uuid,
    pub goal_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub is_completed: bool,
    pub completed_at: Option<DateTime<Utc>>,
    pub sort_order: i32,
}

/// Create goal request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateGoalRequest {
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub target_date: Option<NaiveDate>,
    pub priority: Option<i32>,
}

/// Create milestone request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateMilestoneRequest {
    pub title: String,
    pub description: Option<String>,
}

/// Goal response with milestones
#[derive(Debug, Clone, Serialize)]
pub struct GoalResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub target_date: Option<NaiveDate>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: String,
    pub progress: i32,
    pub priority: i32,
    pub milestones: Vec<GoalMilestone>,
    pub total_milestones: i32,
    pub completed_milestones: i32,
}

/// Goals list response
#[derive(Debug, Clone, Serialize)]
pub struct GoalsListResponse {
    pub goals: Vec<GoalResponse>,
    pub total: i64,
}

/// Complete milestone result
#[derive(Debug, Clone, Serialize)]
pub struct CompleteMilestoneResult {
    pub milestone: GoalMilestone,
    pub goal_progress: i32,
    pub goal_completed: bool,
}
