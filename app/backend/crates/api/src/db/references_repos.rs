//! User references library repository
//!
//! Database operations for user references.

use sqlx::{Pool, Postgres};
use uuid::Uuid;

use crate::db::references_models::*;
use crate::error::AppError;

pub struct ReferencesRepo;

impl ReferencesRepo {
    /// List references for user
    pub async fn list(
        db: &Pool<Postgres>,
        user_id: Uuid,
        page: i64,
        page_size: i64,
        category: Option<String>,
    ) -> Result<ReferencesListResponse, AppError> {
        let offset = (page - 1) * page_size;

        let (items, total) = if let Some(cat) = category {
            let items = sqlx::query_as::<_, UserReference>(
                "SELECT * FROM user_references 
                 WHERE user_id = $1 AND category = $2 AND is_archived = false
                 ORDER BY is_pinned DESC, created_at DESC
                 LIMIT $3 OFFSET $4",
            )
            .bind(user_id)
            .bind(&cat)
            .bind(page_size)
            .bind(offset)
            .fetch_all(db)
            .await?;

            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM user_references WHERE user_id = $1 AND category = $2 AND is_archived = false",
            )
            .bind(user_id)
            .bind(&cat)
            .fetch_one(db)
            .await?;

            (items, total.0)
        } else {
            let items = sqlx::query_as::<_, UserReference>(
                "SELECT * FROM user_references 
                 WHERE user_id = $1 AND is_archived = false
                 ORDER BY is_pinned DESC, created_at DESC
                 LIMIT $2 OFFSET $3",
            )
            .bind(user_id)
            .bind(page_size)
            .bind(offset)
            .fetch_all(db)
            .await?;

            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM user_references WHERE user_id = $1 AND is_archived = false",
            )
            .bind(user_id)
            .fetch_one(db)
            .await?;

            (items, total.0)
        };

        Ok(ReferencesListResponse {
            items: items.into_iter().map(ReferenceResponse::from).collect(),
            total,
            page,
            page_size,
        })
    }

    /// Get single reference
    pub async fn get(
        db: &Pool<Postgres>,
        user_id: Uuid,
        ref_id: Uuid,
    ) -> Result<UserReference, AppError> {
        let reference = sqlx::query_as::<_, UserReference>(
            "SELECT * FROM user_references WHERE id = $1 AND user_id = $2",
        )
        .bind(ref_id)
        .bind(user_id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound("Reference not found".into()))?;

        Ok(reference)
    }

    /// Create reference
    pub async fn create(
        db: &Pool<Postgres>,
        user_id: Uuid,
        req: &CreateReferenceRequest,
    ) -> Result<UserReference, AppError> {
        let reference = sqlx::query_as::<_, UserReference>(
            "INSERT INTO user_references (user_id, title, content, url, category, tags)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *",
        )
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.content)
        .bind(&req.url)
        .bind(&req.category)
        .bind(&req.tags)
        .fetch_one(db)
        .await?;

        Ok(reference)
    }

    /// Update reference
    pub async fn update(
        db: &Pool<Postgres>,
        user_id: Uuid,
        ref_id: Uuid,
        req: &UpdateReferenceRequest,
    ) -> Result<UserReference, AppError> {
        // Check reference exists
        let _ = Self::get(db, user_id, ref_id).await?;

        let reference = sqlx::query_as::<_, UserReference>(
            "UPDATE user_references 
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 url = COALESCE($3, url),
                 category = COALESCE($4, category),
                 tags = COALESCE($5, tags),
                 is_pinned = COALESCE($6, is_pinned),
                 is_archived = COALESCE($7, is_archived),
                 updated_at = NOW()
             WHERE id = $8 AND user_id = $9
             RETURNING *",
        )
        .bind(&req.title)
        .bind(&req.content)
        .bind(&req.url)
        .bind(&req.category)
        .bind(&req.tags)
        .bind(req.is_pinned)
        .bind(req.is_archived)
        .bind(ref_id)
        .bind(user_id)
        .fetch_one(db)
        .await?;

        Ok(reference)
    }

    /// Delete reference
    pub async fn delete(
        db: &Pool<Postgres>,
        user_id: Uuid,
        ref_id: Uuid,
    ) -> Result<(), AppError> {
        let result = sqlx::query(
            "DELETE FROM user_references WHERE id = $1 AND user_id = $2",
        )
        .bind(ref_id)
        .bind(user_id)
        .execute(db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Reference not found".into()));
        }

        Ok(())
    }
}
