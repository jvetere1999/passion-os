//! Audit Event Logging
//!
//! Provides interface for recording audit events for admin monitoring.
//! Uses Postgres-backed storage when schema exists.

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

/// Audit event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuditEventType {
    // Auth events
    Login,
    Logout,
    SessionCreated,
    SessionExpired,
    PasswordChanged,

    // User events
    UserCreated,
    UserUpdated,
    UserDeleted,
    RoleChanged,

    // Resource events
    ResourceCreated,
    ResourceUpdated,
    ResourceDeleted,

    // Admin events
    AdminAction,
    ConfigChanged,
    BackupCreated,
    BackupRestored,

    // Transaction events
    Purchase,
    Refund,

    // Security events
    FailedLogin,
    CsrfViolation,
    UnauthorizedAccess,
    RateLimited,

    // Custom event
    Custom(String),
}

impl std::fmt::Display for AuditEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuditEventType::Login => write!(f, "login"),
            AuditEventType::Logout => write!(f, "logout"),
            AuditEventType::SessionCreated => write!(f, "session_created"),
            AuditEventType::SessionExpired => write!(f, "session_expired"),
            AuditEventType::PasswordChanged => write!(f, "password_changed"),
            AuditEventType::UserCreated => write!(f, "user_created"),
            AuditEventType::UserUpdated => write!(f, "user_updated"),
            AuditEventType::UserDeleted => write!(f, "user_deleted"),
            AuditEventType::RoleChanged => write!(f, "role_changed"),
            AuditEventType::ResourceCreated => write!(f, "resource_created"),
            AuditEventType::ResourceUpdated => write!(f, "resource_updated"),
            AuditEventType::ResourceDeleted => write!(f, "resource_deleted"),
            AuditEventType::AdminAction => write!(f, "admin_action"),
            AuditEventType::ConfigChanged => write!(f, "config_changed"),
            AuditEventType::BackupCreated => write!(f, "backup_created"),
            AuditEventType::BackupRestored => write!(f, "backup_restored"),
            AuditEventType::Purchase => write!(f, "purchase"),
            AuditEventType::Refund => write!(f, "refund"),
            AuditEventType::FailedLogin => write!(f, "failed_login"),
            AuditEventType::CsrfViolation => write!(f, "csrf_violation"),
            AuditEventType::UnauthorizedAccess => write!(f, "unauthorized_access"),
            AuditEventType::RateLimited => write!(f, "rate_limited"),
            AuditEventType::Custom(s) => write!(f, "custom:{}", s),
        }
    }
}

/// Audit event builder
pub struct AuditEvent {
    /// Event type
    pub event_type: AuditEventType,
    /// User who triggered the event (if any)
    pub user_id: Option<Uuid>,
    /// Resource type (e.g., "user", "track", "template")
    pub resource_type: Option<String>,
    /// Resource ID
    pub resource_id: Option<Uuid>,
    /// Action description
    pub action: String,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
    /// IP address
    pub ip_address: Option<String>,
    /// User agent
    pub user_agent: Option<String>,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

impl AuditEvent {
    /// Create a new audit event
    pub fn new(event_type: AuditEventType, action: impl Into<String>) -> Self {
        Self {
            event_type,
            user_id: None,
            resource_type: None,
            resource_id: None,
            action: action.into(),
            metadata: HashMap::new(),
            ip_address: None,
            user_agent: None,
            timestamp: Utc::now(),
        }
    }

    /// Set the user who triggered the event
    pub fn with_user(mut self, user_id: Uuid) -> Self {
        self.user_id = Some(user_id);
        self
    }

    /// Set the resource affected
    pub fn with_resource(mut self, resource_type: &str, resource_id: Uuid) -> Self {
        self.resource_type = Some(resource_type.to_string());
        self.resource_id = Some(resource_id);
        self
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: &str, value: impl Serialize) -> Self {
        if let Ok(json) = serde_json::to_value(value) {
            self.metadata.insert(key.to_string(), json);
        }
        self
    }

    /// Set IP address
    pub fn with_ip(mut self, ip: &str) -> Self {
        self.ip_address = Some(ip.to_string());
        self
    }

    /// Set user agent
    pub fn with_user_agent(mut self, ua: &str) -> Self {
        self.user_agent = Some(ua.to_string());
        self
    }
}

/// Audit event sink interface
pub trait AuditSink: Send + Sync {
    /// Record an audit event
    fn record(
        &self,
        event: AuditEvent,
    ) -> Pin<Box<dyn Future<Output = Result<(), AppError>> + Send + '_>>;
}

/// Postgres-backed audit sink
pub struct PostgresAuditSink {
    pool: PgPool,
}

impl PostgresAuditSink {
    /// Create a new Postgres audit sink
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl AuditSink for PostgresAuditSink {
    fn record(
        &self,
        event: AuditEvent,
    ) -> Pin<Box<dyn Future<Output = Result<(), AppError>> + Send + '_>> {
        let pool = self.pool.clone();
        Box::pin(async move {
            let metadata = serde_json::to_value(&event.metadata).unwrap_or(serde_json::json!({}));

            // Use audit_log table with correct schema
            sqlx::query(
                r#"
                INSERT INTO audit_log (
                    id, event_type, user_id, resource_type, resource_id,
                    action, status, details, ip_address, user_agent, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, 'success', $7, $8::inet, $9, $10
                )
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(event.event_type.to_string())
            .bind(event.user_id)
            .bind(&event.resource_type)
            .bind(event.resource_id.map(|id| id.to_string()))
            .bind(&event.action)
            .bind(metadata)
            .bind(&event.ip_address)
            .bind(&event.user_agent)
            .bind(event.timestamp)
            .execute(&pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

            Ok(())
        })
    }
}

/// No-op audit sink for testing or when audit is disabled
pub struct NoOpAuditSink;

impl AuditSink for NoOpAuditSink {
    fn record(
        &self,
        _event: AuditEvent,
    ) -> Pin<Box<dyn Future<Output = Result<(), AppError>> + Send + '_>> {
        Box::pin(async { Ok(()) })
    }
}

/// Logging audit sink - writes to tracing
pub struct LoggingAuditSink;

impl AuditSink for LoggingAuditSink {
    fn record(
        &self,
        event: AuditEvent,
    ) -> Pin<Box<dyn Future<Output = Result<(), AppError>> + Send + '_>> {
        Box::pin(async move {
            tracing::info!(
                event_type = %event.event_type,
                user_id = ?event.user_id,
                resource_type = ?event.resource_type,
                resource_id = ?event.resource_id,
                action = %event.action,
                metadata = ?event.metadata,
                "Audit event recorded"
            );
            Ok(())
        })
    }
}

/// Multi-sink that records to multiple sinks
pub struct MultiAuditSink {
    sinks: Vec<Box<dyn AuditSink>>,
}

impl MultiAuditSink {
    /// Create a new multi-sink
    pub fn new() -> Self {
        Self { sinks: vec![] }
    }

    /// Add a sink
    pub fn add<S: AuditSink + 'static>(mut self, sink: S) -> Self {
        self.sinks.push(Box::new(sink));
        self
    }
}

impl Default for MultiAuditSink {
    fn default() -> Self {
        Self::new()
    }
}

impl AuditSink for MultiAuditSink {
    fn record(
        &self,
        event: AuditEvent,
    ) -> Pin<Box<dyn Future<Output = Result<(), AppError>> + Send + '_>> {
        Box::pin(async move {
            for sink in &self.sinks {
                // Clone relevant data for each sink
                let event_clone = AuditEvent {
                    event_type: event.event_type.clone(),
                    user_id: event.user_id,
                    resource_type: event.resource_type.clone(),
                    resource_id: event.resource_id,
                    action: event.action.clone(),
                    metadata: event.metadata.clone(),
                    ip_address: event.ip_address.clone(),
                    user_agent: event.user_agent.clone(),
                    timestamp: event.timestamp,
                };
                sink.record(event_clone).await?;
            }
            Ok(())
        })
    }
}

/// Helper to record an audit event asynchronously (fire and forget)
pub fn record_async<S: AuditSink + 'static>(sink: &'static S, event: AuditEvent) {
    tokio::spawn(async move {
        if let Err(e) = sink.record(event).await {
            tracing::error!("Failed to record audit event: {}", e);
        }
    });
}

/// Simple audit writer for route handlers
/// Writes directly to audit_log table (fire and forget)
pub fn write_audit(
    pool: PgPool,
    event_type: AuditEventType,
    user_id: Option<Uuid>,
    action: &str,
    resource_type: Option<&str>,
    resource_id: Option<Uuid>,
) {
    let action = action.to_string();
    let resource_type = resource_type.map(|s| s.to_string());

    tokio::spawn(async move {
        let result = sqlx::query(
            r#"
            INSERT INTO audit_log (event_type, user_id, action, resource_type, resource_id, status)
            VALUES ($1, $2, $3, $4, $5, 'success')
            "#,
        )
        .bind(event_type.to_string())
        .bind(user_id)
        .bind(&action)
        .bind(&resource_type)
        .bind(resource_id.map(|id| id.to_string()))
        .execute(&pool)
        .await;

        if let Err(e) = result {
            tracing::error!("Failed to write audit log: {}", e);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audit_event_type_display() {
        assert_eq!(AuditEventType::Login.to_string(), "login");
        assert_eq!(AuditEventType::UserCreated.to_string(), "user_created");
        assert_eq!(
            AuditEventType::Custom("test".to_string()).to_string(),
            "custom:test"
        );
    }

    #[test]
    fn test_audit_event_builder() {
        let user_id = Uuid::new_v4();
        let resource_id = Uuid::new_v4();

        let event = AuditEvent::new(AuditEventType::ResourceCreated, "Created a new track")
            .with_user(user_id)
            .with_resource("track", resource_id)
            .with_metadata("track_name", "My Track")
            .with_ip("192.168.1.1")
            .with_user_agent("Mozilla/5.0");

        assert!(matches!(event.event_type, AuditEventType::ResourceCreated));
        assert_eq!(event.user_id, Some(user_id));
        assert_eq!(event.resource_type, Some("track".to_string()));
        assert_eq!(event.resource_id, Some(resource_id));
        assert_eq!(event.action, "Created a new track");
        assert!(event.metadata.contains_key("track_name"));
        assert_eq!(event.ip_address, Some("192.168.1.1".to_string()));
    }

    #[tokio::test]
    async fn test_noop_sink() {
        let sink = NoOpAuditSink;
        let event = AuditEvent::new(AuditEventType::Login, "Test login");
        let result = sink.record(event).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_logging_sink() {
        let sink = LoggingAuditSink;
        let event = AuditEvent::new(AuditEventType::Login, "Test login");
        let result = sink.record(event).await;
        assert!(result.is_ok());
    }
}
