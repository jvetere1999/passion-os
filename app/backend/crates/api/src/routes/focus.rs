//! Focus session routes
//!
//! Routes for focus timer sessions (Pomodoro-style).

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{delete, get, post},
    Json, Router,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::focus_models::*;
use crate::db::focus_repos::{FocusPauseRepo, FocusSessionRepo};
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create focus routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_sessions).post(start_session))
        .route("/active", get(get_active))
        .route(
            "/pause",
            get(get_pause_state)
                .post(pause_session)
                .delete(resume_session),
        )
        .route("/{id}/complete", post(complete_session))
        .route("/{id}/abandon", post(abandon_session))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListSessionsQuery {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
    pub stats: Option<bool>,
    pub period: Option<String>,
}

fn default_page() -> i64 {
    1
}
fn default_page_size() -> i64 {
    20
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct SessionResponse {
    data: FocusSessionResponse,
}

#[derive(Serialize)]
struct ActiveResponse {
    data: ActiveFocusResponse,
}

#[derive(Serialize)]
struct PauseResponse {
    data: Option<PauseStateResponse>,
}

#[derive(Serialize)]
struct CompleteResponse {
    data: CompleteSessionResult,
}

#[derive(Serialize)]
struct ListResponse {
    data: FocusSessionsListResponse,
}

#[derive(Serialize)]
struct StatsResponse {
    data: FocusStatsResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /focus
/// List focus sessions or get stats
async fn list_sessions(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListSessionsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    if query.stats == Some(true) {
        let since = match query.period.as_deref() {
            Some("day") => Some(Utc::now() - Duration::days(1)),
            Some("week") => Some(Utc::now() - Duration::weeks(1)),
            Some("month") => Some(Utc::now() - Duration::days(30)),
            _ => None,
        };

        let stats = FocusSessionRepo::get_stats(&state.db, user.id, since).await?;
        return Ok(Json(serde_json::json!({ "data": stats })));
    }

    let result =
        FocusSessionRepo::list_sessions(&state.db, user.id, query.page, query.page_size).await?;

    Ok(Json(serde_json::json!({ "data": result })))
}

/// POST /focus
/// Start a new focus session
async fn start_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateFocusRequest>,
) -> Result<Json<SessionResponse>, AppError> {
    let session = FocusSessionRepo::start_session(&state.db, user.id, &req).await?;

    Ok(Json(SessionResponse {
        data: session.into(),
    }))
}

/// GET /focus/active
/// Get the active focus session
async fn get_active(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ActiveResponse>, AppError> {
    let session = FocusSessionRepo::get_active_session(&state.db, user.id).await?;
    let pause_state = FocusPauseRepo::get_pause_state(&state.db, user.id).await?;

    Ok(Json(ActiveResponse {
        data: ActiveFocusResponse {
            session: session.map(|s| s.into()),
            pause_state: pause_state.map(|p| p.into()),
        },
    }))
}

/// GET /focus/pause
/// Get current pause state
async fn get_pause_state(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<PauseResponse>, AppError> {
    let pause_state = FocusPauseRepo::get_pause_state(&state.db, user.id).await?;

    Ok(Json(PauseResponse {
        data: pause_state.map(|p| p.into()),
    }))
}

/// POST /focus/pause
/// Pause the active session
async fn pause_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<PauseResponse>, AppError> {
    let pause_state = FocusPauseRepo::pause_session(&state.db, user.id).await?;

    Ok(Json(PauseResponse {
        data: Some(pause_state.into()),
    }))
}

/// DELETE /focus/pause
/// Resume the paused session
async fn resume_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<SessionResponse>, AppError> {
    let session = FocusPauseRepo::resume_session(&state.db, user.id).await?;

    Ok(Json(SessionResponse {
        data: session.into(),
    }))
}

/// POST /focus/:id/complete
/// Complete a focus session
async fn complete_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<CompleteResponse>, AppError> {
    let result = FocusSessionRepo::complete_session(&state.db, id, user.id).await?;

    Ok(Json(CompleteResponse { data: result }))
}

/// POST /focus/:id/abandon
/// Abandon a focus session
async fn abandon_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<SessionResponse>, AppError> {
    let session = FocusSessionRepo::abandon_session(&state.db, id, user.id).await?;

    Ok(Json(SessionResponse {
        data: session.into(),
    }))
}
