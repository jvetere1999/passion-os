//! Gamification models
//!
//! Models for XP, coins, wallet, achievements, skills, and streaks.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// USER PROGRESS (XP/Level)
// ============================================================================

/// User progress - XP and level tracking
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_xp: i64,
    pub current_level: i32,
    pub xp_to_next_level: i32,
    pub total_skill_stars: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// USER WALLET (Coins)
// ============================================================================

/// User wallet - coins balance
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserWallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub coins: i64,
    pub total_earned: i64,
    pub total_spent: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// POINTS LEDGER (Transaction History)
// ============================================================================

/// Points ledger entry - transaction history
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PointsLedgerEntry {
    pub id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub event_id: Option<Uuid>,
    pub coins: i32,
    pub xp: i32,
    pub skill_stars: i32,
    pub skill_key: Option<String>,
    pub reason: Option<String>,
    pub idempotency_key: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// SKILLS
// ============================================================================

/// Skill definition - admin-managed skill catalog
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SkillDefinition {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub max_level: i32,
    pub stars_per_level: i32,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// User skill progress
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserSkill {
    pub id: Uuid,
    pub user_id: Uuid,
    pub skill_key: String,
    pub current_stars: i32,
    pub current_level: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/// Achievement definition - admin-managed achievement catalog
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AchievementDefinition {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub trigger_type: String,
    pub trigger_config: Option<serde_json::Value>,
    pub reward_coins: i32,
    pub reward_xp: i32,
    pub is_hidden: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// User achievement - earned achievements
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserAchievement {
    pub id: Uuid,
    pub user_id: Uuid,
    pub achievement_key: String,
    pub earned_at: DateTime<Utc>,
    pub notified: bool,
}

// ============================================================================
// STREAKS
// ============================================================================

/// User streak record
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserStreak {
    pub id: Uuid,
    pub user_id: Uuid,
    pub streak_type: String,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_activity_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/// Gamification summary response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamificationSummary {
    pub total_xp: i64,
    pub current_level: i32,
    pub xp_to_next_level: i32,
    pub xp_progress_percent: i32,
    pub coins: i64,
    pub total_skill_stars: i32,
    pub achievement_count: i64,
    pub current_streak: i32,
    pub longest_streak: i32,
}

/// Achievement teaser for Today page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AchievementTeaser {
    pub achievement: AchievementDefinition,
    pub progress: i32,
    pub progress_max: i32,
    pub progress_label: String,
}

/// Award result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwardResult {
    pub success: bool,
    pub already_awarded: bool,
    pub new_balance: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leveled_up: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_level: Option<i32>,
}

/// Spend result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpendResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub new_balance: i64,
}

/// Streak update result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreakUpdateResult {
    pub current_streak: i32,
    pub is_new_day: bool,
    pub streak_broken: bool,
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/// Input for awarding points
#[derive(Debug, Clone, Deserialize)]
pub struct AwardPointsInput {
    pub xp: Option<i32>,
    pub coins: Option<i32>,
    pub skill_stars: Option<i32>,
    pub skill_key: Option<String>,
    pub event_type: String,
    pub event_id: Option<Uuid>,
    pub reason: Option<String>,
    pub idempotency_key: Option<String>,
}

/// Input for spending coins
#[derive(Debug, Clone, Deserialize)]
pub struct SpendCoinsInput {
    pub amount: i32,
    pub reason: String,
    pub purchase_id: Option<Uuid>,
}
