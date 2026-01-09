# Conversion Current State Summary

**Date:** January 6, 2026  
**Status:** Phase 0-2 Complete (Inventory & Planning)

---

## Executive Summary

The migration planning phase is complete. We have:
1. Fully inventoried the existing Next.js application
2. Documented all 55 API endpoints with their auth, data, and R2 dependencies
3. Created the target Rust backend structure
4. Produced architecture decision records
5. Scaffolded the conversion directory with initial code

---

## What Has Been Discovered

### Current Architecture (Source)

| Component | Technology | Location |
|-----------|------------|----------|
| Frontend | Next.js 15.1.3 + React 19 | `src/app/`, `src/components/` |
| Auth | Auth.js (NextAuth v5) + D1 Adapter | `src/lib/auth/` |
| Database | Cloudflare D1 (SQLite) | `src/lib/db/`, bindings in `wrangler.toml` |
| Storage | Cloudflare R2 | `src/lib/storage/`, binding `BLOBS` |
| API Routes | Next.js App Router | `src/app/api/**/*.ts` (55 routes) |
| Deployment | OpenNext on Cloudflare Workers | `open-next.config.ts`, `wrangler.toml` |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` |

### API Surface Analysis

- **55 total route handlers** discovered in `src/app/api/`
- **22 functional domains** (auth, focus, quests, habits, goals, calendar, exercise, books, learn, market, etc.)
- **3 auth patterns:**
  1. Public (only `/api/auth/[...nextauth]`)
  2. User-authenticated (45+ routes using `auth()` or `createAPIHandler`)
  3. Admin-authenticated (9 routes using `isAdminEmail()`)
- **6 routes directly access R2** (blobs upload/download, reference tracks)

### Database Schema

- **~60 tables** defined in `migrations/0100_master_reset.sql`
- **Key table groups:**
  - Auth: `users`, `accounts`, `sessions`, `verification_tokens`
  - Gamification: `user_wallet`, `points_ledger`, `achievement_definitions`, `user_achievements`
  - Focus: `focus_sessions`, `focus_pause_state`
  - Quests/Habits/Goals: `quests`, `habits`, `goals` + related tables
  - Exercise: `exercises`, `workouts`, `workout_sessions`, `personal_records`
  - Learning: `learn_topics`, `learn_lessons`, `flashcard_decks`
  - Content: `market_items`, `infobase_entries`, `ideas`

### Security Findings

| Aspect | Current State | Notes |
|--------|---------------|-------|
| Session Cookies | HttpOnly, SameSite=Lax, Secure=prod | Configured in `src/lib/auth/index.ts` L115-140 |
| CSRF | Auth.js built-in csrf-token cookie | Managed by NextAuth |
| Admin Check | Email whitelist from env var | `src/lib/admin/index.ts` |
| Rate Limiting | None (relies on Cloudflare edge) | Needs implementation in backend |
| Redirect Validation | Origin check in auth callbacks | `src/lib/auth/index.ts` L96-114 |

### R2 Usage Points

| Route | Operation | Authorization |
|-------|-----------|---------------|
| `POST /api/blobs/upload` | Write | userId from session |
| `GET /api/blobs/[id]` | Read | userId prefix check |
| `DELETE /api/blobs/[id]` | Delete | userId prefix check |
| `POST /api/reference/upload` | Write | userId from session |
| `GET /api/reference/tracks/[id]/stream` | Read | D1 ownership lookup |
| `GET /api/reference/tracks/[id]/play` | Read | D1 ownership lookup |

---

## What Has Been Created

### Conversion Directory Structure

```
conversions/
├── MIGRATION_PLAN.md              # Main migration plan document
├── docs/
│   ├── API_ENDPOINT_INVENTORY.md  # Complete API route table
│   ├── SCHEMA_MIGRATION_MAP.md    # D1 -> Postgres schema mapping
│   └── ARCHITECTURE_DECISIONS.md  # ADRs for key decisions
├── backend/
│   ├── Cargo.toml                 # Rust workspace manifest
│   └── crates/
│       ├── common/                # Shared types, errors, config
│       │   ├── Cargo.toml
│       │   └── src/
│       │       ├── lib.rs
│       │       ├── errors.rs      # AppError enum + IntoResponse
│       │       ├── config.rs      # Environment config loading
│       │       └── types.rs       # Shared types (UserId, FocusMode, etc.)
│       ├── auth/src/              # (empty - to be implemented)
│       ├── db/src/                # (empty - to be implemented)
│       ├── storage/src/           # (empty - to be implemented)
│       ├── focus/src/             # (empty - to be implemented)
│       ├── quests/src/            # (empty - to be implemented)
│       ├── habits/src/            # (empty - to be implemented)
│       ├── goals/src/             # (empty - to be implemented)
│       ├── calendar/src/          # (empty - to be implemented)
│       ├── exercise/src/          # (empty - to be implemented)
│       ├── books/src/             # (empty - to be implemented)
│       ├── learn/src/             # (empty - to be implemented)
│       ├── market/src/            # (empty - to be implemented)
│       ├── onboarding/src/        # (empty - to be implemented)
│       ├── gamification/src/      # (empty - to be implemented)
│       ├── infobase/src/          # (empty - to be implemented)
│       ├── uploads/src/           # (empty - to be implemented)
│       ├── users/src/             # (empty - to be implemented)
│       ├── admin/src/             # (empty - to be implemented)
│       └── api/src/               # (empty - to be implemented)
└── frontend/
    ├── api-client/
    │   ├── client.ts              # API client class (implemented)
    │   ├── types.ts               # (needs creation)
    │   └── endpoints/             # (empty - to be implemented)
    ├── ssr-forwarder/             # (empty - to be implemented)
    ├── types/                     # (empty - to be implemented)
    └── route-proxies/             # (empty - for migration shims)
```

### Implemented Code

#### Backend (`conversions/backend/`)

1. **Cargo.toml (workspace):** Defines all crates and shared dependencies (axum, sqlx, tokio, serde, etc.)

2. **common crate:**
   - `errors.rs`: `AppError` enum with `Unauthorized`, `Forbidden`, `NotFound`, `BadRequest`, `Conflict`, `TooManyRequests`, `Validation`, `Database`, `Internal` variants. Implements `IntoResponse` for automatic HTTP status mapping.
   - `config.rs`: `Config` struct loading from environment variables (database URL, OAuth secrets, R2 credentials, admin emails, etc.)
   - `types.rs`: Shared types including `UserId`, `SessionId`, `Timestamp`, `PaginationParams`, `PaginatedResponse`, and enums for `FocusMode`, `FocusStatus`, `QuestDifficulty`, `HabitFrequency`, etc.

#### Frontend (`conversions/frontend/`)

1. **api-client/client.ts:** Full API client implementation with:
   - CSRF token handling (reads from cookie, includes in headers)
   - Credential inclusion for cookies
   - Typed request methods (get, post, put, patch, delete)
   - SSR support via `forSSR()` factory method
   - Error handling with `APIError` class

---

## Architecture Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Routing Plan** | Plan A: Same-site | First-party cookies, no CORS complexity |
| **Session Storage** | Hash tokens in DB | Security if DB is compromised |
| **CSRF Protection** | Double-submit cookie | Stateless, works with same-site |
| **Database** | Neon + Hyperdrive (proposed) | Serverless Postgres + edge caching |
| **Workspace Structure** | Domain-driven crates | Clear boundaries, faster rebuilds |
| **Error Handling** | Typed enum + thiserror | Type safety, consistent responses |
| **Session Migration** | Invalidate all, force re-login | Security + clean slate |

---

## Migration Phases Defined

### Phase A: Preparation (Week 1-2)
- [x] Create conversions/ directory structure
- [x] Initialize Rust workspace with common crate
- [ ] Create Postgres schema files
- [ ] Create data export/transform scripts
- [x] Create frontend API client skeleton

### Phase B: Backend Core (Week 3-4)
- [ ] Implement db crate with connection pool
- [ ] Implement auth crate (OAuth flows, sessions)
- [ ] Implement storage crate (R2 access)
- [ ] Implement base middleware stack
- [ ] Implement error handling and logging

### Phase C: Domain Modules (Week 5-7)
- [ ] 19 domain crates to implement (focus, quests, habits, etc.)

### Phase D: API Layer (Week 8)
- [ ] All Axum handlers

### Phase E: Frontend Migration (Week 9-10)
- [ ] Replace Auth.js with backend auth
- [ ] Replace all fetch calls with API client

### Phase F: Data Migration (Week 11)
- [ ] D1 -> Postgres data transfer

### Phase G: Cutover (Week 12)
- [ ] Production deployment

---

## Known Gaps / TODOs

### Missing Information

| Item | Status | Impact |
|------|--------|--------|
| Cloudflare Containers config | Not created | Need to verify container deployment process |
| Postgres hosting decision | Proposed Neon | Need team confirmation |
| OAuth redirect URI updates | Not done | Must update in Google/Azure consoles |

### Files Still Needed

| Path | Purpose |
|------|---------|
| `conversions/frontend/api-client/types.ts` | APIError class and API response types |
| `conversions/frontend/api-client/endpoints/*.ts` | Domain-specific typed endpoints |
| `conversions/frontend/ssr-forwarder/index.ts` | SSR cookie forwarding middleware |
| `conversions/migrations/postgres-schema/*.sql` | Postgres DDL files |
| `conversions/migrations/data-migration/*.ts` | Export/transform/import scripts |

### Backend Crates Needing Implementation

All domain crates are scaffolded but empty:
- `auth`, `db`, `storage` (core infrastructure)
- `users`, `admin` (user management)
- `focus`, `quests`, `habits`, `goals`, `calendar` (productivity)
- `exercise`, `books`, `learn` (tracking)
- `market`, `onboarding`, `gamification` (engagement)
- `infobase`, `uploads` (content)
- `api` (HTTP layer)

---

## Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| Session fixation during migration | High | Generate new session IDs; invalidate D1 sessions |
| Data loss during D1->Postgres | Critical | Full backup; verify row counts; reversible migration |
| Type conversion errors | High | Validate transforms with sample data |
| Downtime during cutover | Medium | Blue-green deployment; rollback plan |
| Missing API coverage | High | Automated API inventory comparison |

---

## Next Steps

1. **Immediate:** Create `conversions/frontend/api-client/types.ts` (APIError class)
2. **Short-term:** Create Postgres schema files in `conversions/migrations/postgres-schema/`
3. **Short-term:** Implement `db` crate with connection pool and migrations
4. **Medium-term:** Implement `auth` crate with OAuth and session management
5. **Medium-term:** Port first domain module (suggest: `focus`) as proof of concept

---

## File References

| Document | Path | Purpose |
|----------|------|---------|
| Migration Plan | `conversions/MIGRATION_PLAN.md` | Main migration strategy |
| API Inventory | `conversions/docs/API_ENDPOINT_INVENTORY.md` | All 55 routes documented |
| Schema Map | `conversions/docs/SCHEMA_MIGRATION_MAP.md` | D1 -> Postgres DDL |
| ADRs | `conversions/docs/ARCHITECTURE_DECISIONS.md` | Key architectural choices |

---

*End of Current State Summary*

