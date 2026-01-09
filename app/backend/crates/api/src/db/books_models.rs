//! Books models
//!
//! Models for books and reading sessions.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Book status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BookStatus {
    WantToRead,
    Reading,
    Completed,
    Abandoned,
}

impl BookStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            BookStatus::WantToRead => "want_to_read",
            BookStatus::Reading => "reading",
            BookStatus::Completed => "completed",
            BookStatus::Abandoned => "abandoned",
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Book
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Book {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: i32,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub rating: Option<i32>,
    pub notes: Option<String>,
    pub cover_blob_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Reading session
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ReadingSession {
    pub id: Uuid,
    pub book_id: Uuid,
    pub user_id: Uuid,
    pub pages_read: i32,
    pub duration_minutes: Option<i32>,
    pub started_at: DateTime<Utc>,
    pub notes: Option<String>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

// ============================================================================
// REQUEST MODELS
// ============================================================================

/// Create book request
#[derive(Debug, Deserialize)]
pub struct CreateBookRequest {
    pub title: String,
    pub author: Option<String>,
    pub total_pages: Option<i32>,
    pub status: Option<String>,
}

/// Update book request
#[derive(Debug, Deserialize)]
pub struct UpdateBookRequest {
    pub title: Option<String>,
    pub author: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: Option<i32>,
    pub status: Option<String>,
    pub rating: Option<i32>,
    pub notes: Option<String>,
}

/// Log reading session request
#[derive(Debug, Deserialize)]
pub struct LogReadingRequest {
    pub pages_read: i32,
    pub duration_minutes: Option<i32>,
    pub notes: Option<String>,
}

// ============================================================================
// RESPONSE MODELS
// ============================================================================

/// Book response
#[derive(Serialize)]
pub struct BookResponse {
    pub id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: i32,
    pub progress_percent: Option<i32>,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub rating: Option<i32>,
    pub notes: Option<String>,
}

impl From<Book> for BookResponse {
    fn from(b: Book) -> Self {
        let progress_percent = b.total_pages.map(|total| {
            if total > 0 {
                ((b.current_page as f64 / total as f64) * 100.0).round() as i32
            } else {
                0
            }
        });

        Self {
            id: b.id,
            title: b.title,
            author: b.author,
            total_pages: b.total_pages,
            current_page: b.current_page,
            progress_percent,
            status: b.status,
            started_at: b.started_at,
            completed_at: b.completed_at,
            rating: b.rating,
            notes: b.notes,
        }
    }
}

/// Books list response
#[derive(Serialize)]
pub struct BooksListResponse {
    pub books: Vec<BookResponse>,
    pub total: i64,
}

/// Reading session response
#[derive(Serialize)]
pub struct ReadingSessionResponse {
    pub id: Uuid,
    pub book_id: Uuid,
    pub pages_read: i32,
    pub duration_minutes: Option<i32>,
    pub started_at: DateTime<Utc>,
    pub notes: Option<String>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

impl From<ReadingSession> for ReadingSessionResponse {
    fn from(s: ReadingSession) -> Self {
        Self {
            id: s.id,
            book_id: s.book_id,
            pages_read: s.pages_read,
            duration_minutes: s.duration_minutes,
            started_at: s.started_at,
            notes: s.notes,
            xp_awarded: s.xp_awarded,
            coins_awarded: s.coins_awarded,
        }
    }
}

/// Reading sessions list response
#[derive(Serialize)]
pub struct SessionsListResponse {
    pub sessions: Vec<ReadingSessionResponse>,
    pub total: i64,
}

/// Log reading result
#[derive(Serialize)]
pub struct LogReadingResult {
    pub session: ReadingSessionResponse,
    pub book: BookResponse,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub is_completed: bool,
}

/// Reading stats response
#[derive(Serialize)]
pub struct ReadingStatsResponse {
    pub books_completed: i64,
    pub books_reading: i64,
    pub total_books: i64,
    pub total_pages_read: i64,
    pub total_reading_time_minutes: i64,
}
