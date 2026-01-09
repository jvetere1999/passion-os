//! Feedback routes
//!
//! Routes for user feedback submission.

use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::FeedbackRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create feedback routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/", get(list_feedback).post(create_feedback))
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct FeedbackWrapper {
    data: FeedbackResponse,
}

#[derive(Serialize)]
struct FeedbackListWrapper {
    data: FeedbackListResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /feedback
/// List user's feedback submissions
async fn list_feedback(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<FeedbackListWrapper>, AppError> {
    let result = FeedbackRepo::list(&state.db, user.id).await?;
    Ok(Json(FeedbackListWrapper { data: result }))
}

/// POST /feedback
/// Submit feedback
async fn create_feedback(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateFeedbackRequest>,
) -> Result<Json<FeedbackWrapper>, AppError> {
    // Validate required fields
    if req.title.trim().is_empty() {
        return Err(AppError::Validation("Title is required".into()));
    }
    if req.description.trim().is_empty() {
        return Err(AppError::Validation("Description is required".into()));
    }

    let feedback = FeedbackRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(FeedbackWrapper { data: feedback }))
}
