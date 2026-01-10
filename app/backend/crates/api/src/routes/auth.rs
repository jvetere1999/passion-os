//! Authentication routes
//!
//! Handles OAuth flows, session management, and logout.
//! Per DEC-001=A: Force re-auth at cutover, no session migration.
//! Per DEC-002=A: CSRF via Origin/Referer verification.

use std::collections::HashMap;
use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Redirect, Response},
    routing::{get, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::error::{AppError, AppResult};
use crate::middleware::auth::{create_logout_cookie, create_session_cookie, AuthContext};
use crate::services::{AuthService, OAuthService, OAuthState};
use crate::state::AppState;

/// In-memory OAuth state storage (use Redis in production)
type OAuthStateStore = Arc<RwLock<HashMap<String, OAuthState>>>;

/// Create auth routes
pub fn router(oauth_state_store: OAuthStateStore) -> Router<Arc<AppState>> {
    Router::new()
        // OAuth endpoints
        .route("/providers", get(list_providers))
        .route("/signin/google", get(signin_google))
        .route("/signin/azure", get(signin_azure))
        .route("/callback/google", get(callback_google))
        .route("/callback/azure", get(callback_azure))
        // Session endpoints
        .route("/session", get(get_session))
        .route("/signout", post(signout))
        // Verification endpoints
        .route("/verify-age", post(verify_age))
        .route("/accept-tos", post(accept_tos))
        .layer(Extension(oauth_state_store))
}

/// Create OAuth state store
pub fn create_oauth_state_store() -> OAuthStateStore {
    Arc::new(RwLock::new(HashMap::new()))
}

/// OAuth provider info
#[derive(Serialize)]
pub struct OAuthProvider {
    pub id: String,
    pub name: String,
    pub enabled: bool,
}

/// List available OAuth providers
async fn list_providers(State(state): State<Arc<AppState>>) -> Json<Vec<OAuthProvider>> {
    let mut providers = Vec::new();

    if let Some(ref oauth) = state.config.auth.oauth {
        if oauth.google.is_some() {
            providers.push(OAuthProvider {
                id: "google".to_string(),
                name: "Google".to_string(),
                enabled: true,
            });
        }
        if oauth.azure.is_some() {
            providers.push(OAuthProvider {
                id: "azure".to_string(),
                name: "Microsoft".to_string(),
                enabled: true,
            });
        }
    }

    Json(providers)
}

/// Start Google OAuth flow
async fn signin_google(
    State(state): State<Arc<AppState>>,
    Extension(oauth_store): Extension<OAuthStateStore>,
) -> AppResult<Response> {
    let oauth_service = OAuthService::new(&state.config)?;

    let google = match oauth_service.google {
        Some(g) => g,
        None => {
            // Redirect to error page instead of 500
            let error_url = format!(
                "https://ignition.ecent.online/auth/error?error=OAuthNotConfigured&provider=Google&details={}",
                urlencoding::encode("Google OAuth credentials are not configured on the server")
            );
            return Ok(Redirect::temporary(&error_url).into_response());
        }
    };

    let (auth_url, oauth_state) = google.authorization_url();

    // Store state for callback validation
    {
        let mut store = oauth_store.write().await;
        store.insert(oauth_state.csrf_token.clone(), oauth_state);
    }

    Ok(Redirect::temporary(&auth_url).into_response())
}

/// Start Azure/Microsoft OAuth flow
async fn signin_azure(
    State(state): State<Arc<AppState>>,
    Extension(oauth_store): Extension<OAuthStateStore>,
) -> AppResult<Response> {
    let oauth_service = OAuthService::new(&state.config)?;

    let azure = match oauth_service.azure {
        Some(a) => a,
        None => {
            // Redirect to error page instead of 500
            let error_url = format!(
                "https://ignition.ecent.online/auth/error?error=OAuthNotConfigured&provider=Azure&details={}",
                urlencoding::encode("Azure/Microsoft OAuth credentials are not configured on the server")
            );
            return Ok(Redirect::temporary(&error_url).into_response());
        }
    };

    let (auth_url, oauth_state) = azure.authorization_url();

    // Store state for callback validation
    {
        let mut store = oauth_store.write().await;
        store.insert(oauth_state.csrf_token.clone(), oauth_state);
    }

    Ok(Redirect::temporary(&auth_url).into_response())
}

/// OAuth callback query parameters
#[derive(Deserialize)]
struct OAuthCallback {
    code: String,
    state: String,
}

/// Google OAuth callback
async fn callback_google(
    State(state): State<Arc<AppState>>,
    Extension(oauth_store): Extension<OAuthStateStore>,
    Query(params): Query<OAuthCallback>,
) -> Response {
    match handle_google_callback(&state, oauth_store, params).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Google OAuth callback error: {}", e);
            let error_url = format!(
                "{}/auth/error?error=OAuthCallback&provider=Google&details={}",
                state.config.server.frontend_url,
                urlencoding::encode(&e.to_string())
            );
            Redirect::temporary(&error_url).into_response()
        }
    }
}

async fn handle_google_callback(
    state: &Arc<AppState>,
    oauth_store: OAuthStateStore,
    params: OAuthCallback,
) -> AppResult<Response> {
    // Validate state and get stored OAuth state
    let oauth_state = {
        let mut store = oauth_store.write().await;
        store
            .remove(&params.state)
            .ok_or(AppError::OAuthError("Invalid state parameter".to_string()))?
    };

    // Create OAuth service
    let oauth_service = OAuthService::new(&state.config)?;
    let google = oauth_service
        .google
        .ok_or_else(|| AppError::Config("Google OAuth not configured".to_string()))?;

    // Exchange code for tokens
    let token_info = google
        .exchange_code(&params.code, &oauth_state.pkce_verifier)
        .await?;

    // Get user info
    let user_info = google.get_user_info(&token_info.access_token).await?;

    // Authenticate and create session
    let (user, session) = AuthService::authenticate_oauth(
        &state.db, user_info, None, // TODO: Extract from request
        None, // TODO: Extract from request
        30,   // 30 day session
    )
    .await?;

    // Create session cookie
    let cookie = create_session_cookie(
        &session.token,
        &state.config.auth.cookie_domain,
        state.config.auth.session_ttl_seconds,
    );

    // Redirect to frontend app with session cookie
    let redirect_url = format!("{}/today", state.config.server.frontend_url);
    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(header::LOCATION, redirect_url)
        .header(header::SET_COOKIE, cookie)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?;

    tracing::info!(
        user_id = %user.id,
        email = %user.email,
        "User authenticated via Google OAuth"
    );

    Ok(response)
}

/// Azure OAuth callback
async fn callback_azure(
    State(state): State<Arc<AppState>>,
    Extension(oauth_store): Extension<OAuthStateStore>,
    Query(params): Query<OAuthCallback>,
) -> Response {
    match handle_azure_callback(&state, oauth_store, params).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Azure OAuth callback error: {}", e);
            let error_url = format!(
                "{}/auth/error?error=OAuthCallback&provider=Azure&details={}",
                state.config.server.frontend_url,
                urlencoding::encode(&e.to_string())
            );
            Redirect::temporary(&error_url).into_response()
        }
    }
}

async fn handle_azure_callback(
    state: &Arc<AppState>,
    oauth_store: OAuthStateStore,
    params: OAuthCallback,
) -> AppResult<Response> {
    // Validate state and get stored OAuth state
    let oauth_state = {
        let mut store = oauth_store.write().await;
        store
            .remove(&params.state)
            .ok_or(AppError::OAuthError("Invalid state parameter".to_string()))?
    };

    // Create OAuth service
    let oauth_service = OAuthService::new(&state.config)?;
    let azure = oauth_service
        .azure
        .ok_or_else(|| AppError::Config("Azure OAuth not configured".to_string()))?;

    // Exchange code for tokens
    let token_info = azure
        .exchange_code(&params.code, &oauth_state.pkce_verifier)
        .await?;

    // Get user info
    let user_info = azure.get_user_info(&token_info.access_token).await?;

    // Authenticate and create session
    let (user, session) = AuthService::authenticate_oauth(
        &state.db, user_info, None, None, 30, // 30 day session
    )
    .await?;

    // Create session cookie
    let cookie = create_session_cookie(
        &session.token,
        &state.config.auth.cookie_domain,
        state.config.auth.session_ttl_seconds,
    );

    // Redirect to frontend app with session cookie
    let redirect_url = format!("{}/today", state.config.server.frontend_url);
    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(header::LOCATION, redirect_url)
        .header(header::SET_COOKIE, cookie)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?;

    tracing::info!(
        user_id = %user.id,
        email = %user.email,
        "User authenticated via Azure OAuth"
    );

    Ok(response)
}

/// Session response
#[derive(Serialize)]
pub struct SessionResponse {
    pub user: Option<SessionUser>,
}

#[derive(Serialize)]
pub struct SessionUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub image: Option<String>,
    pub role: String,
    pub entitlements: Vec<String>,
    pub age_verified: bool,
    pub tos_accepted: bool,
}

/// Get current session
async fn get_session(
    State(state): State<Arc<AppState>>,
    auth: Option<Extension<AuthContext>>,
) -> Json<SessionResponse> {
    if let Some(Extension(auth_context)) = auth {
        // Get full user data
        if let Ok(Some(user)) =
            crate::db::repos::UserRepo::find_by_id(&state.db, auth_context.user_id).await
        {
            return Json(SessionResponse {
                user: Some(SessionUser {
                    id: user.id.to_string(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    entitlements: auth_context.entitlements,
                    age_verified: user.age_verified,
                    tos_accepted: user.tos_accepted,
                }),
            });
        }
    }

    Json(SessionResponse { user: None })
}

/// Sign out (destroy session)
async fn signout(
    State(state): State<Arc<AppState>>,
    auth: Option<Extension<AuthContext>>,
) -> Response {
    if let Some(Extension(auth_context)) = auth {
        if !auth_context.is_dev_bypass {
            // Delete session from database
            let _ = AuthService::logout(
                &state.db,
                auth_context.session_id,
                auth_context.user_id,
                None,
            )
            .await;
        }
    }

    // Clear session cookie
    let cookie = create_logout_cookie(&state.config.auth.cookie_domain);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::SET_COOKIE, cookie)
        .body(axum::body::Body::empty())
        .unwrap()
}

#[derive(Deserialize)]
pub struct VerifyAgeRequest {
    pub is_13_or_older: bool,
}

/// Verify age (for COPPA compliance)
async fn verify_age(
    State(state): State<Arc<AppState>>,
    auth: Option<Extension<AuthContext>>,
    Json(payload): Json<VerifyAgeRequest>,
) -> AppResult<StatusCode> {
    let auth_context = auth.ok_or(AppError::Unauthorized)?.0;

    if !payload.is_13_or_older {
        return Err(AppError::Forbidden);
    }

    // Update user record
    crate::db::repos::UserRepo::verify_age(&state.db, auth_context.user_id).await?;

    // Rotate session after privilege change
    if !auth_context.is_dev_bypass {
        let _ = AuthService::rotate_session(
            &state.db,
            auth_context.session_id,
            auth_context.user_id,
            "age_verification",
        )
        .await;
    }

    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub struct AcceptTosRequest {
    pub accepted: bool,
    #[serde(default = "default_tos_version")]
    pub version: String,
}

fn default_tos_version() -> String {
    "1.0".to_string()
}

/// Accept Terms of Service
async fn accept_tos(
    State(state): State<Arc<AppState>>,
    auth: Option<Extension<AuthContext>>,
    Json(payload): Json<AcceptTosRequest>,
) -> AppResult<StatusCode> {
    let auth_context = auth.ok_or(AppError::Unauthorized)?.0;

    if !payload.accepted {
        return Err(AppError::BadRequest("TOS must be accepted".to_string()));
    }

    // Update user record
    crate::db::repos::UserRepo::accept_tos(&state.db, auth_context.user_id, &payload.version)
        .await?;

    // Rotate session after privilege change
    if !auth_context.is_dev_bypass {
        let _ = AuthService::rotate_session(
            &state.db,
            auth_context.session_id,
            auth_context.user_id,
            "tos_acceptance",
        )
        .await;
    }

    Ok(StatusCode::OK)
}
