//! User inbox routes
//!
//! Routes for user inbox (quick capture notes).

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::db::inbox_models::*;
use crate::db::inbox_repos::InboxRepo;
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create inbox routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_inbox).post(create_inbox_item))
        .route("/{id}", get(get_inbox_item).put(update_inbox_item).delete(delete_inbox_item))
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
    data: InboxListResponse,
}

#[derive(serde::Serialize)]
struct ItemWrapper {
    data: InboxResponse,
}

#[derive(serde::Serialize)]
struct DeleteWrapper {
    data: DeleteInboxResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /user/inbox
/// List inbox items
async fn list_inbox(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ListWrapper>, AppError> {
    let response = InboxRepo::list(&state.db, user.id, query.page, query.page_size).await?;
    Ok(Json(ListWrapper { data: response }))
}

/// POST /user/inbox
/// Create inbox item
async fn create_inbox_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateInboxRequest>,
) -> Result<Json<ItemWrapper>, AppError> {
    if req.title.is_empty() {
        return Err(AppError::Validation("Title cannot be empty".into()));
    }

    let item = InboxRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(ItemWrapper {
        data: InboxResponse::from(item),
    }))
}

/// GET /user/inbox/:id
/// Get inbox item
async fn get_inbox_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<ItemWrapper>, AppError> {
    let item = InboxRepo::get(&state.db, user.id, id).await?;
    Ok(Json(ItemWrapper {
        data: InboxResponse::from(item),
    }))
}

/// PUT /user/inbox/:id
/// Update inbox item
async fn update_inbox_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateInboxRequest>,
) -> Result<Json<ItemWrapper>, AppError> {
    let item = InboxRepo::update(&state.db, user.id, id, &req).await?;
    Ok(Json(ItemWrapper {
        data: InboxResponse::from(item),
    }))
}

/// DELETE /user/inbox/:id
/// Delete inbox item
async fn delete_inbox_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteWrapper>, AppError> {
    InboxRepo::delete(&state.db, user.id, id).await?;
    Ok(Json(DeleteWrapper {
        data: DeleteInboxResponse {
            success: true,
            id,
        },
    }))
}
