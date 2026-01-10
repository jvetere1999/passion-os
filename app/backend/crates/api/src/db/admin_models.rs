//! Admin models
//!
//! Types for admin-only operations: user management, stats, feedback moderation, etc.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================
// Admin Status & Claiming
// ============================================

/// Admin status response
#[derive(Debug, Serialize)]
pub struct AdminStatus {
    pub is_admin: bool,
    pub can_claim: bool,
    pub user: Option<AdminUserInfo>,
}

/// Simplified user info for admin status
#[derive(Debug, Serialize)]
pub struct AdminUserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
}

/// Claim request payload
#[derive(Debug, Deserialize)]
pub struct ClaimRequest {
    #[serde(rename = "claimKey")]
    pub claim_key: String,
}

/// Claim response
#[derive(Debug, Serialize)]
pub struct ClaimResponse {
    pub success: bool,
    pub message: String,
}

// ============================================
// User Management
// ============================================

/// Admin view of a user
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AdminUser {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub image: Option<String>,
    pub role: String,
    pub approved: bool,
    pub tos_accepted: bool,
    pub last_activity_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// User with stats for admin list
#[derive(Debug, Clone, Serialize)]
pub struct AdminUserWithStats {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub image: Option<String>,
    pub role: String,
    pub approved: bool,
    pub tos_accepted: bool,
    pub last_activity_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub level: Option<i32>,
    pub total_xp: Option<i64>,
}

/// Row for user with stats join
#[derive(Debug, Clone, FromRow)]
pub struct AdminUserRow {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub image: Option<String>,
    pub role: String,
    pub approved: bool,
    pub tos_accepted: bool,
    pub last_activity_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub level: Option<i32>,
    pub total_xp: Option<i64>,
}

impl From<AdminUserRow> for AdminUserWithStats {
    fn from(row: AdminUserRow) -> Self {
        Self {
            id: row.id,
            email: row.email,
            name: row.name,
            image: row.image,
            role: row.role,
            approved: row.approved,
            tos_accepted: row.tos_accepted,
            last_activity_at: row.last_activity_at,
            created_at: row.created_at,
            level: row.level,
            total_xp: row.total_xp,
        }
    }
}

/// Response for user list
#[derive(Debug, Serialize)]
pub struct AdminUsersResponse {
    pub users: Vec<AdminUserWithStats>,
    pub total: i64,
}

/// Response for user deletion
#[derive(Debug, Serialize)]
pub struct DeleteUserResponse {
    pub success: bool,
    pub message: String,
    pub tables_cleaned: i32,
}

// ============================================
// Platform Statistics
// ============================================

/// User statistics
#[derive(Debug, Clone, Serialize, Default)]
pub struct UserStats {
    pub total_users: i64,
    pub tos_accepted: i64,
    pub admins: i64,
    pub active_7d: i64,
    pub active_30d: i64,
}

/// Content statistics
#[derive(Debug, Clone, Serialize, Default)]
pub struct ContentStats {
    pub exercises: i64,
    pub learn_topics: i64,
    pub learn_lessons: i64,
    pub learn_drills: i64,
    pub universal_quests: i64,
    pub user_quests: i64,
    pub market_items: i64,
}

/// Activity statistics
#[derive(Debug, Clone, Serialize, Default)]
pub struct ActivityStats {
    pub total_focus_sessions: i64,
    pub completed_focus: i64,
    pub total_focus_minutes: i64,
    pub total_events: i64,
    pub events_24h: i64,
    pub habit_completions: i64,
    pub total_goals: i64,
    pub total_ideas: i64,
    pub total_books: i64,
    pub reference_tracks: i64,
}

/// Gamification statistics
#[derive(Debug, Clone, Serialize, Default)]
pub struct GamificationStats {
    pub total_coins_distributed: i64,
    pub total_xp_distributed: i64,
    pub achievements_earned: i64,
    pub total_purchases: i64,
}

/// Recent user activity
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct RecentUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub last_activity_at: Option<DateTime<Utc>>,
}

/// Recent event
#[derive(Debug, Clone, Serialize)]
pub struct RecentEvent {
    pub event_type: String,
    pub created_at: DateTime<Utc>,
    pub user_email: Option<String>,
}

/// Complete stats response
#[derive(Debug, Serialize)]
pub struct AdminStatsResponse {
    pub users: UserStats,
    pub content: ContentStats,
    pub activity: ActivityStats,
    pub gamification: GamificationStats,
    pub recent_users: Vec<RecentUser>,
    pub recent_events: Vec<RecentEvent>,
}

// ============================================
// Feedback Management
// ============================================

/// Admin view of feedback
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AdminFeedback {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_email: Option<String>,
    pub feedback_type: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub admin_response: Option<String>,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// Update feedback request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateFeedbackRequest {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub admin_response: Option<String>,
}

/// Response for feedback list
#[derive(Debug, Serialize)]
pub struct AdminFeedbackResponse {
    pub feedback: Vec<AdminFeedback>,
}

// ============================================
// Quest Management
// ============================================

/// Admin view of universal quest
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AdminQuest {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub quest_type: String,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub target: i32,
    pub skill_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

/// Create quest request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateQuestRequest {
    pub title: String,
    pub description: String,
    pub quest_type: Option<String>,
    pub xp_reward: Option<i32>,
    pub coin_reward: Option<i32>,
    pub target: Option<i32>,
    pub skill_id: Option<String>,
}

/// Update quest request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateQuestRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub quest_type: Option<String>,
    pub xp_reward: Option<i32>,
    pub coin_reward: Option<i32>,
    pub target: Option<i32>,
    pub skill_id: Option<String>,
    pub is_active: Option<bool>,
}

/// Response for quest list
#[derive(Debug, Serialize)]
pub struct AdminQuestsResponse {
    pub quests: Vec<AdminQuest>,
}

// ============================================
// Skill Management
// ============================================

/// Admin view of skill definition
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AdminSkill {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub max_level: i32,
    pub xp_scaling_base: i32,
    pub xp_scaling_multiplier: f64,
    pub display_order: i32,
    pub is_active: bool,
}

/// Create skill request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateSkillRequest {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub max_level: Option<i32>,
    pub xp_scaling_base: Option<i32>,
    pub xp_scaling_multiplier: Option<f64>,
}

/// Update skill request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateSkillRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub max_level: Option<i32>,
    pub xp_scaling_base: Option<i32>,
    pub xp_scaling_multiplier: Option<f64>,
    pub is_active: Option<bool>,
    pub display_order: Option<i32>,
}

/// Response for skill list
#[derive(Debug, Serialize)]
pub struct AdminSkillsResponse {
    pub skills: Vec<AdminSkill>,
}

// ============================================
// Database Health
// ============================================

/// Database health response
#[derive(Debug, Serialize)]
pub struct DbHealthResponse {
    pub status: String,
    pub tables: Vec<TableInfo>,
    pub total_size_estimate: String,
}

/// Table info
#[derive(Debug, Clone, Serialize)]
pub struct TableInfo {
    pub name: String,
    pub row_count: i64,
}

// ============================================
// Backup/Restore
// ============================================

/// Backup info
#[derive(Debug, Clone, Serialize)]
pub struct BackupInfo {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub size_bytes: i64,
    pub status: String,
}

/// List backups response
#[derive(Debug, Serialize)]
pub struct BackupsListResponse {
    pub backups: Vec<BackupInfo>,
}

/// Create backup response
#[derive(Debug, Serialize)]
pub struct CreateBackupResponse {
    pub success: bool,
    pub backup_id: String,
    pub message: String,
}

/// Restore request
#[derive(Debug, Clone, Deserialize)]
pub struct RestoreRequest {
    pub backup_id: String,
}

/// Restore response
#[derive(Debug, Serialize)]
pub struct RestoreResponse {
    pub success: bool,
    pub message: String,
}

// ============================================
// Audit Log
// ============================================

/// Audit log entry for admin viewing
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AuditLogEntry {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub event_type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub action: String,
    pub status: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Audit log entry with user email for display
#[derive(Debug, Clone, Serialize)]
pub struct AuditLogEntryWithUser {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_email: Option<String>,
    pub event_type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub action: String,
    pub status: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Audit log query params
#[derive(Debug, Clone, Deserialize)]
pub struct AuditLogQuery {
    pub event_type: Option<String>,
    pub user_id: Option<Uuid>,
    pub resource_type: Option<String>,
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Audit log response
#[derive(Debug, Serialize)]
pub struct AuditLogResponse {
    pub entries: Vec<AuditLogEntryWithUser>,
    pub total: i64,
}
