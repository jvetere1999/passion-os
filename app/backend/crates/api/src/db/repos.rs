//! Database repositories for auth operations

use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::models::*;
use crate::error::AppError;

/// Generate a secure random token for sessions
pub fn generate_session_token() -> String {
    use base64::Engine;
    use rand::RngCore;

    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

/// User repository operations
pub struct UserRepo;

impl UserRepo {
    /// Find user by ID
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"SELECT
                id, name, email, email_verified, image, role,
                approved, age_verified, tos_accepted, tos_accepted_at,
                tos_version, last_activity_at, created_at, updated_at
            FROM users WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(user)
    }

    /// Find user by email
    pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"SELECT
                id, name, email, email_verified, image, role,
                approved, age_verified, tos_accepted, tos_accepted_at,
                tos_version, last_activity_at, created_at, updated_at
            FROM users WHERE email = $1"#,
        )
        .bind(email)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(user)
    }

    /// Create a new user
    pub async fn create(pool: &PgPool, input: CreateUserInput) -> Result<User, AppError> {
        let user = sqlx::query_as::<_, User>(
            r#"INSERT INTO users (email, name, image, email_verified)
            VALUES ($1, $2, $3, $4)
            RETURNING
                id, name, email, email_verified, image, role,
                approved, age_verified, tos_accepted, tos_accepted_at,
                tos_version, last_activity_at, created_at, updated_at"#,
        )
        .bind(&input.email)
        .bind(&input.name)
        .bind(&input.image)
        .bind(input.email_verified)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(user)
    }

    /// Update user's last activity
    pub async fn update_last_activity(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET last_activity_at = NOW() WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Verify user's age (COPPA compliance)
    pub async fn verify_age(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET age_verified = true WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Accept Terms of Service
    pub async fn accept_tos(
        pool: &PgPool,
        user_id: Uuid,
        tos_version: &str,
    ) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET tos_accepted = true, tos_accepted_at = NOW(), tos_version = $2 WHERE id = $1")
            .bind(user_id)
            .bind(tos_version)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Update user role
    #[allow(dead_code)]
    pub async fn update_role(pool: &PgPool, user_id: Uuid, role: UserRole) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET role = $2 WHERE id = $1")
            .bind(user_id)
            .bind(role.as_str())
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}

/// Account (OAuth) repository operations
pub struct AccountRepo;

impl AccountRepo {
    /// Find account by provider and provider account ID
    pub async fn find_by_provider(
        pool: &PgPool,
        provider: &str,
        provider_account_id: &str,
    ) -> Result<Option<Account>, AppError> {
        let account = sqlx::query_as::<_, Account>(
            r#"SELECT
                id, user_id, type, provider, provider_account_id,
                refresh_token, access_token, expires_at, token_type, scope,
                id_token, session_state, created_at, updated_at
            FROM accounts
            WHERE provider = $1 AND provider_account_id = $2"#,
        )
        .bind(provider)
        .bind(provider_account_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(account)
    }

    /// Find all accounts for a user
    #[allow(dead_code)]
    pub async fn find_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Vec<Account>, AppError> {
        let accounts = sqlx::query_as::<_, Account>(
            r#"SELECT
                id, user_id, type, provider, provider_account_id,
                refresh_token, access_token, expires_at, token_type, scope,
                id_token, session_state, created_at, updated_at
            FROM accounts
            WHERE user_id = $1"#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(accounts)
    }

    /// Create or update OAuth account link
    #[allow(clippy::too_many_arguments)]
    pub async fn upsert(
        pool: &PgPool,
        user_id: Uuid,
        provider: &str,
        provider_account_id: &str,
        access_token: Option<&str>,
        refresh_token: Option<&str>,
        expires_at: Option<i64>,
        id_token: Option<&str>,
    ) -> Result<Account, AppError> {
        let account = sqlx::query_as::<_, Account>(
            r#"INSERT INTO accounts (user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at, id_token)
            VALUES ($1, 'oauth', $2, $3, $4, $5, $6, $7)
            ON CONFLICT (provider, provider_account_id)
            DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = COALESCE(EXCLUDED.refresh_token, accounts.refresh_token),
                expires_at = EXCLUDED.expires_at,
                id_token = EXCLUDED.id_token,
                updated_at = NOW()
            RETURNING
                id, user_id, type, provider, provider_account_id,
                refresh_token, access_token, expires_at, token_type, scope,
                id_token, session_state, created_at, updated_at"#
        )
        .bind(user_id)
        .bind(provider)
        .bind(provider_account_id)
        .bind(access_token)
        .bind(refresh_token)
        .bind(expires_at)
        .bind(id_token)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(account)
    }
}

/// Session repository operations
pub struct SessionRepo;

impl SessionRepo {
    /// Find session by token
    pub async fn find_by_token(pool: &PgPool, token: &str) -> Result<Option<Session>, AppError> {
        let session = sqlx::query_as::<_, Session>(
            r#"SELECT
                id, user_id, token, expires_at, created_at, last_activity_at,
                user_agent, ip_address::text, rotated_from
            FROM sessions
            WHERE token = $1 AND expires_at > NOW()"#,
        )
        .bind(token)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(session)
    }

    /// Create a new session
    pub async fn create(
        pool: &PgPool,
        input: CreateSessionInput,
        ttl_days: i64,
    ) -> Result<Session, AppError> {
        let token = generate_session_token();
        let expires_at = Utc::now() + Duration::days(ttl_days);

        let session = sqlx::query_as::<_, Session>(
            r#"INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
            VALUES ($1, $2, $3, $4, $5::inet)
            RETURNING
                id, user_id, token, expires_at, created_at, last_activity_at,
                user_agent, ip_address::text, rotated_from"#,
        )
        .bind(input.user_id)
        .bind(&token)
        .bind(expires_at)
        .bind(&input.user_agent)
        .bind(&input.ip_address)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(session)
    }

    /// Rotate session token (for session fixation prevention)
    pub async fn rotate(pool: &PgPool, session_id: Uuid) -> Result<Session, AppError> {
        let new_token = generate_session_token();

        let session = sqlx::query_as::<_, Session>(
            r#"UPDATE sessions
            SET token = $2, rotated_from = id, created_at = NOW()
            WHERE id = $1
            RETURNING
                id, user_id, token, expires_at, created_at, last_activity_at,
                user_agent, ip_address::text, rotated_from"#,
        )
        .bind(session_id)
        .bind(&new_token)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(session)
    }

    /// Update session last activity
    pub async fn touch(pool: &PgPool, session_id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE sessions SET last_activity_at = NOW() WHERE id = $1")
            .bind(session_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Delete session (logout)
    pub async fn delete(pool: &PgPool, session_id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM sessions WHERE id = $1")
            .bind(session_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Delete session by token
    #[allow(dead_code)]
    pub async fn delete_by_token(pool: &PgPool, token: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM sessions WHERE token = $1")
            .bind(token)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Delete all sessions for a user
    #[allow(dead_code)]
    pub async fn delete_all_for_user(pool: &PgPool, user_id: Uuid) -> Result<u64, AppError> {
        let result = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected())
    }

    /// Cleanup expired sessions
    #[allow(dead_code)]
    pub async fn cleanup_expired(pool: &PgPool) -> Result<u64, AppError> {
        let result = sqlx::query("DELETE FROM sessions WHERE expires_at < NOW()")
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.rows_affected())
    }
}

/// Audit log repository
pub struct AuditLogRepo;

impl AuditLogRepo {
    /// Log a security event
    pub async fn log(pool: &PgPool, entry: AuditLogEntry) -> Result<(), AppError> {
        sqlx::query(
            r#"INSERT INTO audit_log
                (user_id, session_id, event_type, resource_type, resource_id,
                 action, status, details, ip_address, user_agent, request_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::inet, $10, $11)"#,
        )
        .bind(entry.user_id)
        .bind(entry.session_id)
        .bind(&entry.event_type)
        .bind(&entry.resource_type)
        .bind(&entry.resource_id)
        .bind(&entry.action)
        .bind(&entry.status)
        .bind(&entry.details)
        .bind(&entry.ip_address)
        .bind(&entry.user_agent)
        .bind(&entry.request_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}

/// RBAC repository for entitlement checks
pub struct RbacRepo;

impl RbacRepo {
    /// Check if user has a specific entitlement (now checks role names)
    /// NOTE: Full entitlement system removed (DEC-003). Checks role names instead.
    #[allow(dead_code)]
    pub async fn has_entitlement(
        pool: &PgPool,
        user_id: Uuid,
        entitlement: &str,
    ) -> Result<bool, AppError> {
        // Entitlements/role_entitlements tables were removed per DEC-003
        // Check role names instead
        let result: (bool,) = sqlx::query_as(
            r#"SELECT EXISTS(
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = $1
                  AND r.name = $2
                  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            )"#,
        )
        .bind(user_id)
        .bind(entitlement)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.0)
    }

    /// Get all entitlements for a user
    /// NOTE: Full entitlement system removed (DEC-003). Returns role names as entitlements.
    pub async fn get_entitlements(pool: &PgPool, user_id: Uuid) -> Result<Vec<String>, AppError> {
        // Entitlements/role_entitlements tables were removed per DEC-003
        // Return role names instead for basic RBAC
        let rows: Vec<(String,)> = sqlx::query_as(
            r#"SELECT DISTINCT r.name
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())"#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(|(name,)| name).collect())
    }

    /// Assign a role to a user
    pub async fn assign_role(
        pool: &PgPool,
        user_id: Uuid,
        role_name: &str,
        granted_by: Option<Uuid>,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"INSERT INTO user_roles (user_id, role_id, granted_by)
            SELECT $1, r.id, $3
            FROM roles r WHERE r.name = $2
            ON CONFLICT (user_id, role_id) DO NOTHING"#,
        )
        .bind(user_id)
        .bind(role_name)
        .bind(granted_by)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}
