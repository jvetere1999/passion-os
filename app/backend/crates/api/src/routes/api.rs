//! API routes (requires authentication)
//!
//! All business logic routes. Requires authenticated session.

use std::sync::Arc;

use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;

use crate::state::AppState;

/// Create API routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Stub endpoints that will be filled in during feature migration
        .route("/", get(api_info))
        // Focus module (Wave 2 - real implementation)
        .nest("/focus", super::focus::router())
        // Quests module (Wave 2 - real implementation)
        .nest("/quests", super::quests::router())
        // Habits module (Wave 2 - real implementation)
        .nest("/habits", super::habits::router())
        // Goals module (Wave 2 - real implementation)
        .nest("/goals", super::goals::router())
        // Calendar module (Wave 4 - real implementation)
        .nest("/calendar", super::calendar::router())
        // Daily plan module (Wave 4 - real implementation)
        .nest("/daily-plan", super::daily_plan::router())
        // Exercise module (Wave 3 - real implementation)
        .nest("/exercise", super::exercise::router())
        // Market module (Wave 3 - real implementation)
        .nest("/market", super::market::router())
        // Reference tracks module
        .nest("/reference", reference_routes())
        // Learn module (Wave 3 - real implementation)
        .nest("/learn", super::learn::router())
        // User module (Wave 4 - real implementation)
        .nest("/user", super::user::router())
        // Onboarding module (Wave 4 - real implementation)
        .nest("/onboarding", super::onboarding::router())
        // Infobase module (Wave 4 - real implementation)
        .nest("/infobase", super::infobase::router())
        // Ideas module (Wave 4 - real implementation)
        .nest("/ideas", super::ideas::router())
        // Feedback module (Wave 4 - real implementation)
        .nest("/feedback", super::feedback::router())
        // Analysis module
        .nest("/analysis", analysis_routes())
        // Books module (Wave 3 - real implementation)
        .nest("/books", super::books::router())
        // Programs are handled under /exercise/programs
        // Gamification module (real implementation)
        .nest("/gamification", super::gamification::router())
        // Blob storage module (real implementation)
        .nest("/blobs", super::blobs::router())
    // Apply middleware (CSRF and auth will be added at top level)
}

#[derive(Serialize)]
struct ApiInfo {
    version: String,
    modules: Vec<String>,
}

/// API info endpoint
async fn api_info() -> Json<ApiInfo> {
    Json(ApiInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        modules: vec![
            "focus".to_string(),
            "quests".to_string(),
            "habits".to_string(),
            "goals".to_string(),
            "calendar".to_string(),
            "daily-plan".to_string(),
            "exercise".to_string(),
            "market".to_string(),
            "reference".to_string(),
            "learn".to_string(),
            "user".to_string(),
            "onboarding".to_string(),
            "infobase".to_string(),
            "ideas".to_string(),
            "feedback".to_string(),
            "analysis".to_string(),
            "books".to_string(),
            "gamification".to_string(),
            "blobs".to_string(),
        ],
    })
}

// Stub route builders for modules not yet migrated
// Note: focus, quests, habits, goals, exercise, market, learn, books, gamification, blobs are using real implementations
// Wave 4 migrated: calendar, daily-plan, user, onboarding, infobase, ideas, feedback

fn reference_routes() -> Router<Arc<AppState>> {
    // Reference is already implemented in super::reference, but has custom routing
    // TODO: Wire up super::reference::router() when frontend swap is ready
    Router::new()
        .route("/tracks", get(stub_list))
        .route("/upload", post(stub_create))
}

fn analysis_routes() -> Router<Arc<AppState>> {
    Router::new().route("/", get(stub_get))
}

// Stub handlers for not-yet-migrated routes
#[allow(dead_code)]
async fn stub_list() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "data": [],
        "message": "Stub endpoint - feature migration pending"
    }))
}

async fn stub_get() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "data": null,
        "message": "Stub endpoint - feature migration pending"
    }))
}

async fn stub_create() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "message": "Stub endpoint - feature migration pending"
    }))
}
