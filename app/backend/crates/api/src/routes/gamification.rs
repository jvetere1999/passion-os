//! Gamification routes
//!
//! Routes for XP, coins, wallet, achievements, skills, and streaks.

use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    routing::get,
    Json, Router,
};
use serde::Serialize;

use crate::db::gamification_models::{AchievementTeaser, GamificationSummary};
use crate::db::gamification_repos::GamificationRepo;
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create gamification routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/summary", get(get_summary))
        .route("/teaser", get(get_teaser))
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

#[derive(Serialize)]
struct SummaryResponse {
    data: GamificationSummary,
}

#[derive(Serialize)]
struct TeaserResponse {
    teaser: Option<AchievementTeaser>,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /gamification/summary
/// Get the user's complete gamification summary (XP, level, coins, streaks, etc.)
async fn get_summary(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<SummaryResponse>, AppError> {
    let summary = GamificationRepo::get_summary(&state.db, user.id).await?;

    Ok(Json(SummaryResponse { data: summary }))
}

/// GET /gamification/teaser
/// Get the next achievable achievement for the Today page reward teaser
async fn get_teaser(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<TeaserResponse>, AppError> {
    let teaser = GamificationRepo::get_achievement_teaser(&state.db, user.id).await?;

    Ok(Json(TeaserResponse { teaser }))
}
