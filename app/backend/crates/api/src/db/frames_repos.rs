//! Analysis frames repository
//!
//! Database operations for frame manifests, frame data chunks, and events.

#![allow(dead_code)]

use base64::Engine;
use sqlx::PgPool;
use uuid::Uuid;

use super::frames_models::*;
use crate::error::AppError;

// =============================================================================
// Frame Manifest Repository
// =============================================================================

pub struct FrameManifestRepo;

impl FrameManifestRepo {
    /// Create a new frame manifest
    pub async fn create(
        pool: &PgPool,
        analysis_id: Uuid,
        input: CreateFrameManifestInput,
    ) -> Result<AnalysisFrameManifest, AppError> {
        let bytes_per_frame = calculate_bytes_per_frame(&input.bands);
        let frame_layout = calculate_frame_layout(&input.bands);
        let chunk_size = input.chunk_size_frames.unwrap_or(1000);
        let total_chunks = calculate_total_chunks(input.frame_count, chunk_size);

        let bands_json =
            serde_json::to_value(&input.bands).map_err(|e| AppError::Internal(e.to_string()))?;
        let layout_json =
            serde_json::to_value(&frame_layout).map_err(|e| AppError::Internal(e.to_string()))?;

        let manifest = sqlx::query_as::<_, AnalysisFrameManifest>(
            r#"
            INSERT INTO analysis_frame_manifests (
                analysis_id, hop_ms, frame_count, duration_ms, sample_rate,
                bands, bytes_per_frame, frame_layout, fingerprint, analyzer_version,
                chunk_size_frames, total_chunks
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
        )
        .bind(analysis_id)
        .bind(input.hop_ms)
        .bind(input.frame_count)
        .bind(input.duration_ms)
        .bind(input.sample_rate.unwrap_or(44100))
        .bind(&bands_json)
        .bind(bytes_per_frame)
        .bind(&layout_json)
        .bind(&input.fingerprint)
        .bind(
            input
                .analyzer_version
                .unwrap_or_else(|| "1.0.0".to_string()),
        )
        .bind(chunk_size)
        .bind(total_chunks)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(manifest)
    }

    /// Get manifest by analysis ID
    pub async fn get_by_analysis(
        pool: &PgPool,
        analysis_id: Uuid,
    ) -> Result<Option<AnalysisFrameManifest>, AppError> {
        let manifest = sqlx::query_as::<_, AnalysisFrameManifest>(
            "SELECT * FROM analysis_frame_manifests WHERE analysis_id = $1",
        )
        .bind(analysis_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(manifest)
    }

    /// Get manifest by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<AnalysisFrameManifest>, AppError> {
        let manifest = sqlx::query_as::<_, AnalysisFrameManifest>(
            "SELECT * FROM analysis_frame_manifests WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(manifest)
    }

    /// Update events in manifest
    pub async fn update_events(
        pool: &PgPool,
        manifest_id: Uuid,
        events: Vec<AnalysisEvent>,
    ) -> Result<(), AppError> {
        let events_json =
            serde_json::to_value(&events).map_err(|e| AppError::Internal(e.to_string()))?;

        sqlx::query("UPDATE analysis_frame_manifests SET events = $2 WHERE id = $1")
            .bind(manifest_id)
            .bind(&events_json)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Delete manifest (cascades to frame data)
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM analysis_frame_manifests WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}

// =============================================================================
// Frame Data Repository
// =============================================================================

pub struct FrameDataRepo;

impl FrameDataRepo {
    /// Create a frame data chunk
    pub async fn create_chunk(
        pool: &PgPool,
        manifest_id: Uuid,
        input: CreateFrameDataInput,
    ) -> Result<AnalysisFrameData, AppError> {
        let chunk = sqlx::query_as::<_, AnalysisFrameData>(
            r#"
            INSERT INTO analysis_frame_data (
                manifest_id, chunk_index, start_frame, end_frame,
                start_time_ms, end_time_ms, frame_data, frame_count,
                compressed, compression_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            "#,
        )
        .bind(manifest_id)
        .bind(input.chunk_index)
        .bind(input.start_frame)
        .bind(input.end_frame)
        .bind(input.start_time_ms)
        .bind(input.end_time_ms)
        .bind(&input.frame_data)
        .bind(input.frame_count)
        .bind(input.compressed)
        .bind(&input.compression_type)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(chunk)
    }

    /// Get chunks for a time range
    pub async fn get_chunks_for_range(
        pool: &PgPool,
        manifest_id: Uuid,
        from_ms: i32,
        to_ms: i32,
    ) -> Result<Vec<AnalysisFrameData>, AppError> {
        let chunks = sqlx::query_as::<_, AnalysisFrameData>(
            r#"
            SELECT * FROM analysis_frame_data
            WHERE manifest_id = $1
              AND end_time_ms > $2
              AND start_time_ms < $3
            ORDER BY chunk_index
            "#,
        )
        .bind(manifest_id)
        .bind(from_ms)
        .bind(to_ms)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(chunks)
    }

    /// Get all chunks for a manifest
    pub async fn get_all_chunks(
        pool: &PgPool,
        manifest_id: Uuid,
    ) -> Result<Vec<AnalysisFrameData>, AppError> {
        let chunks = sqlx::query_as::<_, AnalysisFrameData>(
            "SELECT * FROM analysis_frame_data WHERE manifest_id = $1 ORDER BY chunk_index",
        )
        .bind(manifest_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(chunks)
    }

    /// Get a specific chunk by index
    pub async fn get_chunk_by_index(
        pool: &PgPool,
        manifest_id: Uuid,
        chunk_index: i32,
    ) -> Result<Option<AnalysisFrameData>, AppError> {
        let chunk = sqlx::query_as::<_, AnalysisFrameData>(
            "SELECT * FROM analysis_frame_data WHERE manifest_id = $1 AND chunk_index = $2",
        )
        .bind(manifest_id)
        .bind(chunk_index)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(chunk)
    }

    /// Convert chunks to response format (with base64 encoding)
    pub fn chunks_to_response(chunks: Vec<AnalysisFrameData>) -> Vec<FrameChunkResponse> {
        chunks
            .into_iter()
            .map(|c| {
                let data_base64 = base64::engine::general_purpose::STANDARD.encode(&c.frame_data);
                FrameChunkResponse {
                    chunk_index: c.chunk_index,
                    start_frame: c.start_frame,
                    end_frame: c.end_frame,
                    start_time_ms: c.start_time_ms,
                    end_time_ms: c.end_time_ms,
                    frame_count: c.frame_count,
                    data_base64,
                }
            })
            .collect()
    }
}

// =============================================================================
// Events Repository
// =============================================================================

pub struct AnalysisEventsRepo;

impl AnalysisEventsRepo {
    /// Create an event
    pub async fn create(
        pool: &PgPool,
        analysis_id: Uuid,
        input: CreateEventInput,
    ) -> Result<AnalysisEventRow, AppError> {
        let event_data = input.event_data.unwrap_or(serde_json::json!({}));

        let event = sqlx::query_as::<_, AnalysisEventRow>(
            r#"
            INSERT INTO analysis_events (
                analysis_id, time_ms, duration_ms, event_type, event_data, confidence
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(analysis_id)
        .bind(input.time_ms)
        .bind(input.duration_ms)
        .bind(&input.event_type)
        .bind(&event_data)
        .bind(input.confidence)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(event)
    }

    /// Create multiple events in batch
    pub async fn create_batch(
        pool: &PgPool,
        analysis_id: Uuid,
        inputs: Vec<CreateEventInput>,
    ) -> Result<i32, AppError> {
        let mut count = 0;

        for input in inputs {
            let event_data = input.event_data.unwrap_or(serde_json::json!({}));

            sqlx::query(
                r#"
                INSERT INTO analysis_events (
                    analysis_id, time_ms, duration_ms, event_type, event_data, confidence
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(analysis_id)
            .bind(input.time_ms)
            .bind(input.duration_ms)
            .bind(&input.event_type)
            .bind(&event_data)
            .bind(input.confidence)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

            count += 1;
        }

        Ok(count)
    }

    /// Get events for an analysis (takes owned Option<String> for event_type)
    pub async fn get_for_analysis(
        pool: &PgPool,
        analysis_id: Uuid,
        from_ms: Option<i32>,
        to_ms: Option<i32>,
        event_type: Option<String>,
    ) -> Result<Vec<AnalysisEventRow>, AppError> {
        let events = match (&from_ms, &to_ms, &event_type) {
            (Some(from), Some(to), Some(etype)) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms >= $2 AND time_ms <= $3 AND event_type = $4 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(from)
                .bind(to)
                .bind(etype)
                .fetch_all(pool)
                .await
            }
            (Some(from), Some(to), None) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms >= $2 AND time_ms <= $3 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(from)
                .bind(to)
                .fetch_all(pool)
                .await
            }
            (Some(from), None, Some(etype)) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms >= $2 AND event_type = $3 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(from)
                .bind(etype)
                .fetch_all(pool)
                .await
            }
            (None, Some(to), Some(etype)) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms <= $2 AND event_type = $3 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(to)
                .bind(etype)
                .fetch_all(pool)
                .await
            }
            (Some(from), None, None) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms >= $2 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(from)
                .fetch_all(pool)
                .await
            }
            (None, Some(to), None) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND time_ms <= $2 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(to)
                .fetch_all(pool)
                .await
            }
            (None, None, Some(etype)) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 AND event_type = $2 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .bind(etype)
                .fetch_all(pool)
                .await
            }
            (None, None, None) => {
                sqlx::query_as::<_, AnalysisEventRow>(
                    "SELECT * FROM analysis_events WHERE analysis_id = $1 ORDER BY time_ms"
                )
                .bind(analysis_id)
                .fetch_all(pool)
                .await
            }
        }.map_err(|e| AppError::Database(e.to_string()))?;

        Ok(events)
    }

    /// Convert rows to API response
    pub fn rows_to_events(rows: Vec<AnalysisEventRow>) -> Vec<AnalysisEvent> {
        rows.into_iter()
            .map(|r| AnalysisEvent {
                event_type: r.event_type,
                time_ms: r.time_ms,
                duration_ms: r.duration_ms,
                confidence: r.confidence,
                data: Some(r.event_data),
            })
            .collect()
    }
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Calculate the determinism fingerprint for cache validation
pub fn calculate_fingerprint(audio_hash: &str, analyzer_version: &str, params: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    audio_hash.hash(&mut hasher);
    analyzer_version.hash(&mut hasher);
    params.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_fingerprint_determinism() {
        let fp1 = calculate_fingerprint("abc123", "1.0.0", "hop=10");
        let fp2 = calculate_fingerprint("abc123", "1.0.0", "hop=10");
        let fp3 = calculate_fingerprint("abc123", "1.0.1", "hop=10");

        assert_eq!(fp1, fp2, "Same inputs should produce same fingerprint");
        assert_ne!(
            fp1, fp3,
            "Different version should produce different fingerprint"
        );
    }
}
