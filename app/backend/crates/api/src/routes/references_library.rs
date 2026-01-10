//! User references routes
//!
//! Routes for user reference library organization.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::db::models::User;
use crate::db::references_models::*;
use crate::db::references_repos::ReferencesRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create references routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_references).post(create_reference))
        .route("/{id}", get(get_reference).put(update_reference).delete(delete_reference))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
    pub category: Option<String>,
}

fn default_page() -> i64 {
    1
}

fn default_page_size() -> i64 {
    50
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(serde::Serialize)]
struct ListWrapper {
    data: ReferencesListResponse,
}

#[derive(serde::Serialize)]
struct ItemWrapper {
    data: ReferenceResponse,
}

#[derive(serde::Serialize)]
struct DeleteWrapper {
    data: DeleteReferenceResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /references
/// List references
async fn list_references(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ListWrapper>, AppError> {
    let response = ReferencesRepo::list(&state.db, user.id, query.page, query.page_size, query.category).await?;
    Ok(Json(ListWrapper { data: response }))
}

/// POST /references
/// Create reference
async fn create_reference(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateReferenceRequest>,
) -> Result<Json<ItemWrapper>, AppError> {
    if req.title.is_empty() {
        return Err(AppError::Validation("Title cannot be empty".into()));
    }

    let reference = ReferencesRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(ItemWrapper {
        data: ReferenceResponse::from(reference),
    }))
}

/// GET /references/:id
/// Get reference
async fn get_reference(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<ItemWrapper>, AppError> {
    let reference = ReferencesRepo::get(&state.db, user.id, id).await?;
    Ok(Json(ItemWrapper {
        data: ReferenceResponse::from(reference),
    }))
}

/// PUT /references/:id
/// Update reference
async fn update_reference(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateReferenceRequest>,
) -> Result<Json<ItemWrapper>, AppError> {
    let reference = ReferencesRepo::update(&state.db, user.id, id, &req).await?;
    Ok(Json(ItemWrapper {
        data: ReferenceResponse::from(reference),
    }))
}

/// DELETE /references/:id
/// Delete reference
async fn delete_reference(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteWrapper>, AppError> {
    ReferencesRepo::delete(&state.db, user.id, id).await?;
    Ok(Json(DeleteWrapper {
        data: DeleteReferenceResponse {
            success: true,
            id,
        },
    }))
}
