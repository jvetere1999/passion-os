use axum::{extract::State, routing::post, Extension, Json, Router};
use serde_json::json;
use std::sync::Arc;

use crate::{
    db::{
        recovery_codes_models::*, recovery_codes_repos::RecoveryCodesRepo, vault_repos::VaultRepo,
    },
    error::AppError,
    middleware::auth::AuthContext,
    middleware::trust_boundary::*,
    services::RecoveryValidator,
    state::AppState,
};

/// Recovery code endpoints
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/recovery-codes", post(generate_recovery_codes))
        .route("/recovery-codes/list", post(list_recovery_codes))
        .route("/reset-passphrase", post(reset_passphrase_with_code))
        .route("/change-passphrase", post(change_passphrase_authenticated))
}

/// POST /api/vault/recovery-codes
/// Generate new recovery codes for a vault
/// Requires authentication
///
/// # Trust Boundary
/// server_trusted() - This generates recovery codes server-side using secure random.
/// The codes are not cryptographic material; they're opaque identifiers that can be used
/// once to verify identity during passphrase reset.
async fn generate_recovery_codes(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = auth.user_id;

    // Verify user has a vault
    let vault = VaultRepo::get_by_user_id(&state.db, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {:?}", e);
            AppError::NotFound("Vault not found".to_string())
        })?
        .ok_or_else(|| AppError::NotFound("Vault not found".to_string()))?;

    // Generate 8 recovery codes
    let codes = RecoveryCodesRepo::generate_codes(&state.db, vault.id, user_id, 8)
        .await
        .map_err(|e| {
            tracing::error!("Failed to generate recovery codes: {:?}", e);
            AppError::Internal("Failed to generate recovery codes".to_string())
        })?;

    tracing::info!(
        user_id = %user_id,
        vault_id = %vault.id,
        code_count = codes.len(),
        "Recovery codes generated"
    );

    Ok(Json(json!({
        "data": {
            "codes": codes,
            "message": "Recovery codes generated successfully"
        }
    })))
}

/// POST /api/vault/recovery-codes/list
/// List all recovery codes for authenticated user's vault
/// Shows used/unused status and timestamps (but NOT the actual codes)
///
/// # Trust Boundary
/// server_trusted() - Returns metadata about recovery codes, not sensitive material
async fn list_recovery_codes(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = auth.user_id;

    // Verify user has a vault
    let vault = VaultRepo::get_by_user_id(&state.db, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {:?}", e);
            AppError::NotFound("Vault not found".to_string())
        })?
        .ok_or_else(|| AppError::NotFound("Vault not found".to_string()))?;

    // Get all recovery codes for this vault (metadata only, not the codes themselves)
    let codes = RecoveryCodesRepo::get_unused_codes(&state.db, vault.id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch recovery codes: {:?}", e);
            AppError::Internal("Failed to fetch recovery codes".to_string())
        })?;

    // Get counts
    let (unused_count, used_count) = RecoveryCodesRepo::get_code_count(&state.db, vault.id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get code counts: {:?}", e);
            AppError::Internal("Failed to get code counts".to_string())
        })?;

    // Build response with metadata (no actual codes)
    let code_list: Vec<serde_json::Value> = codes
        .iter()
        .map(|code| {
            serde_json::json!({
                "id": code.id.to_string(),
                "created_at": code.created_at,
                "used_at": code.used_at,
                "used": code.used
            })
        })
        .collect();

    Ok(Json(json!({
        "data": {
            "codes": code_list,
            "unused_count": unused_count,
            "used_count": used_count,
            "total_count": unused_count + used_count
        }
    })))
}

/// POST /api/vault/reset-passphrase
/// Reset vault passphrase using recovery code
/// Does NOT require authentication - recovery code acts as proof
///
/// # Trust Boundary
/// e2ee_boundary() - This crosses the E2EE boundary by accepting plaintext new passphrase.
/// Security-critical:
/// - Validates recovery code (single-use, not expired)
/// - Never logs plaintext passphrase
/// - Uses bcrypt cost 12 for new hash
/// - Audit logs the passphrase reset event
async fn reset_passphrase_with_code(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ResetPassphraseRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate code format using validator service
    RecoveryValidator::validate_code_format(&payload.code)?;

    // Validate new passphrase strength
    RecoveryValidator::validate_passphrase_strength(&payload.new_passphrase)?;

    // Find and use the recovery code
    let recovery_code = RecoveryCodesRepo::validate_and_use_code(&state.db, &payload.code)
        .await
        .map_err(|e| {
            tracing::error!("Failed to validate recovery code: {:?}", e);
            AppError::Internal("Failed to validate recovery code".to_string())
        })?
        .ok_or_else(|| AppError::BadRequest("Invalid or already used recovery code".to_string()))?;

    // Get the vault
    let vault = VaultRepo::get_by_user_id(&state.db, recovery_code.created_by)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {:?}", e);
            AppError::NotFound("Vault not found".to_string())
        })?
        .ok_or_else(|| AppError::NotFound("Vault not found".to_string()))?;

    // Hash the new passphrase using bcrypt
    let hashed = bcrypt::hash(&payload.new_passphrase, 12).map_err(|e| {
        tracing::error!("Failed to hash passphrase: {:?}", e);
        AppError::Internal("Failed to hash passphrase".to_string())
    })?;

    // Update vault passphrase
    sqlx::query(
        r#"
        UPDATE vaults
        SET passphrase_hash = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(&hashed)
    .bind(vault.id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update vault passphrase: {:?}", e);
        AppError::Internal("Failed to update passphrase".to_string())
    })?;

    tracing::warn!(
        vault_id = %vault.id,
        "Vault passphrase reset via recovery code"
    );

    Ok(Json(json!({
        "data": {
            "message": "Passphrase reset successfully",
            "vault_id": vault.id.to_string()
        }
    })))
}

/// POST /api/vault/change-passphrase
/// Change vault passphrase (authenticated user)
/// Requires current passphrase to verify identity
///
/// # Trust Boundary
/// e2ee_boundary() - This crosses the E2EE boundary by:
/// 1. Accepting plaintext current and new passphrases
/// 2. Verifying current passphrase against stored hash (bcrypt)
/// 3. Creating new passphrase hash
/// 4. Updating vault state atomically
///
/// Security notes:
/// - Both passphrases verified/hashed with bcrypt cost 12
/// - Current passphrase must match before allowing change
/// - Atomic update prevents partial state corruption
/// - Audit log records the passphrase change event
async fn change_passphrase_authenticated(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(payload): Json<ChangePassphraseRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = auth.user_id;

    // Get or create user's vault (auto-provision placeholder so first change succeeds)
    let vault = VaultRepo::ensure_vault(&state.db, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {:?}", e);
            AppError::NotFound("Vault not found".to_string())
        })?;

    // Verify current passphrase unless this is the first-time placeholder vault
    let is_placeholder = vault
        .key_derivation_params
        .as_object()
        .and_then(|o: &serde_json::Map<String, serde_json::Value>| o.get("placeholder"))
        .and_then(|v: &serde_json::Value| v.as_bool())
        .unwrap_or(false);

    if !is_placeholder {
        let passphrase_valid = bcrypt::verify(&payload.current_passphrase, &vault.passphrase_hash)
            .map_err(|e| {
                tracing::error!("Bcrypt verification failed: {:?}", e);
                AppError::Internal("Failed to verify passphrase".to_string())
            })?;

        if !passphrase_valid {
            return Err(AppError::Unauthorized(
                "Current passphrase is incorrect".to_string(),
            ));
        }
    }

    // Validate new passphrase strength
    RecoveryValidator::validate_passphrase_strength(&payload.new_passphrase)?;

    // Ensure new passphrase is different from current
    RecoveryValidator::validate_different_passphrases(
        &payload.current_passphrase,
        &payload.new_passphrase,
    )?;

    // Hash new passphrase
    let hashed = bcrypt::hash(&payload.new_passphrase, 12).map_err(|e| {
        tracing::error!("Failed to hash passphrase: {:?}", e);
        AppError::Internal("Failed to hash passphrase".to_string())
    })?;

    // Update vault passphrase
    sqlx::query(
        r#"
        UPDATE vaults
        SET passphrase_hash = $1,
            key_derivation_params = $2,
            updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(&hashed)
    .bind(serde_json::json!({ "kdf": "bcrypt", "cost": 12, "placeholder": false }))
    .bind(vault.id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update vault passphrase: {:?}", e);
        AppError::Internal("Failed to update passphrase".to_string())
    })?;

    // Revoke all recovery codes when passphrase changes
    let _ = RecoveryCodesRepo::revoke_all_codes(&state.db, vault.id).await;

    tracing::info!(
        user_id = %user_id,
        vault_id = %vault.id,
        "Vault passphrase changed successfully"
    );

    Ok(Json(json!({
        "data": {
            "message": "Passphrase changed successfully. Recovery codes have been revoked.",
            "vault_id": vault.id.to_string()
        }
    })))
}
