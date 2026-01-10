/// User settings API endpoints
/// GET /api/settings - get all settings for user
/// GET /api/settings/:key - get single setting
/// POST /api/settings - upsert setting
/// DELETE /api/settings/:key - delete setting

use axum::{
    extract::{Path, State, Json},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post, delete},
    Router,
};
use serde_json::{json, Value as JsonValue};
use uuid::Uuid;

use crate::state::AppState;
use super::db::user_settings_models::{UpdateSettingRequest, UserSettingsResponse};
use super::db::user_settings_repos::UserSettingsRepo;

/// Mount user settings routes
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_settings).post(upsert_setting))
        .route("/{key}", get(get_setting).delete(delete_setting))
}

/// GET /api/settings - Get all settings for authenticated user
async fn get_all_settings(
    State(state): State<AppState>,
    // Auth middleware will inject user_id (assumes auth layer in place)
    // For now, using a placeholder - production code gets user_id from session
) -> Result<Json<UserSettingsResponse>, SettingsError> {
    // TODO: Extract user_id from session/auth middleware
    // This is pseudocode showing the pattern:
    // let user_id = session.user_id;
    
    // For demo purposes, returning structured response
    // Production: extract user_id from auth context
    
    Err(SettingsError::NotImplemented(
        "Auth middleware required to extract user_id".to_string(),
    ))
}

/// GET /api/settings/:key - Get a single setting
async fn get_setting(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> Result<Json<serde_json::Value>, SettingsError> {
    // TODO: Extract user_id from session/auth middleware
    Err(SettingsError::NotImplemented(
        "Auth middleware required to extract user_id".to_string(),
    ))
}

/// POST /api/settings - Upsert a setting
async fn upsert_setting(
    State(state): State<AppState>,
    Json(payload): Json<UpdateSettingRequest>,
) -> Result<Json<serde_json::Value>, SettingsError> {
    // Validate key
    if payload.key.is_empty() || payload.key.len() > 255 {
        return Err(SettingsError::InvalidKey("Key must be 1-255 characters".to_string()));
    }

    // TODO: Extract user_id from session/auth middleware
    Err(SettingsError::NotImplemented(
        "Auth middleware required to extract user_id".to_string(),
    ))
}

/// DELETE /api/settings/:key - Delete a setting
async fn delete_setting(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> Result<StatusCode, SettingsError> {
    // TODO: Extract user_id from session/auth middleware
    Err(SettingsError::NotImplemented(
        "Auth middleware required to extract user_id".to_string(),
    ))
}

/// Error types for settings API
#[derive(Debug)]
pub enum SettingsError {
    InvalidKey(String),
    NotFound(String),
    DatabaseError(String),
    NotImplemented(String),
}

impl IntoResponse for SettingsError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            SettingsError::InvalidKey(msg) => (StatusCode::BAD_REQUEST, msg),
            SettingsError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            SettingsError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            SettingsError::NotImplemented(msg) => (StatusCode::NOT_IMPLEMENTED, msg),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}
