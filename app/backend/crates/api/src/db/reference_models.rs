//! Reference tracks database models
//!
//! Models for the Critical Listening domain: tracks, analyses, annotations, regions.

#![allow(dead_code)]

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Reference track status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum TrackStatus {
    Uploading,
    Processing,
    Ready,
    Error,
}

impl Default for TrackStatus {
    fn default() -> Self {
        Self::Ready
    }
}

impl std::fmt::Display for TrackStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TrackStatus::Uploading => write!(f, "uploading"),
            TrackStatus::Processing => write!(f, "processing"),
            TrackStatus::Ready => write!(f, "ready"),
            TrackStatus::Error => write!(f, "error"),
        }
    }
}

/// Analysis status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AnalysisStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

impl Default for AnalysisStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Analysis type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[allow(dead_code)]
pub enum AnalysisType {
    Full,
    Quick,
    Spectral,
    Loudness,
}

impl Default for AnalysisType {
    fn default() -> Self {
        Self::Full
    }
}

/// Annotation category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AnnotationCategory {
    General,
    Technique,
    Mix,
    Mastering,
    Arrangement,
    Production,
}

impl Default for AnnotationCategory {
    fn default() -> Self {
        Self::General
    }
}

/// Section type for regions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum SectionType {
    Intro,
    Verse,
    Chorus,
    Bridge,
    Breakdown,
    Buildup,
    Drop,
    Outro,
    Custom,
}

impl Default for SectionType {
    fn default() -> Self {
        Self::Custom
    }
}

/// Reference track database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct ReferenceTrack {
    pub id: Uuid,
    pub user_id: Uuid,
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
    pub tags: serde_json::Value,
    pub status: String,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Track analysis database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TrackAnalysis {
    pub id: Uuid,
    pub track_id: Uuid,
    pub analysis_type: String,
    pub version: String,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub summary: serde_json::Value,
    pub manifest: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Track annotation database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TrackAnnotation {
    pub id: Uuid,
    pub track_id: Uuid,
    pub user_id: Uuid,
    pub start_time_ms: i32,
    pub end_time_ms: Option<i32>,
    pub title: String,
    pub content: Option<String>,
    pub category: String,
    pub color: String,
    pub is_private: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Track region database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TrackRegion {
    pub id: Uuid,
    pub track_id: Uuid,
    pub user_id: Uuid,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub name: String,
    pub description: Option<String>,
    pub section_type: String,
    pub color: String,
    pub display_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// =============================================================================
// Input types for creating/updating
// =============================================================================

/// Input for creating a reference track
#[derive(Debug, Clone, Deserialize)]
pub struct CreateTrackInput {
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

/// Input for updating a reference track
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTrackInput {
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

/// Input for creating an annotation
#[derive(Debug, Clone, Deserialize)]
pub struct CreateAnnotationInput {
    pub start_time_ms: i32,
    pub end_time_ms: Option<i32>,
    pub title: String,
    pub content: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub is_private: Option<bool>,
}

/// Input for updating an annotation
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateAnnotationInput {
    pub start_time_ms: Option<i32>,
    pub end_time_ms: Option<i32>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub is_private: Option<bool>,
}

/// Input for creating a region
#[derive(Debug, Clone, Deserialize)]
pub struct CreateRegionInput {
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub name: String,
    pub description: Option<String>,
    pub section_type: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

/// Input for updating a region
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateRegionInput {
    pub start_time_ms: Option<i32>,
    pub end_time_ms: Option<i32>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub section_type: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

/// Input for starting an analysis
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct StartAnalysisInput {
    pub analysis_type: Option<String>,
}

// =============================================================================
// Response types
// =============================================================================

/// Track with summary information
#[derive(Debug, Clone, Serialize)]
#[allow(dead_code)]
pub struct TrackWithSummary {
    #[serde(flatten)]
    pub track: ReferenceTrack,
    pub annotation_count: i64,
    pub region_count: i64,
    pub has_analysis: bool,
    pub latest_analysis: Option<AnalysisSummary>,
}

/// Analysis summary (without full manifest)
#[derive(Debug, Clone, Serialize)]
pub struct AnalysisSummary {
    pub id: Uuid,
    pub analysis_type: String,
    pub version: String,
    pub status: String,
    pub summary: serde_json::Value,
    pub completed_at: Option<DateTime<Utc>>,
}

/// Paginated list response
#[derive(Debug, Clone, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}

impl<T> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, total: i64, page: i32, page_size: i32) -> Self {
        let total_pages = ((total as f64) / (page_size as f64)).ceil() as i32;
        Self {
            data,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}
