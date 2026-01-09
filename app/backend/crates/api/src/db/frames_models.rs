//! Analysis frames models
//!
//! Models for time-indexed frame data, manifests, and events transport.

#![allow(dead_code)]

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// =============================================================================
// Manifest Types
// =============================================================================

/// Band definition for frame data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandDefinition {
    /// Band name (e.g., "loudness", "spectrum", "rms")
    pub name: String,
    /// Data type ("float32", "float64", "int16")
    pub data_type: String,
    /// Number of values per frame for this band
    pub size: u32,
    /// Optional description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Optional unit (e.g., "dB", "Hz")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    /// Optional min/max range for normalization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_value: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_value: Option<f32>,
}

/// Frame layout entry (byte offsets for parsing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameLayoutEntry {
    pub band_name: String,
    pub byte_offset: u32,
    pub byte_size: u32,
}

/// Analysis event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    Transient,
    Beat,
    Downbeat,
    SectionStart,
    SectionEnd,
    Peak,
    Silence,
    Custom,
}

impl std::fmt::Display for EventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventType::Transient => write!(f, "transient"),
            EventType::Beat => write!(f, "beat"),
            EventType::Downbeat => write!(f, "downbeat"),
            EventType::SectionStart => write!(f, "section_start"),
            EventType::SectionEnd => write!(f, "section_end"),
            EventType::Peak => write!(f, "peak"),
            EventType::Silence => write!(f, "silence"),
            EventType::Custom => write!(f, "custom"),
        }
    }
}

/// Analysis event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub time_ms: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

// =============================================================================
// Database Models
// =============================================================================

/// Analysis frame manifest database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AnalysisFrameManifest {
    pub id: Uuid,
    pub analysis_id: Uuid,
    pub manifest_version: String,
    pub hop_ms: i32,
    pub frame_count: i32,
    pub duration_ms: i32,
    pub sample_rate: i32,
    pub bands: serde_json::Value,
    pub bytes_per_frame: i32,
    pub frame_layout: serde_json::Value,
    pub events: serde_json::Value,
    pub fingerprint: Option<String>,
    pub analyzer_version: String,
    pub chunk_size_frames: i32,
    pub total_chunks: i32,
    pub created_at: DateTime<Utc>,
}

/// Analysis frame data chunk database model
#[derive(Debug, Clone, FromRow)]
pub struct AnalysisFrameData {
    pub id: Uuid,
    pub manifest_id: Uuid,
    pub chunk_index: i32,
    pub start_frame: i32,
    pub end_frame: i32,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub frame_data: Vec<u8>,
    pub frame_count: i32,
    pub compressed: bool,
    pub compression_type: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Analysis event database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AnalysisEventRow {
    pub id: Uuid,
    pub analysis_id: Uuid,
    pub time_ms: i32,
    pub duration_ms: Option<i32>,
    pub event_type: String,
    pub event_data: serde_json::Value,
    pub confidence: Option<f32>,
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/// Frame manifest response (sent to frontend)
#[derive(Debug, Clone, Serialize)]
pub struct FrameManifestResponse {
    pub version: String,
    pub hop_ms: i32,
    pub frame_count: i32,
    pub duration_ms: i32,
    pub sample_rate: i32,
    pub bands: Vec<BandDefinition>,
    pub bytes_per_frame: i32,
    pub frame_layout: Vec<FrameLayoutEntry>,
    pub fingerprint: Option<String>,
    pub analyzer_version: String,
    pub chunk_size_frames: i32,
    pub total_chunks: i32,
}

impl From<&AnalysisFrameManifest> for FrameManifestResponse {
    fn from(m: &AnalysisFrameManifest) -> Self {
        let bands: Vec<BandDefinition> =
            serde_json::from_value(m.bands.clone()).unwrap_or_default();
        let frame_layout: Vec<FrameLayoutEntry> =
            serde_json::from_value(m.frame_layout.clone()).unwrap_or_default();

        Self {
            version: m.manifest_version.clone(),
            hop_ms: m.hop_ms,
            frame_count: m.frame_count,
            duration_ms: m.duration_ms,
            sample_rate: m.sample_rate,
            bands,
            bytes_per_frame: m.bytes_per_frame,
            frame_layout,
            fingerprint: m.fingerprint.clone(),
            analyzer_version: m.analyzer_version.clone(),
            chunk_size_frames: m.chunk_size_frames,
            total_chunks: m.total_chunks,
        }
    }
}

/// Frame data query parameters
#[derive(Debug, Clone, Deserialize)]
pub struct FrameDataQuery {
    pub from_ms: i32,
    pub to_ms: i32,
    /// Optional: specific bands to return (comma-separated)
    #[serde(default)]
    pub bands: Option<String>,
}

/// Frame data response chunk
#[derive(Debug, Clone, Serialize)]
pub struct FrameChunkResponse {
    pub chunk_index: i32,
    pub start_frame: i32,
    pub end_frame: i32,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub frame_count: i32,
    /// Base64-encoded frame data
    pub data_base64: String,
}

/// Complete frame data response
#[derive(Debug, Clone, Serialize)]
pub struct FrameDataResponse {
    pub manifest: FrameManifestResponse,
    pub requested_range: TimeRange,
    pub actual_range: TimeRange,
    pub chunks: Vec<FrameChunkResponse>,
    pub total_frames: i32,
    pub total_bytes: i32,
}

/// Time range
#[derive(Debug, Clone, Serialize)]
pub struct TimeRange {
    pub from_ms: i32,
    pub to_ms: i32,
}

/// Events query parameters
#[derive(Debug, Clone, Deserialize)]
pub struct EventsQuery {
    #[serde(default)]
    pub from_ms: Option<i32>,
    #[serde(default)]
    pub to_ms: Option<i32>,
    #[serde(default)]
    pub event_type: Option<String>,
}

/// Events response
#[derive(Debug, Clone, Serialize)]
pub struct EventsResponse {
    pub analysis_id: Uuid,
    pub events: Vec<AnalysisEvent>,
    pub count: i32,
}

// =============================================================================
// Input Types for Creating
// =============================================================================

/// Input for creating a frame manifest
#[derive(Debug, Clone, Deserialize)]
pub struct CreateFrameManifestInput {
    pub hop_ms: i32,
    pub frame_count: i32,
    pub duration_ms: i32,
    pub sample_rate: Option<i32>,
    pub bands: Vec<BandDefinition>,
    pub chunk_size_frames: Option<i32>,
    pub fingerprint: Option<String>,
    pub analyzer_version: Option<String>,
}

/// Input for creating a frame data chunk
#[derive(Debug, Clone)]
pub struct CreateFrameDataInput {
    pub chunk_index: i32,
    pub start_frame: i32,
    pub end_frame: i32,
    pub start_time_ms: i32,
    pub end_time_ms: i32,
    pub frame_data: Vec<u8>,
    pub frame_count: i32,
    pub compressed: bool,
    pub compression_type: Option<String>,
}

/// Input for creating an analysis event
#[derive(Debug, Clone, Deserialize)]
pub struct CreateEventInput {
    pub time_ms: i32,
    pub duration_ms: Option<i32>,
    pub event_type: String,
    pub event_data: Option<serde_json::Value>,
    pub confidence: Option<f32>,
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Calculate bytes per frame from band definitions
pub fn calculate_bytes_per_frame(bands: &[BandDefinition]) -> i32 {
    bands
        .iter()
        .map(|b| {
            let type_size = match b.data_type.as_str() {
                "float32" => 4,
                "float64" => 8,
                "int16" => 2,
                "int32" => 4,
                "uint8" => 1,
                _ => 4, // Default to float32
            };
            (b.size as i32) * type_size
        })
        .sum()
}

/// Calculate frame layout from band definitions
pub fn calculate_frame_layout(bands: &[BandDefinition]) -> Vec<FrameLayoutEntry> {
    let mut offset = 0u32;
    bands
        .iter()
        .map(|b| {
            let type_size: u32 = match b.data_type.as_str() {
                "float32" => 4,
                "float64" => 8,
                "int16" => 2,
                "int32" => 4,
                "uint8" => 1,
                _ => 4,
            };
            let byte_size = b.size * type_size;
            let entry = FrameLayoutEntry {
                band_name: b.name.clone(),
                byte_offset: offset,
                byte_size,
            };
            offset += byte_size;
            entry
        })
        .collect()
}

/// Calculate total chunks needed
pub fn calculate_total_chunks(frame_count: i32, chunk_size: i32) -> i32 {
    (frame_count + chunk_size - 1) / chunk_size
}

/// Convert frame index to time in milliseconds
pub fn frame_to_time_ms(frame: i32, hop_ms: i32) -> i32 {
    frame * hop_ms
}

/// Convert time in milliseconds to frame index
pub fn time_to_frame(time_ms: i32, hop_ms: i32) -> i32 {
    time_ms / hop_ms
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_bytes_per_frame() {
        let bands = vec![
            BandDefinition {
                name: "loudness".to_string(),
                data_type: "float32".to_string(),
                size: 1,
                description: None,
                unit: None,
                min_value: None,
                max_value: None,
            },
            BandDefinition {
                name: "spectrum".to_string(),
                data_type: "float32".to_string(),
                size: 128,
                description: None,
                unit: None,
                min_value: None,
                max_value: None,
            },
        ];

        let bytes = calculate_bytes_per_frame(&bands);
        assert_eq!(bytes, 4 + (128 * 4)); // 1 float32 + 128 float32s
    }

    #[test]
    fn test_calculate_frame_layout() {
        let bands = vec![
            BandDefinition {
                name: "loudness".to_string(),
                data_type: "float32".to_string(),
                size: 1,
                description: None,
                unit: None,
                min_value: None,
                max_value: None,
            },
            BandDefinition {
                name: "rms".to_string(),
                data_type: "float32".to_string(),
                size: 1,
                description: None,
                unit: None,
                min_value: None,
                max_value: None,
            },
        ];

        let layout = calculate_frame_layout(&bands);
        assert_eq!(layout.len(), 2);
        assert_eq!(layout[0].band_name, "loudness");
        assert_eq!(layout[0].byte_offset, 0);
        assert_eq!(layout[0].byte_size, 4);
        assert_eq!(layout[1].band_name, "rms");
        assert_eq!(layout[1].byte_offset, 4);
        assert_eq!(layout[1].byte_size, 4);
    }

    #[test]
    fn test_calculate_total_chunks() {
        assert_eq!(calculate_total_chunks(1000, 1000), 1);
        assert_eq!(calculate_total_chunks(1001, 1000), 2);
        assert_eq!(calculate_total_chunks(2500, 1000), 3);
        assert_eq!(calculate_total_chunks(0, 1000), 0);
    }

    #[test]
    fn test_frame_time_conversion() {
        let hop_ms = 10;

        assert_eq!(frame_to_time_ms(0, hop_ms), 0);
        assert_eq!(frame_to_time_ms(100, hop_ms), 1000);
        assert_eq!(frame_to_time_ms(1, hop_ms), 10);

        assert_eq!(time_to_frame(0, hop_ms), 0);
        assert_eq!(time_to_frame(1000, hop_ms), 100);
        assert_eq!(time_to_frame(15, hop_ms), 1); // Truncates
    }

    #[test]
    fn test_event_type_display() {
        assert_eq!(EventType::Transient.to_string(), "transient");
        assert_eq!(EventType::Beat.to_string(), "beat");
        assert_eq!(EventType::SectionStart.to_string(), "section_start");
    }
}
