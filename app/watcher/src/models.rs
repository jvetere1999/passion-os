/// Data models for DAW Watcher
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A watched DAW project directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchedProject {
    pub id: String,
    pub name: String,
    pub path: String,
    pub daw_type: DawType,
    pub file_patterns: Vec<String>,
    pub last_sync: Option<DateTime<Utc>>,
    pub sync_status: SyncStatus,
    pub created_at: DateTime<Utc>,
}

/// Supported DAW types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DawType {
    #[serde(rename = "ableton")]
    Ableton,
    #[serde(rename = "flstudio")]
    FlStudio,
    #[serde(rename = "logic")]
    Logic,
    #[serde(rename = "cubase")]
    Cubase,
    #[serde(rename = "protools")]
    ProTools,
}

impl DawType {
    pub fn extensions(&self) -> Vec<&'static str> {
        match self {
            Self::Ableton => vec![".als"],
            Self::FlStudio => vec![".flp"],
            Self::Logic => vec![".logicx"],
            Self::Cubase => vec![".cpr"],
            Self::ProTools => vec![".ptx", ".pts"],
        }
    }

    pub fn watch_patterns(&self) -> Vec<String> {
        let extensions = self.extensions();
        extensions
            .iter()
            .map(|ext| format!("**/*{}", ext))
            .collect()
    }
}

/// Sync status of a project
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncStatus {
    Idle,
    Syncing,
    Success,
    Error,
    Paused,
}

/// Detected file change
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: String,
    pub change_type: FileChangeType,
    pub timestamp: DateTime<Utc>,
    pub file_size: Option<u64>,
}

/// Type of file change detected
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileChangeType {
    Created,
    Modified,
    Deleted,
    Renamed,
}

/// Sync operation result
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub project_id: String,
    pub success: bool,
    pub files_synced: usize,
    pub total_size: u64,
    pub error_message: Option<String>,
    pub duration_ms: u64,
    pub timestamp: DateTime<Utc>,
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatcherSettings {
    pub auto_sync_enabled: bool,
    pub sync_interval_secs: u64,
    pub max_file_size_mb: u64,
    pub upload_chunk_size_mb: u32,
    pub encrypt_files: bool,
    pub api_base_url: String,
    pub auth_token: Option<String>,
}

impl Default for WatcherSettings {
    fn default() -> Self {
        Self {
            auto_sync_enabled: true,
            sync_interval_secs: 300, // 5 minutes
            max_file_size_mb: 5000, // 5GB
            upload_chunk_size_mb: 5,
            encrypt_files: true,
            api_base_url: "https://api.ecent.online".to_string(),
            auth_token: None,
        }
    }
}

/// Sync statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStats {
    pub total_syncs: u64,
    pub successful_syncs: u64,
    pub failed_syncs: u64,
    pub total_files_synced: u64,
    pub total_bytes_synced: u64,
    pub last_sync_time: Option<DateTime<Utc>>,
}

impl Default for SyncStats {
    fn default() -> Self {
        Self {
            total_syncs: 0,
            successful_syncs: 0,
            failed_syncs: 0,
            total_files_synced: 0,
            total_bytes_synced: 0,
            last_sync_time: None,
        }
    }
}

/// Upload progress for frontend
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadProgress {
    pub session_id: String,
    pub total_size: u64,
    pub uploaded_size: u64,
    pub file_name: String,
    pub status: UploadStatus,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UploadStatus {
    Starting,
    Uploading,
    Completing,
    Complete,
    Failed,
}
