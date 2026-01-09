"OAuth redirect URI overlap plan for safe migration."

# OAuth Redirect URI Overlap Plan

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Safe OAuth transition strategy with rollback capability

---

## Overview

During migration from the legacy Next.js stack to the new Rust backend, OAuth redirect URIs must be carefully managed to:
1. Support the new backend during cutover
2. Maintain rollback capability to legacy system
3. Avoid authentication failures during transition

---

## Current State (Legacy)

### Google OAuth

| Setting | Value |
|---------|-------|
| Client ID | `<GOOGLE_CLIENT_ID>` |
| Authorized Redirect URIs | `https://ignition.ecent.online/api/auth/callback/google` |

### Azure AD OAuth

| Setting | Value |
|---------|-------|
| Client ID | `<AZURE_CLIENT_ID>` |
| Redirect URIs | `https://ignition.ecent.online/api/auth/callback/azure` |

---

## Target State (New Backend)

### Google OAuth

| Setting | Value |
|---------|-------|
| Client ID | Same (no change) |
| Authorized Redirect URIs | `https://api.ecent.online/auth/callback/google` |

### Azure AD OAuth

| Setting | Value |
|---------|-------|
| Client ID | Same (no change) |
| Redirect URIs | `https://api.ecent.online/auth/callback/azure` |

---

## Overlap Strategy

### Phase 1: Add New URIs (T-7 days)

Add new redirect URIs **without removing legacy URIs**.

**Google Cloud Console:**
1. Navigate to APIs & Services → Credentials
2. Select OAuth 2.0 Client ID
3. Add to Authorized redirect URIs:
   - `https://api.ecent.online/auth/callback/google`
4. Save changes

**Azure Portal:**
1. Navigate to App registrations → Ignition App
2. Select Authentication
3. Add to Redirect URIs:
   - `https://api.ecent.online/auth/callback/azure`
4. Save changes

**After Phase 1, both providers should have:**
```
Legacy:
  https://ignition.ecent.online/api/auth/callback/google
  https://ignition.ecent.online/api/auth/callback/azure

New:
  https://api.ecent.online/auth/callback/google
  https://api.ecent.online/auth/callback/azure
```

### Phase 2: Verify New URIs (T-3 days)

Test new URIs in staging/preview:

- [ ] Google OAuth with new callback works
- [ ] Azure OAuth with new callback works
- [ ] Token exchange succeeds
- [ ] Session created correctly
- [ ] User redirected to frontend

### Phase 3: Cutover (T-0)

During cutover:
- New backend goes live
- DNS points to new backend
- OAuth flows use new callback URIs
- Legacy URIs remain as fallback

### Phase 4: Overlap Period (T+0 to T+7 days)

Keep both legacy and new URIs active:
- Allows rollback without OAuth config changes
- Reduces rollback complexity
- Maintains safety margin

### Phase 5: Cleanup (T+7 days)

After 7 days of stable operation:

**Google Cloud Console:**
1. Remove legacy redirect URI:
   - ~~`https://ignition.ecent.online/api/auth/callback/google`~~
2. Keep only new URI:
   - `https://api.ecent.online/auth/callback/google`

**Azure Portal:**
1. Remove legacy redirect URI:
   - ~~`https://ignition.ecent.online/api/auth/callback/azure`~~
2. Keep only new URI:
   - `https://api.ecent.online/auth/callback/azure`

---

## Rollback Implications

### If Rollback Needed (During Overlap)

Because legacy URIs are preserved:
1. Revert DNS to legacy backend
2. Legacy backend receives OAuth callbacks
3. **No OAuth app configuration changes needed**
4. Users can authenticate immediately

### If Rollback Needed (After Cleanup)

If legacy URIs have been removed:
1. Re-add legacy URIs to OAuth providers
2. Wait for OAuth provider to propagate (usually instant)
3. Revert DNS to legacy backend
4. Users can authenticate

**Risk:** 1-5 minute window where OAuth may fail if URIs not yet re-added.

---

## Development Environment

### Local Development URIs

Add for local testing (optional, can be temporary):

**Google:**
- `http://localhost:8080/auth/callback/google`

**Azure:**
- `http://localhost:8080/auth/callback/azure`

**Note:** These should be removed from production OAuth apps after development is complete, or use separate OAuth apps for development.

---

## Verification Checklist

### Pre-Cutover (T-3 days)

- [ ] New URIs added to Google OAuth app
- [ ] New URIs added to Azure OAuth app
- [ ] New URIs tested in staging
- [ ] Legacy URIs still present (for rollback)

### Post-Cutover (T+1 hour)

- [ ] Google OAuth login succeeds on production
- [ ] Azure OAuth login succeeds on production
- [ ] Token refresh works
- [ ] Session persistence verified

### Post-Cutover (T+7 days)

- [ ] No OAuth errors in past 7 days
- [ ] No traffic to legacy callback URIs
- [ ] Ready to remove legacy URIs

### Cleanup Complete

- [ ] Legacy URIs removed from Google
- [ ] Legacy URIs removed from Azure
- [ ] Verified OAuth still works

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Cause:** Callback URI in request doesn't match registered URI.

**Solutions:**
1. Verify exact URI match (including trailing slashes)
2. Check for http vs https mismatch
3. Ensure URI is registered in OAuth provider
4. Wait 1-5 minutes for provider to propagate

### "invalid_client" Error

**Cause:** Client ID or secret mismatch.

**Solutions:**
1. Verify client ID in backend config
2. Verify client secret in Key Vault
3. Check for environment variable issues

### Callback Receives 404

**Cause:** Backend route not registered or wrong path.

**Solutions:**
1. Verify `/auth/callback/google` route exists
2. Check backend logs for routing errors
3. Verify DNS is pointing to correct backend

---

## Security Considerations

### URI Validation

The backend MUST validate:
- `state` parameter matches session
- `code` is exchanged immediately (single use)
- Token response is validated

### Callback Endpoint Protection

- Rate limit callback endpoint
- Log all OAuth attempts
- Alert on unusual patterns (e.g., high failure rate)

---

## Timeline Summary

| Day | Action |
|-----|--------|
| T-7 | Add new URIs to OAuth providers |
| T-3 | Verify new URIs in staging |
| T-0 | Cutover to new backend |
| T+1h | Verify OAuth on production |
| T+7d | Remove legacy URIs |

---

## References

- [LATER.md](./LATER.md) - LATER-004: OAuth Redirect URI Configuration
- [routing_and_domains.md](./routing_and_domains.md) - OAuth route definitions
- [security_model.md](./security_model.md) - OAuth flow documentation
- [go_live_checklist.md](./go_live_checklist.md) - Cutover procedure
- [rollback_checklist.md](./rollback_checklist.md) - Rollback procedure

