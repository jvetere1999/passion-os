//! Reference tracks routes
//!
//! API endpoints for the Critical Listening domain:
//! - Track CRUD
//! - Analysis management
//! - Annotations CRUD
//! - Regions CRUD

use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, patch, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::reference_models::*;
use crate::db::reference_repos::*;
use crate::error::{AppError, AppResult};
use crate::middleware::auth::AuthContext;
use crate::state::AppState;
use crate::storage::SignedUrlResponse;

/// Create reference tracks routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Track routes
        .route("/tracks", get(list_tracks))
        .route("/tracks", post(create_track))
        .route("/tracks/:id", get(get_track))
        .route("/tracks/:id", patch(update_track))
        .route("/tracks/:id", delete(delete_track))
        // Upload routes
        .route("/upload", post(upload_track))
        .route("/upload/init", post(init_upload))
        // Analysis routes
        .route("/tracks/:id/analysis", get(get_analysis))
        .route("/tracks/:id/analysis", post(start_analysis))
        // Streaming routes
        .route("/tracks/:id/stream", get(stream_track))
        .route("/tracks/:id/play", get(stream_track))
        // Annotation routes
        .route("/tracks/:id/annotations", get(list_annotations))
        .route("/tracks/:id/annotations", post(create_annotation))
        .route("/annotations/:id", get(get_annotation))
        .route("/annotations/:id", patch(update_annotation))
        .route("/annotations/:id", delete(delete_annotation))
        // Region routes
        .route("/tracks/:id/regions", get(list_regions))
        .route("/tracks/:id/regions", post(create_region))
        .route("/regions/:id", get(get_region))
        .route("/regions/:id", patch(update_region))
        .route("/regions/:id", delete(delete_region))
}

// =============================================================================
// Request/Response types
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct ListTracksQuery {
    #[serde(default = "default_page")]
    pub page: i32,
    #[serde(default = "default_page_size")]
    pub page_size: i32,
}

fn default_page() -> i32 {
    1
}

fn default_page_size() -> i32 {
    20
}

#[derive(Debug, Deserialize)]
pub struct CreateTrackRequest {
    pub name: String,
    pub description: Option<String>,
    pub r2_key: String,
    pub file_size_bytes: i64,
    pub mime_type: String,
    pub duration_seconds: Option<f32>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub bpm: Option<f32>,
    pub key_signature: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTrackRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub duration_seconds: Option<f32>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub bpm: Option<f32>,
    pub key_signature: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct TrackResponse {
    pub track: ReferenceTrack,
    pub annotation_count: i64,
    pub region_count: i64,
    pub latest_analysis: Option<AnalysisSummary>,
}

#[derive(Debug, Deserialize)]
pub struct InitUploadRequest {
    pub filename: String,
    pub mime_type: String,
    #[allow(dead_code)]
    pub file_size_bytes: i64,
}

#[derive(Debug, Serialize)]
pub struct InitUploadResponse {
    pub upload_url: String,
    pub r2_key: String,
    pub expires_at: String,
}

#[derive(Debug, Deserialize)]
pub struct StartAnalysisRequest {
    pub analysis_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnotationRequest {
    pub start_time_ms: i32,
    pub end_time_ms: Option<i32>,
    pub title: String,
    pub content: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub is_private: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAnnotationRequest {
    pub start_time_ms: Option<i32>,
    pub end_time_ms: Option<i32>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub is_private: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRegionRequest {
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub name: String,
    pub description: Option<String>,
    pub section_type: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRegionRequest {
    pub start_time_ms: Option<i32>,
    pub end_time_ms: Option<i32>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub section_type: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

// =============================================================================
// Track handlers
// =============================================================================

/// List user's tracks
async fn list_tracks(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Query(query): Query<ListTracksQuery>,
) -> AppResult<Json<PaginatedResponse<ReferenceTrack>>> {
    let (tracks, total) =
        ReferenceTrackRepo::list_for_user(&state.db, auth.user_id, query.page, query.page_size)
            .await?;

    Ok(Json(PaginatedResponse::new(
        tracks,
        total,
        query.page,
        query.page_size,
    )))
}

/// Create a new track (after upload complete)
async fn create_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<CreateTrackRequest>,
) -> AppResult<Json<ReferenceTrack>> {
    // Validate MIME type is audio
    if !request.mime_type.starts_with("audio/") {
        return Err(AppError::Validation(
            "Only audio files are allowed for reference tracks".to_string(),
        ));
    }

    let input = CreateTrackInput {
        name: request.name,
        description: request.description,
        r2_key: request.r2_key,
        file_size_bytes: request.file_size_bytes,
        mime_type: request.mime_type,
        duration_seconds: request.duration_seconds,
        artist: request.artist,
        album: request.album,
        genre: request.genre,
        bpm: request.bpm,
        key_signature: request.key_signature,
        tags: request.tags,
    };

    let track = ReferenceTrackRepo::create(&state.db, auth.user_id, input).await?;

    Ok(Json(track))
}

/// Get a track by ID
async fn get_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<TrackResponse>> {
    let track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    // Get annotation and region counts
    let annotations = TrackAnnotationRepo::list_for_track(&state.db, id, auth.user_id).await?;
    let regions = TrackRegionRepo::list_for_track(&state.db, id, auth.user_id).await?;

    // Get latest analysis
    let analysis = TrackAnalysisRepo::get_latest(&state.db, id, None).await?;
    let latest_analysis = analysis.map(|a| AnalysisSummary {
        id: a.id,
        analysis_type: a.analysis_type,
        version: a.version,
        status: a.status,
        summary: a.summary,
        completed_at: a.completed_at,
    });

    Ok(Json(TrackResponse {
        track,
        annotation_count: annotations.len() as i64,
        region_count: regions.len() as i64,
        latest_analysis,
    }))
}

/// Update a track
async fn update_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateTrackRequest>,
) -> AppResult<Json<ReferenceTrack>> {
    let input = UpdateTrackInput {
        name: request.name,
        description: request.description,
        duration_seconds: request.duration_seconds,
        artist: request.artist,
        album: request.album,
        genre: request.genre,
        bpm: request.bpm,
        key_signature: request.key_signature,
        tags: request.tags,
    };

    let track = ReferenceTrackRepo::update(&state.db, id, auth.user_id, input)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    Ok(Json(track))
}

/// Delete a track
async fn delete_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    // Get track first to get R2 key
    let track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    // Delete from database (cascades to analyses, annotations, regions)
    let deleted = ReferenceTrackRepo::delete(&state.db, id, auth.user_id).await?;

    if !deleted {
        return Err(AppError::NotFound("Track not found".to_string()));
    }

    // Delete from R2 storage
    if let Some(storage) = &state.storage {
        if let Err(e) = storage.delete_by_key(&track.r2_key).await {
            tracing::warn!("Failed to delete R2 object {}: {}", track.r2_key, e);
            // Don't fail the request - DB deletion succeeded
        }
    }

    Ok(Json(serde_json::json!({ "success": true })))
}

// =============================================================================
// Upload handlers
// =============================================================================

/// Initialize an upload (get signed URL)
async fn init_upload(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<InitUploadRequest>,
) -> AppResult<Json<InitUploadResponse>> {
    // Validate MIME type is audio
    if !request.mime_type.starts_with("audio/") {
        return Err(AppError::Validation(
            "Only audio files are allowed for reference tracks".to_string(),
        ));
    }

    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let response = storage
        .generate_signed_upload_url(&auth.user_id, &request.mime_type, &request.filename)
        .await?;

    // Extract r2_key from the URL or generate it
    let r2_key = format!(
        "{}/audio/{}.{}",
        auth.user_id,
        Uuid::new_v4(),
        get_extension_from_mime(&request.mime_type)
    );

    Ok(Json(InitUploadResponse {
        upload_url: response.url,
        r2_key,
        expires_at: response.expires_at,
    }))
}

/// Upload a track directly (backend proxies to R2)
async fn upload_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    mut multipart: axum::extract::Multipart,
) -> AppResult<Json<ReferenceTrack>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut mime_type: Option<String> = None;
    let mut name: Option<String> = None;
    let mut description: Option<String> = None;

    // Parse multipart form
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Multipart error: {}", e)))?
    {
        let field_name = field.name().unwrap_or("").to_string();

        match field_name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                mime_type = field.content_type().map(|s| s.to_string());
                file_data = Some(
                    field
                        .bytes()
                        .await
                        .map_err(|e| AppError::BadRequest(format!("File read error: {}", e)))?
                        .to_vec(),
                );
            }
            "name" => {
                name = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(format!("Read error: {}", e)))?,
                );
            }
            "description" => {
                description = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(format!("Read error: {}", e)))?,
                );
            }
            _ => {}
        }
    }

    let data = file_data.ok_or_else(|| AppError::BadRequest("No file provided".to_string()))?;
    let filename = filename.unwrap_or_else(|| "unnamed.mp3".to_string());
    let mime_type = mime_type.unwrap_or_else(|| "audio/mpeg".to_string());

    // Validate MIME type is audio
    if !mime_type.starts_with("audio/") {
        return Err(AppError::Validation(
            "Only audio files are allowed for reference tracks".to_string(),
        ));
    }

    let file_size = data.len() as i64;
    let track_name = name.unwrap_or_else(|| filename.clone());

    // Upload to R2
    let upload_request = crate::storage::UploadRequest {
        user_id: auth.user_id,
        filename: filename.clone(),
        mime_type: mime_type.clone(),
        data,
        metadata: None,
    };

    let upload_response = storage.upload(upload_request).await?;

    // Create track record
    let input = CreateTrackInput {
        name: track_name,
        description,
        r2_key: upload_response.key,
        file_size_bytes: file_size,
        mime_type,
        duration_seconds: None, // Will be set after analysis
        artist: None,
        album: None,
        genre: None,
        bpm: None,
        key_signature: None,
        tags: None,
    };

    let track = ReferenceTrackRepo::create(&state.db, auth.user_id, input).await?;

    Ok(Json(track))
}

/// Stream a track (get signed download URL or proxy)
async fn stream_track(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<SignedUrlResponse>> {
    // Verify ownership
    let track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    // Generate signed download URL
    let response = storage.generate_signed_download_url(&track.r2_key).await?;

    Ok(Json(response))
}

// =============================================================================
// Analysis handlers
// =============================================================================

/// Get latest analysis for a track
async fn get_analysis(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Option<TrackAnalysis>>> {
    // Verify ownership
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    let analysis = TrackAnalysisRepo::get_latest(&state.db, id, None).await?;

    Ok(Json(analysis))
}

/// Start an analysis (creates pending job)
async fn start_analysis(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(request): Json<StartAnalysisRequest>,
) -> AppResult<Json<TrackAnalysis>> {
    // Verify ownership
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    let analysis_type = request.analysis_type.unwrap_or_else(|| "full".to_string());

    // Create analysis record (job stub - actual processing would be async)
    let analysis = TrackAnalysisRepo::create(&state.db, id, &analysis_type).await?;

    // In a real implementation, we would queue a job here
    // For now, we just mark it as pending and it would be processed by a worker
    TrackAnalysisRepo::mark_started(&state.db, analysis.id).await?;

    // Stub: immediately complete with dummy summary
    // In production, a background worker would do this
    let summary = serde_json::json!({
        "status": "stub",
        "message": "Analysis processing is a stub in v1"
    });
    TrackAnalysisRepo::update_status(
        &state.db,
        analysis.id,
        "completed",
        Some(summary),
        None,
        None,
    )
    .await?;

    // Fetch updated analysis
    let analysis = TrackAnalysisRepo::get_latest(&state.db, id, Some(&analysis_type))
        .await?
        .ok_or_else(|| AppError::Internal("Analysis not found after creation".to_string()))?;

    Ok(Json(analysis))
}

// =============================================================================
// Annotation handlers
// =============================================================================

/// List annotations for a track
async fn list_annotations(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<TrackAnnotation>>> {
    // Verify track exists and user has access
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    let annotations = TrackAnnotationRepo::list_for_track(&state.db, id, auth.user_id).await?;

    Ok(Json(annotations))
}

/// Create an annotation
async fn create_annotation(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(track_id): Path<Uuid>,
    Json(request): Json<CreateAnnotationRequest>,
) -> AppResult<Json<TrackAnnotation>> {
    // Verify track ownership
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, track_id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    // Validate times
    if request.start_time_ms < 0 {
        return Err(AppError::Validation(
            "start_time_ms must be non-negative".to_string(),
        ));
    }
    if let Some(end) = request.end_time_ms {
        if end <= request.start_time_ms {
            return Err(AppError::Validation(
                "end_time_ms must be greater than start_time_ms".to_string(),
            ));
        }
    }

    let input = CreateAnnotationInput {
        start_time_ms: request.start_time_ms,
        end_time_ms: request.end_time_ms,
        title: request.title,
        content: request.content,
        category: request.category,
        color: request.color,
        is_private: request.is_private,
    };

    let annotation = TrackAnnotationRepo::create(&state.db, track_id, auth.user_id, input).await?;

    Ok(Json(annotation))
}

/// Get an annotation by ID
async fn get_annotation(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<TrackAnnotation>> {
    let annotation = TrackAnnotationRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Annotation not found".to_string()))?;

    Ok(Json(annotation))
}

/// Update an annotation
async fn update_annotation(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateAnnotationRequest>,
) -> AppResult<Json<TrackAnnotation>> {
    // Validate times if provided
    if let (Some(start), Some(end)) = (request.start_time_ms, request.end_time_ms) {
        if end <= start {
            return Err(AppError::Validation(
                "end_time_ms must be greater than start_time_ms".to_string(),
            ));
        }
    }

    let input = UpdateAnnotationInput {
        start_time_ms: request.start_time_ms,
        end_time_ms: request.end_time_ms,
        title: request.title,
        content: request.content,
        category: request.category,
        color: request.color,
        is_private: request.is_private,
    };

    let annotation = TrackAnnotationRepo::update(&state.db, id, auth.user_id, input)
        .await?
        .ok_or_else(|| AppError::NotFound("Annotation not found".to_string()))?;

    Ok(Json(annotation))
}

/// Delete an annotation
async fn delete_annotation(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let deleted = TrackAnnotationRepo::delete(&state.db, id, auth.user_id).await?;

    if !deleted {
        return Err(AppError::NotFound("Annotation not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}

// =============================================================================
// Region handlers
// =============================================================================

/// List regions for a track
async fn list_regions(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<TrackRegion>>> {
    // Verify track ownership
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    let regions = TrackRegionRepo::list_for_track(&state.db, id, auth.user_id).await?;

    Ok(Json(regions))
}

/// Create a region
async fn create_region(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(track_id): Path<Uuid>,
    Json(request): Json<CreateRegionRequest>,
) -> AppResult<Json<TrackRegion>> {
    // Verify track ownership
    let _track = ReferenceTrackRepo::find_by_id_for_user(&state.db, track_id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Track not found".to_string()))?;

    // Validate times
    if request.start_time_ms < 0 {
        return Err(AppError::Validation(
            "start_time_ms must be non-negative".to_string(),
        ));
    }
    if request.end_time_ms <= request.start_time_ms {
        return Err(AppError::Validation(
            "end_time_ms must be greater than start_time_ms".to_string(),
        ));
    }

    let input = CreateRegionInput {
        start_time_ms: request.start_time_ms,
        end_time_ms: request.end_time_ms,
        name: request.name,
        description: request.description,
        section_type: request.section_type,
        color: request.color,
        display_order: request.display_order,
    };

    let region = TrackRegionRepo::create(&state.db, track_id, auth.user_id, input).await?;

    Ok(Json(region))
}

/// Get a region by ID
async fn get_region(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<TrackRegion>> {
    let region = TrackRegionRepo::find_by_id_for_user(&state.db, id, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Region not found".to_string()))?;

    Ok(Json(region))
}

/// Update a region
async fn update_region(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateRegionRequest>,
) -> AppResult<Json<TrackRegion>> {
    // Validate times if provided
    if let (Some(start), Some(end)) = (request.start_time_ms, request.end_time_ms) {
        if end <= start {
            return Err(AppError::Validation(
                "end_time_ms must be greater than start_time_ms".to_string(),
            ));
        }
    }

    let input = UpdateRegionInput {
        start_time_ms: request.start_time_ms,
        end_time_ms: request.end_time_ms,
        name: request.name,
        description: request.description,
        section_type: request.section_type,
        color: request.color,
        display_order: request.display_order,
    };

    let region = TrackRegionRepo::update(&state.db, id, auth.user_id, input)
        .await?
        .ok_or_else(|| AppError::NotFound("Region not found".to_string()))?;

    Ok(Json(region))
}

/// Delete a region
async fn delete_region(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let deleted = TrackRegionRepo::delete(&state.db, id, auth.user_id).await?;

    if !deleted {
        return Err(AppError::NotFound("Region not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}

// =============================================================================
// Helpers
// =============================================================================

fn get_extension_from_mime(mime: &str) -> &'static str {
    match mime {
        "audio/mpeg" | "audio/mp3" => "mp3",
        "audio/wav" | "audio/wave" | "audio/x-wav" => "wav",
        "audio/ogg" => "ogg",
        "audio/flac" => "flac",
        "audio/aac" => "aac",
        "audio/m4a" | "audio/x-m4a" => "m4a",
        _ => "bin",
    }
}
