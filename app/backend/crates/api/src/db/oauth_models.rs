//! OAuth State Models
//!
//! Database models for distributed OAuth state storage.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// OAuth state stored in database for distributed access
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OAuthStateRow {
    pub state_key: String,
    pub pkce_verifier: String,
    pub redirect_uri: Option<String>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}
