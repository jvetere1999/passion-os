//! Books routes
//!
//! Routes for books and reading sessions.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::books_models::*;
use crate::db::books_repos::{BookRepo, ReadingSessionRepo};
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create books routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_books).post(create_book))
        .route("/stats", get(get_reading_stats))
        .route("/{id}", get(get_book).put(update_book).delete(delete_book))
        .route("/{id}/sessions", get(list_book_sessions).post(log_reading))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListBooksQuery {
    pub status: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct BookWrapper {
    book: BookResponse,
}

#[derive(Serialize)]
struct BooksListWrapper {
    books: Vec<BookResponse>,
}

#[derive(Serialize)]
struct SessionsListWrapper {
    sessions: Vec<ReadingSessionResponse>,
}

#[derive(Serialize)]
struct LogReadingWrapper {
    result: LogReadingResult,
}

#[derive(Serialize)]
struct StatsWrapper {
    stats: ReadingStatsResponse,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /books
/// List user's books
async fn list_books(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListBooksQuery>,
) -> Result<Json<BooksListWrapper>, AppError> {
    let result = BookRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    Ok(Json(BooksListWrapper { books: result.books }))
}

/// POST /books
/// Create a book
async fn create_book(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateBookRequest>,
) -> Result<Json<BookWrapper>, AppError> {
    let book = BookRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(BookWrapper { book: book.into() }))
}

/// GET /books/:id
/// Get book by ID
async fn get_book(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<BookWrapper>, AppError> {
    let book = BookRepo::get_by_id(&state.db, id, user.id).await?;
    let book = book.ok_or_else(|| AppError::NotFound("Book not found".to_string()))?;
    Ok(Json(BookWrapper { book: book.into() }))
}

/// PUT /books/:id
/// Update a book
async fn update_book(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateBookRequest>,
) -> Result<Json<BookWrapper>, AppError> {
    let book = BookRepo::update(&state.db, id, user.id, &req).await?;
    Ok(Json(BookWrapper { book: book.into() }))
}

/// DELETE /books/:id
/// Delete a book
async fn delete_book(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = BookRepo::delete(&state.db, id, user.id).await?;
    if !deleted {
        return Err(AppError::NotFound("Book not found".to_string()));
    }
    Ok(Json(serde_json::json!({ "message": "Book deleted" })))
}

/// GET /books/:id/sessions
/// List reading sessions for a book
async fn list_book_sessions(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(book_id): Path<Uuid>,
) -> Result<Json<SessionsListWrapper>, AppError> {
    let result = ReadingSessionRepo::list_for_book(&state.db, book_id, user.id).await?;
    Ok(Json(SessionsListWrapper { sessions: result.sessions }))
}

/// POST /books/:id/sessions
/// Log a reading session
async fn log_reading(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(book_id): Path<Uuid>,
    Json(req): Json<LogReadingRequest>,
) -> Result<Json<LogReadingWrapper>, AppError> {
    let result = ReadingSessionRepo::log_reading(&state.db, user.id, book_id, &req).await?;
    Ok(Json(LogReadingWrapper { result }))
}

/// GET /books/stats
/// Get reading statistics
async fn get_reading_stats(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<StatsWrapper>, AppError> {
    let stats = ReadingSessionRepo::get_stats(&state.db, user.id).await?;
    Ok(Json(StatsWrapper { stats }))
}
