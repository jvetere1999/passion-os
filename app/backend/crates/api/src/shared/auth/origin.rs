//! Origin Verification Utilities
//!
//! Per DEC-002=A: Strict Origin/Referer verification for CSRF protection.

use axum::http::HeaderMap;

/// Production allowed origins
pub const PRODUCTION_ORIGINS: &[&str] = &[
    "https://ignition.ecent.online",
    "https://admin.ignition.ecent.online",
];

/// Development allowed origins
pub const DEV_ORIGINS: &[&str] = &[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
];

/// Check if an origin is allowed
pub fn is_origin_allowed(origin: &str, is_production: bool) -> bool {
    let mut allowed: Vec<&str> = PRODUCTION_ORIGINS.to_vec();
    if !is_production {
        allowed.extend(DEV_ORIGINS);
    }

    allowed.iter().any(|allowed_origin| {
        origin == *allowed_origin || origin.starts_with(&format!("{}/", allowed_origin))
    })
}

/// Check if a referer is allowed
pub fn is_referer_allowed(referer: &str, is_production: bool) -> bool {
    let mut allowed: Vec<&str> = PRODUCTION_ORIGINS.to_vec();
    if !is_production {
        allowed.extend(DEV_ORIGINS);
    }

    allowed
        .iter()
        .any(|allowed_origin| referer.starts_with(allowed_origin))
}

/// Extract origin from headers, falling back to referer
pub fn extract_origin(headers: &HeaderMap) -> Option<String> {
    // Try Origin header first
    if let Some(origin) = headers.get("Origin").and_then(|h| h.to_str().ok()) {
        return Some(origin.to_string());
    }

    // Fall back to Referer
    if let Some(referer) = headers.get("Referer").and_then(|h| h.to_str().ok()) {
        // Extract origin from referer URL
        if let Ok(url) = url::Url::parse(referer) {
            return Some(format!(
                "{}://{}",
                url.scheme(),
                url.host_str().unwrap_or("")
            ));
        }
    }

    None
}

/// Verify origin/referer from headers
///
/// Returns true if the request origin is allowed.
pub fn verify_origin(headers: &HeaderMap, is_production: bool) -> bool {
    // Check Origin header first
    if let Some(origin) = headers.get("Origin").and_then(|h| h.to_str().ok()) {
        return is_origin_allowed(origin, is_production);
    }

    // Fall back to Referer
    if let Some(referer) = headers.get("Referer").and_then(|h| h.to_str().ok()) {
        return is_referer_allowed(referer, is_production);
    }

    // Neither Origin nor Referer present
    false
}

/// Origin verification result
#[derive(Debug, Clone)]
pub enum OriginCheck {
    /// Origin is valid
    Valid { origin: String },
    /// Origin header missing, valid referer found
    ValidReferer { referer: String },
    /// Invalid origin provided
    InvalidOrigin { provided: String },
    /// No origin or referer headers present
    Missing,
}

impl OriginCheck {
    /// Check if the origin is valid
    pub fn is_valid(&self) -> bool {
        matches!(
            self,
            OriginCheck::Valid { .. } | OriginCheck::ValidReferer { .. }
        )
    }
}

/// Perform detailed origin check
pub fn check_origin(headers: &HeaderMap, is_production: bool) -> OriginCheck {
    // Check Origin header first
    if let Some(origin) = headers.get("Origin").and_then(|h| h.to_str().ok()) {
        if is_origin_allowed(origin, is_production) {
            return OriginCheck::Valid {
                origin: origin.to_string(),
            };
        } else {
            return OriginCheck::InvalidOrigin {
                provided: origin.to_string(),
            };
        }
    }

    // Fall back to Referer
    if let Some(referer) = headers.get("Referer").and_then(|h| h.to_str().ok()) {
        if is_referer_allowed(referer, is_production) {
            return OriginCheck::ValidReferer {
                referer: referer.to_string(),
            };
        } else {
            return OriginCheck::InvalidOrigin {
                provided: referer.to_string(),
            };
        }
    }

    OriginCheck::Missing
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    #[test]
    fn test_is_origin_allowed_production() {
        assert!(is_origin_allowed("https://ignition.ecent.online", true));
        assert!(is_origin_allowed(
            "https://admin.ignition.ecent.online",
            true
        ));
        assert!(!is_origin_allowed("http://localhost:3000", true));
        assert!(!is_origin_allowed("https://evil.com", true));
    }

    #[test]
    fn test_is_origin_allowed_development() {
        assert!(is_origin_allowed("https://ignition.ecent.online", false));
        assert!(is_origin_allowed("http://localhost:3000", false));
        assert!(is_origin_allowed("http://127.0.0.1:3001", false));
        assert!(!is_origin_allowed("https://evil.com", false));
    }

    #[test]
    fn test_is_referer_allowed() {
        assert!(is_referer_allowed(
            "https://ignition.ecent.online/some/path",
            true
        ));
        assert!(is_referer_allowed(
            "https://admin.ignition.ecent.online/admin",
            true
        ));
        assert!(!is_referer_allowed("https://evil.com/attack", true));
    }

    #[test]
    fn test_verify_origin_with_origin_header() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Origin",
            HeaderValue::from_static("https://ignition.ecent.online"),
        );
        assert!(verify_origin(&headers, true));
    }

    #[test]
    fn test_verify_origin_with_referer_header() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Referer",
            HeaderValue::from_static("https://ignition.ecent.online/page"),
        );
        assert!(verify_origin(&headers, true));
    }

    #[test]
    fn test_verify_origin_missing() {
        let headers = HeaderMap::new();
        assert!(!verify_origin(&headers, true));
    }

    #[test]
    fn test_check_origin_valid() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Origin",
            HeaderValue::from_static("https://ignition.ecent.online"),
        );

        let result = check_origin(&headers, true);
        assert!(result.is_valid());
        assert!(matches!(result, OriginCheck::Valid { .. }));
    }

    #[test]
    fn test_check_origin_invalid() {
        let mut headers = HeaderMap::new();
        headers.insert("Origin", HeaderValue::from_static("https://evil.com"));

        let result = check_origin(&headers, true);
        assert!(!result.is_valid());
        assert!(matches!(result, OriginCheck::InvalidOrigin { .. }));
    }

    #[test]
    fn test_check_origin_missing() {
        let headers = HeaderMap::new();

        let result = check_origin(&headers, true);
        assert!(!result.is_valid());
        assert!(matches!(result, OriginCheck::Missing));
    }

    #[test]
    fn test_extract_origin_from_origin_header() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Origin",
            HeaderValue::from_static("https://ignition.ecent.online"),
        );

        let origin = extract_origin(&headers);
        assert_eq!(origin, Some("https://ignition.ecent.online".to_string()));
    }

    #[test]
    fn test_extract_origin_from_referer() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Referer",
            HeaderValue::from_static("https://ignition.ecent.online/page"),
        );

        let origin = extract_origin(&headers);
        assert_eq!(origin, Some("https://ignition.ecent.online".to_string()));
    }
}
