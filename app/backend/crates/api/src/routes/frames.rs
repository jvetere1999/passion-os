//! Analysis frames routes
//!
//! API endpoints for time-indexed frame data and events transport.

use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    routing::get,
    Extension, Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::db::frames_models::*;
use crate::db::frames_repos::*;
use crate::db::reference_repos::*;
use crate::error::{AppError, AppResult};
use crate::middleware::auth::AuthContext;
use crate::state::AppState;

/// Events query parameters (local definition for Query extraction)
#[derive(Debug, Clone, Default, Deserialize)]
pub struct EventsQueryParams {
    pub from_ms: Option<i32>,
    pub to_ms: Option<i32>,
    pub event_type: Option<String>,
}

/// Create frames routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Get frame manifest for an analysis
        .route("/analysis/:analysis_id/manifest", get(get_manifest))
        // Get frame data for a time range
        .route("/analysis/:analysis_id/frames", get(get_frames))
        // Get events for an analysis
        .route("/analysis/:analysis_id/events", get(get_events))
        // Get a specific chunk
        .route("/analysis/:analysis_id/chunks/:chunk_index", get(get_chunk))
}

// =============================================================================
// Handlers
// =============================================================================

/// Get the frame manifest for an analysis
async fn get_manifest(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(analysis_id): Path<Uuid>,
) -> AppResult<Json<FrameManifestResponse>> {
    // Verify the user owns the track that owns this analysis
    verify_analysis_access(&state, auth.user_id, analysis_id).await?;

    let manifest = FrameManifestRepo::get_by_analysis(&state.db, analysis_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Frame manifest not found".to_string()))?;

    Ok(Json(FrameManifestResponse::from(&manifest)))
}

/// Get frame data for a time range
async fn get_frames(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(analysis_id): Path<Uuid>,
    Query(query): Query<FrameDataQuery>,
) -> AppResult<Json<FrameDataResponse>> {
    // Validate time range
    if query.from_ms < 0 {
        return Err(AppError::Validation(
            "from_ms must be non-negative".to_string(),
        ));
    }
    if query.to_ms <= query.from_ms {
        return Err(AppError::Validation(
            "to_ms must be greater than from_ms".to_string(),
        ));
    }

    // Verify access
    verify_analysis_access(&state, auth.user_id, analysis_id).await?;

    // Get manifest
    let manifest = FrameManifestRepo::get_by_analysis(&state.db, analysis_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Frame manifest not found".to_string()))?;

    // Clamp time range to track duration
    let actual_from = query.from_ms.max(0);
    let actual_to = query.to_ms.min(manifest.duration_ms);

    // Get chunks for range
    let chunks =
        FrameDataRepo::get_chunks_for_range(&state.db, manifest.id, actual_from, actual_to).await?;

    // Calculate totals
    let total_frames: i32 = chunks.iter().map(|c| c.frame_count).sum();
    let total_bytes: i32 = chunks.iter().map(|c| c.frame_data.len() as i32).sum();

    // Convert to response format
    let chunk_responses = FrameDataRepo::chunks_to_response(chunks);

    Ok(Json(FrameDataResponse {
        manifest: FrameManifestResponse::from(&manifest),
        requested_range: TimeRange {
            from_ms: query.from_ms,
            to_ms: query.to_ms,
        },
        actual_range: TimeRange {
            from_ms: actual_from,
            to_ms: actual_to,
        },
        chunks: chunk_responses,
        total_frames,
        total_bytes,
    }))
}

/// Get events for an analysis
async fn get_events(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(analysis_id): Path<Uuid>,
    Query(query): Query<EventsQueryParams>,
) -> AppResult<Json<EventsResponse>> {
    // Verify access
    verify_analysis_access(&state, auth.user_id, analysis_id).await?;

    // Get events (pass owned Option<String>)
    let rows = AnalysisEventsRepo::get_for_analysis(
        &state.db,
        analysis_id,
        query.from_ms,
        query.to_ms,
        query.event_type,
    )
    .await?;

    let events = AnalysisEventsRepo::rows_to_events(rows);
    let count = events.len() as i32;

    Ok(Json(EventsResponse {
        analysis_id,
        events,
        count,
    }))
}

/// Get a specific chunk by index
async fn get_chunk(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path((analysis_id, chunk_index)): Path<(Uuid, i32)>,
) -> AppResult<Json<FrameChunkResponse>> {
    // Verify access
    verify_analysis_access(&state, auth.user_id, analysis_id).await?;

    // Get manifest to find manifest_id
    let manifest = FrameManifestRepo::get_by_analysis(&state.db, analysis_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Frame manifest not found".to_string()))?;

    // Get specific chunk
    let chunk = FrameDataRepo::get_chunk_by_index(&state.db, manifest.id, chunk_index)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Chunk {} not found", chunk_index)))?;

    let response = FrameDataRepo::chunks_to_response(vec![chunk])
        .into_iter()
        .next()
        .ok_or_else(|| AppError::Internal("Failed to convert chunk".to_string()))?;

    Ok(Json(response))
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Verify that the user has access to this analysis (via track ownership)
async fn verify_analysis_access(
    state: &AppState,
    user_id: Uuid,
    analysis_id: Uuid,
) -> AppResult<()> {
    // Get the analysis to find the track_id
    let analysis = TrackAnalysisRepo::get_by_id(&state.db, analysis_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Analysis not found".to_string()))?;

    // Verify user owns the track
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, analysis.track_id, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    Ok(())
}
