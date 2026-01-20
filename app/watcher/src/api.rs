/// Backend API client for DAW Watcher
/// Handles authentication, file uploads, and project management
use crate::models::WatcherSettings;
use reqwest::Client;
use std::path::Path;
use tracing::info;

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
        let file_size = std::fs::metadata(file_path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .len();

        // Calculate file hash
        let file_data = std::fs::read(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        let file_hash = self.calculate_hash(&file_data);

        // Initiate upload session
        let session_id = self
            .initiate_upload(project_name, content_type, file_size, &file_hash)
            .await?;

        info!(
            "Initiated upload session {} for {} ({})",
            session_id, project_name, content_type
        );

        // Upload file chunks
        self.upload_chunks(&session_id, &file_data, content_type)
            .await?;

        // Complete upload
        self.complete_upload(&session_id, project_name, &file_hash)
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
    ) -> Result<String, String> {
        let url = format!("{}/api/daw/", self.base_url);

        let body = serde_json::json!({
            "project_name": project_name,
            "content_type": content_type,
            "total_size": total_size,
            "file_hash": file_hash,
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
        _content_type: &str,
    ) -> Result<(), String> {
        const CHUNK_SIZE: usize = 5 * 1024 * 1024; // 5MB
        let total_chunks = (file_data.len() + CHUNK_SIZE - 1) / CHUNK_SIZE;

        for chunk_num in 0..total_chunks {
            let start = chunk_num * CHUNK_SIZE;
            let end = std::cmp::min(start + CHUNK_SIZE, file_data.len());
            let chunk = &file_data[start..end];

            let url = format!(
                "{}/api/daw/upload/{}/chunk",
                self.base_url, session_id
            );

            let mut form = reqwest::multipart::Form::new();
            form = form.part(
                "chunk",
                reqwest::multipart::Part::bytes(chunk.to_vec()),
            );
            form = form.text("chunk_number", chunk_num.to_string());
            form = form.text("total_chunks", total_chunks.to_string());

            let response: reqwest::Response = self
                .client
                .post(&url)
                .bearer_auth(self.auth_token.as_ref().unwrap_or(&String::new()))
                .multipart(form)
                .send()
                .await
                .map_err(|e| format!("Failed to upload chunk {}: {}", chunk_num, e))?;

            if !response.status().is_success() {
                return Err(format!(
                    "Failed to upload chunk {}: {}",
                    chunk_num,
                    response.status()
                ));
            }

            info!("Uploaded chunk {}/{}", chunk_num + 1, total_chunks);
        }

        Ok(())
    }

    /// Completes an upload session
    async fn complete_upload(
        &self,
        session_id: &str,
        _project_name: &str,
        file_hash: &str,
    ) -> Result<(), String> {
        let url = format!(
            "{}/api/daw/upload/{}/complete",
            self.base_url, session_id
        );

        let body = serde_json::json!({
            "file_hash": file_hash,
            "change_description": "Uploaded by DAW Watcher",
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
