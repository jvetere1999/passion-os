//! Daily Plan routes
//!
//! Routes for daily planning.

use std::sync::Arc;

use axum::{
    extract::{Extension, Query, State},
    routing::{get, post},
    Json, Router,
};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::DailyPlanRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create daily plan routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/", get(get_plan).post(handle_action))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
struct GetPlanQuery {
    date: Option<String>,
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

#[derive(Debug, Deserialize)]
struct PlanAction {
    action: String,
    date: Option<String>,
    item_id: Option<String>,
    completed: Option<bool>,
    items: Option<Vec<PlanItem>>,
    notes: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct PlanWrapper {
    plan: Option<DailyPlanResponse>,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /daily-plan
/// Get the plan for today or a specific date
async fn get_plan(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<GetPlanQuery>,
) -> Result<Json<PlanWrapper>, AppError> {
    let date = if let Some(d) = query.date {
        d.parse::<NaiveDate>()
            .map_err(|_| AppError::Validation("Invalid date format. Use YYYY-MM-DD".into()))?
    } else {
        chrono::Utc::now().date_naive()
    };

    let plan = DailyPlanRepo::get_for_date(&state.db, user.id, date).await?;
    Ok(Json(PlanWrapper { plan }))
}

/// POST /daily-plan
/// Handle plan actions: generate, update, complete_item
async fn handle_action(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<PlanAction>,
) -> Result<Json<PlanWrapper>, AppError> {
    let date = if let Some(d) = &req.date {
        d.parse::<NaiveDate>()
            .map_err(|_| AppError::Validation("Invalid date format. Use YYYY-MM-DD".into()))?
    } else {
        chrono::Utc::now().date_naive()
    };

    let plan = match req.action.as_str() {
        "generate" => Some(DailyPlanRepo::generate(&state.db, user.id, date).await?),
        "update" => {
            let upsert_req = UpsertDailyPlanRequest {
                date,
                items: req.items,
                notes: req.notes,
            };
            Some(DailyPlanRepo::upsert(&state.db, user.id, &upsert_req).await?)
        }
        "complete_item" => {
            let item_id = req
                .item_id
                .as_ref()
                .ok_or_else(|| AppError::Validation("item_id required".into()))?;
            let completed = req.completed.unwrap_or(true);
            Some(DailyPlanRepo::complete_item(&state.db, user.id, date, item_id, completed).await?)
        }
        _ => {
            return Err(AppError::Validation(format!(
                "Unknown action: {}",
                req.action
            )));
        }
    };

    Ok(Json(PlanWrapper { plan }))
}
