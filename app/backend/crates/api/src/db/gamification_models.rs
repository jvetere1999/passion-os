//! Gamification models
//!
//! Models for XP, coins, wallet, achievements, skills, and streaks.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS (Type-Safe Event & Streak Types)
// ============================================================================

/// Event type for points ledger entries.
///
/// Defines all valid event types that can trigger XP/coins/skill awards.
/// Using an enum provides compile-time type safety and prevents typos.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")] // Store as TEXT in database
#[serde(rename_all = "snake_case")]
pub enum EventType {
    /// Quest completed event
    QuestCompleted,
    /// Habit completion event
    HabitCompleted,
    /// Goal milestone reached event
    GoalMilestoneCompleted,
    /// Achievement unlocked event
    AchievementEarned,
    /// Skill leveled up event
    SkillLeveledUp,
    /// Bonus points awarded (admin/manual)
    BonusAwarded,
    /// Focus session completed
    FocusSessionCompleted,
    /// Custom event (catch-all)
    Custom,
}

impl EventType {
    /// Get human-readable display name
    pub fn display_name(&self) -> &str {
        match self {
            Self::QuestCompleted => "Quest Completed",
            Self::HabitCompleted => "Habit Completed",
            Self::GoalMilestoneCompleted => "Goal Milestone",
            Self::AchievementEarned => "Achievement Earned",
            Self::SkillLeveledUp => "Skill Level Up",
            Self::BonusAwarded => "Bonus Awarded",
            Self::FocusSessionCompleted => "Focus Session",
            Self::Custom => "Custom Event",
        }
    }
}

/// Streak type for user streak tracking.
///
/// Defines all valid streak types tracked by the system.
/// Using an enum provides compile-time type safety and prevents typos.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")] // Store as TEXT in database
#[serde(rename_all = "snake_case")]
pub enum StreakType {
    /// Daily login streak
    Daily,
    /// Habit completion streak
    Habit,
    /// Quest completion streak
    Quest,
    /// Meditation/focus session streak
    Meditation,
}

impl StreakType {
    /// Get human-readable display name
    pub fn display_name(&self) -> &str {
        match self {
            Self::Daily => "Daily Login",
            Self::Habit => "Habit Streak",
            Self::Quest => "Quest Streak",
            Self::Meditation => "Meditation Streak",
        }
    }
}

/// Skill category - classifies skills by domain
///
/// Skills are grouped into categories to help users discover and organize skills
/// relevant to their goals and interests.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")] // Store as TEXT in database
#[serde(rename_all = "snake_case")]
pub enum SkillCategory {
    /// Health and fitness related skills
    Health,
    /// Learning and education related skills
    Learning,
    /// Productivity and efficiency related skills
    Productivity,
    /// Creative and artistic skills
    Creativity,
    /// Social and interpersonal skills
    Social,
    /// Finance and money management skills
    Finance,
    /// Wellness and mindfulness skills
    Wellness,
    /// Other miscellaneous skills
    Other,
}

impl SkillCategory {
    /// Get human-readable display name
    pub fn display_name(&self) -> &str {
        match self {
            Self::Health => "Health & Fitness",
            Self::Learning => "Learning",
            Self::Productivity => "Productivity",
            Self::Creativity => "Creativity",
            Self::Social => "Social",
            Self::Finance => "Finance",
            Self::Wellness => "Wellness",
            Self::Other => "Other",
        }
    }
}

/// Achievement category - classifies achievements by type
///
/// Different achievement types convey different meanings and prestige levels.
/// Categories help organize achievements in the UI.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")] // Store as TEXT in database
#[serde(rename_all = "snake_case")]
pub enum AchievementCategory {
    /// Focus-related achievements
    Focus,
    /// Milestone achievements (level milestones, etc.)
    Milestone,
    /// Challenge achievements (complete specific challenges)
    Challenge,
    /// Hidden secret achievements
    Secret,
    /// Seasonal limited-time achievements
    Seasonal,
    /// Progression and advancement achievements
    Progression,
    /// Skill mastery achievements
    Skill,
    /// Community and social achievements
    Community,
    /// First-time/early-bird achievements
    FirstTime,
}

impl AchievementCategory {
    /// Get human-readable display name
    pub fn display_name(&self) -> &str {
        match self {
            Self::Focus => "Focus",
            Self::Milestone => "Milestone",
            Self::Challenge => "Challenge",
            Self::Secret => "Secret",
            Self::Seasonal => "Seasonal",
            Self::Progression => "Progression",
            Self::Skill => "Skill",
            Self::Community => "Community",
            Self::FirstTime => "First Time",
        }
    }
}

/// Achievement trigger type - defines how achievements are earned.
///
/// Different achievement types have different trigger mechanisms:
/// - CountBased: User performs an action N times
/// - Milestone: User reaches a specific level or threshold
/// - Unlock: Achievement unlocked by another achievement
/// - Streak: User maintains a streak of N consecutive days
///
/// Using tagged enum (externally tagged via #[serde(tag = "type", content = "config")])
/// allows flexible storage while maintaining type safety.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", content = "config")]
pub enum TriggerType {
    /// Achievement earned when user performs an event N times
    CountBased {
        /// Event type to count (e.g., "quest_completed")
        event_type: String,
        /// Required count to earn achievement
        target_count: i32,
    },
    /// Achievement earned when user reaches a specific milestone
    Milestone {
        /// Milestone type (e.g., "level_10", "total_xp_100000")
        milestone_type: String,
        /// Milestone value to reach
        milestone_value: i32,
    },
    /// Achievement unlocked when another achievement is earned
    Unlock {
        /// Key of achievement that must be earned first
        dependency_key: String,
    },
    /// Achievement earned for maintaining a streak
    Streak {
        /// Type of streak required
        streak_type: String,
        /// Number of consecutive days required
        days_required: i32,
    },
}

impl TriggerType {
    /// Get human-readable description of trigger.
    ///
    /// Example outputs:
    /// - CountBased: "Earn 5 times (quest_completed)"
    /// - Milestone: "Reach milestone: level_10 10"
    /// - Unlock: "Unlock after earning achievement: early_bird"
    /// - Streak: "Maintain 7-day Daily streak"
    pub fn description(&self) -> String {
        match self {
            Self::CountBased {
                event_type,
                target_count,
            } => {
                format!("Earn {} times ({})", target_count, event_type)
            }
            Self::Milestone {
                milestone_type,
                milestone_value,
            } => {
                format!("Reach milestone: {} {}", milestone_type, milestone_value)
            }
            Self::Unlock { dependency_key } => {
                format!("Unlock after earning achievement: {}", dependency_key)
            }
            Self::Streak {
                streak_type,
                days_required,
            } => {
                format!("Maintain {}-day {} streak", days_required, streak_type)
            }
        }
    }
}

// ============================================================================
// USER PROGRESS (XP/Level)
// ============================================================================

// TODO [BACK-005]: Consolidate database model macro duplication
// Reference: debug/analysis/MASTER_TASK_LIST.md#back-005-database-model-macro-duplication
// Roadmap: Step 1 of 5 - Create schema_enums! and status_enum! macros
// Status: NOT_STARTED

/// User progress - XP and level tracking
///
/// Tracks user progression through XP and level systems.
/// All XP-related fields use i64 to prevent overflow at high levels.
///
/// **Type Safety Note**:
/// `xp_to_next_level` is i64 (not i32) to handle high-level progression safely.
/// At level 100, xp_to_next_level ≈ 1,000,000 (within i32 range).
/// However, using i64 prevents potential overflow if level caps are raised in future.
///
/// **Example**:
/// - User at level 50 with 500,000 total XP
/// - Requires 5,000,000 XP to reach level 100
/// - xp_to_next_level = 4,500,000
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_xp: i64,
    pub current_level: i32,
    /// XP required to reach next level (i64 for type safety at high levels)
    pub xp_to_next_level: i64,
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

/// Points ledger entry - complete transaction history
///
/// Records all XP, coins, and skill star awards/transactions with full context.
/// Each entry links to a specific event via `event_type` and optional `event_id`.
///
/// **Ledger Strategy**:
/// - Every award is logged for audit trail
/// - Supports filtering by event_type (e.g., "show me all habit completions")
/// - Enables analytics (most common reward types, busiest days, etc.)
/// - Type-safe event_type enum prevents invalid values
///
/// **Example**:
/// User completes a quest (quest_id: abc123):
/// ```json
/// {
///   "id": "uuid1",
///   "user_id": "user123",
///   "event_type": "quest_completed",
///   "event_id": "abc123",
///   "coins": 100,
///   "xp": 500,
///   "skill_stars": 0,
///   "created_at": "2026-01-17T12:34:56Z"
/// }
/// ```
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PointsLedgerEntry {
    pub id: Uuid,
    pub user_id: Uuid,
    /// Type of event that triggered this award (type-safe enum)
    pub event_type: EventType,
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
///
/// Defines available skills that users can level up.
/// Categories help organize skills by domain (Health, Learning, Productivity, etc.).
///
/// **Example**:
/// ```json
/// {
///   "key": "meditation",
///   "name": "Meditation",
///   "description": "Practice mindfulness and meditation",
///   "category": "wellness",
///   "max_level": 10,
///   "stars_per_level": 100
/// }
/// ```
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SkillDefinition {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    /// Skill category (type-safe enum)
    pub category: SkillCategory,
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
///
/// Defines how users can earn achievements. The trigger_type determines
/// when the achievement is earned (count-based, milestone, unlock, streak).
///
/// **Achievement System Design**:
/// - Admin creates achievement definitions with structured triggers
/// - Users earn achievements through various actions (quests, habits, milestones)
/// - Each achievement has rewards (XP, coins) and can be hidden (secret achievements)
/// - Earned achievements stored in `UserAchievement` table with earned_at timestamp
///
/// **Trigger Types** (stored as JSON in trigger_type field):
/// - `CountBased { event_type, target_count }`: Earn after N actions
/// - `Milestone { milestone_type, milestone_value }`: Reach specific level/value
/// - `Unlock { dependency_key }`: Unlocked by another achievement
/// - `Streak { streak_type, days_required }`: Maintain N-day streak
///
/// **Example Achievement Definition**:
/// ```json
/// {
///   "key": "social_butterfly",
///   "name": "Social Butterfly",
///   "description": "Send 50 messages",
///   "category": "community",
///   "trigger_type": "CountBased",
///   "trigger_config": {
///     "event_type": "message_sent",
///     "target_count": 50
///   },
///   "reward_xp": 500,
///   "reward_coins": 100,
///   "is_hidden": false
/// }
/// ```
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AchievementDefinition {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    /// Achievement category (type-safe enum)
    pub category: AchievementCategory,
    pub icon: Option<String>,
    /// Achievement trigger mechanism (serialized as JSON string in database)
    /// Deserialized to TriggerType for type-safe handling
    pub trigger_type: String,
    /// Legacy: raw JSONB config. Prefer structured trigger_type field.
    pub trigger_config: Option<serde_json::Value>,
    pub reward_coins: i32,
    pub reward_xp: i32,
    pub is_hidden: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

impl AchievementDefinition {
    /// Parse trigger_type string into strongly-typed TriggerType enum.
    ///
    /// Converts JSON-serialized trigger_type into TriggerType enum for type-safe
    /// achievement trigger handling.
    ///
    /// # Errors
    /// Returns `serde_json::Error` if trigger_type cannot be deserialized.
    ///
    /// # Example
    /// ```ignore
    /// let achievement = AchievementDefinition { ... };
    /// match achievement.parse_trigger_type()? {
    ///     TriggerType::CountBased { event_type, target_count } => {
    ///         // Handle count-based achievement
    ///     }
    ///     TriggerType::Milestone { milestone_type, milestone_value } => {
    ///         // Handle milestone achievement
    ///     }
    ///     // ...
    /// }
    /// ```
    pub fn parse_trigger_type(&self) -> serde_json::Result<TriggerType> {
        serde_json::from_str(&self.trigger_type)
    }
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

/// User streak record - continuous activity tracking
///
/// Tracks consecutive days of user activity for different streak types.
/// Streaks are key motivators for habit formation and user engagement.
///
/// **Streak Mechanics**:
/// - `current_streak`: Updated daily; resets to 0 if user misses a day
/// - `longest_streak`: Historical record (never resets)
/// - `last_activity_date`: Tracks date of last activity to detect missed days
/// - `streak_type`: Enum ensures only valid types (Daily, Habit, Quest, Meditation)
///
/// **Example**:
/// User completes 3 quests in a row:
/// ```json
/// {
///   "id": "uuid1",
///   "user_id": "user123",
///   "streak_type": "quest",
///   "current_streak": 3,
///   "longest_streak": 5,
///   "last_activity_date": "2026-01-17",
///   "created_at": "2025-12-15T...",
///   "updated_at": "2026-01-17T..."
/// }
/// ```
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserStreak {
    pub id: Uuid,
    pub user_id: Uuid,
    /// Type of streak being tracked (type-safe enum)
    pub streak_type: StreakType,
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
///
/// Complete summary of a user's gamification progress including XP, coins, achievements.
/// All XP fields use i64 for consistency with database model and high-level safety.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamificationSummary {
    pub total_xp: i64,
    pub current_level: i32,
    /// XP required to reach next level (i64 for type consistency and overflow safety)
    pub xp_to_next_level: i64,
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

/// Award result - returned only on successful award (200 status)
///
/// If award fails, an AppError is returned instead (automatic via Result type).
/// Therefore, receiving this response means success=true implicitly.
/// Removed redundant `success` field that was always true.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwardResult {
    /// Whether this award was already completed (duplicate call)
    pub already_awarded: bool,
    /// New coin balance after award
    pub new_balance: i64,
    /// Whether user leveled up as a side effect of XP award
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leveled_up: Option<bool>,
    /// New level after leveling up (only present if leveled_up=true)
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
///
/// Used when awarding XP, coins, or skill stars to a user.
/// event_type must match a valid EventType variant.
#[derive(Debug, Clone, Deserialize)]
pub struct AwardPointsInput {
    pub xp: Option<i32>,
    pub coins: Option<i32>,
    pub skill_stars: Option<i32>,
    pub skill_key: Option<String>,
    /// Type of event triggering this award (type-safe enum)
    pub event_type: EventType,
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
