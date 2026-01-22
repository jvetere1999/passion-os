/// Backend API client for DAW Watcher
/// Handles authentication, file uploads, and project management
use crate::chunking::{build_chunk_descriptors, ChunkDescriptor, ChunkSettings};
use crate::compression::compress_zstd;
use crate::models::WatcherSettings;
use crate::packager::build_tar_archive;
use reqwest::Client;
use std::path::Path;
use tracing::info;

#[allow(dead_code)]
pub struct ApiClient {
    client: Client,
    base_url: String,
    auth_token: Option<String>,
}

impl ApiClient {
    /// Creates a new API client
    pub fn new(settings: &WatcherSettings) -> Self {
        Self {
            client: Client::new(),
            base_url: settings.api_base_url.clone(),
            auth_token: settings.auth_token.clone(),
        }
    }

    /// Uploads a DAW project file
    pub async fn upload_project(
        &self,
        project_name: &str,
        content_type: &str,
        file_path: &Path,
    ) -> Result<String, String> {
        let effective_content_type = if file_path.is_dir() {
            "application/vnd.ignition.daw-project+tar"
        } else {
            content_type
        };

        let file_data = if file_path.is_dir() {
            build_tar_archive(file_path)?
        } else {
            std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?
        };

        let file_size = file_data.len() as u64;
        let file_hash = self.calculate_hash(&file_data);

        let chunk_settings = ChunkSettings::default();
        let chunk_descriptors = build_chunk_descriptors(&file_data, &chunk_settings);

        let manifest = build_manifest(
            &file_hash,
            file_size,
            &chunk_settings,
            &chunk_descriptors,
        );

        let session_id = self
            .initiate_upload(
                project_name,
                effective_content_type,
                file_size,
                &file_hash,
                chunk_descriptors.len() as i32,
            )
            .await?;

        info!(
            "Initiated upload session {} for {} ({})",
            session_id, project_name, effective_content_type
        );

        let missing = self
            .check_missing_chunks(&session_id, &manifest)
            .await?;

        self.upload_chunks(&session_id, &file_data, &chunk_descriptors, &missing)
            .await?;

        // Complete upload
        self.complete_upload(&session_id, &manifest, &file_hash)
            .await?;

        info!("Upload completed: {} ({})", project_name, session_id);

        Ok(session_id)
    }

    /// Lists all projects for the authenticated user
    pub async fn list_projects(&self) -> Result<Vec<ProjectInfo>, String> {
        let url = format!("{}/api/daw/", self.base_url);

        let response = self
            .client
            .get(&url)
            .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
            .send()
            .await
            .map_err(|e| format!("Failed to list projects: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to list projects: {}", response.status()));
        }

        let data = response
            .json::<ProjectListResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(data.projects)
    }

    /// Gets sync status from backend
    pub async fn get_sync_status(&self) -> Result<SyncStatusResponse, String> {
        let url = format!("{}/api/daw/sync-status", self.base_url);

        let response = self
            .client
            .get(&url)
            .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
            .send()
            .await
            .map_err(|e| format!("Failed to get sync status: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get sync status: {}", response.status()));
        }

        response
            .json::<SyncStatusResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Initiates an upload session
    async fn initiate_upload(
        &self,
        project_name: &str,
        content_type: &str,
        total_size: u64,
        file_hash: &str,
        total_chunks: i32,
    ) -> Result<String, String> {
        let url = format!("{}/api/daw/", self.base_url);

        let body = serde_json::json!({
            "project_name": project_name,
            "content_type": content_type,
            "total_size": total_size,
            "file_hash": file_hash,
            "total_chunks": total_chunks,
            "compression": "zstd",
            "chunking": "gear",
        });

        let response = self
            .client
            .post(&url)
            .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to initiate upload: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to initiate upload: {}",
                response.status()
            ));
        }

        let data = response
            .json::<InitiateUploadResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(data.session_id)
    }

    /// Uploads file chunks
    async fn upload_chunks(
        &self,
        session_id: &str,
        file_data: &[u8],
        chunks: &[ChunkDescriptor],
        missing: &[String],
    ) -> Result<(), String> {
        let total_chunks = chunks.len();
        let missing_set: std::collections::HashSet<&String> = missing.iter().collect();

        for chunk in chunks {
            if !missing_set.contains(&chunk.hash) {
                continue;
            }

            let start = chunk.offset;
            let end = chunk.offset + chunk.length;
            let slice = &file_data[start..end];
            let compressed = compress_zstd(slice)?;
            let url = format!(
                "{}/api/daw/upload/{}/chunk",
                self.base_url, session_id
            );

            let mut form = reqwest::multipart::Form::new();
            form = form.part(
                "chunk",
                reqwest::multipart::Part::bytes(compressed),
            );
            form = form.text("chunk_hash", chunk.hash.clone());
            form = form.text("compression", "zstd");
            form = form.text("encryption", "none");

            let response: reqwest::Response = self
                .client
                .post(&url)
                .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
                .multipart(form)
                .send()
                .await
                .map_err(|e| format!("Failed to upload chunk {}: {}", chunk.index, e))?;

            if !response.status().is_success() {
                return Err(format!(
                    "Failed to upload chunk {}: {}",
                    chunk.index,
                    response.status()
                ));
            }

            info!("Uploaded chunk {}/{}", chunk.index + 1, total_chunks);
        }

        Ok(())
    }

    /// Completes an upload session
    async fn complete_upload(
        &self,
        session_id: &str,
        manifest: &ChunkManifest,
        file_hash: &str,
    ) -> Result<(), String> {
        let url = format!(
            "{}/api/daw/upload/{}/complete",
            self.base_url, session_id
        );

        let body = serde_json::json!({
            "file_hash": file_hash,
            "change_description": "Uploaded by DAW Watcher",
            "manifest": manifest,
        });

        let response = self
            .client
            .post(&url)
            .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to complete upload: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to complete upload: {}",
                response.status()
            ));
        }

        Ok(())
    }

    fn calculate_hash(&self, data: &[u8]) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data);
        format!("{:x}", hasher.finalize())
    }

    async fn check_missing_chunks(
        &self,
        session_id: &str,
        manifest: &ChunkManifest,
    ) -> Result<Vec<String>, String> {
        let url = format!(
            "{}/api/daw/upload/{}/chunks/check",
            self.base_url, session_id
        );

        let body = serde_json::json!({
            "chunk_hashes": manifest.chunks.iter().map(|c| c.hash.clone()).collect::<Vec<_>>(),
            "compression": manifest.compression.algo.as_str(),
            "encryption": "none",
        });

        let response = self
            .client
            .post(&url)
            .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to check chunks: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to check chunks: {}", response.status()));
        }

        let data = response
            .json::<ChunkCheckResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(data.missing)
    }
}

// Response types

#[derive(Debug, serde::Deserialize)]
struct InitiateUploadResponse {
    session_id: String,
}

#[derive(Debug, serde::Deserialize)]
struct ProjectListResponse {
    projects: Vec<ProjectInfo>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct ProjectInfo {
    pub id: String,
    pub project_name: String,
    pub content_type: String,
    pub file_size: u64,
    pub version_count: u32,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct SyncStatusResponse {
    pub syncing: bool,
    pub last_sync_time: Option<String>,
    pub total_synced_files: u64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct ChunkManifest {
    version: i32,
    total_size: i64,
    file_hash: String,
    compression: CompressionConfig,
    chunking: ChunkingConfig,
    chunks: Vec<ChunkManifestEntry>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct CompressionConfig {
    algo: String,
    level: i32,
    rsyncable: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct ChunkingConfig {
    algo: String,
    min_size: i64,
    avg_size: i64,
    max_size: i64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct ChunkManifestEntry {
    index: i32,
    hash: String,
    size: i64,
    compressed_size: Option<i64>,
}

#[derive(Debug, serde::Deserialize)]
struct ChunkCheckResponse {
    missing: Vec<String>,
}

fn build_manifest(
    file_hash: &str,
    total_size: u64,
    settings: &ChunkSettings,
    chunks: &[ChunkDescriptor],
) -> ChunkManifest {
    ChunkManifest {
        version: 1,
        total_size: total_size as i64,
        file_hash: file_hash.to_string(),
        compression: CompressionConfig {
            algo: "zstd".to_string(),
            level: crate::compression::ZSTD_LEVEL,
            rsyncable: true,
        },
        chunking: ChunkingConfig {
            algo: "gear".to_string(),
            min_size: settings.min_size as i64,
            avg_size: settings.avg_size as i64,
            max_size: settings.max_size as i64,
        },
        chunks: chunks
            .iter()
            .map(|chunk| ChunkManifestEntry {
                index: chunk.index as i32,
                hash: chunk.hash.clone(),
                size: chunk.size as i64,
                compressed_size: None,
            })
            .collect(),
    }
}
