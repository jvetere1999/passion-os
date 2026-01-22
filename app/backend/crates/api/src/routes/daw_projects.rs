use crate::db::daw_chunk_repos::DawChunkRepo;
use crate::db::daw_project_models::*;
use crate::db::daw_project_repos::DawProjectsRepo;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use axum::{
    extract::Multipart,
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
        .route(
            "/{project_id}/versions/{version_id}/restore",
            post(restore_version),
        )
        .route("/upload/{session_id}/chunks/check", post(check_chunks))
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
        return Err(AppError::Validation("total_size must be > 0".to_string()));
    }

    if req.total_size > 5_000_000_000 {
        // 5GB max
        return Err(AppError::Validation("File too large (max 5GB)".to_string()));
    }

    let chunk_size = 5_242_880; // 5MB fallback
    let total_chunks = req
        .total_chunks
        .filter(|count| *count > 0)
        .unwrap_or_else(|| ((req.total_size + chunk_size - 1) / chunk_size) as i32);
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

/// POST /api/daw/upload/:session_id/chunks/check - Check missing chunks
async fn check_chunks(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<ChunkCheckRequest>,
) -> Result<Json<ChunkCheckResponse>, AppError> {
    let _session = DawProjectsRepo::get_upload_session(&state.db, session_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Upload session not found".to_string()))?;

    let encryption = req.encryption.as_deref().unwrap_or("none");
    let existing = DawChunkRepo::list_existing_hashes(
        &state.db,
        &req.chunk_hashes,
        &req.compression,
        encryption,
    )
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let missing = req
        .chunk_hashes
        .into_iter()
        .filter(|hash| !existing.contains(hash))
        .collect();

    Ok(Json(ChunkCheckResponse { missing }))
}

/// POST /api/daw/upload/:session_id/chunk - Upload file chunk
async fn upload_chunk(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(session_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<UploadChunkResponse>, AppError> {
    let session = DawProjectsRepo::get_upload_session(&state.db, session_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Upload session not found".to_string()))?;

    let storage = state
        .storage
        .as_ref()
        .ok_or(AppError::Internal("Storage not configured".to_string()))?;

    let mut chunk_hash = None;
    let mut compression = "zstd".to_string();
    let mut encryption = "none".to_string();
    let mut chunk_data: Option<Vec<u8>> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::Validation(format!("Failed to parse multipart field: {}", e))
    })? {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "chunk" => {
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| AppError::Validation(format!("Failed to read chunk: {}", e)))?;
                chunk_data = Some(data.to_vec());
            }
            "chunk_hash" => {
                chunk_hash = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::Validation(format!("Invalid chunk_hash: {}", e)))?,
                );
            }
            "compression" => {
                compression = field
                    .text()
                    .await
                    .map_err(|e| AppError::Validation(format!("Invalid compression: {}", e)))?;
            }
            "encryption" => {
                encryption = field
                    .text()
                    .await
                    .map_err(|e| AppError::Validation(format!("Invalid encryption: {}", e)))?;
            }
            _ => {}
        }
    }

    let chunk_hash = chunk_hash.ok_or(AppError::Validation("chunk_hash missing".to_string()))?;
    let chunk_data = chunk_data.ok_or(AppError::Validation("chunk missing".to_string()))?;

    let existing = DawChunkRepo::list_existing_hashes(
        &state.db,
        &[chunk_hash.clone()],
        &compression,
        &encryption,
    )
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let mut chunks_received = session.chunks_received;

    if !existing.contains(&chunk_hash) {
        let storage_key = format!(
            "daw/{}/chunks/{}/{}.zst",
            auth.user_id, compression, chunk_hash
        );

        storage
            .upload_raw(&storage_key, &chunk_data, "application/zstd")
            .await?;

        DawChunkRepo::insert_chunk(
            &state.db,
            &chunk_hash,
            &compression,
            &encryption,
            chunk_data.len() as i64,
            &storage_key,
        )
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        let new_chunks_received = std::cmp::min(session.total_chunks, session.chunks_received + 1);
        DawProjectsRepo::update_chunks_received(&state.db, session_id, new_chunks_received)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        chunks_received = new_chunks_received;
    }

    let remaining = (session.total_chunks - chunks_received).max(0);

    Ok(Json(UploadChunkResponse {
        chunk_number: chunks_received,
        received_at: Utc::now(),
        chunks_remaining: remaining,
    }))
}

/// POST /api/daw/upload/:session_id/complete - Finalize upload
async fn complete_upload(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<CompleteUploadRequest>,
) -> Result<Json<CompleteUploadResponse>, AppError> {
    let session = DawProjectsRepo::get_upload_session(&state.db, session_id, auth.user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or(AppError::NotFound("Upload session not found".to_string()))?;

    let storage = state
        .storage
        .as_ref()
        .ok_or(AppError::Internal("Storage not configured".to_string()))?;

    let manifest = &req.manifest;
    if manifest.total_size != session.total_size {
        return Err(AppError::Validation("Manifest size mismatch".to_string()));
    }
    if manifest.file_hash != req.file_hash {
        return Err(AppError::Validation("Manifest hash mismatch".to_string()));
    }
    if session.total_chunks != manifest.chunks.len() as i32 {
        return Err(AppError::Validation("Manifest chunk count mismatch".to_string()));
    }

    let encryption = "none";
    let existing = DawChunkRepo::list_existing_hashes(
        &state.db,
        &manifest
            .chunks
            .iter()
            .map(|chunk| chunk.hash.clone())
            .collect::<Vec<String>>(),
        &manifest.compression.algo,
        encryption,
    )
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let missing: Vec<String> = manifest
        .chunks
        .iter()
        .filter(|chunk| !existing.contains(&chunk.hash))
        .map(|chunk| chunk.hash.clone())
        .collect();

    if !missing.is_empty() {
        return Err(AppError::Validation(format!(
            "Missing {} chunks",
            missing.len()
        )));
    }

    let project = DawProjectsRepo::get_by_name(&state.db, auth.user_id, &session.project_name)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let (project_id, version_number) = match &project {
        Some(ref existing_project) => (existing_project.id, existing_project.version_count + 1),
        None => (Uuid::new_v4(), 1),
    };

    let manifest_key = format!(
        "daw/{}/projects/{}/v{}/manifest.json",
        auth.user_id, project_id, version_number
    );
    let manifest_bytes = serde_json::to_vec(manifest)
        .map_err(|e| AppError::Internal(format!("Failed to serialize manifest: {}", e)))?;

    storage
        .upload_raw(&manifest_key, &manifest_bytes, "application/json")
        .await?;

    let change_description = req.change_description.as_deref();
    let file_hash = req.file_hash.as_str();

    let _project_version = if let Some(existing_project) = project {
        let version = DawProjectsRepo::create_version(
            &state.db,
            existing_project.id,
            auth.user_id,
            existing_project.version_count + 1,
            session.total_size,
            file_hash,
            &manifest_key,
            change_description,
        )
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        DawProjectsRepo::update_current_version(
            &state.db,
            existing_project.id,
            version.id,
            existing_project.version_count + 1,
            version.file_size,
            &version.file_hash,
            &version.storage_key,
        )
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        (existing_project.id, version.version_number)
    } else {
        let version_id = Uuid::new_v4();
        let (project, version) = DawProjectsRepo::create_with_version(
            &state.db,
            project_id,
            version_id,
            auth.user_id,
            &session.project_name,
            &session.content_type,
            session.total_size,
            file_hash,
            &manifest_key,
            change_description,
        )
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        (project.id, version.version_number)
    };

    DawProjectsRepo::complete_upload_session(&state.db, session_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(CompleteUploadResponse {
        project_id,
        version_number,
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
