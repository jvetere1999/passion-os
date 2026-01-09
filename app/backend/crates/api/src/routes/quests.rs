//! Quests routes
//!
//! Routes for quest system.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::models::User;
use crate::db::quests_models::*;
use crate::db::quests_repos::QuestsRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create quests routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_quests).post(create_quest))
        .route("/{id}", get(get_quest))
        .route("/{id}/accept", post(accept_quest))
        .route("/{id}/complete", post(complete_quest))
        .route("/{id}/abandon", post(abandon_quest))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListQuestsQuery {
    pub status: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct QuestResponseWrapper {
    data: QuestResponse,
}

#[derive(Serialize)]
struct QuestsListWrapper {
    data: QuestsListResponse,
}

#[derive(Serialize)]
struct CompleteQuestWrapper {
    data: CompleteQuestResult,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /quests
/// List quests for user
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;

    Ok(Json(QuestsListWrapper { data: result }))
}

/// POST /quests
/// Create a new quest
async fn create_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateQuestRequest>,
) -> Result<Json<QuestResponseWrapper>, AppError> {
    let quest = QuestsRepo::create(&state.db, user.id, &req).await?;

    Ok(Json(QuestResponseWrapper { data: quest.into() }))
}

/// GET /quests/:id
/// Get a quest
async fn get_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<QuestResponseWrapper>, AppError> {
    let quest = QuestsRepo::get_by_id(&state.db, id, user.id).await?;
    let quest = quest.ok_or_else(|| AppError::NotFound("Quest not found".to_string()))?;

    Ok(Json(QuestResponseWrapper { data: quest.into() }))
}

/// POST /quests/:id/accept
/// Accept a quest
async fn accept_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<QuestResponseWrapper>, AppError> {
    let quest = QuestsRepo::accept_quest(&state.db, id, user.id).await?;

    Ok(Json(QuestResponseWrapper { data: quest.into() }))
}

/// POST /quests/:id/complete
/// Complete a quest
async fn complete_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<CompleteQuestWrapper>, AppError> {
    let result = QuestsRepo::complete_quest(&state.db, id, user.id).await?;

    Ok(Json(CompleteQuestWrapper { data: result }))
}

/// POST /quests/:id/abandon
/// Abandon a quest
async fn abandon_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<QuestResponseWrapper>, AppError> {
    let quest = QuestsRepo::abandon_quest(&state.db, id, user.id).await?;

    Ok(Json(QuestResponseWrapper { data: quest.into() }))
}
