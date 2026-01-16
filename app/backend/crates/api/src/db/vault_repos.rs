use crate::db::vault_models::{LockReason, Vault, VaultLockState};
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

pub struct VaultRepo;

impl VaultRepo {
    /// Get vault by user_id
    pub async fn get_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Vault>, sqlx::Error> {
        sqlx::query_as::<_, Vault>(
            "SELECT id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, 
                    crypto_policy_version, locked_at, lock_reason, enforce_tier, created_at, updated_at
             FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
    }

    /// Get vault lock state (only locked_at and lock_reason)
    pub async fn get_lock_state(pool: &PgPool, user_id: Uuid) -> Result<Option<VaultLockState>, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct LockStateRow {
            locked_at: Option<chrono::DateTime<chrono::Utc>>,
            lock_reason: Option<String>,
        }
        
        let row = sqlx::query_as::<_, LockStateRow>(
            "SELECT locked_at, lock_reason FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|r| VaultLockState {
            locked_at: r.locked_at,
            lock_reason: r.lock_reason,
        }))
    }

    /// Check if vault is locked
    pub async fn is_locked(pool: &PgPool, user_id: Uuid) -> Result<bool, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct IsLockedRow {
            is_locked: Option<bool>,
        }
        
        let result = sqlx::query_as::<_, IsLockedRow>(
            "SELECT (locked_at IS NOT NULL) as is_locked FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(result.map(|r| r.is_locked.unwrap_or(false)).unwrap_or(false))
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
        sqlx::query(
            "UPDATE vaults SET locked_at = $1, lock_reason = $2, updated_at = NOW() 
             WHERE user_id = $3"
        )
        .bind(Utc::now())
        .bind(reason.as_str())
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
        
        // Log lock event
        sqlx::query(
            "INSERT INTO vault_lock_events (id, vault_id, locked_at, lock_reason, created_at)
             SELECT gen_random_uuid(), id, NOW(), $2, NOW() FROM vaults WHERE user_id = $1"
        )
        .bind(user_id)
        .bind(reason.as_str())
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
        .bind(0i32)
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
        .bind(reason.as_str())
        .bind(device_id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
