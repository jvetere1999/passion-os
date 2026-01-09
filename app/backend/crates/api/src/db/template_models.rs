//! Listening Prompt Template Models
//!
//! Models for admin-curated listening prompt templates.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Template category for listening exercises
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TemplateCategory {
    General,
    Frequency,
    Dynamics,
    Spatial,
    Arrangement,
    Production,
    Mixing,
    Mastering,
    GenreSpecific,
}

impl std::fmt::Display for TemplateCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::General => write!(f, "general"),
            Self::Frequency => write!(f, "frequency"),
            Self::Dynamics => write!(f, "dynamics"),
            Self::Spatial => write!(f, "spatial"),
            Self::Arrangement => write!(f, "arrangement"),
            Self::Production => write!(f, "production"),
            Self::Mixing => write!(f, "mixing"),
            Self::Mastering => write!(f, "mastering"),
            Self::GenreSpecific => write!(f, "genre_specific"),
        }
    }
}

impl std::str::FromStr for TemplateCategory {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "general" => Ok(Self::General),
            "frequency" => Ok(Self::Frequency),
            "dynamics" => Ok(Self::Dynamics),
            "spatial" => Ok(Self::Spatial),
            "arrangement" => Ok(Self::Arrangement),
            "production" => Ok(Self::Production),
            "mixing" => Ok(Self::Mixing),
            "mastering" => Ok(Self::Mastering),
            "genre_specific" => Ok(Self::GenreSpecific),
            _ => Err(format!("Invalid category: {}", s)),
        }
    }
}

/// Template difficulty level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TemplateDifficulty {
    Beginner,
    Intermediate,
    Advanced,
    Expert,
}

impl std::fmt::Display for TemplateDifficulty {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Beginner => write!(f, "beginner"),
            Self::Intermediate => write!(f, "intermediate"),
            Self::Advanced => write!(f, "advanced"),
            Self::Expert => write!(f, "expert"),
        }
    }
}

impl std::str::FromStr for TemplateDifficulty {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "beginner" => Ok(Self::Beginner),
            "intermediate" => Ok(Self::Intermediate),
            "advanced" => Ok(Self::Advanced),
            "expert" => Ok(Self::Expert),
            _ => Err(format!("Invalid difficulty: {}", s)),
        }
    }
}

/// Preset type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PresetType {
    Focus,
    Comparison,
    Loop,
    Visualization,
}

impl std::fmt::Display for PresetType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Focus => write!(f, "focus"),
            Self::Comparison => write!(f, "comparison"),
            Self::Loop => write!(f, "loop"),
            Self::Visualization => write!(f, "visualization"),
        }
    }
}

impl std::str::FromStr for PresetType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "focus" => Ok(Self::Focus),
            "comparison" => Ok(Self::Comparison),
            "loop" => Ok(Self::Loop),
            "visualization" => Ok(Self::Visualization),
            _ => Err(format!("Invalid preset type: {}", s)),
        }
    }
}

/// Listening prompt template database row
#[derive(Debug, Clone, FromRow)]
pub struct ListeningPromptTemplateRow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub difficulty: String,
    pub prompt_text: String,
    pub hints: serde_json::Value,
    pub expected_observations: serde_json::Value,
    pub tags: serde_json::Value,
    pub display_order: i32,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Listening prompt template API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListeningPromptTemplate {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub category: String,
    pub difficulty: String,
    pub prompt_text: String,
    pub hints: Vec<String>,
    pub expected_observations: Vec<String>,
    pub tags: Vec<String>,
    pub display_order: i32,
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ListeningPromptTemplateRow> for ListeningPromptTemplate {
    fn from(row: ListeningPromptTemplateRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            difficulty: row.difficulty,
            prompt_text: row.prompt_text,
            hints: serde_json::from_value(row.hints).unwrap_or_default(),
            expected_observations: serde_json::from_value(row.expected_observations)
                .unwrap_or_default(),
            tags: serde_json::from_value(row.tags).unwrap_or_default(),
            display_order: row.display_order,
            is_active: row.is_active,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

/// Create template input
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTemplateInput {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default = "default_category")]
    pub category: String,
    #[serde(default = "default_difficulty")]
    pub difficulty: String,
    pub prompt_text: String,
    #[serde(default)]
    pub hints: Vec<String>,
    #[serde(default)]
    pub expected_observations: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub display_order: i32,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

fn default_category() -> String {
    "general".to_string()
}

fn default_difficulty() -> String {
    "beginner".to_string()
}

fn default_true() -> bool {
    true
}

/// Update template input
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTemplateInput {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub difficulty: Option<String>,
    #[serde(default)]
    pub prompt_text: Option<String>,
    #[serde(default)]
    pub hints: Option<Vec<String>>,
    #[serde(default)]
    pub expected_observations: Option<Vec<String>>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub display_order: Option<i32>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

/// Listening prompt preset database row
#[derive(Debug, Clone, FromRow)]
pub struct ListeningPromptPresetRow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub template_id: Option<Uuid>,
    pub preset_type: String,
    pub config: serde_json::Value,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Listening prompt preset API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListeningPromptPreset {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<Uuid>,
    pub preset_type: String,
    pub config: serde_json::Value,
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ListeningPromptPresetRow> for ListeningPromptPreset {
    fn from(row: ListeningPromptPresetRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            description: row.description,
            template_id: row.template_id,
            preset_type: row.preset_type,
            config: row.config,
            is_active: row.is_active,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

/// Create preset input
#[derive(Debug, Clone, Deserialize)]
pub struct CreatePresetInput {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub template_id: Option<Uuid>,
    #[serde(default = "default_preset_type")]
    pub preset_type: String,
    #[serde(default = "default_config")]
    pub config: serde_json::Value,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

fn default_preset_type() -> String {
    "focus".to_string()
}

fn default_config() -> serde_json::Value {
    serde_json::json!({})
}

/// Update preset input
#[derive(Debug, Clone, Deserialize)]
pub struct UpdatePresetInput {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub template_id: Option<Option<Uuid>>,
    #[serde(default)]
    pub preset_type: Option<String>,
    #[serde(default)]
    pub config: Option<serde_json::Value>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

/// Template with presets (for detail view)
#[derive(Debug, Clone, Serialize)]
pub struct TemplateWithPresets {
    #[serde(flatten)]
    pub template: ListeningPromptTemplate,
    pub presets: Vec<ListeningPromptPreset>,
}

/// Template list query options
#[derive(Debug, Clone, Deserialize, Default)]
pub struct TemplateListOptions {
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub difficulty: Option<String>,
    #[serde(default)]
    pub active_only: Option<bool>,
    #[serde(default)]
    pub page: Option<i64>,
    #[serde(default)]
    pub page_size: Option<i64>,
}
