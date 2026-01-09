//! R2/S3 Storage Client
//!
//! Backend-only storage client for Cloudflare R2 (S3-compatible).
//! Frontend never receives credentials - all access is through backend APIs.
//! Uses rust-s3 crate for lightweight S3 compatibility.

use chrono::Utc;
use s3::creds::Credentials;
use s3::region::Region;
use s3::Bucket;
use std::sync::Arc;
use uuid::Uuid;

use super::types::*;
use crate::config::StorageConfig;
use crate::error::AppError;

/// R2 Storage Client
///
/// Provides secure, backend-only access to R2/S3 storage.
/// Implements prefix-based user isolation to prevent IDOR.
#[derive(Clone)]
pub struct StorageClient {
    bucket: Arc<Bucket>,
}

impl StorageClient {
    /// Create a new storage client from config
    pub async fn new(config: &StorageConfig) -> Result<Self, AppError> {
        let endpoint = config
            .endpoint
            .as_ref()
            .ok_or_else(|| AppError::Config("STORAGE_ENDPOINT required".to_string()))?;

        let bucket_name = config
            .bucket
            .as_ref()
            .ok_or_else(|| AppError::Config("STORAGE_BUCKET required".to_string()))?
            .clone();

        let access_key = config
            .access_key_id
            .as_ref()
            .ok_or_else(|| AppError::Config("STORAGE_ACCESS_KEY_ID required".to_string()))?;

        let secret_key = config
            .secret_access_key
            .as_ref()
            .ok_or_else(|| AppError::Config("STORAGE_SECRET_ACCESS_KEY required".to_string()))?;

        let credentials = Credentials::new(
            Some(access_key),
            Some(secret_key),
            None, // security token
            None, // session token
            None, // profile
        )
        .map_err(|e| AppError::Config(format!("Invalid credentials: {}", e)))?;

        let region = Region::Custom {
            region: config.region.clone(),
            endpoint: endpoint.clone(),
        };

        let bucket = Bucket::new(&bucket_name, region, credentials)
            .map_err(|e| AppError::Config(format!("Failed to create bucket: {}", e)))?
            .with_path_style(); // Required for MinIO/R2 compatibility

        Ok(Self {
            bucket: Arc::new(*bucket),
        })
    }

    /// Upload a blob to storage
    ///
    /// Returns the blob ID and key. The key includes the user's prefix for isolation.
    pub async fn upload(&self, request: UploadRequest) -> Result<UploadResponse, AppError> {
        // Validate MIME type
        if !is_allowed_mime_type(&request.mime_type) {
            return Err(AppError::Validation(format!(
                "MIME type {} not allowed",
                request.mime_type
            )));
        }

        // Validate file size
        let size = request.data.len() as u64;
        validate_file_size(size, &request.mime_type).map_err(AppError::Validation)?;

        // Generate key with user prefix for isolation
        let category = BlobCategory::from_mime_type(&request.mime_type);
        let extension = get_extension_from_mime(&request.mime_type);
        let (blob_id, key) = generate_blob_key(&request.user_id, category, extension);

        // Build metadata
        let _metadata = BlobMetadata {
            user_id: request.user_id,
            filename: request.filename.clone(),
            uploaded_at: Utc::now().to_rfc3339(),
            custom: request.metadata,
        };

        // Upload to S3/R2 with rust-s3
        self.bucket
            .put_object_with_content_type(&key, &request.data, &request.mime_type)
            .await
            .map_err(|e| AppError::Internal(format!("S3 upload failed: {}", e)))?;

        Ok(UploadResponse {
            id: blob_id,
            key,
            size_bytes: size,
            mime_type: request.mime_type,
            category,
        })
    }

    /// Get a blob by ID, searching under the user's prefix only (IDOR prevention)
    pub async fn get_blob_by_id(
        &self,
        user_id: &Uuid,
        blob_id: &Uuid,
    ) -> Result<Option<(Vec<u8>, String)>, AppError> {
        // Search all categories under user's prefix
        let categories = [
            BlobCategory::Audio,
            BlobCategory::Images,
            BlobCategory::Exports,
            BlobCategory::Other,
        ];

        for category in categories {
            let prefix = format!("{}/{}/{}", user_id, category.as_str(), blob_id);

            let list_result = self
                .bucket
                .list(prefix, Some("/".to_string()))
                .await
                .map_err(|e| AppError::Internal(format!("S3 list failed: {}", e)))?;

            for result in &list_result {
                if let Some(obj) = result.contents.first() {
                    let key = &obj.key;
                    // Found the blob, now get it
                    let response = self
                        .bucket
                        .get_object(key)
                        .await
                        .map_err(|e| AppError::Internal(format!("S3 get failed: {}", e)))?;

                    let content_type = response
                        .headers()
                        .get("content-type")
                        .map(|s| s.to_string())
                        .unwrap_or_else(|| "application/octet-stream".to_string());

                    return Ok(Some((response.to_vec(), content_type)));
                }
            }
        }

        Ok(None)
    }

    /// Get blob info by ID without downloading content
    pub async fn get_blob_info(
        &self,
        user_id: &Uuid,
        blob_id: &Uuid,
    ) -> Result<Option<BlobInfo>, AppError> {
        let categories = [
            BlobCategory::Audio,
            BlobCategory::Images,
            BlobCategory::Exports,
            BlobCategory::Other,
        ];

        for category in categories {
            let prefix = format!("{}/{}/{}", user_id, category.as_str(), blob_id);

            let list_result = self
                .bucket
                .list(prefix, Some("/".to_string()))
                .await
                .map_err(|e| AppError::Internal(format!("S3 list failed: {}", e)))?;

            for result in &list_result {
                if let Some(obj) = result.contents.first() {
                    let key = &obj.key;
                    // Get metadata via HEAD
                    let (head_result, code) = self
                        .bucket
                        .head_object(key)
                        .await
                        .map_err(|e| AppError::Internal(format!("S3 head failed: {}", e)))?;

                    if code != 200 {
                        continue;
                    }

                    let parsed = parse_blob_key(key);
                    let filename = "unknown".to_string(); // rust-s3 doesn't expose metadata in HEAD easily

                    let uploaded_at = obj.last_modified.clone();

                    return Ok(Some(BlobInfo {
                        id: *blob_id,
                        key: key.to_string(),
                        size_bytes: head_result.content_length.unwrap_or(0) as u64,
                        mime_type: head_result
                            .content_type
                            .unwrap_or_else(|| "application/octet-stream".to_string()),
                        category: parsed.map(|p| p.category).unwrap_or(BlobCategory::Other),
                        filename,
                        uploaded_at,
                        etag: obj.e_tag.clone(),
                    }));
                }
            }
        }

        Ok(None)
    }

    /// Delete a blob by ID (only if owned by user)
    pub async fn delete_blob_by_id(
        &self,
        user_id: &Uuid,
        blob_id: &Uuid,
    ) -> Result<bool, AppError> {
        let categories = [
            BlobCategory::Audio,
            BlobCategory::Images,
            BlobCategory::Exports,
            BlobCategory::Other,
        ];

        for category in categories {
            let prefix = format!("{}/{}/{}", user_id, category.as_str(), blob_id);

            let list_result = self
                .bucket
                .list(prefix, Some("/".to_string()))
                .await
                .map_err(|e| AppError::Internal(format!("S3 list failed: {}", e)))?;

            for result in &list_result {
                if let Some(obj) = result.contents.first() {
                    let key = &obj.key;
                    self.bucket
                        .delete_object(key)
                        .await
                        .map_err(|e| AppError::Internal(format!("S3 delete failed: {}", e)))?;

                    return Ok(true);
                }
            }
        }

        Ok(false)
    }

    /// List blobs for a user, optionally filtered by category
    pub async fn list_blobs(
        &self,
        user_id: &Uuid,
        category: Option<BlobCategory>,
    ) -> Result<Vec<BlobInfo>, AppError> {
        let prefix = match category {
            Some(cat) => format!("{}/{}/", user_id, cat.as_str()),
            None => format!("{}/", user_id),
        };

        let list_result = self
            .bucket
            .list(prefix, None)
            .await
            .map_err(|e| AppError::Internal(format!("S3 list failed: {}", e)))?;

        let mut blobs = Vec::new();

        for result in list_result {
            for obj in &result.contents {
                let key = &obj.key;
                if let Some(parsed) = parse_blob_key(key) {
                    blobs.push(BlobInfo {
                        id: parsed.blob_id,
                        key: key.to_string(),
                        size_bytes: obj.size as u64,
                        mime_type: "unknown".to_string(), // Would need HEAD for this
                        category: parsed.category,
                        filename: "unknown".to_string(),
                        uploaded_at: obj.last_modified.clone(),
                        etag: obj.e_tag.clone(),
                    });
                }
            }
        }

        Ok(blobs)
    }

    /// Generate a signed download URL (short-lived) for a blob by user_id and blob_id
    ///
    /// This allows frontend to download directly without proxying through backend.
    /// URL expires in SIGNED_URL_EXPIRY_SECONDS.
    ///
    /// NOTE: Deprecated in favor of generate_signed_download_url_for_blob
    #[allow(dead_code)]
    pub async fn generate_signed_download_url_by_id(
        &self,
        user_id: &Uuid,
        blob_id: &Uuid,
    ) -> Result<Option<SignedUrlResponse>, AppError> {
        // First find the blob (verifies ownership via prefix)
        let info = self.get_blob_info(user_id, blob_id).await?;

        let info = match info {
            Some(i) => i,
            None => return Ok(None),
        };

        let url = self
            .bucket
            .presign_get(&info.key, SIGNED_URL_EXPIRY_SECONDS as u32, None)
            .await
            .map_err(|e| AppError::Internal(format!("Presign failed: {}", e)))?;

        let expires_at = Utc::now() + chrono::Duration::seconds(SIGNED_URL_EXPIRY_SECONDS as i64);

        Ok(Some(SignedUrlResponse {
            url,
            expires_at: expires_at.to_rfc3339(),
            method: "GET".to_string(),
        }))
    }

    /// Generate a signed upload URL (short-lived)
    ///
    /// This allows frontend to upload directly without proxying through backend.
    /// Returns the key that will be created.
    pub async fn generate_signed_upload_url(
        &self,
        user_id: &Uuid,
        mime_type: &str,
        _filename: &str,
    ) -> Result<SignedUrlResponse, AppError> {
        // Validate MIME type
        if !is_allowed_mime_type(mime_type) {
            return Err(AppError::Validation(format!(
                "MIME type {} not allowed",
                mime_type
            )));
        }

        // Generate key with user prefix for isolation
        let category = BlobCategory::from_mime_type(mime_type);
        let extension = get_extension_from_mime(mime_type);
        let (_blob_id, key) = generate_blob_key(user_id, category, extension);

        // rust-s3 presign_put takes: path, expiry_secs, custom_headers, custom_queries
        // We pass None for custom headers and queries
        let url = self
            .bucket
            .presign_put(&key, SIGNED_UPLOAD_URL_EXPIRY_SECONDS as u32, None, None)
            .await
            .map_err(|e| AppError::Internal(format!("Presign failed: {}", e)))?;

        let expires_at =
            Utc::now() + chrono::Duration::seconds(SIGNED_UPLOAD_URL_EXPIRY_SECONDS as i64);

        Ok(SignedUrlResponse {
            url,
            expires_at: expires_at.to_rfc3339(),
            method: "PUT".to_string(),
        })
    }

    /// Get total storage usage for a user
    pub async fn get_user_storage_usage(&self, user_id: &Uuid) -> Result<u64, AppError> {
        let prefix = format!("{}/", user_id);

        let list_result = self
            .bucket
            .list(prefix, None)
            .await
            .map_err(|e| AppError::Internal(format!("S3 list failed: {}", e)))?;

        let total: u64 = list_result
            .iter()
            .flat_map(|r| &r.contents)
            .map(|o| o.size as u64)
            .sum();

        Ok(total)
    }

    /// Check if bucket exists and is accessible
    #[allow(dead_code)]
    pub async fn health_check(&self) -> Result<bool, AppError> {
        // rust-s3: list with empty prefix to check connectivity
        self.bucket
            .list("".to_string(), Some("/".to_string()))
            .await
            .map_err(|e| AppError::Internal(format!("S3 health check failed: {}", e)))?;

        Ok(true)
    }

    /// Delete a blob by its full R2 key (no ownership check - caller must verify)
    pub async fn delete_by_key(&self, key: &str) -> Result<bool, AppError> {
        self.bucket
            .delete_object(key)
            .await
            .map_err(|e| AppError::Internal(format!("S3 delete failed: {}", e)))?;

        Ok(true)
    }

    /// Generate a signed download URL for a specific key (no ownership check - caller must verify)
    pub async fn generate_signed_download_url(
        &self,
        key: &str,
    ) -> Result<SignedUrlResponse, AppError> {
        let url = self
            .bucket
            .presign_get(key, SIGNED_URL_EXPIRY_SECONDS as u32, None)
            .await
            .map_err(|e| AppError::Internal(format!("Presign failed: {}", e)))?;

        let expires_at = Utc::now() + chrono::Duration::seconds(SIGNED_URL_EXPIRY_SECONDS as i64);

        Ok(SignedUrlResponse {
            url,
            expires_at: expires_at.to_rfc3339(),
            method: "GET".to_string(),
        })
    }

    /// Generate a signed download URL by user ID and blob ID (with ownership check)
    pub async fn generate_signed_download_url_for_blob(
        &self,
        user_id: &Uuid,
        blob_id: &Uuid,
    ) -> Result<Option<SignedUrlResponse>, AppError> {
        // First find the blob (verifies ownership via prefix)
        let info = self.get_blob_info(user_id, blob_id).await?;

        let info = match info {
            Some(i) => i,
            None => return Ok(None),
        };

        let response = self.generate_signed_download_url(&info.key).await?;
        Ok(Some(response))
    }
}
