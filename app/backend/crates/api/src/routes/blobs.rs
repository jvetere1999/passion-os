//! Blob storage routes
//!
//! Provides safe R2 access APIs with IDOR prevention.
//! All operations verify user ownership via prefix-based isolation.

use std::sync::Arc;

use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::Response,
    routing::{delete, get, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::AuthContext;
use crate::state::AppState;
use crate::storage::{BlobCategory, BlobInfo, SignedUrlResponse, UploadRequest, UploadResponse};

/// Create blob routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Direct upload (backend proxies to R2)
        .route("/upload", post(upload_blob))
        // Signed URL for direct uploads (frontend uploads directly to R2)
        .route("/upload-url", post(get_upload_url))
        // Get blob by ID
        .route("/{id}", get(get_blob))
        // Get blob info (HEAD-like)
        .route("/{id}/info", get(get_blob_info))
        // Delete blob
        .route("/{id}", delete(delete_blob))
        // Get signed download URL
        .route("/{id}/download-url", get(get_download_url))
        // List user's blobs
        .route("/", get(list_blobs))
        // Get storage usage
        .route("/usage", get(get_storage_usage))
}

/// Upload a blob (multipart form data)
async fn upload_blob(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    mut multipart: Multipart,
) -> AppResult<Json<UploadResponse>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut mime_type: Option<String> = None;
    let mut metadata: Option<serde_json::Value> = None;

    // Parse multipart form
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Multipart error: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
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
            "metadata" => {
                let text = field
                    .text()
                    .await
                    .map_err(|e| AppError::BadRequest(format!("Metadata read error: {}", e)))?;
                metadata = serde_json::from_str(&text).ok();
            }
            _ => {}
        }
    }

    let data = file_data.ok_or_else(|| AppError::BadRequest("No file provided".to_string()))?;
    let filename = filename.unwrap_or_else(|| "unnamed".to_string());
    let mime_type = mime_type.unwrap_or_else(|| "application/octet-stream".to_string());

    let request = UploadRequest {
        user_id: auth.user_id,
        filename,
        mime_type,
        data,
        metadata,
    };

    let response = storage.upload(request).await?;

    Ok(Json(response))
}

#[derive(Deserialize)]
pub struct UploadUrlRequest {
    pub filename: String,
    pub mime_type: String,
}

/// Get a signed upload URL for direct frontend upload
async fn get_upload_url(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<UploadUrlRequest>,
) -> AppResult<Json<SignedUrlResponse>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let response = storage
        .generate_signed_upload_url(&auth.user_id, &request.mime_type, &request.filename)
        .await?;

    Ok(Json(response))
}

/// Get a blob by ID
async fn get_blob(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Response> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let result = storage.get_blob_by_id(&auth.user_id, &id).await?;

    match result {
        Some((data, content_type)) => {
            let body = Body::from(data);
            Ok(Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, content_type)
                .body(body)
                .unwrap())
        }
        None => Err(AppError::NotFound(format!("Blob {} not found", id))),
    }
}

/// Get blob info without content
async fn get_blob_info(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<BlobInfo>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let info = storage.get_blob_info(&auth.user_id, &id).await?;

    match info {
        Some(info) => Ok(Json(info)),
        None => Err(AppError::NotFound(format!("Blob {} not found", id))),
    }
}

/// Delete a blob
async fn delete_blob(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<DeleteResponse>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let deleted = storage.delete_blob_by_id(&auth.user_id, &id).await?;

    if deleted {
        Ok(Json(DeleteResponse { success: true }))
    } else {
        Err(AppError::NotFound(format!("Blob {} not found", id)))
    }
}

#[derive(Serialize)]
pub struct DeleteResponse {
    pub success: bool,
}

/// Get a signed download URL
async fn get_download_url(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<SignedUrlResponse>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let result = storage
        .generate_signed_download_url_for_blob(&auth.user_id, &id)
        .await?;

    match result {
        Some(response) => Ok(Json(response)),
        None => Err(AppError::NotFound(format!("Blob {} not found", id))),
    }
}

#[derive(Deserialize)]
pub struct ListBlobsQuery {
    pub category: Option<String>,
}

/// List user's blobs
async fn list_blobs(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Query(query): Query<ListBlobsQuery>,
) -> AppResult<Json<Vec<BlobInfo>>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let category: Option<BlobCategory> = query.category.as_ref().and_then(|c| c.parse().ok());

    let blobs = storage.list_blobs(&auth.user_id, category).await?;

    Ok(Json(blobs))
}

#[derive(Serialize)]
pub struct StorageUsageResponse {
    pub total_bytes: u64,
    pub formatted: String,
}

/// Get storage usage for user
async fn get_storage_usage(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> AppResult<Json<StorageUsageResponse>> {
    let storage = state
        .storage
        .as_ref()
        .ok_or_else(|| AppError::Config("Storage not configured".to_string()))?;

    let total = storage.get_user_storage_usage(&auth.user_id).await?;

    let formatted = format_bytes(total);

    Ok(Json(StorageUsageResponse {
        total_bytes: total,
        formatted,
    }))
}

/// Format bytes as human-readable string
fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}
