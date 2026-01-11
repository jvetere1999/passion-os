//! Quests models
//!
//! Models for quest system (user quests + universal quests).

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Quest status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QuestStatus {
    Available,
    Accepted,
    InProgress,
    Completed,
    Claimed,
    Abandoned,
    Expired,
}

impl QuestStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            QuestStatus::Available => "available",
            QuestStatus::Accepted => "accepted",
            QuestStatus::InProgress => "in_progress",
            QuestStatus::Completed => "completed",
            QuestStatus::Claimed => "claimed",
            QuestStatus::Abandoned => "abandoned",
            QuestStatus::Expired => "expired",
        }
    }
}

/// Quest difficulty
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QuestDifficulty {
    Starter,
    Easy,
    Medium,
    Hard,
    Epic,
}

impl QuestDifficulty {
    pub fn as_str(&self) -> &'static str {
        match self {
            QuestDifficulty::Starter => "starter",
            QuestDifficulty::Easy => "easy",
            QuestDifficulty::Medium => "medium",
            QuestDifficulty::Hard => "hard",
            QuestDifficulty::Epic => "epic",
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Universal quest definition (system-defined)
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UniversalQuest {
    pub id: Uuid,
    pub key: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub quest_type: String,
    pub category: Option<String>,
    pub requirements: Option<serde_json::Value>,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub skill_key: Option<String>,
    pub skill_star_reward: i32,
    pub is_recurring: bool,
    pub recurrence_period: Option<String>,
    pub is_active: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User quest progress on universal quests
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserQuestProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub quest_id: Uuid,
    pub status: String,
    pub progress: i32,
    pub accepted_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub claimed_at: Option<DateTime<Utc>>,
    pub last_reset_at: Option<DateTime<Utc>>,
    pub times_completed: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User quest (personal quests)
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Quest {
    pub id: Uuid,
    pub user_id: Uuid,
    pub source_quest_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub status: String,
    pub progress: i32,
    pub target: i32,
    pub is_active: bool,
    pub is_repeatable: bool,
    pub repeat_frequency: Option<String>,
    pub accepted_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub claimed_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_completed_date: Option<NaiveDate>,
    pub streak_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/// Create quest request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateQuestRequest {
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    #[serde(default = "default_difficulty")]
    pub difficulty: String,
    pub xp_reward: Option<i32>,
    pub coin_reward: Option<i32>,
    pub target: Option<i32>,
    pub is_repeatable: Option<bool>,
    pub repeat_frequency: Option<String>,
}

fn default_difficulty() -> String {
    "starter".to_string()
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/// Quest response
#[derive(Debug, Clone, Serialize)]
pub struct QuestResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub status: String,
    pub is_repeatable: bool,
    pub streak_count: i32,
    pub accepted_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl From<Quest> for QuestResponse {
    fn from(q: Quest) -> Self {
        Self {
            id: q.id,
            title: q.title,
            description: q.description,
            category: q.category,
            difficulty: q.difficulty,
            xp_reward: q.xp_reward,
            coin_reward: q.coin_reward,
            status: q.status,
            is_repeatable: q.is_repeatable,
            streak_count: q.streak_count,
            accepted_at: q.accepted_at,
            completed_at: q.completed_at,
            expires_at: q.expires_at,
        }
    }
}

/// Quests list response
#[derive(Debug, Clone, Serialize)]
pub struct QuestsListResponse {
    pub quests: Vec<QuestResponse>,
    pub total: i64,
}

/// Complete quest result
#[derive(Debug, Clone, Serialize)]
pub struct CompleteQuestResult {
    pub quest: QuestResponse,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub leveled_up: bool,
    pub new_level: Option<i32>,
}

/// Universal quest with user progress
#[derive(Debug, Clone, Serialize)]
pub struct UniversalQuestWithProgress {
    pub quest: UniversalQuest,
    pub progress: Option<UserQuestProgress>,
    pub is_available: bool,
    pub is_completed: bool,
}
