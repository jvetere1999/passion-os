//! Authentication middleware
//!
//! Extracts and validates session from cookies.
//! Per DEC-001=A: Force re-auth at cutover, no session migration.
//! Per DEC-004=B: DB-backed roles for admin authorization.

use std::sync::Arc;

use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::db::repos::{RbacRepo, SessionRepo, UserRepo};
use crate::error::AppError;
use crate::services::DevBypassAuth;
use crate::state::AppState;

/// Extracted authentication context
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct AuthContext {
    /// User ID
    pub user_id: Uuid,
    /// User email
    pub email: String,
    /// User name
    pub name: String,
    /// User role (legacy column, per DEC-004=B)
    pub role: String,
    /// Session ID
    pub session_id: Uuid,
    /// User entitlements (from RBAC)
    pub entitlements: Vec<String>,
    /// Whether this is a dev bypass session
    pub is_dev_bypass: bool,
}

impl AuthContext {
    /// Check if user has admin role
    pub fn is_admin(&self) -> bool {
        self.role == "admin" || self.entitlements.contains(&"admin:access".to_string())
    }

    /// Check if user has a specific entitlement
    #[allow(dead_code)]
    pub fn has_entitlement(&self, entitlement: &str) -> bool {
        self.entitlements.contains(&entitlement.to_string())
    }

    /// Create AuthContext from database using session token
    ///
    /// Consolidates the session lookup, user fetch, and entitlement loading
    /// into a single operation with consistent error handling.
    pub async fn from_token(db: &sqlx::PgPool, token: &str) -> Result<Self, AppError> {
        // Look up session in database
        let session = SessionRepo::find_by_token(db, token)
            .await?
            .ok_or_else(|| AppError::unauthorized("Session not found"))?;

        tracing::debug!(session_id = %session.id, "Session found");

        // Fetch user
        let user = UserRepo::find_by_id(db, session.user_id)
            .await?
            .ok_or_else(|| AppError::unauthorized("User not found"))?;

        tracing::debug!(user_id = %user.id, "User found");

        // Load entitlements from RBAC
        let entitlements = RbacRepo::get_entitlements(db, user.id).await?;

        Ok(AuthContext {
            user_id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            session_id: session.id,
            entitlements,
            is_dev_bypass: false,
        })
    }
}

/// Session cookie name
pub const SESSION_COOKIE_NAME: &str = "session";

/// Extract session from request and validate
pub async fn extract_session(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let host = req
        .headers()
        .get(header::HOST)
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    // Check for dev bypass first
    if DevBypassAuth::is_allowed(&state.config.server.environment, host.as_deref()) {
        let (user_id, email, name, role) = DevBypassAuth::get_dev_user();
        let auth_context = AuthContext {
            user_id,
            email,
            name,
            role,
            session_id: Uuid::nil(),
            entitlements: vec![
                "admin:access".to_string(),
                "admin:users".to_string(),
                "admin:content".to_string(),
                "admin:backup".to_string(),
            ],
            is_dev_bypass: true,
        };
        req.extensions_mut().insert(auth_context);
        return Ok(next.run(req).await);
    }

    // Extract and process session
    if let Some(token) = extract_session_token(&req) {
        init_auth_context(&state, &mut req, &token).await;
    }

    Ok(next.run(req).await)
}

/// Require authenticated user and inject User extension
pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Check if AuthContext is present in extensions
    let auth_context = req
        .extensions()
        .get::<AuthContext>()
        .ok_or(AppError::Unauthorized(
            "Authentication required".to_string(),
        ))?
        .clone();

    let user = UserRepo::find_by_id(&state.db, auth_context.user_id)
        .await?
        .ok_or(AppError::Unauthorized("User not found".to_string()))?;

    if !user.approved {
        return Err(AppError::Forbidden);
    }

    // Enforce passkey only after onboarding is completed; always allow onboarding/webauthn flows.
    let path = req.uri().path();
    let skip_passkey_paths =
        path.starts_with("/api/onboarding") || path.starts_with("/auth/webauthn");

    let onboarding_completed = sqlx::query_scalar::<_, Option<String>>(
        "SELECT status FROM user_onboarding_state WHERE user_id = $1",
    )
    .bind(auth_context.user_id)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten()
    .flatten()
    .map(|s| s == "completed")
    .unwrap_or(false);

    if !skip_passkey_paths && onboarding_completed {
        let has_passkey = crate::db::authenticator_repos::AuthenticatorRepo::get_by_user_id(
            &state.db,
            auth_context.user_id,
        )
        .await?
        .first()
        .is_some();

        if !has_passkey {
            return Err(AppError::Forbidden);
        }
    }

    // If TOS not accepted, auto-mark as accepted on first authenticated request to unblock flow
    if !user.tos_accepted {
        let _ = crate::db::repos::UserRepo::accept_tos(&state.db, user.id, "1.0").await;
    }

    req.extensions_mut().insert(user);

    Ok(next.run(req).await)
}

/// Require admin role (per DEC-004=B: DB-backed roles)
pub async fn require_admin(req: Request, next: Next) -> Result<Response, AppError> {
    // Check if AuthContext is present and has admin role
    match req.extensions().get::<AuthContext>() {
        Some(auth) if auth.is_admin() => Ok(next.run(req).await),
        Some(_) => Err(AppError::Forbidden),
        None => Err(AppError::Unauthorized(
            "Authentication required".to_string(),
        )),
    }
}

/// Require specific entitlement
#[allow(dead_code)]
pub fn require_entitlement(
    entitlement: &'static str,
) -> impl Fn(
    Request,
    Next,
)
    -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, AppError>> + Send>>
       + Clone
       + Send
       + 'static {
    move |req: Request, next: Next| {
        Box::pin(async move {
            match req.extensions().get::<AuthContext>() {
                Some(auth) if auth.has_entitlement(entitlement) => Ok(next.run(req).await),
                Some(_) => Err(AppError::Forbidden),
                None => Err(AppError::Unauthorized(
                    "Authentication required".to_string(),
                )),
            }
        })
    }
}

/// Initialize AuthContext from session token
///
/// This function consolidates the session lookup, user fetch, and activity logging
/// into a single point of logic. It replaces scattered session handling code.
///
/// Includes timeout enforcement: returns 401 if session has been inactive too long.
async fn init_auth_context(state: &Arc<AppState>, req: &mut Request, token: &str) {
    tracing::debug!(
        token_preview = %&token[..token.len().min(10)],
        "Looking up session in database"
    );

    // Look up session in database
    match SessionRepo::find_by_token(&state.db, token).await {
        Ok(Some(session)) => {
            tracing::debug!(
                session_id = %session.id,
                user_id = %session.user_id,
                "Session found in database"
            );

            // TIMEOUT CHECK: Return 401 if session has been inactive too long
            if SessionRepo::is_inactive(
                &session,
                state.config.auth.session_inactivity_timeout_minutes,
            ) {
                tracing::warn!(
                    session_id = %session.id,
                    user_id = %session.user_id,
                    timeout_minutes = state.config.auth.session_inactivity_timeout_minutes,
                    "Session inactive for too long, returning 401"
                );
                // Don't insert AuthContext - handler will return 401 when it requires Extension(auth)
                return;
            }

            // Get user
            match UserRepo::find_by_id(&state.db, session.user_id).await {
                Ok(Some(user)) => {
                    tracing::debug!(
                        user_id = %user.id,
                        email = %user.email,
                        "User found"
                    );

                    // Get entitlements from RBAC
                    match RbacRepo::get_entitlements(&state.db, user.id).await {
                        Ok(entitlements) => {
                            let auth_context = AuthContext {
                                user_id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                session_id: session.id,
                                entitlements,
                                is_dev_bypass: false,
                            };

                            // Update activity (fire and forget, logged internally)
                            log_activity_update(&state.db, session.id, user.id);

                            req.extensions_mut().insert(auth_context);
                        }
                        Err(e) => {
                            tracing::error!(
                                error = %e,
                                user_id = %user.id,
                                "Error fetching entitlements"
                            );
                        }
                    }
                }
                Ok(None) => {
                    tracing::warn!(
                        user_id = %session.user_id,
                        "User not found for valid session"
                    );
                }
                Err(e) => {
                    tracing::error!(error = %e, "Error fetching user");
                }
            }
        }
        Ok(None) => {
            tracing::debug!("Session not found in database");
        }
        Err(e) => {
            tracing::error!(error = %e, "Error looking up session");
        }
    }
}

/// Extract session token from cookie header
fn extract_session_token(req: &Request) -> Option<String> {
    let cookie_header = req.headers().get(header::COOKIE);

    cookie_header?.to_str().ok()?.split(';').find_map(|cookie| {
        let cookie = cookie.trim();
        if cookie.starts_with(SESSION_COOKIE_NAME) {
            cookie
                .strip_prefix(&format!("{}=", SESSION_COOKIE_NAME))
                .map(|s| s.to_string())
        } else {
            None
        }
    })
}

/// Log session and user activity asynchronously with error handling
///
/// Updates are fire-and-forget but errors are logged for observability.
/// This ensures activity tracking doesn't impact request latency.
fn log_activity_update(db: &sqlx::PgPool, session_id: Uuid, user_id: Uuid) {
    let db = db.clone();
    tokio::spawn(async move {
        // Update session last activity
        if let Err(e) = SessionRepo::touch(&db, session_id).await {
            tracing::warn!(
                session_id = %session_id,
                error = %e,
                "Failed to update session activity"
            );
        }

        // Update user last activity
        if let Err(e) = UserRepo::update_last_activity(&db, user_id).await {
            tracing::warn!(
                user_id = %user_id,
                error = %e,
                "Failed to update user last activity"
            );
        }
    });
}

/// Create session cookie header value
/// Per copilot-instructions: Domain=ecent.online; SameSite=None; Secure; HttpOnly
pub fn create_session_cookie(token: &str, domain: &str, ttl_seconds: u64) -> String {
    format!(
        "{}={}; Domain={}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age={}",
        SESSION_COOKIE_NAME, token, domain, ttl_seconds
    )
}

/// Create logout cookie (expires immediately)
pub fn create_logout_cookie(domain: &str) -> String {
    format!(
        "{}=; Domain={}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0",
        SESSION_COOKIE_NAME, domain
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_session_cookie() {
        let cookie = create_session_cookie("test_token", "ecent.online", 2592000);
        assert!(cookie.contains("session=test_token"));
        assert!(cookie.contains("Domain=ecent.online"));
        assert!(cookie.contains("HttpOnly"));
        assert!(cookie.contains("Secure"));
        assert!(cookie.contains("SameSite=None"));
        assert!(cookie.contains("Max-Age=2592000"));
    }

    #[test]
    fn test_create_logout_cookie() {
        let cookie = create_logout_cookie("ecent.online");
        assert!(cookie.contains("session="));
        assert!(cookie.contains("Max-Age=0"));
    }

    #[test]
    fn test_dev_bypass_rejected_in_production() {
        std::env::set_var("AUTH_DEV_BYPASS", "true");
        assert!(!DevBypassAuth::is_allowed(
            "production",
            Some("localhost:3000")
        ));
        std::env::remove_var("AUTH_DEV_BYPASS");
    }

    #[test]
    fn test_dev_bypass_rejected_for_non_localhost() {
        std::env::set_var("AUTH_DEV_BYPASS", "true");
        assert!(!DevBypassAuth::is_allowed(
            "development",
            Some("example.com")
        ));
        std::env::remove_var("AUTH_DEV_BYPASS");
    }

    #[test]
    fn test_dev_bypass_allowed_in_dev_localhost() {
        std::env::set_var("AUTH_DEV_BYPASS", "true");
        assert!(DevBypassAuth::is_allowed(
            "development",
            Some("localhost:3000")
        ));
        std::env::remove_var("AUTH_DEV_BYPASS");
    }

    #[test]
    fn test_auth_context_is_admin() {
        let ctx = AuthContext {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test".to_string(),
            role: "admin".to_string(),
            session_id: Uuid::new_v4(),
            entitlements: vec![],
            is_dev_bypass: false,
        };
        assert!(ctx.is_admin());

        let ctx2 = AuthContext {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test".to_string(),
            role: "user".to_string(),
            session_id: Uuid::new_v4(),
            entitlements: vec!["admin:access".to_string()],
            is_dev_bypass: false,
        };
        assert!(ctx2.is_admin());

        let ctx3 = AuthContext {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test".to_string(),
            role: "user".to_string(),
            session_id: Uuid::new_v4(),
            entitlements: vec![],
            is_dev_bypass: false,
        };
        assert!(!ctx3.is_admin());
    }
}
