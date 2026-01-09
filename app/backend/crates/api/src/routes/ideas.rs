//! Ideas routes
//!
//! Routes for idea capture and management.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::IdeasRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create ideas routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_ideas).post(create_idea))
        .route("/{id}", get(get_idea).put(update_idea).delete(delete_idea))
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct IdeaWrapper {
    data: IdeaResponse,
}

#[derive(Serialize)]
struct IdeasListWrapper {
    data: IdeasListResponse,
}

#[derive(Serialize)]
struct DeleteSuccessWrapper {
    data: DeleteSuccess,
}

#[derive(Serialize)]
struct DeleteSuccess {
    success: bool,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /ideas
/// List all ideas
async fn list_ideas(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<IdeasListWrapper>, AppError> {
    let result = IdeasRepo::list(&state.db, user.id).await?;
    Ok(Json(IdeasListWrapper { data: result }))
}

/// GET /ideas/:id
/// Get a single idea
async fn get_idea(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<IdeaWrapper>, AppError> {
    let idea = IdeasRepo::get(&state.db, id, user.id).await?;
    Ok(Json(IdeaWrapper { data: idea }))
}

/// POST /ideas
/// Create an idea
async fn create_idea(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateIdeaRequest>,
) -> Result<Json<IdeaWrapper>, AppError> {
    if req.title.trim().is_empty() {
        return Err(AppError::Validation("Title is required".into()));
    }

    let idea = IdeasRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(IdeaWrapper { data: idea }))
}

/// PUT /ideas/:id
/// Update an idea
async fn update_idea(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateIdeaRequest>,
) -> Result<Json<IdeaWrapper>, AppError> {
    let idea = IdeasRepo::update(&state.db, id, user.id, &req).await?;
    Ok(Json(IdeaWrapper { data: idea }))
}

/// DELETE /ideas/:id
/// Delete an idea
async fn delete_idea(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteSuccessWrapper>, AppError> {
    IdeasRepo::delete(&state.db, id, user.id).await?;
    Ok(Json(DeleteSuccessWrapper {
        data: DeleteSuccess { success: true },
    }))
}
