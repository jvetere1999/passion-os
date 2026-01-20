/// User settings model for server-side persistence
/// Replaces localStorage-based settings (theme, accessibility, UI preferences)
/// PostgreSQL backed, JSON-serialized values

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserSetting {
    pub id: Uuid,
    pub user_id: Uuid,
    pub key: String,
    pub value: serde_json::Value,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Request to update a setting
#[derive(Debug, Deserialize)]
pub struct UpdateSettingRequest {
    pub key: String,
    pub value: serde_json::Value,
}

/// Response for get settings
#[derive(Debug, Serialize)]
pub struct UserSettingsResponse {
    pub settings: Vec<UserSetting>,
}

/// Common setting keys (canonical list)
pub mod keys {
    pub const THEME: &str = "theme";
    pub const ACCESSIBILITY: &str = "accessibility";
    pub const UI_COLLAPSE_STATE: &str = "ui_collapse_state";
    pub const NOTIFICATIONS_ENABLED: &str = "notifications_enabled";
}

/// Theme setting values
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl Theme {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!(self)
    }
    
    pub fn from_json(v: &serde_json::Value) -> Option<Self> {
        serde_json::from_value(v.clone()).ok()
    }
}

/// Accessibility setting values
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilitySettings {
    pub reduced_motion: bool,
    pub high_contrast: bool,
    pub large_text: bool,
}

impl AccessibilitySettings {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!(self)
    }
    
    pub fn from_json(v: &serde_json::Value) -> Option<Self> {
        serde_json::from_value(v.clone()).ok()
    }
    
    pub fn default() -> Self {
        Self {
            reduced_motion: false,
            high_contrast: false,
            large_text: false,
        }
    }
}
