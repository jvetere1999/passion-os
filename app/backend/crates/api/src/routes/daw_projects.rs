use crate::db::daw_project_models::*;
use crate::db::daw_project_repos::DawProjectsRepo;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Extension, Json, Router,
};
use chrono::Utc;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_projects).post(initiate_upload))
        .route("/{project_id}", get(get_project))
        .route("/{project_id}/versions", get(list_versions))
        .route("/{project_id}/versions/{version_id}/restore", post(restore_version))
        .route("/upload/{session_id}/chunk", post(upload_chunk))
        .route("/upload/{session_id}/complete", post(complete_upload))
        .route("/download/{project_id}/{version_id}", get(download_project))
}

/// GET /api/daw/projects - List all DAW projects for user
async fn list_projects(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<ListProjectsResponse>, AppError> {
    let (projects, total) = DawProjectsRepo::list_by_user(&state.db, auth.user_id, 100, 0)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let total_storage: i64 = DawProjectsRepo::get_user_storage_usage(&state.db, auth.user_id)
        .await
        .unwrap_or(0);

    let summary = projects
        .iter()
        .map(|p| DawProjectSummary {
            id: p.id,
            project_name: p.project_name.clone(),
            content_type: p.content_type.clone(),
            current_version: p.version_count,
            total_versions: p.version_count,
            file_size: p.file_size,
            last_modified_at: p.last_modified_at,
        })
        .collect();

    Ok(Json(ListProjectsResponse {
        projects: summary,
        total_count: total,
        total_storage_bytes: total_storage,
    }))
}

/// POST /api/daw/projects - Initiate chunked upload
async fn initiate_upload(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<InitiateUploadRequest>,
) -> Result<Json<InitiateUploadResponse>, AppError> {
    if req.total_size <= 0 {
        return Err(AppError::Validation(
            "total_size must be > 0".to_string(),
        ));
    }

    if req.total_size > 5_000_000_000 {
        // 5GB max
        return Err(AppError::Validation(
            "File too large (max 5GB)".to_string(),
        ));
    }

    let chunk_size = 5_242_880; // 5MB
    let total_chunks = ((req.total_size + chunk_size - 1) / chunk_size) as i32;
    let storage_key = format!(
        "daw/{}/{}/{}",
        auth.user_id,
        chrono::Utc::now().timestamp(),
        req.project_name
    );

    let session = DawProjectsRepo::create_upload_session(
        &state.db,
        auth.user_id,
        &req.project_name,
        &req.content_type,
        req.total_size,
        total_chunks,
        &storage_key,
    )
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(InitiateUploadResponse {
        session_id: session.id,
        chunk_size,
        total_chunks,
        expires_at: session.expires_at,
    }))
}

/// GET /api/daw/:project_id - Get project details
async fn get_project(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<DawProjectFile>, AppError> {
    let project = DawProjectsRepo::get_by_id(&state.db, project_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Project not found".to_string()))?;

    Ok(Json(project))
}

/// GET /api/daw/:project_id/versions - List version history
async fn list_versions(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<ListVersionsResponse>, AppError> {
    // Verify ownership
    let _project = DawProjectsRepo::get_by_id(&state.db, project_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Project not found".to_string()))?;

    let versions = DawProjectsRepo::get_versions(&state.db, project_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let summary: Vec<VersionSummary> = versions
        .iter()
        .map(|v| VersionSummary {
            version_id: v.id,
            version_number: v.version_number,
            file_size: v.file_size,
            change_description: v.change_description.clone(),
            is_current: false, // TODO: check against project.current_version_id
            created_at: v.created_at,
        })
        .collect();

    Ok(Json(ListVersionsResponse {
        project_id,
        project_name: "".to_string(), // TODO: fetch from project
        versions: summary,
        total_count: versions.len() as i32,
    }))
}

/// POST /api/daw/:project_id/versions/:version_id/restore - Restore previous version
async fn restore_version(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path((project_id, version_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<RestoreVersionRequest>,
) -> Result<Json<RestoreVersionResponse>, AppError> {
    let new_version =
        DawProjectsRepo::restore_version(&state.db, project_id, version_id, auth.user_id)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(RestoreVersionResponse {
        project_id,
        current_version_number: new_version.version_number,
        restored_at: Utc::now(),
    }))
}

/// POST /api/daw/upload/:session_id/chunk - Upload file chunk
async fn upload_chunk(
    State(_state): State<Arc<AppState>>,
    Extension(_auth): Extension<AuthContext>,
    Path(_session_id): Path<Uuid>,
) -> Result<Json<UploadChunkResponse>, AppError> {
    // TODO: Implement chunked upload handling
    // This requires multipart form parsing and R2 integration
    Err(AppError::Internal(
        "Chunked upload requires multipart parsing".to_string(),
    ))
}

/// POST /api/daw/upload/:session_id/complete - Finalize upload
async fn complete_upload(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(session_id): Path<Uuid>,
    Json(_req): Json<CompleteUploadRequest>,
) -> Result<Json<CompleteUploadResponse>, AppError> {
    let session = DawProjectsRepo::get_upload_session(&state.db, session_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Upload session not found".to_string()))?;

    // TODO: Verify all chunks received
    // TODO: Create project and version records
    // TODO: Mark session complete

    DawProjectsRepo::complete_upload_session(&state.db, session_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(CompleteUploadResponse {
        project_id: Uuid::new_v4(), // TODO: return actual project_id
        version_number: 1,
        file_size: session.total_size,
        created_at: Utc::now(),
    }))
}

/// GET /api/daw/:project_id/download/:version_id - Download project file
async fn download_project(
    State(_state): State<Arc<AppState>>,
    Extension(_auth): Extension<AuthContext>,
    Path((_project_id, _version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<DownloadMetadata>, AppError> {
    // TODO: Generate presigned R2 URL
    // TODO: Return download metadata
    Err(AppError::Internal(
        "Download requires R2 presigned URL generation".to_string(),
    ))
}
