//! Auth Extractor - Extract user context from request
//!
//! Usage:
//! ```rust
//! async fn handler(auth: Auth) -> impl IntoResponse {
//!     // auth.user_id, auth.email, etc.
//! }
//! ```

use axum::{extract::FromRequestParts, http::request::Parts};
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthContext;

/// Authentication extractor - extracts authenticated user from request
///
/// This is an Axum extractor that pulls the AuthContext from request extensions.
/// Returns 401 Unauthorized if no authenticated session exists.
///
/// # Example
/// ```rust,ignore
/// async fn protected_handler(auth: Auth) -> impl IntoResponse {
///     format!("Hello, {}!", auth.email)
/// }
/// ```
#[derive(Debug, Clone)]
pub struct Auth {
    /// User ID
    pub user_id: Uuid,
    /// User email
    pub email: String,
    /// User name
    pub name: String,
    /// User role (legacy, prefer entitlements)
    pub role: String,
    /// Session ID
    pub session_id: Uuid,
    /// User entitlements from RBAC
    pub entitlements: Vec<String>,
    /// Whether this is a dev bypass session
    pub is_dev_bypass: bool,
}

impl From<&AuthContext> for Auth {
    fn from(ctx: &AuthContext) -> Self {
        Self {
            user_id: ctx.user_id,
            email: ctx.email.clone(),
            name: ctx.name.clone(),
            role: ctx.role.clone(),
            session_id: ctx.session_id,
            entitlements: ctx.entitlements.clone(),
            is_dev_bypass: ctx.is_dev_bypass,
        }
    }
}

impl Auth {
    /// Check if user is an admin
    pub fn is_admin(&self) -> bool {
        self.role == "admin" || self.entitlements.contains(&"admin:access".to_string())
    }

    /// Check if user has a specific entitlement
    pub fn has_entitlement(&self, entitlement: &str) -> bool {
        self.entitlements.contains(&entitlement.to_string())
    }

    /// Check if user has any of the given entitlements
    pub fn has_any_entitlement(&self, entitlements: &[&str]) -> bool {
        entitlements.iter().any(|e| self.has_entitlement(e))
    }

    /// Check if user has all of the given entitlements
    pub fn has_all_entitlements(&self, entitlements: &[&str]) -> bool {
        entitlements.iter().all(|e| self.has_entitlement(e))
    }
}

impl<S> FromRequestParts<S> for Auth
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthContext>()
            .map(Auth::from)
            .ok_or(AppError::Unauthorized)
    }
}

/// Optional authentication extractor - returns None if not authenticated
///
/// Use this for routes that work for both authenticated and anonymous users.
///
/// # Example
/// ```rust,ignore
/// async fn optional_handler(auth: MaybeAuth) -> impl IntoResponse {
///     match auth.0 {
///         Some(user) => format!("Hello, {}!", user.email),
///         None => "Hello, anonymous!".to_string(),
///     }
/// }
/// ```
#[derive(Debug, Clone)]
pub struct MaybeAuth(pub Option<Auth>);

impl<S> FromRequestParts<S> for MaybeAuth
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth = parts.extensions.get::<AuthContext>().map(Auth::from);
        Ok(MaybeAuth(auth))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_auth(role: &str, entitlements: Vec<&str>) -> Auth {
        Auth {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: role.to_string(),
            session_id: Uuid::new_v4(),
            entitlements: entitlements.into_iter().map(String::from).collect(),
            is_dev_bypass: false,
        }
    }

    #[test]
    fn test_is_admin_by_role() {
        let auth = make_auth("admin", vec![]);
        assert!(auth.is_admin());
    }

    #[test]
    fn test_is_admin_by_entitlement() {
        let auth = make_auth("user", vec!["admin:access"]);
        assert!(auth.is_admin());
    }

    #[test]
    fn test_not_admin() {
        let auth = make_auth("user", vec![]);
        assert!(!auth.is_admin());
    }

    #[test]
    fn test_has_entitlement() {
        let auth = make_auth("user", vec!["feature:read", "feature:write"]);
        assert!(auth.has_entitlement("feature:read"));
        assert!(auth.has_entitlement("feature:write"));
        assert!(!auth.has_entitlement("feature:delete"));
    }

    #[test]
    fn test_has_any_entitlement() {
        let auth = make_auth("user", vec!["feature:read"]);
        assert!(auth.has_any_entitlement(&["feature:read", "feature:write"]));
        assert!(!auth.has_any_entitlement(&["feature:delete", "feature:admin"]));
    }

    #[test]
    fn test_has_all_entitlements() {
        let auth = make_auth("user", vec!["feature:read", "feature:write"]);
        assert!(auth.has_all_entitlements(&["feature:read", "feature:write"]));
        assert!(!auth.has_all_entitlements(&["feature:read", "feature:delete"]));
    }
}
