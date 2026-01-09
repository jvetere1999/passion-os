//! Application state shared across handlers

use std::sync::Arc;
use std::time::Duration;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::config::AppConfig;
use crate::storage::StorageClient;

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    /// Application configuration
    pub config: Arc<AppConfig>,
    /// Database connection pool
    pub db: PgPool,
    /// Storage client (R2/S3) - optional, only available if configured
    pub storage: Option<StorageClient>,
}

impl AppState {
    /// Create new application state
    pub async fn new(config: &AppConfig) -> anyhow::Result<Self> {
        // Log the database URL (redacted for security)
        let db_url = &config.database.url;
        let redacted_url = if db_url.contains('@') {
            let parts: Vec<&str> = db_url.splitn(2, '@').collect();
            format!("***@{}", parts.get(1).unwrap_or(&"unknown"))
        } else {
            "***".to_string()
        };
        tracing::info!("Connecting to database: {}", redacted_url);

        // Create database pool with explicit timeout settings
        // Cloudflare containers may have network latency, so we use conservative timeouts
        let db = PgPoolOptions::new()
            .max_connections(config.database.pool_size)
            .acquire_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .connect(&config.database.url)
            .await
            .map_err(|e| {
                tracing::error!("Failed to connect to database: {}", e);
                tracing::error!("DATABASE_URL (redacted): {}", redacted_url);
                e
            })?;

        tracing::info!("Database connection pool created");

        // Run pending migrations on every startup
        // sqlx tracks applied migrations in _sqlx_migrations table
        tracing::info!("Checking database migrations...");
        match Self::run_migrations(&db).await {
            Ok(applied) => {
                if applied > 0 {
                    tracing::info!("Applied {} new migration(s)", applied);
                } else {
                    tracing::info!("Database schema is up to date");
                }
            }
            Err(e) => {
                tracing::error!("Migration failed: {}", e);
                return Err(e.into());
            }
        }

        // Create storage client if configured
        let storage = if config.storage.endpoint.is_some() {
            match StorageClient::new(&config.storage).await {
                Ok(client) => {
                    tracing::info!("Storage client initialized");
                    Some(client)
                }
                Err(e) => {
                    tracing::warn!("Storage client not available: {}", e);
                    None
                }
            }
        } else {
            tracing::info!("Storage not configured");
            None
        };

        Ok(Self {
            config: Arc::new(config.clone()),
            db,
            storage,
        })
    }

    /// Run database migrations
    /// 
    /// Embeds migrations at compile time.
    /// Tracks applied migrations in _sqlx_migrations table.
    /// Returns the number of newly applied migrations.
    async fn run_migrations(db: &PgPool) -> Result<usize, sqlx::migrate::MigrateError> {
        // Migrations are embedded at compile time
        // Path relative to Cargo.toml: app/backend/migrations
        let migrator = sqlx::migrate!("../../migrations");
        
        // Get current migration count before running
        let before = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM _sqlx_migrations"
        )
        .fetch_one(db)
        .await
        .unwrap_or(0);

        // Run all pending migrations
        migrator.run(db).await?;

        // Get count after running
        let after = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM _sqlx_migrations"
        )
        .fetch_one(db)
        .await
        .unwrap_or(0);

        Ok((after - before) as usize)
    }

    /// Get the current database schema version
    pub async fn get_schema_version(&self) -> Option<i64> {
        sqlx::query_scalar::<_, i64>(
            "SELECT version FROM _sqlx_migrations ORDER BY version DESC LIMIT 1"
        )
        .fetch_optional(&self.db)
        .await
        .ok()
        .flatten()
    }
}
