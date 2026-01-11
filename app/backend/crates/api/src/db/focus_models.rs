//! Focus session models
//!
//! Models for focus timer sessions (Pomodoro-style).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Focus session mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FocusMode {
    Focus,
    Break,
    LongBreak,
}

impl FocusMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            FocusMode::Focus => "focus",
            FocusMode::Break => "break",
            FocusMode::LongBreak => "long_break",
        }
    }
}

impl std::str::FromStr for FocusMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "focus" => Ok(FocusMode::Focus),
            "break" => Ok(FocusMode::Break),
            "long_break" => Ok(FocusMode::LongBreak),
            _ => Err(format!("Unknown focus mode: {}", s)),
        }
    }
}

/// Focus session status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FocusStatus {
    Active,
    Paused,
    Completed,
    Abandoned,
    Expired,
}

impl FocusStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            FocusStatus::Active => "active",
            FocusStatus::Paused => "paused",
            FocusStatus::Completed => "completed",
            FocusStatus::Abandoned => "abandoned",
            FocusStatus::Expired => "expired",
        }
    }
}

impl std::str::FromStr for FocusStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "active" => Ok(FocusStatus::Active),
            "paused" => Ok(FocusStatus::Paused),
            "completed" => Ok(FocusStatus::Completed),
            "abandoned" => Ok(FocusStatus::Abandoned),
            "expired" => Ok(FocusStatus::Expired),
            _ => Err(format!("Unknown focus status: {}", s)),
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Focus session database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub mode: String,
    pub duration_seconds: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub abandoned_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub paused_at: Option<DateTime<Utc>>,
    pub paused_remaining_seconds: Option<i32>,
    pub status: String,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub task_id: Option<Uuid>,
    pub task_title: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Focus pause state
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusPauseState {
    pub id: Uuid,
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub mode: Option<String>,
    pub is_paused: bool,
    pub time_remaining_seconds: Option<i32>,
    pub paused_at: Option<DateTime<Utc>>,
    pub resumed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/// Create focus session request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateFocusRequest {
    #[serde(default = "default_focus_mode")]
    pub mode: String,
    #[serde(default = "default_duration")]
    pub duration_seconds: i32,
    pub task_id: Option<Uuid>,
    pub task_title: Option<String>,
}

fn default_focus_mode() -> String {
    "focus".to_string()
}

fn default_duration() -> i32 {
    1500 // 25 minutes
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/// Focus session response
#[derive(Debug, Clone, Serialize)]
pub struct FocusSessionResponse {
    pub id: Uuid,
    pub mode: String,
    pub duration_seconds: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub abandoned_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub status: String,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub task_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_remaining_seconds: Option<i32>,
}

impl From<FocusSession> for FocusSessionResponse {
    fn from(s: FocusSession) -> Self {
        let time_remaining = if s.status == "active" || s.status == "paused" {
            s.expires_at.map(|exp| {
                let remaining = (exp - Utc::now()).num_seconds();
                remaining.max(0) as i32
            })
        } else {
            None
        };

        Self {
            id: s.id,
            mode: s.mode,
            duration_seconds: s.duration_seconds,
            started_at: s.started_at,
            completed_at: s.completed_at,
            abandoned_at: s.abandoned_at,
            expires_at: s.expires_at,
            status: s.status,
            xp_awarded: s.xp_awarded,
            coins_awarded: s.coins_awarded,
            task_title: s.task_title,
            time_remaining_seconds: time_remaining,
        }
    }
}

/// Active session response
#[derive(Debug, Clone, Serialize)]
pub struct ActiveFocusResponse {
    pub session: Option<FocusSessionResponse>,
    pub pause_state: Option<PauseStateResponse>,
}

/// Pause state response
#[derive(Debug, Clone, Serialize)]
pub struct PauseStateResponse {
    pub mode: Option<String>,
    pub time_remaining_seconds: Option<i32>,
    pub paused_at: Option<DateTime<Utc>>,
}

impl From<FocusPauseState> for PauseStateResponse {
    fn from(p: FocusPauseState) -> Self {
        Self {
            mode: p.mode,
            time_remaining_seconds: p.time_remaining_seconds,
            paused_at: p.paused_at,
        }
    }
}

/// Complete session result
#[derive(Debug, Clone, Serialize)]
pub struct CompleteSessionResult {
    pub session: FocusSessionResponse,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub leveled_up: bool,
    pub new_level: Option<i32>,
}

/// Focus stats response
#[derive(Debug, Clone, Serialize)]
pub struct FocusStatsResponse {
    pub completed_sessions: i64,
    pub abandoned_sessions: i64,
    pub total_focus_seconds: i64,
    pub total_xp_earned: i64,
    pub total_coins_earned: i64,
}

/// Paginated focus sessions response
#[derive(Debug, Clone, Serialize)]
pub struct FocusSessionsListResponse {
    pub sessions: Vec<FocusSessionResponse>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

// ============================================================================
// FOCUS LIBRARIES
// ============================================================================

/// Focus library database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusLibrary {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub library_type: String,
    pub tracks_count: i32,
    pub is_favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Focus library track database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusLibraryTrack {
    pub id: Uuid,
    pub library_id: Uuid,
    pub track_id: String,
    pub track_title: String,
    pub track_url: Option<String>,
    pub duration_seconds: Option<i32>,
    pub added_at: DateTime<Utc>,
}

/// Create focus library request
#[derive(Debug, Deserialize)]
pub struct CreateFocusLibraryRequest {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub library_type: Option<String>,
}

/// Focus library response
#[derive(Debug, Serialize)]
pub struct FocusLibraryResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub library_type: String,
    pub tracks_count: i32,
    pub is_favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<FocusLibrary> for FocusLibraryResponse {
    fn from(lib: FocusLibrary) -> Self {
        FocusLibraryResponse {
            id: lib.id,
            name: lib.name,
            description: lib.description,
            library_type: lib.library_type,
            tracks_count: lib.tracks_count,
            is_favorite: lib.is_favorite,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
        }
    }
}

/// Focus libraries list response
#[derive(Debug, Serialize)]
pub struct FocusLibrariesListResponse {
    pub libraries: Vec<FocusLibraryResponse>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}
