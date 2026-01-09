"Endpoint namespace map defining route organization and legacy mapping."

# Endpoint Namespace Map

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define endpoint namespaces, legacy route mapping, and transitional rules

---

## Overview

This document defines how endpoints are organized in the new Rust backend and how legacy Next.js routes map to them.

---

## Namespace Structure

### Top-Level Namespaces

| Namespace | Purpose | Auth Level | Host |
|-----------|---------|------------|------|
| `/health` | Liveness/readiness | Public | api.ecent.online |
| `/auth/*` | Authentication | Varies | api.ecent.online |
| `/admin/*` | Admin operations | Admin | api.ecent.online |
| `/blobs/*` | Blob storage | User | api.ecent.online |
| `/*` (feature routes) | Feature APIs | User | api.ecent.online |

### Route Hierarchy

```
https://api.ecent.online/
├── health                    # Public
├── health/ready             # Public
├── health/db                # Admin (optional)
│
├── auth/                    # Authentication
│   ├── login/google         # Public - OAuth initiation
│   ├── login/azure          # Public - OAuth initiation
│   ├── callback/google      # Public - OAuth callback
│   ├── callback/azure       # Public - OAuth callback
│   ├── logout               # User - End session
│   ├── session              # User - Get session
│   ├── accept-tos           # User - Accept ToS
│   └── verify-age           # User - Age verification
│
├── blobs/                   # Storage
│   ├── upload               # POST - Upload blob
│   ├── upload-url           # POST - Get signed upload URL
│   ├── :id                  # GET, DELETE - Blob operations
│   ├── :id/info             # GET - Blob metadata
│   ├── :id/download-url     # GET - Signed download URL
│   └── usage                # GET - Storage usage
│
├── admin/                   # Admin operations
│   ├── users                # GET, DELETE
│   ├── cleanup-users        # GET, DELETE
│   ├── stats                # GET
│   ├── feedback             # GET, PATCH
│   ├── quests               # GET, PATCH
│   ├── skills               # GET, PATCH, DELETE
│   ├── content              # GET, POST, DELETE
│   ├── db-health            # GET, DELETE
│   ├── backup               # GET
│   └── restore              # POST
│
├── gamification/            # XP, wallet, achievements
│   ├── teaser               # GET
│   └── summary              # GET
│
├── focus/                   # Focus sessions
│   ├── (list/create)        # GET, POST
│   ├── active               # GET
│   ├── pause                # GET, POST, DELETE
│   └── :id/
│       ├── complete         # POST
│       └── abandon          # POST
│
├── habits/                  # Habits
│   └── (list/create)        # GET, POST
│
├── goals/                   # Goals
│   └── (list/create)        # GET, POST
│
├── quests/                  # Quests
│   └── (list/update)        # GET, POST
│
├── calendar/                # Calendar
│   └── (crud)               # GET, POST, PUT, DELETE
│
├── daily-plan/              # Daily planning
│   └── (list/create)        # GET, POST
│
├── exercise/                # Exercise
│   ├── (crud)               # GET, POST, PUT, DELETE
│   └── seed                 # POST (admin)
│
├── programs/                # Training programs
│   └── (list/create)        # GET, POST
│
├── books/                   # Book tracking
│   └── (list/create/delete) # GET, POST, DELETE
│
├── learn/                   # Learning
│   ├── (topics/lessons)     # GET
│   ├── progress             # GET, POST
│   └── review               # GET, POST
│
├── market/                  # Market
│   ├── (overview)           # GET
│   ├── items                # GET, POST, PUT, DELETE
│   ├── purchase             # POST
│   └── redeem               # POST
│
├── reference/               # Reference tracks
│   ├── tracks               # GET, POST
│   ├── tracks/:id           # GET, PATCH, DELETE
│   ├── tracks/:id/analysis  # GET, POST
│   ├── tracks/:id/play      # GET (stream)
│   ├── tracks/:id/stream    # GET (stream)
│   ├── upload               # POST
│   └── upload/init          # POST
│
├── onboarding/              # Onboarding
│   ├── (state)              # GET
│   ├── start                # POST
│   ├── skip                 # POST
│   ├── reset                # POST
│   └── step                 # POST
│
├── user/                    # User operations
│   ├── export               # GET
│   ├── delete               # DELETE
│   └── settings             # GET, PUT (if needed)
│
├── feedback/                # User feedback
│   └── (list/create)        # GET, POST
│
├── infobase/                # Knowledge base
│   └── (crud)               # GET, POST, PUT, DELETE
│
├── ideas/                   # Ideas capture
│   └── (crud)               # GET, POST, PUT, DELETE
│
└── analysis/                # Track analysis
    └── (get/create)         # GET, POST
```

---

## Legacy Next.js Route Mapping

### Complete Mapping Table

| Legacy Route (Next.js) | New Route (Rust) | Method(s) | Notes |
|------------------------|------------------|-----------|-------|
| `/api/auth/[...nextauth]` | `/auth/*` | GET, POST | Split into discrete routes |
| `/api/auth/accept-tos` | `/auth/accept-tos` | GET, POST | Same path |
| `/api/auth/verify-age` | `/auth/verify-age` | POST | Same path |
| `/api/admin/backup` | `/admin/backup` | GET | Same |
| `/api/admin/cleanup-users` | `/admin/cleanup-users` | GET, DELETE | Same |
| `/api/admin/content` | `/admin/content` | GET, POST, DELETE | Same |
| `/api/admin/db-health` | `/admin/db-health` | GET, DELETE | Same |
| `/api/admin/feedback` | `/admin/feedback` | GET, PATCH | Same |
| `/api/admin/quests` | `/admin/quests` | GET, PATCH | Same |
| `/api/admin/restore` | `/admin/restore` | POST | Same |
| `/api/admin/skills` | `/admin/skills` | GET, PATCH, DELETE | Same |
| `/api/admin/stats` | `/admin/stats` | GET | Same |
| `/api/admin/users` | `/admin/users` | GET, DELETE | Same |
| `/api/user/delete` | `/user/delete` | DELETE | Same |
| `/api/user/export` | `/user/export` | GET | Same |
| `/api/blobs/upload` | `/blobs/upload` | POST | Same |
| `/api/blobs/[id]` | `/blobs/:id` | GET, DELETE, HEAD | Path param syntax |
| `/api/focus` | `/focus` | GET, POST | Same |
| `/api/focus/active` | `/focus/active` | GET | Same |
| `/api/focus/pause` | `/focus/pause` | GET, POST, DELETE | Same |
| `/api/focus/[id]/complete` | `/focus/:id/complete` | POST | Path param syntax |
| `/api/focus/[id]/abandon` | `/focus/:id/abandon` | POST | Path param syntax |
| `/api/habits` | `/habits` | GET, POST | Same |
| `/api/goals` | `/goals` | GET, POST | Same |
| `/api/quests` | `/quests` | GET, POST | Same |
| `/api/calendar` | `/calendar` | GET, POST, PUT, DELETE | Same |
| `/api/daily-plan` | `/daily-plan` | GET, POST | Same |
| `/api/exercise` | `/exercise` | GET, POST, PUT, DELETE | Same |
| `/api/exercise/seed` | `/exercise/seed` | POST | Same |
| `/api/programs` | `/programs` | GET, POST | Same |
| `/api/books` | `/books` | GET, POST, DELETE | Same |
| `/api/learn` | `/learn` | GET | Same |
| `/api/learn/progress` | `/learn/progress` | GET, POST | Same |
| `/api/learn/review` | `/learn/review` | GET, POST | Same |
| `/api/market` | `/market` | GET | Same |
| `/api/market/items` | `/market/items` | GET, POST, PUT, DELETE | Same |
| `/api/market/purchase` | `/market/purchase` | POST | Same |
| `/api/market/redeem` | `/market/redeem` | POST | Same |
| `/api/gamification/teaser` | `/gamification/teaser` | GET | Same |
| `/api/onboarding` | `/onboarding` | GET | Same |
| `/api/onboarding/start` | `/onboarding/start` | POST | Same |
| `/api/onboarding/skip` | `/onboarding/skip` | POST | Same |
| `/api/onboarding/reset` | `/onboarding/reset` | POST | Same |
| `/api/onboarding/step` | `/onboarding/step` | POST | Same |
| `/api/infobase` | `/infobase` | GET, POST, PUT, DELETE | Same |
| `/api/ideas` | `/ideas` | GET, POST, PUT, DELETE | Same |
| `/api/analysis` | `/analysis` | GET, POST | Same |
| `/api/feedback` | `/feedback` | GET, POST | Same |
| `/api/reference/tracks` | `/reference/tracks` | GET, POST | Same |
| `/api/reference/tracks/[id]` | `/reference/tracks/:id` | GET, PATCH, DELETE | Path param syntax |
| `/api/reference/tracks/[id]/analysis` | `/reference/tracks/:id/analysis` | GET, POST | Path param syntax |
| `/api/reference/tracks/[id]/play` | `/reference/tracks/:id/play` | GET | Path param syntax |
| `/api/reference/tracks/[id]/stream` | `/reference/tracks/:id/stream` | GET | Path param syntax |
| `/api/reference/upload` | `/reference/upload` | POST | Same |
| `/api/reference/upload/init` | `/reference/upload/init` | POST | Same |

### Path Parameter Syntax Change

| Next.js | Rust/Axum |
|---------|-----------|
| `[id]` | `:id` |
| `[...slug]` | `*slug` (catch-all) |

---

## Reference Tracks Location

Reference tracks are a specialized feature combining storage and analysis. They live under `/reference/*`:

### Route Details

| Route | Method | Purpose | Auth | R2 Access |
|-------|--------|---------|------|-----------|
| `/reference/tracks` | GET | List user's tracks | User | No |
| `/reference/tracks` | POST | Create track metadata | User | No |
| `/reference/tracks/:id` | GET | Get track metadata | User | No |
| `/reference/tracks/:id` | PATCH | Update track metadata | User | No |
| `/reference/tracks/:id` | DELETE | Delete track (+ R2 file) | User | Yes |
| `/reference/tracks/:id/analysis` | GET | Get cached analysis | User | No |
| `/reference/tracks/:id/analysis` | POST | Trigger/update analysis | User | No |
| `/reference/tracks/:id/play` | GET | Stream audio | User | Yes |
| `/reference/tracks/:id/stream` | GET | Stream audio (range) | User | Yes |
| `/reference/upload` | POST | Upload audio file | User | Yes |
| `/reference/upload/init` | POST | Init multipart upload | User | No |

### Why Not Under `/blobs/*`?

Reference tracks have domain-specific logic:
- Linked to `reference_tracks` table (metadata)
- Analysis caching in `track_analysis_cache`
- Specialized streaming (byte-range)
- Future: annotations, comparisons

Generic blobs (`/blobs/*`) are for general-purpose storage.

---

## Transitional Rules

### During Migration

1. **Parallel Operation:** Both Next.js (`/api/*`) and Rust backends may run simultaneously during testing
2. **Feature Flags:** (Not used per copilot-instructions)
3. **Frontend Switch:** Use `NEXT_PUBLIC_API_URL` to point to either backend

### API URL Configuration

```typescript
// Frontend configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

// Development: http://localhost:8080
// Staging: https://api-staging.ecent.online
// Production: https://api.ecent.online
```

### Cutover Sequence

1. Deploy Rust backend
2. Update `NEXT_PUBLIC_API_URL` to point to Rust backend
3. Verify all routes work
4. Remove Next.js API routes
5. Move to `deprecated/`

### No Simultaneous Active Implementations

Per copilot-instructions: Once Rust route is active, Next.js route must be deprecated:

```
src/app/api/focus/route.ts → deprecated/src/app/api/focus/route.ts
```

---

## New Routes (Not in Legacy)

Routes added in the new backend that didn't exist in Next.js:

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/auth/login/google` | GET | OAuth initiation |
| `/auth/login/azure` | GET | OAuth initiation |
| `/auth/callback/google` | GET | OAuth callback |
| `/auth/callback/azure` | GET | OAuth callback |
| `/auth/session` | GET | Get current session |
| `/blobs/upload-url` | POST | Signed upload URL |
| `/blobs/:id/info` | GET | Blob metadata |
| `/blobs/:id/download-url` | GET | Signed download URL |
| `/blobs/usage` | GET | Storage usage |
| `/gamification/summary` | GET | Full gamification state |

---

## Deprecated Routes

Routes that exist in Next.js but will NOT be ported:

| Route | Reason |
|-------|--------|
| (none identified) | All routes will be ported |

---

## Method Mapping

### Standard CRUD

| Operation | HTTP Method | Path Pattern |
|-----------|-------------|--------------|
| List | GET | `/resource` |
| Create | POST | `/resource` |
| Get | GET | `/resource/:id` |
| Update | PUT | `/resource/:id` |
| Partial Update | PATCH | `/resource/:id` |
| Delete | DELETE | `/resource/:id` |

### Action Endpoints

For non-CRUD actions, use POST with action path:

| Operation | HTTP Method | Path Pattern |
|-----------|-------------|--------------|
| Complete focus | POST | `/focus/:id/complete` |
| Abandon focus | POST | `/focus/:id/abandon` |
| Purchase item | POST | `/market/purchase` |
| Start onboarding | POST | `/onboarding/start` |

---

## Query Parameter Conventions

### Pagination

```
GET /focus?page=1&page_size=20&sort=started_at&order=desc
```

### Filtering

```
GET /calendar?start_date=2026-01-01&end_date=2026-01-31
GET /habits?frequency=daily
```

### Search

```
GET /infobase?q=audio+compression
```

---

## Content-Type by Route

| Route Pattern | Request Content-Type | Response Content-Type |
|---------------|---------------------|----------------------|
| Most routes | `application/json` | `application/json` |
| `/blobs/upload` | `multipart/form-data` | `application/json` |
| `/reference/upload` | `multipart/form-data` | `application/json` |
| `/blobs/:id` | N/A | Varies by blob |
| `/reference/tracks/:id/stream` | N/A | `audio/*` |
| `/user/export` | N/A | `application/zip` |

---

## CORS Configuration

### Allowed Origins

| Origin | Environment |
|--------|-------------|
| `https://ignition.ecent.online` | Production |
| `https://admin.ignition.ecent.online` | Production |
| `http://localhost:3000` | Development |
| `http://localhost:3001` | Development |

### Preflight Caching

```
Access-Control-Max-Age: 86400
```

---

## References

- [API_CONTRACTS_PLAN.md](./API_CONTRACTS_PLAN.md) - Contract standards
- [SHARED_TYPES_STRATEGY.md](./SHARED_TYPES_STRATEGY.md) - Type sharing
- [api_endpoint_inventory.md](./api_endpoint_inventory.md) - Legacy routes
- [FEATURE_OWNERSHIP_MAP.md](./FEATURE_OWNERSHIP_MAP.md) - Feature ownership
- [routing_and_domains.md](./routing_and_domains.md) - Domain configuration

