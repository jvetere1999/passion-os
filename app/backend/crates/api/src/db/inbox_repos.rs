//! Inbox repository
//!
//! Database operations for inbox items (notifications, action items).

use sqlx::{Pool, Postgres};
use uuid::Uuid;

use crate::db::inbox_models::*;
use crate::error::AppError;

pub struct InboxRepo;

impl InboxRepo {
    /// List inbox items for user
    pub async fn list(
        db: &Pool<Postgres>,
        user_id: Uuid,
        page: i64,
        page_size: i64,
        include_archived: bool,
    ) -> Result<InboxListResponse, AppError> {
        let offset = (page - 1) * page_size;

        let items = if include_archived {
            sqlx::query_as::<_, InboxItem>(
                "SELECT * FROM inbox_items WHERE user_id = $1 ORDER BY priority DESC, created_at DESC LIMIT $2 OFFSET $3",
            )
            .bind(user_id)
            .bind(page_size)
            .bind(offset)
            .fetch_all(db)
            .await?
        } else {
            sqlx::query_as::<_, InboxItem>(
                "SELECT * FROM inbox_items WHERE user_id = $1 AND is_archived = false ORDER BY priority DESC, created_at DESC LIMIT $2 OFFSET $3",
            )
            .bind(user_id)
            .bind(page_size)
            .bind(offset)
            .fetch_all(db)
            .await?
        };

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(db)
        .await?;

        let unread: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_read = false AND is_archived = false",
        )
        .bind(user_id)
        .fetch_one(db)
        .await?;

        Ok(InboxListResponse {
            items: items.into_iter().map(InboxResponse::from).collect(),
            total: total.0,
            unread_count: unread.0,
            page,
            page_size,
        })
    }

    /// Get single inbox item
    pub async fn get(
        db: &Pool<Postgres>,
        user_id: Uuid,
        item_id: Uuid,
    ) -> Result<InboxItem, AppError> {
        let item = sqlx::query_as::<_, InboxItem>(
            "SELECT * FROM inbox_items WHERE id = $1 AND user_id = $2",
        )
        .bind(item_id)
        .bind(user_id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound("Inbox item not found".into()))?;

        Ok(item)
    }

    /// Create inbox item
    pub async fn create(
        db: &Pool<Postgres>,
        user_id: Uuid,
        req: &CreateInboxRequest,
    ) -> Result<InboxItem, AppError> {
        let item = sqlx::query_as::<_, InboxItem>(
            "INSERT INTO inbox_items (user_id, item_type, title, body, action_url, action_data, priority, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *",
        )
        .bind(user_id)
        .bind(&req.item_type)
        .bind(&req.title)
        .bind(&req.body)
        .bind(&req.action_url)
        .bind(&req.action_data)
        .bind(req.priority.unwrap_or(0))
        .bind(&req.expires_at)
        .fetch_one(db)
        .await?;

        Ok(item)
    }

    /// Update inbox item (mark read/archived)
    pub async fn update(
        db: &Pool<Postgres>,
        user_id: Uuid,
        item_id: Uuid,
        req: &UpdateInboxRequest,
    ) -> Result<InboxItem, AppError> {
        // Check item exists
        let _ = Self::get(db, user_id, item_id).await?;

        let item = sqlx::query_as::<_, InboxItem>(
            "UPDATE inbox_items 
             SET is_processed = COALESCE($1, is_processed),
                 is_archived = COALESCE($2, is_archived)
             WHERE id = $3 AND user_id = $4
             RETURNING *",
        )
        .bind(&req.is_processed)
        .bind(&req.is_archived)
        .bind(item_id)
        .bind(user_id)
        .fetch_one(db)
        .await?;

        Ok(item)
    }

    /// Mark all items as read
    pub async fn mark_all_read(
        db: &Pool<Postgres>,
        user_id: Uuid,
    ) -> Result<i64, AppError> {
        let result = sqlx::query(
            "UPDATE inbox_items SET is_read = true WHERE user_id = $1 AND is_read = false",
        )
        .bind(user_id)
        .execute(db)
        .await?;

        Ok(result.rows_affected() as i64)
    }

    /// Delete inbox item
    pub async fn delete(
        db: &Pool<Postgres>,
        user_id: Uuid,
        item_id: Uuid,
    ) -> Result<(), AppError> {
        let result = sqlx::query(
            "DELETE FROM inbox_items WHERE id = $1 AND user_id = $2",
        )
        .bind(item_id)
        .bind(user_id)
        .execute(db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Inbox item not found".into()));
        }

        Ok(())
    }

    /// Get unread count
    pub async fn unread_count(
        db: &Pool<Postgres>,
        user_id: Uuid,
    ) -> Result<i64, AppError> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_read = false AND is_archived = false",
        )
        .bind(user_id)
        .fetch_one(db)
        .await?;

        Ok(count.0)
    }
}
