/// User settings repository
/// Provides database access for reading/writing user settings
/// Uses sqlx runtime queries (NO compile-time macros)

use sqlx::{PgPool, Error as SqlxError};
use uuid::Uuid;
use serde_json::json;

use super::user_settings_models::{UserSetting, UpdateSettingRequest};

pub struct UserSettingsRepo;

impl UserSettingsRepo {
    /// Get all settings for a user
    pub async fn get_all(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Vec<UserSetting>, SqlxError> {
        sqlx::query_as::<_, UserSetting>(
            r#"
            SELECT id, user_id, key, value, updated_at, created_at
            FROM user_settings
            WHERE user_id = $1
            ORDER BY key ASC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
    }

    /// Get a single setting by key
    pub async fn get_one(
        pool: &PgPool,
        user_id: Uuid,
        key: &str,
    ) -> Result<Option<UserSetting>, SqlxError> {
        sqlx::query_as::<_, UserSetting>(
            r#"
            SELECT id, user_id, key, value, updated_at, created_at
            FROM user_settings
            WHERE user_id = $1 AND key = $2
            "#,
        )
        .bind(user_id)
        .bind(key)
        .fetch_optional(pool)
        .await
    }

    /// Upsert a setting (insert or update)
    pub async fn upsert(
        pool: &PgPool,
        user_id: Uuid,
        req: &UpdateSettingRequest,
    ) -> Result<UserSetting, SqlxError> {
        let now = chrono::Utc::now();
        
        sqlx::query_as::<_, UserSetting>(
            r#"
            INSERT INTO user_settings (id, user_id, key, value, updated_at, created_at)
            VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              $4,
              $4
            )
            ON CONFLICT (user_id, key) DO UPDATE
            SET value = $3, updated_at = $4
            RETURNING id, user_id, key, value, updated_at, created_at
            "#,
        )
        .bind(user_id)
        .bind(&req.key)
        .bind(&req.value)
        .bind(now)
        .fetch_one(pool)
        .await
    }

    /// Delete a setting
    pub async fn delete(
        pool: &PgPool,
        user_id: Uuid,
        key: &str,
    ) -> Result<bool, SqlxError> {
        let result = sqlx::query(
            r#"
            DELETE FROM user_settings
            WHERE user_id = $1 AND key = $2
            "#,
        )
        .bind(user_id)
        .bind(key)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Get setting value directly (convenience)
    pub async fn get_value(
        pool: &PgPool,
        user_id: Uuid,
        key: &str,
    ) -> Result<Option<serde_json::Value>, SqlxError> {
        let setting = Self::get_one(pool, user_id, key).await?;
        Ok(setting.map(|s| s.value))
    }

    /// Set setting value directly (convenience)
    pub async fn set_value(
        pool: &PgPool,
        user_id: Uuid,
        key: &str,
        value: serde_json::Value,
    ) -> Result<UserSetting, SqlxError> {
        let req = UpdateSettingRequest {
            key: key.to_string(),
            value,
        };
        Self::upsert(pool, user_id, &req).await
    }
}
