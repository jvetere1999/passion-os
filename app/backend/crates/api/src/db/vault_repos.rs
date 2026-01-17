use crate::db::vault_models::{LockReason, Vault, VaultLockState};
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

/// Default enforcement tier for new vaults (0 = no tier enforcement)
const DEFAULT_ENFORCE_TIER: i32 = 0;

/// Vault table column list (single source of truth for schema queries)
const VAULT_COLUMNS: &str = 
    "id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, \
     crypto_policy_version, locked_at, lock_reason, enforce_tier, last_rotated_at, \
     next_rotation_due, created_at, updated_at";

pub struct VaultRepo;

impl VaultRepo {
    /// Get vault by user_id
    pub async fn get_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Vault>, sqlx::Error> {
        sqlx::query_as::<_, Vault>(
            &format!("SELECT {} FROM vaults WHERE user_id = $1", VAULT_COLUMNS)
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
    }

    /// Get complete vault lock state (unified query, replaces separate get_lock_state + is_locked)
    /// Returns lock status with all relevant context for sync operations
    pub async fn get_vault_state_full(pool: &PgPool, user_id: Uuid) -> Result<Option<VaultLockState>, sqlx::Error> {
        sqlx::query_as::<_, VaultLockState>(
            "SELECT locked_at, lock_reason FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
    }

    /// Check if vault is locked (convenience method using get_vault_state_full)
    pub async fn is_locked(pool: &PgPool, user_id: Uuid) -> Result<bool, sqlx::Error> {
        let state = Self::get_vault_state_full(pool, user_id).await?;
        Ok(state.as_ref().map(|s| s.locked_at.is_some()).unwrap_or(false))
    }

    /// Get vault lock state (deprecated: use get_vault_state_full instead)
    #[deprecated(since = "0.2.0", note = "Use get_vault_state_full for unified query")]
    pub async fn get_lock_state(pool: &PgPool, user_id: Uuid) -> Result<Option<VaultLockState>, sqlx::Error> {
        Self::get_vault_state_full(pool, user_id).await
    }

    /// Lock vault with reason (wrapped in transaction with advisory lock)
    pub async fn lock_vault(
        pool: &PgPool,
        user_id: Uuid,
        reason: LockReason,
    ) -> Result<(), sqlx::Error> {
        // Use advisory lock to prevent concurrent mutations
        // Advisory lock key: hash of user_id to ensure unique lock per vault
        let lock_key = (user_id.as_u128() % i64::MAX as u128) as i64;
        
        let mut tx = pool.begin().await?;
        
        // Acquire exclusive advisory lock
        sqlx::query("SELECT pg_advisory_xact_lock($1)")
            .bind(lock_key)
            .execute(&mut *tx)
            .await?;
        
        // Update vault state within transaction
        let result = sqlx::query(
            "UPDATE vaults SET locked_at = $1, lock_reason = $2, updated_at = NOW() 
             WHERE user_id = $3"
        )
        .bind(Utc::now())
        .bind(reason.as_ref())
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        
        // Validate vault was found and updated (CLEANUP-4: prevent silent failures)
        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }
        
        // Log lock event
        sqlx::query(
            "INSERT INTO vault_lock_events (id, vault_id, locked_at, lock_reason, created_at)
             SELECT gen_random_uuid(), id, NOW(), $2, NOW() FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .bind(reason.as_ref())
        .execute(&mut *tx)
        .await?;
        
        tx.commit().await?;
        Ok(())
    }

    /// Unlock vault (wrapped in transaction with advisory lock)
    pub async fn unlock_vault(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
        // Use advisory lock to prevent concurrent mutations
        let lock_key = (user_id.as_u128() % i64::MAX as u128) as i64;
        
        let mut tx = pool.begin().await?;
        
        // Acquire exclusive advisory lock
        sqlx::query("SELECT pg_advisory_xact_lock($1)")
            .bind(lock_key)
            .execute(&mut *tx)
            .await?;
        
        // Update vault state within transaction
        sqlx::query(
            "UPDATE vaults SET locked_at = NULL, lock_reason = NULL, updated_at = NOW() 
             WHERE user_id = $1"
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        
        // Log unlock event
        sqlx::query(
            "INSERT INTO vault_lock_events (id, vault_id, locked_at, lock_reason, created_at)
             SELECT gen_random_uuid(), id, NULL, 'unlocked', NOW() FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        
        tx.commit().await?;
        Ok(())
    }

    /// Create new vault
    pub async fn create_vault(
        pool: &PgPool,
        user_id: Uuid,
        passphrase_salt: Vec<u8>,
        passphrase_hash: String,
        key_derivation_params: serde_json::Value,
    ) -> Result<Vault, sqlx::Error> {
        let vault_id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query_as::<_, Vault>(
            "INSERT INTO vaults 
             (id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, 
              crypto_policy_version, locked_at, lock_reason, enforce_tier, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, 
                       crypto_policy_version, locked_at, lock_reason, enforce_tier, created_at, updated_at"
        )
        .bind(vault_id)
        .bind(user_id)
        .bind(passphrase_salt)
        .bind(passphrase_hash)
        .bind(key_derivation_params)
        .bind(None::<String>)
        .bind(None::<chrono::DateTime<chrono::Utc>>)
        .bind(None::<String>)
        .bind(DEFAULT_ENFORCE_TIER)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await
    }

    /// Update crypto policy version
    pub async fn update_crypto_policy_version(
        pool: &PgPool,
        user_id: Uuid,
        version: String,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE vaults SET crypto_policy_version = $1, updated_at = NOW() 
             WHERE user_id = $2"
        )
        .bind(version)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Audit lock event (optional, for compliance)
    pub async fn log_lock_event(
        pool: &PgPool,
        vault_id: Uuid,
        reason: LockReason,
        device_id: Option<String>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO vault_lock_events (id, vault_id, locked_at, lock_reason, device_id, created_at)
             VALUES (gen_random_uuid(), $1, NOW(), $2, $3, NOW())"
        )
        .bind(vault_id)
        .bind(reason.as_ref())
        .bind(device_id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
