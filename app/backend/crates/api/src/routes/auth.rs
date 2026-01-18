//! Authentication routes
//!
//! Handles OAuth flows, session management, and logout.
//! Per DEC-001=A: Force re-auth at cutover, no session migration.
//! Per DEC-002=A: CSRF via Origin/Referer verification.

use std::sync::Arc;
use std::str::FromStr;

use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Redirect, Response},
    routing::{get, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::db::oauth_repos::OAuthStateRepo;
use crate::error::{AppError, AppResult};
use crate::middleware::auth::{create_logout_cookie, create_session_cookie, AuthContext};
use crate::services::{AuthService, OAuthService};
use crate::state::AppState;

/// Allowed redirect URIs - must match frontend deployment URLs
/// These are the only valid destinations after OAuth completes.
/// Any other redirect URI will be rejected to prevent open redirect attacks.
const ALLOWED_REDIRECT_URIS: &[&str] = &[
    // Production
    "https://ignition.ecent.online/today",
    "https://ignition.ecent.online/",
    "https://admin.ignition.ecent.online/dashboard",
    "https://admin.ignition.ecent.online/",
    // Development & Local
    "http://localhost:3000/today",
    "http://localhost:3000/",
    "http://localhost:3001/dashboard",
    "http://localhost:3001/",
    "http://127.0.0.1:3000/today",
    "http://127.0.0.1:3000/",
    "http://127.0.0.1:3001/dashboard",
    "http://127.0.0.1:3001/",
];

/// Validate redirect URI is on security allowlist
///
/// SEC-001: Prevents open redirect vulnerability by validating all redirect URIs
/// against a configured whitelist before storing them.
///
/// # Arguments
/// * `uri` - The redirect URI provided by the client (optional)
/// * `config` - Application configuration for fallback URL
///
/// # Returns
/// * Ok(String) - The validated redirect URI (either from allowlist or default)
/// * Err(AppError) - If URI is not on allowlist
fn validate_redirect_uri(uri: Option<&str>, config: &crate::config::AppConfig) -> AppResult<String> {
    let default = format!("{}/today", config.server.frontend_url);
    let uri = uri.unwrap_or(&default);
    
    // Check if URI matches one of the allowed patterns
    let is_valid = ALLOWED_REDIRECT_URIS.iter().any(|allowed| {
        uri == *allowed || uri.starts_with(&format!("{}/", allowed))
    });
    
    if !is_valid {
        tracing::warn!(
            redirect_uri = %uri,
            allowed_list = ?ALLOWED_REDIRECT_URIS,
            "Rejected redirect URI - not on allowlist (open redirect attack prevented)"
        );
        return Err(AppError::Unauthorized(
            "Invalid redirect URI - not on approved list".to_string(),
        ));
    }
    
    tracing::debug!(redirect_uri = %uri, "Redirect URI validated successfully");
    Ok(uri.to_string())
}

/// Query parameters for signin endpoints
#[derive(Deserialize)]
struct SigninQuery {
    redirect_uri: Option<String>,
}

/// Create auth routes (no more in-memory state store needed)
pub fn router() -> Router<Arc<AppState>> {
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
        .route("/accept-tos", post(accept_tos))
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
    Query(query): Query<SigninQuery>,
) -> AppResult<Response> {
    let oauth_service = OAuthService::new(&state.config)?;

    let google = match oauth_service.google {
        Some(g) => g,
        None => {
            let error_url = format!(
                "{}/auth/error?error=OAuthNotConfigured&provider=Google&details={}",
                state.config.server.frontend_url,
                urlencoding::encode("Google OAuth credentials are not configured on the server")
            );
            return Ok(Redirect::temporary(&error_url).into_response());
        }
    };

    let (auth_url, oauth_state) = google.authorization_url();

    // SEC-001: Validate redirect_uri against ALLOWED_REDIRECT_URIS whitelist
    // Prevents open redirect vulnerability - only approved URLs allowed
    let validated_redirect = validate_redirect_uri(query.redirect_uri.as_deref(), &state.config)?;
    
    // Store state in database for distributed access, with validated redirect_uri
    OAuthStateRepo::insert(
        &state.db,
        &oauth_state.csrf_token,
        &oauth_state.pkce_verifier,
        Some(&validated_redirect),
    )
    .await?;

    tracing::debug!(state = %oauth_state.csrf_token, redirect_uri = %validated_redirect, "Stored OAuth state in database");

    Ok(Redirect::temporary(&auth_url).into_response())
}

/// Start Azure/Microsoft OAuth flow
async fn signin_azure(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SigninQuery>,
) -> AppResult<Response> {
    let oauth_service = OAuthService::new(&state.config)?;

    let azure = match oauth_service.azure {
        Some(a) => a,
        None => {
            let error_url = format!(
                "{}/auth/error?error=OAuthNotConfigured&provider=Azure&details={}",
                state.config.server.frontend_url,
                urlencoding::encode("Azure/Microsoft OAuth credentials are not configured on the server")
            );
            return Ok(Redirect::temporary(&error_url).into_response());
        }
    };

    let (auth_url, oauth_state) = azure.authorization_url();

    // SEC-001: Validate redirect_uri against ALLOWED_REDIRECT_URIS whitelist
    // Prevents open redirect vulnerability - only approved URLs allowed
    let validated_redirect = validate_redirect_uri(query.redirect_uri.as_deref(), &state.config)?;

    // Store state in database for distributed access, with validated redirect_uri
    OAuthStateRepo::insert(
        &state.db,
        &oauth_state.csrf_token,
        &oauth_state.pkce_verifier,
        Some(&validated_redirect),
    )
    .await?;

    tracing::debug!(state = %oauth_state.csrf_token, redirect_uri = %validated_redirect, "Stored OAuth state in database");

    Ok(Redirect::temporary(&auth_url).into_response())
}

/// OAuth callback query parameters
/// Handles both success and error cases per OAuth 2.0 spec (RFC 6749)
#[derive(Deserialize)]
struct OAuthCallback {
    // Success case parameters
    code: Option<String>,
    
    // Error case parameters (RFC 6749 Section 4.1.2.1)
    error: Option<String>,
    error_description: Option<String>,
    error_uri: Option<String>,
    
    // Always present in both cases
    state: String,
}

/// Google OAuth callback
async fn callback_google(
    State(state): State<Arc<AppState>>,
    Query(params): Query<OAuthCallback>,
) -> Response {
    match handle_google_callback(&state, params).await {
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
    params: OAuthCallback,
) -> AppResult<Response> {
    // RFC 6749 Section 4.1.2.1: Handle OAuth error response
    if let Some(error) = params.error {
        let error_desc = params.error_description
            .as_deref()
            .unwrap_or(&error);
        
        tracing::warn!(
            oauth_error = %error,
            oauth_error_description = %error_desc,
            provider = "Google",
            "OAuth authorization failed at provider"
        );
        
        // Map specific OAuth errors to user-friendly messages
        let (error_code, message) = match error.as_str() {
            "access_denied" => (
                "OAuthDenied",
                "You denied the sign-in request. Please try again if you'd like to proceed.",
            ),
            "server_error" => (
                "OAuthServerError",
                "Google encountered an error. Please try again in a moment.",
            ),
            "temporarily_unavailable" => (
                "OAuthUnavailable",
                "Google is temporarily unavailable. Please try again later.",
            ),
            _ => (
                "OAuthError",
                "Sign-in failed. Please try again.",
            ),
        };
        
        let error_url = format!(
            "{}/auth/error?error={}&provider=Google&details={}",
            state.config.server.frontend_url,
            error_code,
            urlencoding::encode(message)
        );
        
        return Ok(Redirect::temporary(&error_url).into_response());
    }
    
    // Success path: code must be present
    let code = params.code.ok_or_else(|| {
        tracing::warn!(state_key = %params.state, "OAuth callback missing both code and error");
        AppError::OAuthError("Invalid OAuth response: missing authorization code".to_string())
    })?;

    tracing::debug!(state_key = %params.state, "Looking up OAuth state from database");
    
    // Validate state and get stored OAuth state from database
    let oauth_state_row = OAuthStateRepo::take(&state.db, &params.state)
        .await?
        .ok_or_else(|| {
            tracing::warn!(state_key = %params.state, "OAuth state not found in database");
            AppError::OAuthError("Invalid state parameter".to_string())
        })?;

    tracing::debug!("OAuth state found, exchanging code for tokens");

    // Create OAuth service
    let oauth_service = OAuthService::new(&state.config)?;
    let google = oauth_service
        .google
        .ok_or_else(|| AppError::Config("Google OAuth not configured".to_string()))?;

    // Exchange code for tokens
    let token_info = google
        .exchange_code(&code, &oauth_state_row.pkce_verifier)
        .await?;

    // Get user info
    let user_info = google.get_user_info(&token_info.access_token).await?;

    // Authenticate and create session
    // Note: user_agent and ip_address could be extracted from ConnectInfo middleware
    // For now, these are optional and logged separately via audit_log if needed
    let (user, session) = AuthService::authenticate_oauth(
        &state.db, user_info, None, // user_agent - would need Request extractor
        None, // ip_address - would need ConnectInfo middleware
        30,   // 30 day session
    )
    .await?;

    // Create session cookie
    let cookie = create_session_cookie(
        &session.token,
        &state.config.auth.cookie_domain,
        state.config.auth.session_ttl_seconds,
    );

    // Redirect to stored redirect_uri or default to /today
    let redirect_url = oauth_state_row.redirect_uri
        .unwrap_or_else(|| format!("{}/today", state.config.server.frontend_url));
    
    tracing::info!(
        user_id = %user.id,
        email = %user.email,
        redirect_url = %redirect_url,
        cookie_domain = %state.config.auth.cookie_domain,
        "User authenticated via Google OAuth, redirecting with cookie"
    );

    // Use 302 redirect with Set-Cookie header
    // The cookie domain is .ecent.online so it works across subdomains
    let cookie_header = header::HeaderValue::from_str(&cookie)
        .map_err(|e| AppError::Internal(format!("Invalid cookie header: {}", e)))?;
    
    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(header::LOCATION, redirect_url)
        .header(header::SET_COOKIE, cookie_header)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(response)
}

/// Azure OAuth callback
async fn callback_azure(
    State(state): State<Arc<AppState>>,
    Query(params): Query<OAuthCallback>,
) -> Response {
    match handle_azure_callback(&state, params).await {
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
    params: OAuthCallback,
) -> AppResult<Response> {
    // RFC 6749 Section 4.1.2.1: Handle OAuth error response
    if let Some(error) = params.error {
        let error_desc = params.error_description
            .as_deref()
            .unwrap_or(&error);
        
        tracing::warn!(
            oauth_error = %error,
            oauth_error_description = %error_desc,
            provider = "Azure",
            "OAuth authorization failed at provider"
        );
        
        // Map specific OAuth errors to user-friendly messages
        let (error_code, message) = match error.as_str() {
            "access_denied" => (
                "OAuthDenied",
                "You denied the sign-in request. Please try again if you'd like to proceed.",
            ),
            "server_error" => (
                "OAuthServerError",
                "Azure encountered an error. Please try again in a moment.",
            ),
            "temporarily_unavailable" => (
                "OAuthUnavailable",
                "Azure is temporarily unavailable. Please try again later.",
            ),
            _ => (
                "OAuthError",
                "Sign-in failed. Please try again.",
            ),
        };
        
        let error_url = format!(
            "{}/auth/error?error={}&provider=Azure&details={}",
            state.config.server.frontend_url,
            error_code,
            urlencoding::encode(message)
        );
        
        return Ok(Redirect::temporary(&error_url).into_response());
    }
    
    // Success path: code must be present
    let code = params.code.ok_or_else(|| {
        tracing::warn!(state_key = %params.state, "OAuth callback missing both code and error");
        AppError::OAuthError("Invalid OAuth response: missing authorization code".to_string())
    })?;

    tracing::debug!(state_key = %params.state, "Looking up OAuth state from database");
    
    // Validate state and get stored OAuth state from database
    let oauth_state_row = OAuthStateRepo::take(&state.db, &params.state)
        .await?
        .ok_or_else(|| {
            tracing::warn!(state_key = %params.state, "OAuth state not found in database");
            AppError::OAuthError("Invalid state parameter".to_string())
        })?;

    tracing::debug!("OAuth state found, exchanging code for tokens");

    // Create OAuth service
    let oauth_service = OAuthService::new(&state.config)?;
    let azure = oauth_service
        .azure
        .ok_or_else(|| AppError::Config("Azure OAuth not configured".to_string()))?;

    // Exchange code for tokens
    let token_info = azure
        .exchange_code(&code, &oauth_state_row.pkce_verifier)
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

    // Redirect to stored redirect_uri or default to /today
    let redirect_url = oauth_state_row.redirect_uri
        .unwrap_or_else(|| format!("{}/today", state.config.server.frontend_url));
    
    tracing::info!(
        user_id = %user.id,
        email = %user.email,
        redirect_url = %redirect_url,
        provider = "Azure",
        "User authenticated via Azure OAuth, redirecting with cookie"
    );

    // Use 302 redirect with Set-Cookie header
    let cookie_header = header::HeaderValue::from_str(&cookie)
        .map_err(|e| AppError::Internal(format!("Invalid cookie header: {}", e)))?;
    
    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(header::LOCATION, redirect_url)
        .header(header::SET_COOKIE, cookie_header)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(response)
}    // Create session cookie
    let cookie = create_session_cookie(
        &session.token,
        &state.config.auth.cookie_domain,
        state.config.auth.session_ttl_seconds,
    );

    // Redirect to stored redirect_uri or default to /today
    let redirect_url = oauth_state_row.redirect_uri
        .unwrap_or_else(|| format!("{}/today", state.config.server.frontend_url));
    
    tracing::info!(
        user_id = %user.id,
        email = %user.email,
        redirect_url = %redirect_url,
        cookie_domain = %state.config.auth.cookie_domain,
        "User authenticated via Azure OAuth, redirecting with cookie"
    );

    // Use 302 redirect with Set-Cookie header
    // The cookie domain is .ecent.online so it works across subdomains
    let cookie_header = header::HeaderValue::from_str(&cookie)
        .map_err(|e| AppError::Internal(format!("Invalid cookie header: {}", e)))?;
    
    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(header::LOCATION, redirect_url)
        .header(header::SET_COOKIE, cookie_header)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?;

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
    pub approved: bool,
    pub tos_accepted: bool,
}

/// Get current session
async fn get_session(
    State(state): State<Arc<AppState>>,
    auth: Option<Extension<AuthContext>>,
) -> Json<SessionResponse> {
    tracing::debug!(
        has_auth = auth.is_some(),
        "get_session called"
    );
    
    if let Some(Extension(auth_context)) = auth {
        tracing::debug!(
            user_id = %auth_context.user_id,
            email = %auth_context.email,
            "Session found for user"
        );
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
                    approved: user.approved,
                    tos_accepted: user.tos_accepted,
                }),
            });
        }
    }

    tracing::debug!("No valid session, returning null user");
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
            if let Err(e) = AuthService::logout(
                &state.db,
                auth_context.session_id,
                auth_context.user_id,
                None,
            )
            .await {
                // Log error but continue - cookie will be cleared regardless
                tracing::warn!(
                    error = %e,
                    user_id = %auth_context.user_id,
                    session_id = %auth_context.session_id,
                    "Failed to delete session from database during logout"
                );
            }
        }
    }

    // Clear session cookie
    let cookie = create_logout_cookie(&state.config.auth.cookie_domain);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::SET_COOKIE, cookie)
        .body(axum::body::Body::empty())
        .expect("Logout response construction with static header should never fail")
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
) -> AppResult<Response> {
    let auth_context = auth.ok_or(AppError::Unauthorized("Authentication required".to_string()))?.0;

    if !payload.accepted {
        return Err(AppError::BadRequest("TOS must be accepted".to_string()));
    }

    // Update user record
    crate::db::repos::UserRepo::accept_tos(&state.db, auth_context.user_id, &payload.version)
        .await?;

    // Rotate session after privilege change (prevents session fixation)
    if !auth_context.is_dev_bypass {
        let new_session = AuthService::rotate_session(
            &state.db,
            auth_context.session_id,
            auth_context.user_id,
            "tos_acceptance",
        )
        .await?;

        // Return new session cookie to client
        let cookie = create_session_cookie(
            &new_session.token,
            &state.config.auth.cookie_domain,
            state.config.auth.session_ttl_seconds,
        );

        tracing::info!(
            user_id = %auth_context.user_id,
            tos_version = %payload.version,
            "TOS accepted and session rotated"
        );

        let response = Response::builder()
            .status(StatusCode::OK)
            .header(header::SET_COOKIE, cookie)
            .body(axum::body::Body::empty())
            .map_err(|e| AppError::Internal(e.to_string()))?;

        return Ok(response);
    }

    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(axum::body::Body::empty())
        .map_err(|e| AppError::Internal(e.to_string()))?)
}
