//! Inbox models
//!
//! Models for user inbox notifications and action items.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Inbox item database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct InboxItem {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_type: String,
    pub title: String,
    pub body: Option<String>,
    pub action_url: Option<String>,
    pub action_data: Option<serde_json::Value>,
    pub priority: i32,
    pub is_processed: bool,
    pub is_archived: bool,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/// Create inbox item request
#[derive(Debug, Deserialize)]
pub struct CreateInboxRequest {
    pub item_type: String,
    pub title: String,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub action_url: Option<String>,
    #[serde(default)]
    pub action_data: Option<serde_json::Value>,
    #[serde(default)]
    pub priority: Option<i32>,
    #[serde(default)]
    pub expires_at: Option<DateTime<Utc>>,
}

/// Update inbox item request
#[derive(Debug, Deserialize)]
pub struct UpdateInboxRequest {
    pub is_processed: Option<bool>,
    pub is_archived: Option<bool>,
}

/// Inbox item response
#[derive(Debug, Serialize)]
pub struct InboxResponse {
    pub id: Uuid,
    pub item_type: String,
    pub title: String,
    pub body: Option<String>,
    pub action_url: Option<String>,
    pub action_data: Option<serde_json::Value>,
    pub priority: i32,
    pub is_processed: bool,
    pub is_archived: bool,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<InboxItem> for InboxResponse {
    fn from(item: InboxItem) -> Self {
        InboxResponse {
            id: item.id,
            item_type: item.item_type,
            title: item.title,
            body: item.body,
            action_url: item.action_url,
            action_data: item.action_data,
            priority: item.priority,
            is_processed: item.is_processed,
            is_archived: item.is_archived,
            expires_at: item.expires_at,
            created_at: item.created_at,
        }
    }
}

/// List inbox response
#[derive(Debug, Serialize)]
pub struct InboxListResponse {
    pub items: Vec<InboxResponse>,
    pub total: i64,
    pub unread_count: i64,
    pub page: i64,
    pub page_size: i64,
}

/// Delete response
#[derive(Debug, Serialize)]
pub struct DeleteInboxResponse {
    pub success: bool,
    pub id: Uuid,
}
