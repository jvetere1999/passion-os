//! Learn models
//!
//! Models for learning system (topics, lessons, drills, progress).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Lesson status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LessonStatus {
    NotStarted,
    InProgress,
    Completed,
}

/// Difficulty level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Difficulty {
    Beginner,
    Intermediate,
    Advanced,
}

impl Difficulty {
    pub fn as_str(&self) -> &'static str {
        match self {
            Difficulty::Beginner => "beginner",
            Difficulty::Intermediate => "intermediate",
            Difficulty::Advanced => "advanced",
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Learning topic
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnTopic {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// Learning lesson
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnLesson {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub content_markdown: Option<String>,
    pub duration_minutes: i32,
    pub difficulty: String,
    pub quiz_json: Option<serde_json::Value>,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub skill_key: Option<String>,
    pub skill_star_reward: Option<i32>,
    pub audio_r2_key: Option<String>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// Learning drill
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LearnDrill {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub drill_type: String,
    pub config_json: serde_json::Value,
    pub difficulty: String,
    pub duration_seconds: i32,
    pub xp_reward: i32,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// User lesson progress
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserLessonProgress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub lesson_id: Uuid,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub quiz_score: Option<i32>,
    pub attempts: i32,
}

/// User drill stats
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserDrillStats {
    pub id: Uuid,
    pub user_id: Uuid,
    pub drill_id: Uuid,
    pub total_attempts: i32,
    pub correct_answers: i32,
    pub best_score: Option<i32>,
    pub average_score: Option<f64>,
    pub current_streak: i32,
    pub best_streak: i32,
    pub last_attempt_at: Option<DateTime<Utc>>,
    pub total_time_seconds: i32,
}

// ============================================================================
// REQUEST MODELS
// ============================================================================

/// Start lesson request
#[derive(Debug, Deserialize)]
pub struct StartLessonRequest {
    pub lesson_id: Uuid,
}

/// Complete lesson request
#[derive(Debug, Deserialize)]
pub struct CompleteLessonRequest {
    pub lesson_id: Uuid,
    pub quiz_score: Option<i32>,
}

/// Submit drill result request
#[derive(Debug, Deserialize)]
pub struct SubmitDrillRequest {
    pub drill_id: Uuid,
    pub score: i32,
    pub correct_count: i32,
    pub total_count: i32,
    pub time_seconds: i32,
}

// ============================================================================
// RESPONSE MODELS
// ============================================================================

/// Topic response with progress
#[derive(Serialize)]
pub struct TopicResponse {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: Option<String>,
    pub lesson_count: i64,
    pub completed_count: i64,
}

/// Topics list response
#[derive(Serialize)]
pub struct TopicsListResponse {
    pub topics: Vec<TopicResponse>,
    pub total: i64,
}

/// Lesson response with progress
#[derive(Serialize)]
pub struct LessonResponse {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: i32,
    pub difficulty: String,
    pub xp_reward: i32,
    pub coin_reward: i32,
    pub status: String,
    pub has_quiz: bool,
    pub has_audio: bool,
}

/// Lessons list response
#[derive(Serialize)]
pub struct LessonsListResponse {
    pub lessons: Vec<LessonResponse>,
    pub total: i64,
}

/// Lesson content response
#[derive(Serialize)]
pub struct LessonContentResponse {
    pub id: Uuid,
    pub title: String,
    pub content_markdown: Option<String>,
    pub quiz_json: Option<serde_json::Value>,
    pub audio_url: Option<String>,
    pub progress: LessonProgressInfo,
}

/// Lesson progress info
#[derive(Serialize)]
pub struct LessonProgressInfo {
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub quiz_score: Option<i32>,
    pub attempts: i32,
}

/// Complete lesson result
#[derive(Serialize)]
pub struct CompleteLessonResult {
    pub lesson_id: Uuid,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub is_first_completion: bool,
    pub quiz_score: Option<i32>,
}

/// Drill response
#[derive(Serialize)]
pub struct DrillResponse {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub drill_type: String,
    pub difficulty: String,
    pub duration_seconds: i32,
    pub xp_reward: i32,
    pub best_score: Option<i32>,
    pub current_streak: i32,
}

/// Drills list response
#[derive(Serialize)]
pub struct DrillsListResponse {
    pub drills: Vec<DrillResponse>,
    pub total: i64,
}

/// Drill result response
#[derive(Serialize)]
pub struct DrillResultResponse {
    pub drill_id: Uuid,
    pub score: i32,
    pub xp_awarded: i32,
    pub is_new_best: bool,
    pub streak_continued: bool,
    pub new_streak: i32,
}

/// Review items response
#[derive(Serialize)]
pub struct ReviewItemsResponse {
    pub lessons_due: Vec<LessonResponse>,
    pub drills_due: Vec<DrillResponse>,
    pub total_due: i64,
}

/// Learning progress summary
#[derive(Serialize)]
pub struct LearnProgressSummary {
    pub topics_started: i64,
    pub lessons_completed: i64,
    pub total_lessons: i64,
    pub drills_practiced: i64,
    pub total_xp_earned: i64,
    pub current_streak_days: i32,
}
