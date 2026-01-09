//! RBAC Guards
//!
//! Per DEC-004=B: DB-backed roles for admin authorization.
//! Provides deny-by-default guards for route protection.

use axum::{extract::Request, middleware::Next, response::Response};

use crate::error::AppError;
use crate::middleware::auth::AuthContext;

/// Guard that requires authenticated user
///
/// Use as middleware layer:
/// ```rust,ignore
/// Router::new()
///     .route("/protected", get(handler))
///     .layer(middleware::from_fn(require_auth_guard))
/// ```
pub async fn require_auth_guard(req: Request, next: Next) -> Result<Response, AppError> {
    if req.extensions().get::<AuthContext>().is_none() {
        return Err(AppError::Unauthorized);
    }
    Ok(next.run(req).await)
}

/// Guard that requires admin role
///
/// Per DEC-004=B: Checks both legacy role column and RBAC entitlements.
pub async fn require_admin_guard(req: Request, next: Next) -> Result<Response, AppError> {
    match req.extensions().get::<AuthContext>() {
        Some(auth) if auth.is_admin() => Ok(next.run(req).await),
        Some(_) => Err(AppError::Forbidden),
        None => Err(AppError::Unauthorized),
    }
}

/// Create a guard that requires a specific entitlement
///
/// Use as middleware layer:
/// ```rust,ignore
/// Router::new()
///     .route("/admin/users", get(handler))
///     .layer(middleware::from_fn(require_entitlement_guard("admin:users")))
/// ```
pub fn require_entitlement_guard(
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
        let entitlement = entitlement.to_string();
        Box::pin(async move {
            match req.extensions().get::<AuthContext>() {
                Some(auth) if auth.entitlements.contains(&entitlement) => Ok(next.run(req).await),
                Some(_) => Err(AppError::Forbidden),
                None => Err(AppError::Unauthorized),
            }
        })
    }
}

/// Create a guard that requires any of the given entitlements
pub fn require_any_entitlement_guard(
    entitlements: &'static [&'static str],
) -> impl Fn(
    Request,
    Next,
)
    -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, AppError>> + Send>>
       + Clone
       + Send
       + 'static {
    move |req: Request, next: Next| {
        let entitlements: Vec<String> = entitlements.iter().map(|s| s.to_string()).collect();
        Box::pin(async move {
            match req.extensions().get::<AuthContext>() {
                Some(auth) => {
                    let has_any = entitlements.iter().any(|e| auth.entitlements.contains(e));
                    if has_any {
                        Ok(next.run(req).await)
                    } else {
                        Err(AppError::Forbidden)
                    }
                }
                None => Err(AppError::Unauthorized),
            }
        })
    }
}

/// Create a guard that requires all of the given entitlements
pub fn require_all_entitlements_guard(
    entitlements: &'static [&'static str],
) -> impl Fn(
    Request,
    Next,
)
    -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, AppError>> + Send>>
       + Clone
       + Send
       + 'static {
    move |req: Request, next: Next| {
        let entitlements: Vec<String> = entitlements.iter().map(|s| s.to_string()).collect();
        Box::pin(async move {
            match req.extensions().get::<AuthContext>() {
                Some(auth) => {
                    let has_all = entitlements.iter().all(|e| auth.entitlements.contains(e));
                    if has_all {
                        Ok(next.run(req).await)
                    } else {
                        Err(AppError::Forbidden)
                    }
                }
                None => Err(AppError::Unauthorized),
            }
        })
    }
}

/// RBAC policy for checking permissions
pub struct RbacPolicy {
    /// Required entitlements (any of these)
    pub any_of: Vec<String>,
    /// Required entitlements (all of these)
    pub all_of: Vec<String>,
    /// Admin bypass (if true, admin role skips checks)
    pub admin_bypass: bool,
}

impl Default for RbacPolicy {
    fn default() -> Self {
        Self {
            any_of: vec![],
            all_of: vec![],
            admin_bypass: true,
        }
    }
}

impl RbacPolicy {
    /// Create a new policy requiring any of the given entitlements
    pub fn any(entitlements: &[&str]) -> Self {
        Self {
            any_of: entitlements.iter().map(|s| s.to_string()).collect(),
            all_of: vec![],
            admin_bypass: true,
        }
    }

    /// Create a new policy requiring all of the given entitlements
    pub fn all(entitlements: &[&str]) -> Self {
        Self {
            any_of: vec![],
            all_of: entitlements.iter().map(|s| s.to_string()).collect(),
            admin_bypass: true,
        }
    }

    /// Disable admin bypass
    pub fn no_admin_bypass(mut self) -> Self {
        self.admin_bypass = false;
        self
    }

    /// Check if auth context satisfies this policy
    pub fn check(&self, auth: &AuthContext) -> bool {
        // Admin bypass
        if self.admin_bypass && auth.is_admin() {
            return true;
        }

        // Check all_of requirements
        if !self.all_of.is_empty() {
            let has_all = self.all_of.iter().all(|e| auth.entitlements.contains(e));
            if !has_all {
                return false;
            }
        }

        // Check any_of requirements
        if !self.any_of.is_empty() {
            let has_any = self.any_of.iter().any(|e| auth.entitlements.contains(e));
            if !has_any {
                return false;
            }
        }

        // If no requirements, allow
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn make_auth(role: &str, entitlements: Vec<&str>) -> AuthContext {
        AuthContext {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test".to_string(),
            role: role.to_string(),
            session_id: Uuid::new_v4(),
            entitlements: entitlements.into_iter().map(String::from).collect(),
            is_dev_bypass: false,
        }
    }

    #[test]
    fn test_policy_admin_bypass() {
        let policy = RbacPolicy::any(&["feature:special"]);
        let admin = make_auth("admin", vec![]);
        assert!(policy.check(&admin));
    }

    #[test]
    fn test_policy_admin_bypass_disabled() {
        let policy = RbacPolicy::any(&["feature:special"]).no_admin_bypass();
        let admin = make_auth("admin", vec![]);
        assert!(!policy.check(&admin));
    }

    #[test]
    fn test_policy_any_of() {
        let policy = RbacPolicy::any(&["feature:read", "feature:write"]);

        let user_read = make_auth("user", vec!["feature:read"]);
        assert!(policy.check(&user_read));

        let user_write = make_auth("user", vec!["feature:write"]);
        assert!(policy.check(&user_write));

        let user_none = make_auth("user", vec!["feature:delete"]);
        assert!(!policy.check(&user_none));
    }

    #[test]
    fn test_policy_all_of() {
        let policy = RbacPolicy::all(&["feature:read", "feature:write"]).no_admin_bypass();

        let user_both = make_auth("user", vec!["feature:read", "feature:write"]);
        assert!(policy.check(&user_both));

        let user_one = make_auth("user", vec!["feature:read"]);
        assert!(!policy.check(&user_one));
    }

    #[test]
    fn test_policy_default_allows_all() {
        let policy = RbacPolicy::default().no_admin_bypass();
        let user = make_auth("user", vec![]);
        assert!(policy.check(&user));
    }
}
