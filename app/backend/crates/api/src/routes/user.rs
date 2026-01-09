//! User routes
//!
//! Routes for user settings, account management, and data export.

use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    routing::{delete, get, put},
    Json, Router,
};
use serde::Serialize;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::{UserAccountRepo, UserSettingsRepo};
use crate::error::AppError;
use crate::state::AppState;

/// Create user routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/settings", get(get_settings).put(update_settings))
        .route("/delete", delete(delete_account))
        .route("/export", get(export_data))
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct SettingsWrapper {
    data: UserSettingsResponse,
}

#[derive(Serialize)]
struct DeleteWrapper {
    data: DeleteAccountResponse,
}

#[derive(Serialize)]
struct ExportWrapper {
    data: ExportDataResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /user/settings
/// Get user settings
async fn get_settings(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<SettingsWrapper>, AppError> {
    let settings = UserSettingsRepo::get(&state.db, user.id).await?;
    Ok(Json(SettingsWrapper { data: settings }))
}

/// PUT /user/settings
/// Update user settings
async fn update_settings(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<UpdateUserSettingsRequest>,
) -> Result<Json<SettingsWrapper>, AppError> {
    // Validate theme if provided
    if let Some(ref theme) = req.theme {
        if !["light", "dark", "system"].contains(&theme.as_str()) {
            return Err(AppError::Validation(
                "Invalid theme. Must be 'light', 'dark', or 'system'".into(),
            ));
        }
    }

    let settings = UserSettingsRepo::update(&state.db, user.id, &req).await?;
    Ok(Json(SettingsWrapper { data: settings }))
}

/// DELETE /user/delete
/// Delete user account and all data
async fn delete_account(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<DeleteWrapper>, AppError> {
    let result = UserAccountRepo::delete_account(&state.db, user.id).await?;
    Ok(Json(DeleteWrapper { data: result }))
}

/// GET /user/export
/// Export all user data
async fn export_data(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ExportWrapper>, AppError> {
    let result = UserAccountRepo::export_data(&state.db, user.id, Some(user.email)).await?;
    Ok(Json(ExportWrapper { data: result }))
}
