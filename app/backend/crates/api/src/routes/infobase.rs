//! Infobase routes
//!
//! Routes for knowledge base entries.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::InfobaseRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create infobase routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_entries).post(create_entry))
        .route(
            "/{id}",
            get(get_entry).put(update_entry).delete(delete_entry),
        )
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
struct ListQuery {
    category: Option<String>,
    search: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct EntryWrapper {
    data: InfobaseEntryResponse,
}

#[derive(Serialize)]
struct EntriesListWrapper {
    data: InfobaseListResponse,
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

/// GET /infobase
/// List entries with optional filtering
async fn list_entries(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuery>,
) -> Result<Json<EntriesListWrapper>, AppError> {
    let result = InfobaseRepo::list(
        &state.db,
        user.id,
        query.category.as_deref(),
        query.search.as_deref(),
    )
    .await?;

    Ok(Json(EntriesListWrapper { data: result }))
}

/// GET /infobase/:id
/// Get a single entry
async fn get_entry(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<EntryWrapper>, AppError> {
    let entry = InfobaseRepo::get(&state.db, id, user.id).await?;
    Ok(Json(EntryWrapper { data: entry }))
}

/// POST /infobase
/// Create entry
async fn create_entry(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateInfobaseEntryRequest>,
) -> Result<Json<EntryWrapper>, AppError> {
    if req.title.trim().is_empty() {
        return Err(AppError::Validation("Title is required".into()));
    }
    if req.content.trim().is_empty() {
        return Err(AppError::Validation("Content is required".into()));
    }

    let entry = InfobaseRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(EntryWrapper { data: entry }))
}

/// PUT /infobase/:id
/// Update entry
async fn update_entry(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateInfobaseEntryRequest>,
) -> Result<Json<EntryWrapper>, AppError> {
    let entry = InfobaseRepo::update(&state.db, id, user.id, &req).await?;
    Ok(Json(EntryWrapper { data: entry }))
}

/// DELETE /infobase/:id
/// Delete entry
async fn delete_entry(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteSuccessWrapper>, AppError> {
    InfobaseRepo::delete(&state.db, id, user.id).await?;
    Ok(Json(DeleteSuccessWrapper {
        data: DeleteSuccess { success: true },
    }))
}
