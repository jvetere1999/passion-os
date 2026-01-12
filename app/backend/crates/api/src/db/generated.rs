// GENERATED FROM schema.json v2.0.0 - DO NOT EDIT
// Generated: 2026-01-10
//
// Source of truth for database types. Import from here.
//
// Domains:
//   - Authentication & Authorization
//   - Gamification & Progress
//   - Focus Timer & Sessions
//   - Habits & Goals
//   - Reading & Books
//   - Fitness & Exercise
//   - Learning & Courses
//   - Shop & Market
//   - Calendar & Planning
//   - Analysis Frames
//   - Music Analysis
//   - Sync & Settings
//   - Content & References
//   - Onboarding
//   - Admin & Platform
//   - Other Tables

#![allow(dead_code)]

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

/// Database model for `accounts` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Accounts {
    pub id: Uuid,
    pub user_id: Uuid,
    pub r#type: String,
    pub provider: String,
    pub provider_account_id: String,
    pub refresh_token: Option<String>,
    pub access_token: Option<String>,
    pub expires_at: Option<i64>,
    pub token_type: Option<String>,
    pub scope: Option<String>,
    pub id_token: Option<String>,
    pub session_state: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `authenticators` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Authenticators {
    pub id: Uuid,
    pub user_id: Uuid,
    pub credential_id: String,
    pub provider_account_id: String,
    pub credential_public_key: String,
    pub counter: i64,
    pub credential_device_type: String,
    pub credential_backed_up: bool,
    pub transports: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `entitlements` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Entitlements {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `role_entitlements` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct RoleEntitlements {
    pub role_id: Uuid,
    pub entitlement_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `roles` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Roles {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub parent_role_id: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `sessions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Sessions {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_activity_at: Option<chrono::DateTime<chrono::Utc>>,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
    pub rotated_from: Option<Uuid>,
}

/// Database model for `user_roles` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserRoles {
    pub user_id: Uuid,
    pub role_id: Uuid,
    pub granted_by: Option<Uuid>,
    pub granted_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Database model for `users` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Users {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: String,
    pub email_verified: Option<chrono::DateTime<chrono::Utc>>,
    pub image: Option<String>,
    pub role: String,
    pub approved: bool,
    pub age_verified: bool,
    pub tos_accepted: bool,
    pub tos_accepted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub tos_version: Option<String>,
    pub is_admin: bool,
    pub last_activity_at: Option<chrono::DateTime<chrono::Utc>>,
    pub theme: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `verification_tokens` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct VerificationTokens {
    pub identifier: String,
    pub token: String,
    pub expires: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// GAMIFICATION & PROGRESS
// =============================================================================

/// Database model for `achievement_definitions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AchievementDefinitions {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub trigger_type: String,
    pub trigger_config: serde_json::Value,
    pub reward_coins: i32,
    pub reward_xp: i32,
    pub is_hidden: bool,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `activity_events` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ActivityEvents {
    pub id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub category: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub xp_earned: i32,
    pub coins_earned: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `skill_definitions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SkillDefinitions {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub max_level: i32,
    pub stars_per_level: i32,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `universal_quests` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UniversalQuests {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub r#type: String,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub target: i32,
    pub target_type: String,
    pub target_config: Option<serde_json::Value>,
    pub skill_key: Option<String>,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_achievements` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserAchievements {
    pub id: Uuid,
    pub user_id: Uuid,
    pub achievement_key: String,
    pub earned_at: chrono::DateTime<chrono::Utc>,
    pub notified: bool,
}

/// Database model for `user_progress` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_xp: i32,
    pub current_level: i32,
    pub xp_to_next_level: i32,
    pub total_skill_stars: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_quests` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserQuests {
    pub id: Uuid,
    pub user_id: Uuid,
    pub source_quest_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub difficulty: String,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub status: String,
    pub progress: i32,
    pub target: i32,
    pub is_active: bool,
    pub is_repeatable: bool,
    pub repeat_frequency: Option<String>,
    pub accepted_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub claimed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_completed_date: Option<chrono::NaiveDate>,
    pub streak_count: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_skills` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserSkills {
    pub id: Uuid,
    pub user_id: Uuid,
    pub skill_key: String,
    pub current_stars: i32,
    pub current_level: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_wallet` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserWallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub coins: i32,
    pub total_earned: i32,
    pub total_spent: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// FOCUS TIMER & SESSIONS
// =============================================================================

/// Database model for `focus_pause_state` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusPauseState {
    pub id: Uuid,
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub mode: Option<String>,
    pub is_paused: bool,
    pub time_remaining_seconds: Option<i32>,
    pub paused_at: Option<chrono::DateTime<chrono::Utc>>,
    pub resumed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `focus_sessions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusSessions {
    pub id: Uuid,
    pub user_id: Uuid,
    pub mode: String,
    pub duration_seconds: i32,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub abandoned_at: Option<chrono::DateTime<chrono::Utc>>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub status: String,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub task_id: Option<Uuid>,
    pub task_title: Option<String>,
    pub paused_at: Option<chrono::DateTime<chrono::Utc>>,
    pub paused_remaining_seconds: Option<i32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// HABITS & GOALS
// =============================================================================

/// Database model for `goal_milestones` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct GoalMilestones {
    pub id: Uuid,
    pub goal_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub is_completed: bool,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub sort_order: i32,
}

/// Database model for `goals` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Goals {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub target_date: Option<chrono::NaiveDate>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub status: String,
    pub progress: i32,
    pub priority: i32,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `habit_completions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct HabitCompletions {
    pub id: Uuid,
    pub habit_id: Uuid,
    pub user_id: Uuid,
    pub completed_at: chrono::DateTime<chrono::Utc>,
    pub completed_date: chrono::NaiveDate,
    pub notes: Option<String>,
}

/// Database model for `habits` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Habits {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,
    pub target_count: i32,
    pub custom_days: Option<Vec<i32>>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_active: bool,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// READING & BOOKS
// =============================================================================

/// Database model for `books` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Books {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: i32,
    pub status: String,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub rating: Option<i32>,
    pub notes: Option<String>,
    pub cover_blob_id: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `reading_sessions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ReadingSessions {
    pub id: Uuid,
    pub book_id: Uuid,
    pub user_id: Uuid,
    pub pages_read: i32,
    pub start_page: Option<i32>,
    pub end_page: Option<i32>,
    pub duration_minutes: Option<i32>,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub notes: Option<String>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

// =============================================================================
// FITNESS & EXERCISE
// =============================================================================

/// Database model for `personal_records` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PersonalRecords {
    pub id: Uuid,
    pub user_id: Uuid,
    pub exercise_id: Uuid,
    pub record_type: String,
    pub value: f32,
    pub reps: Option<i32>,
    pub achieved_at: chrono::DateTime<chrono::Utc>,
    pub exercise_set_id: Option<Uuid>,
    pub previous_value: Option<f32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `workout_exercises` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutExercises {
    pub id: Uuid,
    pub workout_id: Uuid,
    pub section_id: Option<Uuid>,
    pub exercise_id: Uuid,
    pub sets: Option<i32>,
    pub reps: Option<i32>,
    pub weight: Option<f32>,
    pub duration: Option<i32>,
    pub rest_seconds: Option<i32>,
    pub notes: Option<String>,
    pub sort_order: i32,
}

/// Database model for `workout_sessions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutSessions {
    pub id: Uuid,
    pub user_id: Uuid,
    pub workout_id: Option<Uuid>,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub duration_seconds: Option<i32>,
    pub notes: Option<String>,
    pub rating: Option<i32>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

// =============================================================================
// LEARNING & COURSES
// =============================================================================

/// Database model for `learn_lessons` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnLessons {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub content_markdown: Option<String>,
    pub duration_minutes: Option<i32>,
    pub difficulty: String,
    pub quiz_json: Option<serde_json::Value>,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub skill_key: Option<String>,
    pub skill_star_reward: i32,
    pub audio_r2_key: Option<String>,
    pub video_url: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `learn_topics` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnTopics {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_lesson_progress` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserLessonProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub lesson_id: Uuid,
    pub status: String,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub quiz_score: Option<i32>,
    pub attempts: i32,
}

// =============================================================================
// SHOP & MARKET
// =============================================================================

/// Database model for `market_items` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MarketItems {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub cost_coins: i32,
    pub rarity: Option<String>,
    pub icon: Option<String>,
    pub image_url: Option<String>,
    pub is_global: bool,
    pub is_available: bool,
    pub is_active: bool,
    pub is_consumable: bool,
    pub uses_per_purchase: Option<i32>,
    pub total_stock: Option<i32>,
    pub remaining_stock: Option<i32>,
    pub created_by_user_id: Option<Uuid>,
    pub sort_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_purchases` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserPurchases {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_id: Uuid,
    pub cost_coins: i32,
    pub quantity: i32,
    pub purchased_at: chrono::DateTime<chrono::Utc>,
    pub redeemed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub uses_remaining: Option<i32>,
    pub status: String,
    pub refunded_at: Option<chrono::DateTime<chrono::Utc>>,
    pub refund_reason: Option<String>,
}

// =============================================================================
// CALENDAR & PLANNING
// =============================================================================

/// Database model for `calendar_events` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CalendarEvents {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub event_type: String,
    pub start_time: chrono::DateTime<chrono::Utc>,
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
    pub all_day: bool,
    pub timezone: Option<String>,
    pub location: Option<String>,
    pub workout_id: Option<Uuid>,
    pub habit_id: Option<Uuid>,
    pub goal_id: Option<Uuid>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end: Option<chrono::NaiveDate>,
    pub parent_event_id: Option<Uuid>,
    pub color: Option<String>,
    pub reminder_minutes: Option<i32>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `daily_plans` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DailyPlans {
    pub id: Uuid,
    pub user_id: Uuid,
    pub date: chrono::NaiveDate,
    pub items: serde_json::Value,
    pub notes: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// ANALYSIS FRAMES
// =============================================================================

/// Database model for `analysis_events` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AnalysisEvents {
    pub id: Uuid,
    pub analysis_id: Uuid,
    pub time_ms: i32,
    pub duration_ms: Option<i32>,
    pub event_type: String,
    pub event_data: Option<serde_json::Value>,
    pub confidence: Option<f32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `analysis_frame_data` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AnalysisFrameData {
    pub id: Uuid,
    pub manifest_id: Uuid,
    pub chunk_index: i32,
    pub start_frame: i32,
    pub end_frame: i32,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub frame_data: Vec<u8>,
    pub frame_count: i32,
    pub compressed: bool,
    pub compression_type: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `analysis_frame_manifests` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AnalysisFrameManifests {
    pub id: Uuid,
    pub analysis_id: Uuid,
    pub manifest_version: i32,
    pub hop_ms: i32,
    pub frame_count: i32,
    pub duration_ms: i32,
    pub sample_rate: i32,
    pub bands: i32,
    pub bytes_per_frame: i32,
    pub frame_layout: serde_json::Value,
    pub events: Option<serde_json::Value>,
    pub fingerprint: Option<String>,
    pub analyzer_version: String,
    pub chunk_size_frames: i32,
    pub total_chunks: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// SYNC & SETTINGS
// =============================================================================

/// Database model for `feature_flags` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub id: Uuid,
    pub flag_name: String,
    pub enabled: bool,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_settings` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserSettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notifications_enabled: bool,
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub theme: String,
    pub timezone: Option<String>,
    pub locale: String,
    pub profile_public: bool,
    pub show_activity: bool,
    pub daily_reminder_time: Option<String>,
    pub soft_landing_until: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// CONTENT & REFERENCES
// =============================================================================

/// Database model for `ideas` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Ideas {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `inbox_items` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct InboxItems {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub item_type: String,
    pub tags: Option<Vec<String>>,
    pub is_processed: bool,
    pub processed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// ONBOARDING
// =============================================================================

/// Database model for `onboarding_flows` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OnboardingFlows {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub total_steps: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `onboarding_steps` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OnboardingSteps {
    pub id: Uuid,
    pub flow_id: Uuid,
    pub step_order: i32,
    pub step_type: String,
    pub title: String,
    pub description: Option<String>,
    pub target_selector: Option<String>,
    pub target_route: Option<String>,
    pub fallback_content: Option<String>,
    pub options: Option<serde_json::Value>,
    pub allows_multiple: bool,
    pub required: bool,
    pub action_type: Option<String>,
    pub action_config: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// ADMIN & PLATFORM
// =============================================================================

/// Database model for `audit_log` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub session_id: Option<Uuid>,
    pub event_type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
    pub action: Option<String>,
    pub status: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub request_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `feedback` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Feedback {
    pub id: Uuid,
    pub user_id: Uuid,
    pub feedback_type: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: Option<String>,
    pub admin_response: Option<String>,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// OTHER TABLES
// =============================================================================

/// Database model for `exercise_sets` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ExerciseSets {
    pub id: Uuid,
    pub session_id: Uuid,
    pub exercise_id: Uuid,
    pub set_number: i32,
    pub reps: Option<i32>,
    pub weight: Option<f32>,
    pub duration: Option<i32>,
    pub is_warmup: bool,
    pub is_dropset: bool,
    pub rpe: Option<i32>,
    pub notes: Option<String>,
    pub completed_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `exercises` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Exercises {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub muscle_groups: Option<Vec<String>>,
    pub equipment: Option<Vec<String>>,
    pub instructions: Option<String>,
    pub video_url: Option<String>,
    pub is_custom: bool,
    pub is_builtin: bool,
    pub user_id: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `focus_libraries` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusLibraries {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub library_type: String,
    pub tracks_count: i32,
    pub is_favorite: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `focus_library_tracks` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusLibraryTracks {
    pub id: Uuid,
    pub library_id: Uuid,
    pub track_id: Option<String>,
    pub track_title: String,
    pub track_url: Option<String>,
    pub duration_seconds: Option<i32>,
    pub sort_order: i32,
    pub added_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `infobase_entries` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct InfobaseEntries {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `learn_drills` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnDrills {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub drill_type: String,
    pub config_json: serde_json::Value,
    pub difficulty: String,
    pub duration_seconds: Option<i32>,
    pub xp_reward: i32,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `listening_prompt_presets` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ListeningPromptPresets {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub template_id: Uuid,
    pub preset_type: String,
    pub config: serde_json::Value,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `listening_prompt_templates` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ListeningPromptTemplates {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub difficulty: String,
    pub prompt_text: String,
    pub hints: Option<serde_json::Value>,
    pub expected_observations: Option<serde_json::Value>,
    pub tags: Option<Vec<String>>,
    pub display_order: i32,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `market_recommendations` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MarketRecommendations {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_id: Uuid,
    pub score: f32,
    pub reason: Option<String>,
    pub computed_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `market_transactions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MarketTransactions {
    pub id: Uuid,
    pub user_id: Uuid,
    pub transaction_type: String,
    pub coins_amount: i32,
    pub item_id: Option<Uuid>,
    pub reason: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `oauth_states` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OauthStates {
    pub state_key: String,
    pub pkce_verifier: String,
    pub redirect_uri: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `plan_templates` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PlanTemplates {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub items: serde_json::Value,
    pub is_public: bool,
    pub category: Option<String>,
    pub use_count: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `points_ledger` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PointsLedger {
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
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `program_weeks` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ProgramWeeks {
    pub id: Uuid,
    pub program_id: Uuid,
    pub week_number: i32,
    pub name: Option<String>,
    pub is_deload: bool,
    pub notes: Option<String>,
}

/// Database model for `program_workouts` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ProgramWorkouts {
    pub id: Uuid,
    pub program_week_id: Uuid,
    pub workout_id: Uuid,
    pub day_of_week: i32,
    pub order_index: i32,
    pub intensity_modifier: f32,
}

/// Database model for `reference_tracks` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ReferenceTracks {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub r2_key: String,
    pub file_size_bytes: i64,
    pub mime_type: String,
    pub duration_seconds: Option<f32>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub bpm: Option<f32>,
    pub key_signature: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: String,
    pub error_message: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `track_analyses` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct TrackAnalyses {
    pub id: Uuid,
    pub track_id: Uuid,
    pub analysis_type: String,
    pub version: String,
    pub status: String,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub error_message: Option<String>,
    pub summary: Option<serde_json::Value>,
    pub manifest: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `track_annotations` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct TrackAnnotations {
    pub id: Uuid,
    pub track_id: Uuid,
    pub user_id: Uuid,
    pub start_time_ms: i32,
    pub end_time_ms: Option<i32>,
    pub title: String,
    pub content: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub is_private: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `track_regions` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct TrackRegions {
    pub id: Uuid,
    pub track_id: Uuid,
    pub user_id: Uuid,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub name: String,
    pub description: Option<String>,
    pub section_type: Option<String>,
    pub color: Option<String>,
    pub display_order: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `training_programs` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct TrainingPrograms {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub duration_weeks: i32,
    pub goal: Option<String>,
    pub difficulty: Option<String>,
    pub is_active: bool,
    pub current_week: i32,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_drill_stats` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserDrillStats {
    pub id: Uuid,
    pub user_id: Uuid,
    pub drill_id: Uuid,
    pub total_attempts: i32,
    pub correct_answers: i32,
    pub best_score: i32,
    pub average_score: f32,
    pub current_streak: i32,
    pub best_streak: i32,
    pub last_attempt_at: Option<chrono::DateTime<chrono::Utc>>,
    pub total_time_seconds: i32,
}

/// Database model for `user_interests` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserInterests {
    pub id: Uuid,
    pub user_id: Uuid,
    pub interest_key: String,
    pub interest_label: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_onboarding_responses` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserOnboardingResponses {
    pub id: Uuid,
    pub user_id: Uuid,
    pub step_id: Uuid,
    pub response: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_onboarding_state` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserOnboardingState {
    pub id: Uuid,
    pub user_id: Uuid,
    pub flow_id: Uuid,
    pub current_step_id: Option<Uuid>,
    pub status: String,
    pub can_resume: bool,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub skipped_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_quest_progress` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserQuestProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub quest_id: Uuid,
    pub status: String,
    pub progress: i32,
    pub accepted_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub claimed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_reset_at: Option<chrono::DateTime<chrono::Utc>>,
    pub times_completed: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_references` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserReferences {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: Option<String>,
    pub url: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_rewards` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserRewards {
    pub id: Uuid,
    pub user_id: Uuid,
    pub reward_type: String,
    pub source_id: Option<Uuid>,
    pub coins_earned: i32,
    pub xp_earned: i32,
    pub claimed: bool,
    pub claimed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `user_streaks` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserStreaks {
    pub id: Uuid,
    pub user_id: Uuid,
    pub streak_type: String,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_activity_date: Option<chrono::NaiveDate>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Database model for `workout_sections` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutSections {
    pub id: Uuid,
    pub workout_id: Uuid,
    pub name: String,
    pub section_type: Option<String>,
    pub sort_order: i32,
}

/// Database model for `workouts` table
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Workouts {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub difficulty: Option<String>,
    pub category: Option<String>,
    pub is_template: bool,
    pub is_public: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// =============================================================================
// TYPE ALIASES
// =============================================================================

pub type Account = Accounts;
pub type AchievementDefinition = AchievementDefinitions;
pub type ActivityEvent = ActivityEvents;
pub type AnalysisEvent = AnalysisEvents;
pub type AnalysisFrameManifest = AnalysisFrameManifests;
pub type Authenticator = Authenticators;
pub type Book = Books;
pub type CalendarEvent = CalendarEvents;
pub type DailyPlan = DailyPlans;
pub type Entitlement = Entitlements;
pub type ExerciseSet = ExerciseSets;
pub type Exercise = Exercises;
pub type FeatureFlag = FeatureFlags;
pub type FocusLibrary = FocusLibraries;
pub type FocusLibraryTrack = FocusLibraryTracks;
pub type FocusSession = FocusSessions;
pub type GoalMileston = GoalMilestones;
pub type Goal = Goals;
pub type HabitCompletion = HabitCompletions;
pub type Habit = Habits;
pub type Idea = Ideas;
pub type InboxItem = InboxItems;
pub type InfobaseEntry = InfobaseEntries;
pub type LearnDrill = LearnDrills;
pub type LearnLesson = LearnLessons;
pub type LearnTopic = LearnTopics;
pub type ListeningPromptPreset = ListeningPromptPresets;
pub type ListeningPromptTemplat = ListeningPromptTemplates;
pub type MarketItem = MarketItems;
pub type MarketRecommendation = MarketRecommendations;
pub type MarketTransaction = MarketTransactions;
pub type OauthStat = OauthStates;
pub type OnboardingFlow = OnboardingFlows;
pub type OnboardingStep = OnboardingSteps;
pub type PersonalRecord = PersonalRecords;
pub type PlanTemplat = PlanTemplates;
pub type ProgramWeek = ProgramWeeks;
pub type ProgramWorkout = ProgramWorkouts;
pub type ReadingSession = ReadingSessions;
pub type ReferenceTrack = ReferenceTracks;
pub type RoleEntitlement = RoleEntitlements;
pub type Rol = Roles;
pub type Session = Sessions;
pub type SkillDefinition = SkillDefinitions;
pub type TrackAnalyse = TrackAnalyses;
pub type TrackAnnotation = TrackAnnotations;
pub type TrackRegion = TrackRegions;
pub type TrainingProgram = TrainingPrograms;
pub type UniversalQuest = UniversalQuests;
pub type UserAchievement = UserAchievements;
pub type UserDrillStat = UserDrillStats;
pub type UserInterest = UserInterests;
pub type UserOnboardingResponse = UserOnboardingResponses;
pub type UserPurchase = UserPurchases;
pub type UserQuest = UserQuests;
pub type UserReferenc = UserReferences;
pub type UserReward = UserRewards;
pub type UserRol = UserRoles;
pub type UserSetting = UserSettings;
pub type UserSkill = UserSkills;
pub type UserStreak = UserStreaks;
pub type User = Users;
pub type VerificationToken = VerificationTokens;
pub type WorkoutExercise = WorkoutExercises;
pub type WorkoutSection = WorkoutSections;
pub type WorkoutSession = WorkoutSessions;
pub type Workout = Workouts;

/// Schema version
pub const SCHEMA_VERSION: &str = "2.0.0";
