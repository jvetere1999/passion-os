# ISSUE: OAuth Callback Error - Missing Error Parameter Handling

**Date**: January 17, 2026  
**Status**: Phase 1: ISSUE (Discovery & Validation)  
**User Impact**: CRITICAL (10/10) - Users cannot authenticate  
**Type**: OAuth Flow Bug

---

## Problem Summary

When a user denies OAuth consent or an error occurs during the OAuth flow, Google/Azure return an error to the callback endpoint. However, the backend callback handler doesn't accept or handle the `error` parameter, causing the callback to fail with a generic error message.

**User Experience**:
- User clicks "Sign in with Google"
- Sees Google consent screen
- Clicks "Deny" OR an error occurs on Google's side
- Backend receives error callback but crashes
- User sees generic: "An error occurred while processing the authentication response"

---

## Root Cause Analysis

### Current Implementation Problem

**File**: [app/backend/crates/api/src/routes/auth.rs](app/backend/crates/api/src/routes/auth.rs#L215-L225)

```rust
/// OAuth callback query parameters
#[derive(Deserialize)]
struct OAuthCallback {
    code: String,         // ✅ Handled
    state: String,        // ✅ Handled
    // ❌ MISSING: error parameter
    // ❌ MISSING: error_description parameter  
    // ❌ MISSING: error_uri parameter
}
```

**OAuth 2.0 Standard** (RFC 6749, Section 4.1.2.1):
- **Success case**: `code=...&state=...`
- **Error case**: `error=access_denied&error_description=...&state=...`

### What Happens When OAuth Denies

Google OAuth response to callback URL:
```
GET https://api.ecent.online/auth/callback/google?
  error=access_denied&
  error_description=Permissions%20error&
  state=<state_value>
```

Current axum deserialization:
```rust
Query(params): Query<OAuthCallback>
```

**Result**: Deserialization fails because `code` is missing → HTTP 400 Bad Request → Generic error message

### Error Flow Diagram

```
User denies consent on Google
        ↓
Google redirects: /callback?error=access_denied&state=...
        ↓
Axum tries to deserialize OAuthCallback { code: String, state: String }
        ↓
Missing `code` field → Deserialization error
        ↓
Axum returns 400 Bad Request (before handler even runs)
        ↓
Frontend gets 400, shows generic error to user
```

---

## Why It Breaks

1. **Validation Happens Before Handler**: Axum deserializes query parameters before passing to handler
2. **No Error Parameter**: `OAuthCallback` struct requires `code` field
3. **No Fallback**: When `code` is missing, deserialization fails immediately
4. **Generic Error Response**: 400 Bad Request doesn't give user helpful feedback

---

## What Should Happen

When user denies or error occurs:

1. ✅ Receive error parameter in callback
2. ✅ Log the error from OAuth provider
3. ✅ Display user-friendly error message: "You denied the sign-in request" or "Sign-in failed, please try again"
4. ✅ Redirect to `/auth/error?error=<type>&details=<message>`

---

## Solution Approach

### Phase 1: Make code and error fields optional

```rust
#[derive(Deserialize)]
struct OAuthCallback {
    code: Option<String>,              // Optional - only in success case
    error: Option<String>,             // Optional - only in error case
    error_description: Option<String>, // Optional - error details
    error_uri: Option<String>,         // Optional - error documentation
    state: String,                     // Always required
}
```

### Phase 2: Handle error cases in callback handler

```rust
async fn handle_google_callback(
    state: &Arc<AppState>,
    params: OAuthCallback,
) -> AppResult<Response> {
    // Check for OAuth error first
    if let Some(error) = params.error {
        match error.as_str() {
            "access_denied" => {
                return Ok(Redirect::temporary(&format!(
                    "{}/auth/error?error=OAuthDenied&provider=Google&details={}",
                    state.config.server.frontend_url,
                    urlencoding::encode("You denied the sign-in request")
                )).into_response());
            }
            "server_error" => {
                tracing::error!("Google OAuth server error: {}", 
                    params.error_description.unwrap_or_default());
                return Ok(Redirect::temporary(&format!(
                    "{}/auth/error?error=OAuthServerError&provider=Google&details={}",
                    state.config.server.frontend_url,
                    urlencoding::encode("Google encountered a server error. Please try again.")
                )).into_response());
            }
            _ => {
                tracing::warn!("Unknown OAuth error: {}", error);
                return Ok(Redirect::temporary(&format!(
                    "{}/auth/error?error=OAuthError&provider=Google&details={}",
                    state.config.server.frontend_url,
                    urlencoding::encode("Sign-in failed. Please try again.")
                )).into_response());
            }
        }
    }
    
    // Original success flow continues
    let code = params.code.ok_or_else(|| {
        AppError::OAuthError("Missing authorization code".to_string())
    })?;
    
    // ... rest of successful flow ...
}
```

### Phase 3: Update frontend to handle new error types

Frontend error page should handle:
- `OAuthDenied` - User explicitly denied
- `OAuthServerError` - Provider had an issue
- `OAuthError` - Generic OAuth error
- `OAuthCallback` - Existing (malformed callback)

---

## Error Messages to User

| Scenario | Error Code | Message |
|----------|-----------|---------|
| User denies consent | `OAuthDenied` | "You denied the sign-in request" |
| Provider server error | `OAuthServerError` | "The provider encountered an error. Please try again." |
| Missing code | `OAuthError` | "Sign-in failed. Please try again." |
| Invalid state | `InvalidState` | "Session expired. Please try again." |
| Token exchange failed | `TokenExchange` | "Could not complete sign-in. Please try again." |

---

## Implementation Checklist

### Phase 1: Update OAuthCallback struct (5 min)
- [ ] Make `code` field optional
- [ ] Add `error` field (Option<String>)
- [ ] Add `error_description` field (Option<String>)
- [ ] Add `error_uri` field (Option<String>)

### Phase 2: Update handle_google_callback (10 min)
- [ ] Check for error parameter first
- [ ] Handle access_denied case
- [ ] Handle server_error case
- [ ] Handle other error codes
- [ ] Validate code is present in success case
- [ ] Log error with provider context

### Phase 3: Update handle_azure_callback (10 min)
- [ ] Same as Google callback
- [ ] Use "Azure" as provider name in messages

### Phase 4: Update frontend error handling (5 min)
- [ ] Handle OAuthDenied error code
- [ ] Show user-friendly messages
- [ ] Add retry logic

### Phase 5: Testing (5 min)
- [ ] Test deny flow: Google consent → deny → error page
- [ ] Test error flow: Simulate server error
- [ ] Verify state validation still works
- [ ] Verify success flow unchanged

**Total Effort**: ~35-40 minutes (0.5-1h)

---

## Files to Modify

1. **[app/backend/crates/api/src/routes/auth.rs](app/backend/crates/api/src/routes/auth.rs)**
   - Lines 215: OAuthCallback struct
   - Lines 240-310: handle_google_callback function
   - Lines 336+: handle_azure_callback function

2. **Frontend error page** (TBD - need to locate)
   - Add handling for OAuthDenied and other error codes
   - Display user-friendly messages

---

## Validation

✅ **Acceptance Criteria**:
- User denies OAuth consent → redirected to `/auth/error?error=OAuthDenied`
- OAuth provider error → redirected to `/auth/error?error=OAuthServerError`
- Success flow unchanged
- `cargo check --bin ignition-api`: 0 errors
- Log messages capture error details for debugging

---

## References

- **RFC 6749**: OAuth 2.0 Authorization Framework (Section 4.1.2.1 - Error Response)
- **Google OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2/web-server#handle-the-oauth-20-server-response
- **Current Code**: [app/backend/crates/api/src/routes/auth.rs#L215-L315](app/backend/crates/api/src/routes/auth.rs#L215-L315)

---

**Next Step**: Phase 2 - DOCUMENT (detailed implementation plan)
