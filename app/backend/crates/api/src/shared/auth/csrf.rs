//! CSRF Protection Utilities
//!
//! Per DEC-002=A: CSRF protection via strict Origin/Referer verification.
//!
//! These utilities can be used to issue and verify CSRF tokens if needed
//! in addition to Origin verification.

use base64::Engine;
use rand::RngCore;

/// CSRF token length in bytes
const TOKEN_BYTES: usize = 32;

/// Generate a new CSRF token
///
/// Returns a URL-safe base64 encoded random string.
pub fn generate_token() -> String {
    let mut bytes = [0u8; TOKEN_BYTES];
    rand::thread_rng().fill_bytes(&mut bytes);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

/// Verify a CSRF token matches expected value
///
/// Uses constant-time comparison to prevent timing attacks.
pub fn verify_token(expected: &str, provided: &str) -> bool {
    if expected.len() != provided.len() {
        return false;
    }

    // Constant-time comparison
    let expected_bytes = expected.as_bytes();
    let provided_bytes = provided.as_bytes();

    let mut result = 0u8;
    for (a, b) in expected_bytes.iter().zip(provided_bytes.iter()) {
        result |= a ^ b;
    }

    result == 0
}

/// CSRF header name
pub const CSRF_HEADER: &str = "X-CSRF-Token";

/// CSRF cookie name
pub const CSRF_COOKIE: &str = "csrf_token";

/// Create a CSRF cookie value
pub fn create_csrf_cookie(token: &str, domain: &str, ttl_seconds: u64) -> String {
    format!(
        "{}={}; Domain={}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age={}",
        CSRF_COOKIE, token, domain, ttl_seconds
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_token_length() {
        let token = generate_token();
        // Base64 encoded 32 bytes = 43 characters (without padding)
        assert_eq!(token.len(), 43);
    }

    #[test]
    fn test_generate_token_uniqueness() {
        let token1 = generate_token();
        let token2 = generate_token();
        assert_ne!(token1, token2);
    }

    #[test]
    fn test_verify_token_valid() {
        let token = generate_token();
        assert!(verify_token(&token, &token));
    }

    #[test]
    fn test_verify_token_invalid() {
        let token = generate_token();
        let other = generate_token();
        assert!(!verify_token(&token, &other));
    }

    #[test]
    fn test_verify_token_different_length() {
        let token = generate_token();
        assert!(!verify_token(&token, "short"));
    }

    #[test]
    fn test_create_csrf_cookie() {
        let token = "test_token";
        let cookie = create_csrf_cookie(token, "ecent.online", 3600);
        assert!(cookie.contains("csrf_token=test_token"));
        assert!(cookie.contains("Domain=ecent.online"));
        assert!(cookie.contains("HttpOnly"));
        assert!(cookie.contains("Secure"));
        assert!(cookie.contains("SameSite=None"));
        assert!(cookie.contains("Max-Age=3600"));
    }
}
