//! Goals routes
//!
//! Routes for goal management.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::habits_goals_models::*;
use crate::db::habits_goals_repos::GoalsRepo;
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create goals routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_goals).post(create_goal))
        .route("/{id}", get(get_goal))
        .route("/{id}/milestones", post(add_milestone))
        .route("/milestones/{id}/complete", post(complete_milestone))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListGoalsQuery {
    pub status: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct GoalResponseWrapper {
    goal: GoalResponse,
}

#[derive(Serialize)]
struct GoalsListWrapper {
    goals: Vec<GoalResponse>,
}

#[derive(Serialize)]
struct MilestoneWrapper {
    milestone: GoalMilestone,
}

#[derive(Serialize)]
struct CompleteMilestoneWrapper {
    result: CompleteMilestoneResult,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /goals
/// List goals for user
async fn list_goals(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListGoalsQuery>,
) -> Result<Json<GoalsListWrapper>, AppError> {
    let result = GoalsRepo::list(&state.db, user.id, query.status.as_deref()).await?;

    Ok(Json(GoalsListWrapper { goals: result.goals }))
}

/// POST /goals
/// Create a new goal
async fn create_goal(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateGoalRequest>,
) -> Result<Json<GoalResponseWrapper>, AppError> {
    let goal = GoalsRepo::create(&state.db, user.id, &req).await?;

    Ok(Json(GoalResponseWrapper {
        goal: GoalResponse {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            target_date: goal.target_date,
            started_at: goal.started_at,
            completed_at: goal.completed_at,
            status: goal.status,
            progress: goal.progress,
            priority: goal.priority,
            milestones: vec![],
            total_milestones: 0,
            completed_milestones: 0,
        },
    }))
}

/// GET /goals/:id
/// Get a goal with milestones
async fn get_goal(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<GoalResponseWrapper>, AppError> {
    let goal = GoalsRepo::get_by_id(&state.db, id, user.id).await?;
    let goal = goal.ok_or_else(|| AppError::NotFound("Goal not found".to_string()))?;

    Ok(Json(GoalResponseWrapper { goal }))
}

/// POST /goals/:id/milestones
/// Add milestone to goal
async fn add_milestone(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateMilestoneRequest>,
) -> Result<Json<MilestoneWrapper>, AppError> {
    let milestone = GoalsRepo::add_milestone(&state.db, id, user.id, &req).await?;

    Ok(Json(MilestoneWrapper { milestone }))
}

/// POST /goals/milestones/:id/complete
/// Complete a milestone
async fn complete_milestone(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<CompleteMilestoneWrapper>, AppError> {
    let result = GoalsRepo::complete_milestone(&state.db, id, user.id).await?;

    Ok(Json(CompleteMilestoneWrapper { result }))
}
