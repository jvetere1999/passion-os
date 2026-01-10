//! Application configuration

use config::{Config, Environment, File};
use serde::Deserialize;

/// Main application configuration
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub cors: CorsConfig,
    /// Storage config (R2/S3) - used in Phase 14
    #[allow(dead_code)]
    pub storage: StorageConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_env")]
    pub environment: String,
    #[serde(default = "default_public_url")]
    pub public_url: String,
    /// Frontend URL for OAuth redirects (e.g., https://ignition.ecent.online)
    #[serde(default = "default_frontend_url")]
    pub frontend_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL - can be set via DATABASE_URL env var
    /// Uses serde default to handle missing values gracefully
    #[serde(default = "default_database_url")]
    pub url: String,
    /// Pool size - used when sqlx pool is configured
    #[serde(default = "default_pool_size")]
    #[allow(dead_code)]
    pub pool_size: u32,
}

fn default_database_url() -> String {
    // Check environment directly as fallback
    let db_url = std::env::var("DATABASE_URL")
        .ok()
        .filter(|s| !s.is_empty() && s != "undefined")
        .unwrap_or_else(|| "postgres://localhost/ignition".to_string());
    
    // Log what we got (redacted for security)
    let redacted = if db_url.len() > 30 {
        format!("{}...{}", &db_url[..15], &db_url[db_url.len()-10..])
    } else {
        "***".to_string()
    };
    tracing::info!("DATABASE_URL from env: {}", redacted);
    
    db_url
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    /// Session cookie domain (e.g., "ecent.online")
    #[serde(default = "default_cookie_domain")]
    pub cookie_domain: String,
    /// Session TTL in seconds (default: 30 days)
    #[serde(default = "default_session_ttl")]
    pub session_ttl_seconds: u64,
    /// OAuth providers configuration
    #[serde(default)]
    pub oauth: Option<OAuthConfig>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct OAuthConfig {
    pub google: Option<OAuthProviderConfig>,
    pub azure: Option<OAuthProviderConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OAuthProviderConfig {
    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub client_secret: String,
    /// Redirect URI from config (may be overridden by computed value)
    #[allow(dead_code)]
    #[serde(default)]
    pub redirect_uri: String,
    /// Tenant ID (required for Azure)
    pub tenant_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CorsConfig {
    /// Allowed origins for CORS and CSRF verification
    #[serde(default = "default_allowed_origins")]
    pub allowed_origins: Vec<String>,
}

/// Storage config - used in Phase 14 R2 integration
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct StorageConfig {
    /// R2/S3 endpoint URL
    pub endpoint: Option<String>,
    /// R2/S3 bucket name
    pub bucket: Option<String>,
    /// R2/S3 region
    #[serde(default = "default_region")]
    pub region: String,
    /// Access key ID
    pub access_key_id: Option<String>,
    /// Secret access key
    pub secret_access_key: Option<String>,
}

// Default value functions
fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_port() -> u16 {
    8080
}

fn default_env() -> String {
    "development".to_string()
}

fn default_pool_size() -> u32 {
    10
}

fn default_cookie_domain() -> String {
    "localhost".to_string()
}

fn default_session_ttl() -> u64 {
    60 * 60 * 24 * 30 // 30 days in seconds
}

fn default_allowed_origins() -> Vec<String> {
    vec![
        "http://localhost:3000".to_string(),
        "http://localhost:3001".to_string(),
    ]
}

fn default_region() -> String {
    "auto".to_string()
}

fn default_public_url() -> String {
    "http://localhost:8080".to_string()
}

fn default_frontend_url() -> String {
    "http://localhost:3000".to_string()
}

impl AppConfig {
    /// Load configuration from files and environment
    pub fn load() -> anyhow::Result<Self> {
        let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());

        // Get database URL directly from environment - handle missing/empty/undefined values
        let database_url = std::env::var("DATABASE_URL")
            .ok()
            .filter(|s| !s.is_empty() && s != "undefined")
            .unwrap_or_else(|| "postgres://localhost/ignition".to_string());

        // Debug: Log all AUTH_* and STORAGE_* env vars at startup
        tracing::info!("=== Config Loading: Environment Variables ===");
        for (key, value) in std::env::vars() {
            if key.starts_with("AUTH_") || key.starts_with("STORAGE_") || key.starts_with("DATABASE") || key.starts_with("SERVER_") {
                let display_value = if key.contains("SECRET") || key.contains("PASSWORD") || key.contains("KEY") {
                    if value.is_empty() { "(empty)" } else { "(set)" }
                } else if value.len() > 50 {
                    &value[..50]
                } else {
                    &value
                };
                tracing::info!("  {}: {}", key, display_value);
            }
        }
        tracing::info!("=== End Environment Variables ===");

        let config = Config::builder()
            // Default configuration
            .set_default("server.host", "0.0.0.0")?
            .set_default("server.port", 8080)?
            .set_default("server.environment", env.clone())?
            .set_default("server.public_url", "http://localhost:8080")?
            .set_default("server.frontend_url", "http://localhost:3000")?
            // Set database.url BEFORE adding Environment source so it acts as fallback
            .set_default("database.url", database_url.clone())?
            .set_default("database.pool_size", 10)?
            .set_default("auth.cookie_domain", "localhost")?
            .set_default("auth.session_ttl_seconds", 60 * 60 * 24 * 30)?
            // Initialize OAuth structure with empty defaults so env vars can populate it
            .set_default("auth.oauth.google.client_id", "")?
            .set_default("auth.oauth.google.client_secret", "")?
            .set_default("auth.oauth.google.redirect_uri", "")?
            .set_default("auth.oauth.azure.client_id", "")?
            .set_default("auth.oauth.azure.client_secret", "")?
            .set_default("auth.oauth.azure.redirect_uri", "")?
            .set_default("auth.oauth.azure.tenant_id", "")?
            .set_default(
                "cors.allowed_origins",
                vec!["http://localhost:3000", "http://localhost:3001"],
            )?
            .set_default("storage.region", "auto")?
            // Load from config file if exists
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name(&format!("config/{}", env)).required(false))
            // Override with environment variables (e.g., DATABASE_URL, SERVER_PORT)
            // Note: separator("_") means DATABASE_URL -> database.url
            .add_source(Environment::default().separator("_").try_parsing(true))
            .build()?;

        // Deserialize but handle potential empty url from env override
        let mut app_config: Self = config.try_deserialize()?;
        
        // If url is empty after deserialization (env var was empty string), use our fallback
        if app_config.database.url.is_empty() || app_config.database.url == "undefined" {
            app_config.database.url = database_url;
        }

        // Manual Server config override - separator("_") splits SERVER_PUBLIC_URL into
        // server.public.url instead of server.public_url. We need to manually read these.
        if let Ok(public_url) = std::env::var("SERVER_PUBLIC_URL") {
            if !public_url.is_empty() {
                tracing::info!("Loading SERVER_PUBLIC_URL from environment: {}", public_url);
                app_config.server.public_url = public_url;
            }
        }
        if let Ok(frontend_url) = std::env::var("SERVER_FRONTEND_URL") {
            if !frontend_url.is_empty() {
                tracing::info!("Loading SERVER_FRONTEND_URL from environment: {}", frontend_url);
                app_config.server.frontend_url = frontend_url;
            }
        }
        if let Ok(cookie_domain) = std::env::var("AUTH_COOKIE_DOMAIN") {
            if !cookie_domain.is_empty() {
                tracing::info!("Loading AUTH_COOKIE_DOMAIN from environment: {}", cookie_domain);
                app_config.auth.cookie_domain = cookie_domain;
            }
        }

        // Manual OAuth override - the config crate separator("_") splits ALL underscores,
        // so AUTH_OAUTH_GOOGLE_CLIENT_ID becomes auth.oauth.google.client.id instead of
        // auth.oauth.google.client_id. We need to manually read these env vars.
        let google_client_id = std::env::var("AUTH_OAUTH_GOOGLE_CLIENT_ID").unwrap_or_default();
        let google_client_secret = std::env::var("AUTH_OAUTH_GOOGLE_CLIENT_SECRET").unwrap_or_default();
        let google_redirect_uri = std::env::var("AUTH_OAUTH_GOOGLE_REDIRECT_URI").unwrap_or_default();
        
        if !google_client_id.is_empty() && !google_client_secret.is_empty() {
            tracing::info!("Loading Google OAuth from environment variables");
            let google_config = OAuthProviderConfig {
                client_id: google_client_id,
                client_secret: google_client_secret,
                redirect_uri: google_redirect_uri,
                tenant_id: None,
            };
            if app_config.auth.oauth.is_none() {
                app_config.auth.oauth = Some(OAuthConfig::default());
            }
            if let Some(ref mut oauth) = app_config.auth.oauth {
                oauth.google = Some(google_config);
            }
        }

        let azure_client_id = std::env::var("AUTH_OAUTH_AZURE_CLIENT_ID").unwrap_or_default();
        let azure_client_secret = std::env::var("AUTH_OAUTH_AZURE_CLIENT_SECRET").unwrap_or_default();
        let azure_redirect_uri = std::env::var("AUTH_OAUTH_AZURE_REDIRECT_URI").unwrap_or_default();
        let azure_tenant_id = std::env::var("AUTH_OAUTH_AZURE_TENANT_ID").unwrap_or_default();

        if !azure_client_id.is_empty() && !azure_client_secret.is_empty() && !azure_tenant_id.is_empty() {
            tracing::info!("Loading Azure OAuth from environment variables");
            let azure_config = OAuthProviderConfig {
                client_id: azure_client_id,
                client_secret: azure_client_secret,
                redirect_uri: azure_redirect_uri,
                tenant_id: Some(azure_tenant_id),
            };
            if app_config.auth.oauth.is_none() {
                app_config.auth.oauth = Some(OAuthConfig::default());
            }
            if let Some(ref mut oauth) = app_config.auth.oauth {
                oauth.azure = Some(azure_config);
            }
        }

        // Manual Storage override - same issue as OAuth: separator("_") splits ALL underscores,
        // so STORAGE_ACCESS_KEY_ID becomes storage.access.key.id instead of storage.access_key_id.
        let storage_endpoint = std::env::var("STORAGE_ENDPOINT").ok().filter(|s| !s.is_empty());
        let storage_bucket = std::env::var("STORAGE_BUCKET").ok().filter(|s| !s.is_empty());
        let storage_access_key = std::env::var("STORAGE_ACCESS_KEY_ID").ok().filter(|s| !s.is_empty());
        let storage_secret_key = std::env::var("STORAGE_SECRET_ACCESS_KEY").ok().filter(|s| !s.is_empty());
        let storage_region = std::env::var("STORAGE_REGION").ok().filter(|s| !s.is_empty());

        if storage_endpoint.is_some() || storage_access_key.is_some() {
            tracing::info!("Loading Storage config from environment variables");
            app_config.storage.endpoint = storage_endpoint.or(app_config.storage.endpoint);
            app_config.storage.bucket = storage_bucket.or(app_config.storage.bucket);
            app_config.storage.access_key_id = storage_access_key.or(app_config.storage.access_key_id);
            app_config.storage.secret_access_key = storage_secret_key.or(app_config.storage.secret_access_key);
            if let Some(region) = storage_region {
                app_config.storage.region = region;
            }
        }

        Ok(app_config)
    }

    /// Check if running in production
    #[allow(dead_code)]
    pub fn is_production(&self) -> bool {
        self.server.environment == "production"
    }

    /// Check if running in development
    pub fn is_development(&self) -> bool {
        self.server.environment == "development"
    }
}
