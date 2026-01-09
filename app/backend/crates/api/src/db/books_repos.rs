//! Books repository
//!
//! Database operations for books and reading sessions.

use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

use super::books_models::*;

// ============================================================================
// BOOK REPOSITORY
// ============================================================================

pub struct BookRepo;

impl BookRepo {
    /// List user's books
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        status: Option<&str>,
    ) -> Result<BooksListResponse, AppError> {
        let books = if let Some(s) = status {
            sqlx::query_as::<_, Book>(
                r#"
                SELECT id, user_id, title, author, total_pages, current_page,
                       status, started_at, completed_at, rating, notes,
                       cover_blob_id, created_at, updated_at
                FROM books
                WHERE user_id = $1 AND status = $2
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .bind(s)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Book>(
                r#"
                SELECT id, user_id, title, author, total_pages, current_page,
                       status, started_at, completed_at, rating, notes,
                       cover_blob_id, created_at, updated_at
                FROM books
                WHERE user_id = $1
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        let total = books.len() as i64;

        Ok(BooksListResponse {
            books: books.into_iter().map(|b| b.into()).collect(),
            total,
        })
    }

    /// Get book by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<Book>, AppError> {
        let book = sqlx::query_as::<_, Book>(
            r#"
            SELECT id, user_id, title, author, total_pages, current_page,
                   status, started_at, completed_at, rating, notes,
                   cover_blob_id, created_at, updated_at
            FROM books
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(book)
    }

    /// Create book
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateBookRequest,
    ) -> Result<Book, AppError> {
        let status = req.status.as_deref().unwrap_or("want_to_read");

        let book = sqlx::query_as::<_, Book>(
            r#"
            INSERT INTO books (user_id, title, author, total_pages, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, title, author, total_pages, current_page,
                      status, started_at, completed_at, rating, notes,
                      cover_blob_id, created_at, updated_at
            "#,
        )
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.author)
        .bind(req.total_pages)
        .bind(status)
        .fetch_one(pool)
        .await?;

        Ok(book)
    }

    /// Update book
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        req: &UpdateBookRequest,
    ) -> Result<Book, AppError> {
        // Get existing book
        let existing = Self::get_by_id(pool, id, user_id).await?;
        let existing = existing.ok_or_else(|| AppError::NotFound("Book not found".to_string()))?;

        let title = req.title.as_deref().unwrap_or(&existing.title);
        let author = req.author.as_ref().or(existing.author.as_ref());
        let total_pages = req.total_pages.or(existing.total_pages);
        let current_page = req.current_page.unwrap_or(existing.current_page);
        let status = req.status.as_deref().unwrap_or(&existing.status);
        let rating = req.rating.or(existing.rating);
        let notes = req.notes.as_ref().or(existing.notes.as_ref());

        // Check if completing
        let is_completing = status == "completed" && existing.status != "completed";
        let completed_at = if is_completing {
            Some(chrono::Utc::now())
        } else {
            existing.completed_at
        };

        // Check if starting
        let is_starting = status == "reading" && existing.started_at.is_none();
        let started_at = if is_starting {
            Some(chrono::Utc::now())
        } else {
            existing.started_at
        };

        let book = sqlx::query_as::<_, Book>(
            r#"
            UPDATE books SET
                title = $3, author = $4, total_pages = $5, current_page = $6,
                status = $7, rating = $8, notes = $9,
                started_at = $10, completed_at = $11
            WHERE id = $1 AND user_id = $2
            RETURNING id, user_id, title, author, total_pages, current_page,
                      status, started_at, completed_at, rating, notes,
                      cover_blob_id, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(title)
        .bind(author)
        .bind(total_pages)
        .bind(current_page)
        .bind(status)
        .bind(rating)
        .bind(notes)
        .bind(started_at)
        .bind(completed_at)
        .fetch_one(pool)
        .await?;

        Ok(book)
    }

    /// Delete book
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM books WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

// ============================================================================
// READING SESSION REPOSITORY
// ============================================================================

pub struct ReadingSessionRepo;

impl ReadingSessionRepo {
    /// List reading sessions for a book
    pub async fn list_for_book(
        pool: &PgPool,
        book_id: Uuid,
        user_id: Uuid,
    ) -> Result<SessionsListResponse, AppError> {
        let sessions = sqlx::query_as::<_, ReadingSession>(
            r#"
            SELECT id, book_id, user_id, pages_read, duration_minutes,
                   started_at, notes, xp_awarded, coins_awarded
            FROM reading_sessions
            WHERE book_id = $1 AND user_id = $2
            ORDER BY started_at DESC
            "#,
        )
        .bind(book_id)
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        let total = sessions.len() as i64;

        Ok(SessionsListResponse {
            sessions: sessions.into_iter().map(|s| s.into()).collect(),
            total,
        })
    }

    /// Log reading session
    pub async fn log_reading(
        pool: &PgPool,
        user_id: Uuid,
        book_id: Uuid,
        req: &LogReadingRequest,
    ) -> Result<LogReadingResult, AppError> {
        // Get and lock book
        let book = sqlx::query_as::<_, Book>(
            r#"
            SELECT id, user_id, title, author, total_pages, current_page,
                   status, started_at, completed_at, rating, notes,
                   cover_blob_id, created_at, updated_at
            FROM books
            WHERE id = $1 AND user_id = $2
            FOR UPDATE
            "#,
        )
        .bind(book_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let book = book.ok_or_else(|| AppError::NotFound("Book not found".to_string()))?;

        // Calculate new page
        let new_page = book
            .total_pages
            .map_or(book.current_page + req.pages_read, |total| {
                (book.current_page + req.pages_read).min(total)
            });

        // Check if completing
        let is_completed = book.total_pages.map_or(false, |total| new_page >= total);

        // Calculate rewards: 1 XP per 5 pages, 1 coin per 10 pages
        let xp = (req.pages_read / 5).max(1);
        let coins = (req.pages_read / 10).max(0);

        // Create session
        let session = sqlx::query_as::<_, ReadingSession>(
            r#"
            INSERT INTO reading_sessions (book_id, user_id, pages_read, duration_minutes, started_at, notes, xp_awarded, coins_awarded)
            VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
            RETURNING id, book_id, user_id, pages_read, duration_minutes,
                      started_at, notes, xp_awarded, coins_awarded
            "#,
        )
        .bind(book_id)
        .bind(user_id)
        .bind(req.pages_read)
        .bind(req.duration_minutes)
        .bind(&req.notes)
        .bind(xp)
        .bind(coins)
        .fetch_one(pool)
        .await?;

        // Update book
        let updated_book = sqlx::query_as::<_, Book>(
            r#"
            UPDATE books SET
                current_page = $3,
                status = CASE WHEN $4 THEN 'completed' ELSE CASE WHEN status = 'want_to_read' THEN 'reading' ELSE status END END,
                started_at = COALESCE(started_at, NOW()),
                completed_at = CASE WHEN $4 THEN NOW() ELSE completed_at END
            WHERE id = $1 AND user_id = $2
            RETURNING id, user_id, title, author, total_pages, current_page,
                      status, started_at, completed_at, rating, notes,
                      cover_blob_id, created_at, updated_at
            "#,
        )
        .bind(book_id)
        .bind(user_id)
        .bind(new_page)
        .bind(is_completed)
        .fetch_one(pool)
        .await?;

        Ok(LogReadingResult {
            session: session.into(),
            book: updated_book.into(),
            xp_awarded: xp,
            coins_awarded: coins,
            is_completed,
        })
    }

    /// Get reading stats for user
    pub async fn get_stats(pool: &PgPool, user_id: Uuid) -> Result<ReadingStatsResponse, AppError> {
        #[derive(sqlx::FromRow)]
        struct StatsRow {
            books_completed: Option<i64>,
            books_reading: Option<i64>,
            total_books: Option<i64>,
            total_pages_read: Option<i64>,
        }

        let stats = sqlx::query_as::<_, StatsRow>(
            r#"
            SELECT
                COUNT(*) FILTER (WHERE status = 'completed') as books_completed,
                COUNT(*) FILTER (WHERE status = 'reading') as books_reading,
                COUNT(*) as total_books,
                COALESCE(SUM(current_page), 0) as total_pages_read
            FROM books
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        #[derive(sqlx::FromRow)]
        struct TimeRow {
            total: Option<i64>,
        }

        let reading_time = sqlx::query_as::<_, TimeRow>(
            r#"
            SELECT COALESCE(SUM(duration_minutes), 0) as total
            FROM reading_sessions
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(ReadingStatsResponse {
            books_completed: stats.books_completed.unwrap_or(0),
            books_reading: stats.books_reading.unwrap_or(0),
            total_books: stats.total_books.unwrap_or(0),
            total_pages_read: stats.total_pages_read.unwrap_or(0),
            total_reading_time_minutes: reading_time.total.unwrap_or(0),
        })
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_book_response_progress() {
        let book = Book {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "Test Book".to_string(),
            author: Some("Author".to_string()),
            total_pages: Some(100),
            current_page: 50,
            status: "reading".to_string(),
            started_at: Some(chrono::Utc::now()),
            completed_at: None,
            rating: None,
            notes: None,
            cover_blob_id: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let response: BookResponse = book.into();
        assert_eq!(response.progress_percent, Some(50));
    }
}
