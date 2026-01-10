//! OAuth State Repository
//!
//! Database operations for distributed OAuth state storage.
//! This allows OAuth state to be shared across multiple backend instances.

use chrono::{Duration, Utc};
use sqlx::PgPool;

use crate::db::oauth_models::OAuthStateRow;
use crate::error::AppResult;

pub struct OAuthStateRepo;

impl OAuthStateRepo {
    /// Store OAuth state in database
    pub async fn insert(
        pool: &PgPool,
        state_key: &str,
        pkce_verifier: &str,
        redirect_uri: Option<&str>,
    ) -> AppResult<()> {
        let expires_at = Utc::now() + Duration::minutes(10);
        
        sqlx::query(
            r#"
            INSERT INTO oauth_states (state_key, pkce_verifier, redirect_uri, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (state_key) DO UPDATE SET
                pkce_verifier = EXCLUDED.pkce_verifier,
                redirect_uri = EXCLUDED.redirect_uri,
                expires_at = EXCLUDED.expires_at
            "#,
        )
        .bind(state_key)
        .bind(pkce_verifier)
        .bind(redirect_uri)
        .bind(expires_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Get and remove OAuth state (atomic operation)
    pub async fn take(pool: &PgPool, state_key: &str) -> AppResult<Option<OAuthStateRow>> {
        let row = sqlx::query_as::<_, OAuthStateRow>(
            r#"
            DELETE FROM oauth_states
            WHERE state_key = $1 AND expires_at > NOW()
            RETURNING state_key, pkce_verifier, redirect_uri, created_at, expires_at
            "#,
        )
        .bind(state_key)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    /// Clean up expired OAuth states (call periodically)
    pub async fn cleanup_expired(pool: &PgPool) -> AppResult<u64> {
        let result = sqlx::query("DELETE FROM oauth_states WHERE expires_at < NOW()")
            .execute(pool)
            .await?;

        Ok(result.rows_affected())
    }
}
