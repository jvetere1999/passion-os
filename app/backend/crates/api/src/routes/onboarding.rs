//! Onboarding routes
//!
//! Routes for user onboarding flow.

use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::OnboardingRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create onboarding routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_onboarding))
        .route("/start", post(start_onboarding))
        .route("/step", post(complete_step))
        .route("/reset", post(reset_onboarding))
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct OnboardingWrapper {
    data: OnboardingResponse,
}

#[derive(Serialize)]
struct StartWrapper {
    data: StartOnboardingResponse,
}

#[derive(Serialize)]
struct CompleteStepWrapper {
    data: CompleteStepResponse,
}

#[derive(Serialize)]
struct ResetWrapper {
    success: bool,
    message: String,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /onboarding
/// Get current onboarding state
async fn get_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<OnboardingWrapper>, AppError> {
    let result = OnboardingRepo::get_full_state(&state.db, user.id).await?;
    Ok(Json(OnboardingWrapper { data: result }))
}

/// POST /onboarding/start
/// Start or resume onboarding
async fn start_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<StartWrapper>, AppError> {
    let result = OnboardingRepo::start(&state.db, user.id).await?;
    Ok(Json(StartWrapper { data: result }))
}

/// POST /onboarding/step
/// Complete the current step
async fn complete_step(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CompleteStepRequest>,
) -> Result<Json<CompleteStepWrapper>, AppError> {
    let result =
        OnboardingRepo::complete_step(&state.db, user.id, req.step_id, req.response).await?;
    Ok(Json(CompleteStepWrapper { data: result }))
}

/// POST /onboarding/reset
/// Reset onboarding (for testing/admin)
async fn reset_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ResetWrapper>, AppError> {
    OnboardingRepo::reset(&state.db, user.id).await?;
    Ok(Json(ResetWrapper {
        success: true,
        message: "Onboarding reset. Refresh the page to start onboarding.".to_string(),
    }))
}
