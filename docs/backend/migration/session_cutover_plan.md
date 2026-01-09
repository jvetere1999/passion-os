"Session cutover plan implementing DEC-001=A (force re-authentication)."

# Session Cutover Plan

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Implement forced re-authentication strategy for session migration

---

## Decision Reference

| Decision | Chosen | Implication |
|----------|--------|-------------|
| **DEC-001** | **A (Force re-auth)** | All existing sessions invalidated at cutover |

**Owner Notes:** "Force re-auth; D1 unseeded data may be deleted at cutover."

---

## Overview

Per DEC-001=A, we implement a **clean break** strategy:
- No session migration from D1 to Postgres
- All existing user sessions are invalidated
- All users must re-authenticate after cutover
- Legacy D1 session data can be deleted

This is the simplest and safest approach with clear security properties.

---

## What This Means

### For Users

| Behavior | Before Cutover | After Cutover |
|----------|----------------|---------------|
| Existing session | Valid | **Invalid** |
| Next page load | Normal | Redirect to login |
| Login required | No | **Yes** |
| Data preserved | Yes | Yes (users, not sessions) |

### For System

| Aspect | Impact |
|--------|--------|
| Session table (D1) | Can be deleted |
| Session table (Postgres) | Starts empty |
| Cookies | Old cookies ignored, new cookies issued |
| Token format | Can be completely different |

---

## Implementation Strategy

### Pre-Cutover

1. **New Postgres sessions table is empty**
   - No data to migrate
   - Clean state

2. **Backend validates only Postgres sessions**
   - No dual-read required
   - No D1 fallback logic

3. **Legacy cookies are ignored**
   - Different cookie format/signing
   - Automatic invalidation

### At Cutover

```
User Request with Legacy Cookie
              │
              ▼
      ┌───────────────────┐
      │  New Backend      │
      │  Session Check    │
      └─────────┬─────────┘
                │
                ▼
      ┌───────────────────┐
      │  Token not found  │
      │  in Postgres      │
      └─────────┬─────────┘
                │
                ▼
      ┌───────────────────┐
      │  Return 401       │
      │  Unauthenticated  │
      └─────────┬─────────┘
                │
                ▼
      ┌───────────────────┐
      │  Frontend         │
      │  Redirect to      │
      │  /auth/signin     │
      └───────────────────┘
```

### Post-Cutover

1. User visits any protected page
2. Backend checks Postgres for session (none exists)
3. Returns 401 Unauthorized
4. Frontend redirects to `/auth/signin`
5. User completes OAuth flow
6. New session created in Postgres
7. New cookie issued with new format

---

## Cookie Handling

### Legacy Cookie (Will Be Ignored)

```
Cookie: authjs.session-token=eyJ...  # NextAuth format
```

### New Cookie (Backend-Issued)

```
Set-Cookie: session=<new-token>; Domain=ecent.online; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000
```

### Why Old Cookies Don't Work

| Reason | Detail |
|--------|--------|
| Different token format | New backend uses different signing |
| Different session store | Postgres vs D1 |
| Different cookie name | `session` vs `authjs.session-token` |
| No lookup match | Token not in Postgres |

---

## User Experience

### First Visit After Cutover

```
1. User visits ignition.ecent.online
2. Frontend makes API call to backend
3. Backend returns 401 (no valid session)
4. Frontend detects 401, redirects to /auth/signin
5. User sees "Welcome back! Please sign in again"
6. User clicks Google/Azure login
7. OAuth flow completes
8. New session created, cookie issued
9. User redirected to dashboard
```

### Recommended UX

- **Sign-in page message:** "We've updated our system. Please sign in to continue."
- **No error styling:** This is expected behavior, not an error
- **Fast OAuth:** User is already authenticated with Google/Azure, minimal friction

---

## Data Preservation

### What Is Preserved (Migrated)

| Data Type | Status |
|-----------|--------|
| User accounts | ✅ Preserved |
| User email/name/image | ✅ Preserved |
| OAuth account links | ✅ Preserved |
| User role (admin) | ✅ Preserved |
| All user-generated content | ✅ Preserved |
| Focus sessions | ✅ Preserved |
| Habits, goals, quests | ✅ Preserved |
| Storage (R2) | ✅ Preserved |

### What Is Not Preserved

| Data Type | Status | Reason |
|-----------|--------|--------|
| Session tokens | ❌ Deleted | DEC-001=A |
| Session metadata | ❌ Deleted | No migration |
| "Remember me" state | ❌ Reset | New session required |

---

## Security Benefits

### Why Force Re-Auth Is Safest

| Benefit | Explanation |
|---------|-------------|
| Clean token rotation | All old tokens invalidated |
| No token migration bugs | No complex migration code |
| Session fixation prevention | Fresh sessions only |
| Audit trail | All sessions have known origin |
| Simpler rollback | No session state to reconcile |

---

## Backend Implementation

### Session Validation (No D1 Fallback)

```rust
pub async fn validate_session(token: &str, pool: &PgPool) -> Result<Session, AuthError> {
    // Only check Postgres - no D1 fallback
    let session = sqlx::query_as!(Session,
        "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
        token
    )
    .fetch_optional(pool)
    .await?;
    
    session.ok_or(AuthError::SessionNotFound)
}
```

### No Migration Code Required

Because we're forcing re-auth:
- No D1 session reader
- No token translation
- No dual-write
- No grace period logic

---

## Cutover Sequence

### T-0: Backend Deployment

1. Deploy new backend with empty sessions table
2. Backend only validates Postgres sessions
3. All existing cookies will fail validation

### T+0 to T+1h: User Re-Authentication

1. Users visit site
2. Receive 401, redirected to login
3. Complete OAuth (fast, one-click if already logged into provider)
4. New session created in Postgres

### Expected Metrics

| Metric | Expected |
|--------|----------|
| 401 responses | Spike at cutover, then decline |
| OAuth initiations | Spike at cutover |
| New sessions created | High volume at cutover |
| Active users after 1h | Should match pre-cutover |

---

## Rollback Considerations

### If Rollback Needed

Because sessions are not migrated:
1. New Postgres sessions are lost on rollback
2. Users who re-authenticated will need to re-auth again on legacy
3. Legacy D1 sessions may still be valid (if not deleted)

### Recommendation

- Keep D1 session data for 7 days after cutover
- Delete only after stable period
- Document that rollback may require user re-auth

---

## Monitoring

### Key Metrics to Watch

| Metric | Alert Threshold |
|--------|-----------------|
| 401 rate | Expected spike, then < 5% |
| OAuth success rate | > 95% |
| Session creation rate | Should match login attempts |
| Session validation rate | Should stabilize within 1h |

### Logs to Monitor

```
# Expected at cutover (info, not error)
[INFO] Session not found for token: abc...

# Success indicator
[INFO] New session created for user: user@example.com

# Watch for (error)
[ERROR] OAuth callback failed: invalid_grant
```

---

## Communication Plan

### Pre-Cutover (T-24h)

**Email/Notification to Users:**
> We're updating Ignition to a faster, more reliable system. You may need to sign in again after the update. Your data is safe and will be waiting for you!

### At Cutover

**Sign-in Page Banner:**
> Welcome back! We've upgraded our system. Please sign in to continue.

### Post-Cutover

**Success Message After Login:**
> You're all set! Thanks for signing back in.

---

## Checklist

### Pre-Cutover

- [ ] Sessions table in Postgres is empty
- [ ] Backend only validates Postgres sessions
- [ ] Frontend handles 401 → redirect to login
- [ ] Sign-in page has friendly re-auth message
- [ ] Monitoring configured for 401 rates

### At Cutover

- [ ] Deploy new backend
- [ ] Verify 401 responses for old sessions
- [ ] Verify OAuth flow works
- [ ] Verify new sessions created

### Post-Cutover (T+1h)

- [ ] Active user count recovering
- [ ] 401 rate declining
- [ ] No OAuth errors
- [ ] User feedback positive

### Post-Cutover (T+7d)

- [ ] All active users have re-authenticated
- [ ] D1 session data can be deleted
- [ ] D1 database deletion approved (per DEC-001)

---

## References

- [DECISIONS.md](./DECISIONS.md) - DEC-001 decision record
- [security_model.md](./security_model.md) - Session management
- [go_live_checklist.md](./go_live_checklist.md) - Cutover procedure
- [rollback_checklist.md](./rollback_checklist.md) - Rollback procedure

