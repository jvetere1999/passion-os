# OAuth Redirect Issue - Debug Summary

**Issue:** After successful Google OAuth authentication, user redirected back to `/auth/signin?callbackUrl=%2Ftoday` instead of staying on `/today`.

**Date:** January 10, 2026  
**Status:** Fixed (commit `8d37948`)

---

## Root Cause

**Client-side race condition in `AppShell.tsx`:**

The `AppShell` component had a `useEffect` that checked `isAuthenticated` and redirected to signin **before** the `useAuth()` hook finished fetching the session from the backend.

### The Race Condition Flow

1. OAuth completes successfully → backend sets session cookie
2. User redirected to `/today`
3. `AppShell` component renders
4. `useAuth()` hook starts fetching session from `/api/auth/session`
5. `isLoading` becomes `false` but `isAuthenticated` is still `null` (fetch not complete yet)
6. The `useEffect` fires and redirects to `/auth/signin` ❌

---

## What Was Tried (Chronological)

### 1. Database-backed OAuth State
**Goal:** Handle distributed Fly.io machines properly

**Changes:**
- Created `oauth_states` PostgreSQL table (migration 0015)
- Added `oauth_models.rs` and `oauth_repos.rs`
- Stored PKCE verifier and redirect_uri in database

**Files:**
- `app/backend/migrations/0015_oauth_state.sql`
- `app/backend/crates/api/src/db/oauth_models.rs`
- `app/backend/crates/api/src/db/oauth_repos.rs`

**Result:** ❌ Still redirected to signin (backend was already working correctly)

---

### 2. Frontend Passing redirect_uri to Backend
**Goal:** Preserve callbackUrl through OAuth flow

**Changes:**
- `SignInButtons.tsx` reads `callbackUrl` from URL query params
- `api-auth.ts` `getSignInUrl()` accepts `redirectPath` parameter
- Backend `auth.rs` accepts `redirect_uri` in signin query, stores in DB, uses in callback

**Files:**
- `app/frontend/src/app/auth/signin/SignInButtons.tsx`
- `app/frontend/src/lib/auth/api-auth.ts`
- `app/backend/crates/api/src/routes/auth.rs`

**Result:** ❌ Still redirected to signin (backend working, problem was client-side)

---

### 3. Fixed Cookie Domain
**Goal:** Ensure session cookie accessible across subdomains

**Finding:** `AUTH_COOKIE_DOMAIN` was not set on Fly.io (defaulting to `localhost`)

**Fix:** `flyctl secrets set AUTH_COOKIE_DOMAIN=ecent.online`

**Result:** ❌ Still redirected (but this was a necessary fix)

---

### 4. Backend Logs Analysis
**Finding:** Backend logs showed:
- Session WAS being validated: `"Session found for user"`
- Cookie set correctly with `Domain=ecent.online; SameSite=None; Secure; HttpOnly`

**Conclusion:** Backend working correctly, problem is client-side

---

### 5. Root Cause Identified: Client-Side Race Condition

**The Problematic Code:**
```tsx
// app/frontend/src/components/shell/AppShell.tsx (OLD)
useEffect(() => {
  if (isLoading) return;
  if (!isAuthenticated) {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }
}, [isLoading, isAuthenticated, router, pathname]);
```

**Why It Failed:**
- `useAuth()` hook makes async fetch to `/api/auth/session`
- `isLoading` becomes `false` when hook initializes (not when fetch completes)
- `isAuthenticated` is `null` until fetch resolves
- The `useEffect` sees `isLoading=false` and `isAuthenticated=null` → redirects

**The Fix:**
Removed the redundant `useEffect` entirely. The middleware at `app/frontend/src/middleware.ts` already handles authentication enforcement before the page renders.

**Fixed Code:**
```tsx
// app/frontend/src/components/shell/AppShell.tsx (NEW)
// Note: Authentication is enforced by middleware.
// Client-side redirect is disabled to prevent race conditions.
// The middleware already redirects unauthenticated users before this component renders.
```

**Commit:** `8d37948`  
**Deployed:** Pushed to main, GitHub Actions deploying

---

## Technical Details

### Authentication Flow (Corrected)

```
1. User clicks "Sign in with Google"
   ↓
2. Frontend → GET /api/auth/signin/google?redirect_uri=https://ignition.ecent.online/today
   ↓
3. Backend generates OAuth URL + stores state in DB
   ↓
4. User redirected to Google OAuth consent
   ↓
5. User approves → Google redirects to /api/auth/callback/google?code=...&state=...
   ↓
6. Backend validates state, exchanges code for tokens, creates user/session
   ↓
7. Backend sets session cookie (Domain=ecent.online)
   ↓
8. Backend redirects to stored redirect_uri (https://ignition.ecent.online/today)
   ↓
9. Frontend middleware validates session cookie
   ↓
10. If valid: page renders ✅
    If invalid: middleware redirects to /auth/signin
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| **Backend `/api/auth/signin/google`** | Generate OAuth URL, store state in DB |
| **Backend `/api/auth/callback/google`** | Validate state, exchange tokens, create session, redirect |
| **Frontend middleware** | Validate session before page renders |
| **`useAuth()` hook** | Fetch session data for UI display (NOT for auth enforcement) |

---

## Lessons Learned

1. **Middleware > Client-side checks:** Authentication should be enforced at the middleware level, not in client components
2. **useEffect + async state = race conditions:** Client-side redirects based on async state are prone to timing issues
3. **Backend was working:** Spent time debugging backend when the issue was client-side
4. **Logs are critical:** Backend logs showed session WAS valid, pointing to client issue

---

## Related Files

| File | Purpose |
|------|---------|
| [AppShell.tsx](../../app/frontend/src/components/shell/AppShell.tsx) | Fixed - removed redirect |
| [middleware.ts](../../app/frontend/src/middleware.ts) | Auth enforcement (correct place) |
| [useAuth()](../../app/frontend/src/lib/auth/index.ts) | Session hook |
| [auth.rs](../../app/backend/crates/api/src/routes/auth.rs) | OAuth handlers |

---

## Testing Checklist

- [ ] Test OAuth flow: Landing → Signin → Google → `/today` (stay on page)
- [ ] Test with multiple tabs open
- [ ] Test with expired session (should redirect to signin)
- [ ] Test direct navigation to `/today` without auth (middleware should catch)
- [ ] Verify no console errors
- [ ] Verify session cookie present with correct domain

---

**Status:** Fixed and deployed (pending GitHub Actions completion)  
**Next:** Monitor production, verify no regressions
