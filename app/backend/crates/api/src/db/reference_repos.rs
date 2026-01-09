//! Reference tracks repository
//!
//! Database operations for reference tracks, analyses, annotations, and regions.

#![allow(dead_code)]

use sqlx::PgPool;
use uuid::Uuid;

use super::reference_models::*;
use crate::error::AppError;

// =============================================================================
// Reference Tracks Repository
// =============================================================================

pub struct ReferenceTrackRepo;

impl ReferenceTrackRepo {
    /// Create a new reference track
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        input: CreateTrackInput,
    ) -> Result<ReferenceTrack, AppError> {
        let tags = serde_json::to_value(input.tags.unwrap_or_default())
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let track = sqlx::query_as::<_, ReferenceTrack>(
            r#"
            INSERT INTO reference_tracks (
                user_id, name, description, r2_key, file_size_bytes, mime_type,
                duration_seconds, artist, album, genre, bpm, key_signature, tags
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(&input.name)
        .bind(&input.description)
        .bind(&input.r2_key)
        .bind(input.file_size_bytes)
        .bind(&input.mime_type)
        .bind(input.duration_seconds)
        .bind(&input.artist)
        .bind(&input.album)
        .bind(&input.genre)
        .bind(input.bpm)
        .bind(&input.key_signature)
        .bind(&tags)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(track)
    }

    /// Find track by ID (no ownership check - use for internal lookups)
    #[allow(dead_code)]
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<ReferenceTrack>, AppError> {
        let track =
            sqlx::query_as::<_, ReferenceTrack>("SELECT * FROM reference_tracks WHERE id = $1")
                .bind(id)
                .fetch_optional(pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(track)
    }

    /// Find track by ID with ownership check (IDOR prevention)
    pub async fn find_by_id_for_user(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<ReferenceTrack>, AppError> {
        let track = sqlx::query_as::<_, ReferenceTrack>(
            "SELECT * FROM reference_tracks WHERE id = $1 AND user_id = $2",
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(track)
    }

    /// List tracks for a user with pagination
    pub async fn list_for_user(
        pool: &PgPool,
        user_id: Uuid,
        page: i32,
        page_size: i32,
    ) -> Result<(Vec<ReferenceTrack>, i64), AppError> {
        let offset = (page - 1) * page_size;

        let tracks = sqlx::query_as::<_, ReferenceTrack>(
            r#"
            SELECT * FROM reference_tracks
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        let total: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM reference_tracks WHERE user_id = $1")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

        Ok((tracks, total.0))
    }

    /// Update a track
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        input: UpdateTrackInput,
    ) -> Result<Option<ReferenceTrack>, AppError> {
        // Build dynamic update query
        let mut updates = Vec::new();
        let mut idx = 3;

        if input.name.is_some() {
            updates.push(format!("name = ${}", idx));
            idx += 1;
        }
        if input.description.is_some() {
            updates.push(format!("description = ${}", idx));
            idx += 1;
        }
        if input.duration_seconds.is_some() {
            updates.push(format!("duration_seconds = ${}", idx));
            idx += 1;
        }
        if input.artist.is_some() {
            updates.push(format!("artist = ${}", idx));
            idx += 1;
        }
        if input.album.is_some() {
            updates.push(format!("album = ${}", idx));
            idx += 1;
        }
        if input.genre.is_some() {
            updates.push(format!("genre = ${}", idx));
            idx += 1;
        }
        if input.bpm.is_some() {
            updates.push(format!("bpm = ${}", idx));
            idx += 1;
        }
        if input.key_signature.is_some() {
            updates.push(format!("key_signature = ${}", idx));
            idx += 1;
        }
        if input.tags.is_some() {
            updates.push(format!("tags = ${}", idx));
        }

        if updates.is_empty() {
            // No updates, just return current track
            return Self::find_by_id_for_user(pool, id, user_id).await;
        }

        updates.push("updated_at = NOW()".to_string());
        let update_clause = updates.join(", ");

        let query = format!(
            "UPDATE reference_tracks SET {} WHERE id = $1 AND user_id = $2 RETURNING *",
            update_clause
        );

        let mut q = sqlx::query_as::<_, ReferenceTrack>(&query)
            .bind(id)
            .bind(user_id);

        if let Some(ref name) = input.name {
            q = q.bind(name);
        }
        if let Some(ref desc) = input.description {
            q = q.bind(desc);
        }
        if let Some(dur) = input.duration_seconds {
            q = q.bind(dur);
        }
        if let Some(ref artist) = input.artist {
            q = q.bind(artist);
        }
        if let Some(ref album) = input.album {
            q = q.bind(album);
        }
        if let Some(ref genre) = input.genre {
            q = q.bind(genre);
        }
        if let Some(bpm) = input.bpm {
            q = q.bind(bpm);
        }
        if let Some(ref key_sig) = input.key_signature {
            q = q.bind(key_sig);
        }
        if let Some(ref tags) = input.tags {
            let tags_json =
                serde_json::to_value(tags).map_err(|e| AppError::Internal(e.to_string()))?;
            q = q.bind(tags_json);
        }

        let track = q
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(track)
    }

    /// Delete a track (and cascade to analyses/annotations/regions)
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM reference_tracks WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }

    /// Update track status
    #[allow(dead_code)]
    pub async fn update_status(
        pool: &PgPool,
        id: Uuid,
        status: &str,
        error_message: Option<&str>,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE reference_tracks
            SET status = $2, error_message = $3, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(error_message)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}

// =============================================================================
// Track Analyses Repository
// =============================================================================

pub struct TrackAnalysisRepo;

impl TrackAnalysisRepo {
    /// Get analysis by ID
    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<TrackAnalysis>, AppError> {
        let analysis =
            sqlx::query_as::<_, TrackAnalysis>("SELECT * FROM track_analyses WHERE id = $1")
                .bind(id)
                .fetch_optional(pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(analysis)
    }

    /// Create a new analysis
    pub async fn create(
        pool: &PgPool,
        track_id: Uuid,
        analysis_type: &str,
    ) -> Result<TrackAnalysis, AppError> {
        let analysis = sqlx::query_as::<_, TrackAnalysis>(
            r#"
            INSERT INTO track_analyses (track_id, analysis_type, status)
            VALUES ($1, $2, 'pending')
            RETURNING *
            "#,
        )
        .bind(track_id)
        .bind(analysis_type)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(analysis)
    }

    /// Get latest analysis for a track
    pub async fn get_latest(
        pool: &PgPool,
        track_id: Uuid,
        analysis_type: Option<&str>,
    ) -> Result<Option<TrackAnalysis>, AppError> {
        let analysis = if let Some(atype) = analysis_type {
            sqlx::query_as::<_, TrackAnalysis>(
                r#"
                SELECT * FROM track_analyses
                WHERE track_id = $1 AND analysis_type = $2
                ORDER BY created_at DESC
                LIMIT 1
                "#,
            )
            .bind(track_id)
            .bind(atype)
            .fetch_optional(pool)
            .await
        } else {
            sqlx::query_as::<_, TrackAnalysis>(
                r#"
                SELECT * FROM track_analyses
                WHERE track_id = $1
                ORDER BY created_at DESC
                LIMIT 1
                "#,
            )
            .bind(track_id)
            .fetch_optional(pool)
            .await
        }
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(analysis)
    }

    /// Update analysis status and results
    pub async fn update_status(
        pool: &PgPool,
        id: Uuid,
        status: &str,
        summary: Option<serde_json::Value>,
        manifest: Option<serde_json::Value>,
        error_message: Option<&str>,
    ) -> Result<(), AppError> {
        let completed_at = if status == "completed" {
            Some(chrono::Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE track_analyses
            SET status = $2,
                summary = COALESCE($3, summary),
                manifest = COALESCE($4, manifest),
                error_message = $5,
                completed_at = COALESCE($6, completed_at),
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(summary)
        .bind(manifest)
        .bind(error_message)
        .bind(completed_at)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Mark analysis as started
    pub async fn mark_started(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE track_analyses
            SET status = 'running', started_at = NOW(), updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}

// =============================================================================
// Track Annotations Repository
// =============================================================================

pub struct TrackAnnotationRepo;

impl TrackAnnotationRepo {
    /// Create a new annotation
    pub async fn create(
        pool: &PgPool,
        track_id: Uuid,
        user_id: Uuid,
        input: CreateAnnotationInput,
    ) -> Result<TrackAnnotation, AppError> {
        let annotation = sqlx::query_as::<_, TrackAnnotation>(
            r#"
            INSERT INTO track_annotations (
                track_id, user_id, start_time_ms, end_time_ms,
                title, content, category, color, is_private
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(track_id)
        .bind(user_id)
        .bind(input.start_time_ms)
        .bind(input.end_time_ms)
        .bind(&input.title)
        .bind(&input.content)
        .bind(input.category.unwrap_or_else(|| "general".to_string()))
        .bind(input.color.unwrap_or_else(|| "#3b82f6".to_string()))
        .bind(input.is_private.unwrap_or(true))
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(annotation)
    }

    /// List annotations for a track (respects privacy)
    pub async fn list_for_track(
        pool: &PgPool,
        track_id: Uuid,
        user_id: Uuid,
    ) -> Result<Vec<TrackAnnotation>, AppError> {
        let annotations = sqlx::query_as::<_, TrackAnnotation>(
            r#"
            SELECT * FROM track_annotations
            WHERE track_id = $1 AND (user_id = $2 OR is_private = false)
            ORDER BY start_time_ms ASC
            "#,
        )
        .bind(track_id)
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(annotations)
    }

    /// Get annotation by ID with ownership check
    pub async fn find_by_id_for_user(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<TrackAnnotation>, AppError> {
        let annotation = sqlx::query_as::<_, TrackAnnotation>(
            "SELECT * FROM track_annotations WHERE id = $1 AND user_id = $2",
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(annotation)
    }

    /// Update an annotation
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        input: UpdateAnnotationInput,
    ) -> Result<Option<TrackAnnotation>, AppError> {
        let annotation = sqlx::query_as::<_, TrackAnnotation>(
            r#"
            UPDATE track_annotations SET
                start_time_ms = COALESCE($3, start_time_ms),
                end_time_ms = COALESCE($4, end_time_ms),
                title = COALESCE($5, title),
                content = COALESCE($6, content),
                category = COALESCE($7, category),
                color = COALESCE($8, color),
                is_private = COALESCE($9, is_private),
                updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(input.start_time_ms)
        .bind(input.end_time_ms)
        .bind(&input.title)
        .bind(&input.content)
        .bind(&input.category)
        .bind(&input.color)
        .bind(input.is_private)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(annotation)
    }

    /// Delete an annotation
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM track_annotations WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}

// =============================================================================
// Track Regions Repository
// =============================================================================

pub struct TrackRegionRepo;

impl TrackRegionRepo {
    /// Create a new region
    pub async fn create(
        pool: &PgPool,
        track_id: Uuid,
        user_id: Uuid,
        input: CreateRegionInput,
    ) -> Result<TrackRegion, AppError> {
        let region = sqlx::query_as::<_, TrackRegion>(
            r#"
            INSERT INTO track_regions (
                track_id, user_id, start_time_ms, end_time_ms,
                name, description, section_type, color, display_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(track_id)
        .bind(user_id)
        .bind(input.start_time_ms)
        .bind(input.end_time_ms)
        .bind(&input.name)
        .bind(&input.description)
        .bind(input.section_type.unwrap_or_else(|| "custom".to_string()))
        .bind(input.color.unwrap_or_else(|| "#10b981".to_string()))
        .bind(input.display_order.unwrap_or(0))
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(region)
    }

    /// List regions for a track
    pub async fn list_for_track(
        pool: &PgPool,
        track_id: Uuid,
        user_id: Uuid,
    ) -> Result<Vec<TrackRegion>, AppError> {
        let regions = sqlx::query_as::<_, TrackRegion>(
            r#"
            SELECT * FROM track_regions
            WHERE track_id = $1 AND user_id = $2
            ORDER BY start_time_ms ASC, display_order ASC
            "#,
        )
        .bind(track_id)
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(regions)
    }

    /// Get region by ID with ownership check
    pub async fn find_by_id_for_user(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<TrackRegion>, AppError> {
        let region = sqlx::query_as::<_, TrackRegion>(
            "SELECT * FROM track_regions WHERE id = $1 AND user_id = $2",
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(region)
    }

    /// Update a region
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        input: UpdateRegionInput,
    ) -> Result<Option<TrackRegion>, AppError> {
        let region = sqlx::query_as::<_, TrackRegion>(
            r#"
            UPDATE track_regions SET
                start_time_ms = COALESCE($3, start_time_ms),
                end_time_ms = COALESCE($4, end_time_ms),
                name = COALESCE($5, name),
                description = COALESCE($6, description),
                section_type = COALESCE($7, section_type),
                color = COALESCE($8, color),
                display_order = COALESCE($9, display_order),
                updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(input.start_time_ms)
        .bind(input.end_time_ms)
        .bind(&input.name)
        .bind(&input.description)
        .bind(&input.section_type)
        .bind(&input.color)
        .bind(input.display_order)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(region)
    }

    /// Delete a region
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM track_regions WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}
