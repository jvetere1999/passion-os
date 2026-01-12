//! Focus session routes
//!
//! Routes for focus timer sessions (Pomodoro-style).

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::focus_models::*;
use crate::db::focus_repos::{FocusLibraryRepo, FocusPauseRepo, FocusSessionRepo};
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;
use crate::storage::{BlobCategory, SignedUrlResponse};

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
        .route("/libraries", get(list_libraries).post(create_library))
        .route("/libraries/{id}", get(get_library).delete(delete_library))
        .route("/libraries/{id}/favorite", post(toggle_favorite))
        // Track upload routes
        .route("/libraries/{id}/tracks/upload-url", post(get_track_upload_url))
        .route("/libraries/{id}/tracks", post(add_track))
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
    session: FocusSessionResponse,
}

#[derive(Serialize)]
struct ActiveResponse {
    active: ActiveFocusResponse,
}

#[derive(Serialize)]
struct PauseResponse {
    pause: Option<PauseStateResponse>,
}

#[derive(Serialize)]
struct CompleteResponse {
    result: CompleteSessionResult,
}

#[derive(Serialize)]
struct ListResponse {
    sessions: Vec<FocusSessionResponse>,
}

#[derive(Serialize)]
struct StatsResponse {
    stats: FocusStatsResponse,
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
        return Ok(Json(serde_json::json!({ "stats": stats })));
    }

    let result =
        FocusSessionRepo::list_sessions(&state.db, user.id, query.page, query.page_size).await?;

    Ok(Json(serde_json::json!({ "sessions": result })))
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
        session: session.into(),
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
        active: ActiveFocusResponse {
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
        pause: pause_state.map(|p| p.into()),
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
        pause: Some(pause_state.into()),
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
        session: session.into(),
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

    Ok(Json(CompleteResponse { result }))
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
        session: session.into(),
    }))
}

// ============================================================================
// FOCUS LIBRARIES HANDLERS
// ============================================================================

#[derive(Serialize)]
struct LibraryWrapper {
    library: FocusLibraryResponse,
}

#[derive(Serialize)]
struct LibrariesWrapper {
    libraries: Vec<FocusLibraryResponse>,
}

/// GET /focus/libraries
/// List focus libraries
async fn list_libraries(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListSessionsQuery>,
) -> Result<Json<LibrariesWrapper>, AppError> {
    let response = FocusLibraryRepo::list(&state.db, user.id, query.page, query.page_size).await?;
    Ok(Json(LibrariesWrapper { libraries: response.libraries }))
}

/// POST /focus/libraries
/// Create focus library
async fn create_library(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateFocusLibraryRequest>,
) -> Result<Json<LibraryWrapper>, AppError> {
    if req.name.is_empty() {
        return Err(AppError::Validation("Library name cannot be empty".into()));
    }

    let library = FocusLibraryRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(LibraryWrapper {
        library: FocusLibraryResponse::from(library),
    }))
}

/// GET /focus/libraries/:id
/// Get focus library
async fn get_library(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<LibraryWrapper>, AppError> {
    let library = FocusLibraryRepo::get(&state.db, user.id, id).await?;
    Ok(Json(LibraryWrapper {
        library: FocusLibraryResponse::from(library),
    }))
}

/// DELETE /focus/libraries/:id
/// Delete focus library
async fn delete_library(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    FocusLibraryRepo::delete(&state.db, user.id, id).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "id": id
    })))
}

/// POST /focus/libraries/:id/favorite
/// Toggle library favorite status
async fn toggle_favorite(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<LibraryWrapper>, AppError> {
    let library = FocusLibraryRepo::toggle_favorite(&state.db, user.id, id).await?;
    Ok(Json(LibraryWrapper {
        library: FocusLibraryResponse::from(library),
    }))
}

// ============================================================================
// FOCUS LIBRARY TRACKS HANDLERS
// ============================================================================

/// Request for track upload URL
#[derive(Debug, Deserialize)]
pub struct GetTrackUploadUrlRequest {
    pub filename: String,
    #[serde(default = "default_mime_type")]
    pub mime_type: String,
}

fn default_mime_type() -> String {
    "audio/mpeg".to_string()
}

/// Response for adding track
#[derive(Debug, Serialize)]
pub struct AddTrackResponse {
    pub id: Uuid,
    pub library_id: Uuid,
    pub track_id: String,
    pub track_title: String,
    pub track_url: Option<String>,
}

/// Request for adding track after upload
#[derive(Debug, Deserialize)]
pub struct AddTrackRequest {
    pub track_title: String,
    pub track_url: Option<String>,
    pub r2_key: Option<String>,
    pub duration_seconds: Option<i32>,
}

/// POST /focus/libraries/:id/tracks/upload-url
/// Get presigned upload URL for focus track
async fn get_track_upload_url(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(library_id): Path<Uuid>,
    Json(req): Json<GetTrackUploadUrlRequest>,
) -> Result<Json<SignedUrlResponse>, AppError> {
    // Verify library ownership
    FocusLibraryRepo::get(&state.db, user.id, library_id).await?;

    // Get storage client (required for R2 uploads)
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Internal("Storage not configured".into()))?;

    // Generate presigned upload URL
    let signed_url = storage
        .generate_signed_upload_url(&user.id, &req.mime_type, &req.filename)
        .await?;

    Ok(Json(signed_url))
}

/// POST /focus/libraries/:id/tracks
/// Add track to library after upload to R2
async fn add_track(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(library_id): Path<Uuid>,
    Json(req): Json<AddTrackRequest>,
) -> Result<Json<AddTrackResponse>, AppError> {
    // Verify library ownership
    FocusLibraryRepo::get(&state.db, user.id, library_id).await?;

    if req.track_title.is_empty() {
        return Err(AppError::Validation("Track title cannot be empty".into()));
    }

    // Create track record
    let track = FocusLibraryRepo::add_track(
        &state.db,
        user.id,
        library_id,
        &req.track_title,
        req.track_url.as_deref(),
        req.r2_key.as_deref(),
        req.duration_seconds,
    )
    .await?;

    Ok(Json(AddTrackResponse {
        id: track.id,
        library_id: track.library_id,
        track_id: track.track_id,
        track_title: track.track_title,
        track_url: track.track_url,
    }))
}
