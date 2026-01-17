use crate::db::vault_models::{LockReason, LockVaultRequest, UnlockVaultRequest, UnlockVaultResponse};
use crate::db::vault_repos::VaultRepo;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::state::AppState;
use axum::{
    extract::{State, Json, Extension},
    http::StatusCode,
    routing::post,
    Router,
};
use std::sync::Arc;
use std::str::FromStr;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/lock", post(lock_vault))
        .route("/unlock", post(unlock_vault))
}

/// POST /api/vault/lock
/// Lock user's vault with specified reason
async fn lock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<LockVaultRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    // Validate lock reason
    if req.reason.is_empty() {
        return Err(AppError::BadRequest("Lock reason cannot be empty".to_string()));
    }

    // Parse lock reason using strum's FromStr derive
    let reason = LockReason::from_str(&req.reason)
        .map_err(|_| {
            AppError::BadRequest(
                format!("Invalid lock reason. Valid reasons: idle, backgrounded, logout, force, rotation, admin")
            )
        })?;

    VaultRepo::lock_vault(&state.db, auth.user_id, reason).await
        .map_err(|e| {
            tracing::error!("Failed to lock vault: {}", e);
            AppError::Internal("Failed to lock vault".to_string())
        })?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Vault locked"
        })),
    ))
}

/// POST /api/vault/unlock
/// Unlock user's vault with passphrase verification
async fn unlock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<UnlockVaultRequest>,
) -> Result<(StatusCode, Json<UnlockVaultResponse>), AppError> {
    // Validate passphrase input
    if req.passphrase.is_empty() {
        return Err(AppError::BadRequest("Passphrase cannot be empty".to_string()));
    }

    // Fetch vault
    let vault = VaultRepo::get_by_user_id(&state.db, auth.user_id).await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {}", e);
            AppError::Internal("Failed to fetch vault".to_string())
        })?
        .ok_or(AppError::Unauthorized("Vault not found".to_string()))?;

    // Verify passphrase using bcrypt (CLEANUP-1: security-critical)
    // The vault stores passphrase_hash created with bcrypt cost 12
    let passphrase_valid = bcrypt::verify(&req.passphrase, &vault.passphrase_hash)
        .map_err(|e| {
            tracing::error!("Passphrase verification failed: {}", e);
            AppError::Internal("Passphrase verification failed".to_string())
        })?;

    if !passphrase_valid {
        // Don't reveal whether vault exists, just return generic unauthorized
        return Err(AppError::Unauthorized("Invalid passphrase".to_string()));
    }

    // Passphrase verified - unlock vault within transaction (atomic operation with advisory lock)
    VaultRepo::unlock_vault(&state.db, auth.user_id).await
        .map_err(|e| {
            tracing::error!("Failed to unlock vault: {}", e);
            AppError::Internal("Failed to unlock vault".to_string())
        })?;

    // Fetch updated lock state to return in response
    let lock_state = VaultRepo::get_vault_state_full(&state.db, auth.user_id).await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault state: {}", e);
            AppError::Internal("Failed to fetch vault state".to_string())
        })?
        .unwrap_or_else(|| crate::db::vault_models::VaultLockState {
            locked_at: None,
            lock_reason: None,
        });

    Ok((
        StatusCode::OK,
        Json(UnlockVaultResponse {
            locked_at: lock_state.locked_at,
            lock_reason: lock_state.lock_reason,
        }),
    ))
}
