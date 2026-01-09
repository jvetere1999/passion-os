# Architecture Evolution Guide

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Status:** Post-Migration Architecture Planning  
**Author:** Architecture Recommender

---

## Current State Summary

The stack split migration has achieved:
- **Backend:** Rust monolith (Axum + Tower) at `app/backend/crates/api/`
- **Frontend:** Next.js UI-only at `app/frontend/`
- **Admin:** Separate Next.js app at `app/admin/`
- **Database:** PostgreSQL with 14 migrations at `app/database/migrations/`
- **Storage:** R2 via backend-only signed URLs

**Ownership Model (Non-Negotiable):**
- Backend owns: Auth, Sessions, RBAC, all business logic, R2 access
- Frontend owns: UI rendering (SSR/RSC allowed), cookie forwarding
- Admin owns: UI for admin functions under `/admin/*` routes

---

## 1. What to Modularize Next

### 1.1 Backend Internal Modularization (P1)

The current `app/backend/crates/api/` is a single crate. As complexity grows, consider:

| Module | Current Location | Recommendation | Trigger |
|--------|------------------|----------------|---------|
| **Auth/Session** | `routes/auth.rs`, `shared/auth/` | Keep together | - |
| **Gamification** | `routes/gamification.rs`, `db/gamification_repos.rs` | Extract crate when > 2000 LOC | LOC threshold |
| **Reference Tracks** | `routes/reference.rs` (816 lines) | Consider extraction | Feature complexity grows |
| **Exercise** | `routes/exercise.rs` + programs | Keep together (domain cohesion) | - |

**Recommended First Extraction:** None immediately. Current module boundaries are clean.

**Extraction Criteria:**
1. Module exceeds 2000 lines
2. Module has distinct external dependencies
3. Module could be versioned independently
4. Team boundaries align with module boundaries

### 1.2 Shared Types Strategy (P1)

Current status: Types duplicated between backend (Rust) and frontend (TypeScript).

**Recommendation:** Generate TypeScript types from Rust structs.

```
app/backend/crates/api/src/
  routes/<feature>.rs  →  #[derive(Serialize, TS)]
                          ↓
                      ts-rs export
                          ↓
shared/api-client/types/generated.ts  ←  Frontend imports
```

**Tools:** `ts-rs` crate for Rust → TypeScript generation.

**Benefits:**
- Single source of truth
- Compile-time contract enforcement
- Eliminates drift between API and client

### 1.3 Database Layer Patterns (P2)

Current: Repositories in `db/<feature>_repos.rs` with inline SQL.

**Keep:**
- Runtime query binding (no compile-time macros per copilot-instructions)
- Parameterized queries (security requirement)
- Explicit transaction boundaries

**Consider:**
- Query builder abstraction for complex filters
- Read replicas for reporting (UNKNOWN: scale requirements)
- Connection pool monitoring

### 1.4 Frontend Component Organization (P2)

Current: Mixed component structure in `app/frontend/src/`.

**Recommendation:**
```
app/frontend/src/
  components/
    ui/         # Primitives (Button, Card, Modal)
    features/   # Feature-specific (FocusTimer, WorkoutBuilder)
    layouts/    # Page layouts
  lib/
    api/        # ✅ Already centralized
    hooks/      # Custom hooks
    utils/      # Utilities
  app/          # Next.js app router pages
```

---

## 2. What to Avoid

### 2.1 Architectural Anti-Patterns

| Anti-Pattern | Risk | Mitigation |
|--------------|------|------------|
| **Backend-for-frontend (BFF) layer** | Adds latency, complexity | Keep single backend |
| **Microservices split** | Operational overhead for small team | Monolith with clean modules |
| **GraphQL adoption** | Complexity not justified | REST with versioning |
| **Redis for sessions** | Extra infrastructure | Postgres sessions (current) |
| **Feature flags system** | Already deprecated per copilot-instructions | Remove remaining stubs |
| **Real-time WebSockets** | Complexity, scaling concerns | SSE or polling for updates |

### 2.2 Frontend Anti-Patterns

| Anti-Pattern | Risk | Mitigation |
|--------------|------|------------|
| **Client-side auth logic** | Security, inconsistency | Backend-only auth |
| **Direct R2 access** | IDOR, credential exposure | Backend signed URLs only |
| **Heavy client state** | Hydration issues, complexity | Server components + minimal client state |
| **Prop drilling** | Maintenance burden | Context + composition |

### 2.3 Database Anti-Patterns

| Anti-Pattern | Risk | Mitigation |
|--------------|------|------------|
| **N+1 queries** | Performance degradation | Eager loading, query monitoring |
| **Schema changes without migrations** | State drift | Enforce migration workflow |
| **Storing sessions in memory** | Loss on restart | Postgres sessions (current) |
| **Connection leaks** | Pool exhaustion | Monitor pool metrics |

---

## 3. Drift Prevention Strategy

### 3.1 Documentation Drift

**Problem:** Planning docs diverge from implementation over time.

**Prevention:**

| Mechanism | Implementation | Frequency |
|-----------|----------------|-----------|
| **Drift Report** | `docs/backend/migration/DRIFT_REPORT.md` | Weekly |
| **Parity Checklist Audit** | Count PARITY IDs vs summary | Per release |
| **Schema Validation** | Compare Rust models to Postgres schema | Per migration |
| **API Contract Tests** | Validate routes match OpenAPI spec | Per PR |

### 3.2 Code-Documentation Alignment

**Rules:**
1. Every new route gets a PARITY-XXX entry before merge
2. Every schema change gets a migration + model update in same PR
3. Every closed gap (FGAP) requires validation doc before closing
4. Tests must exist before PARITY item can be marked ✅ Done

### 3.3 Automated Checks

| Check | Tool | When |
|-------|------|------|
| Rust format | `cargo fmt --check` | CI |
| Rust lint | `cargo clippy` | CI |
| TypeScript typecheck | `npm run typecheck` | CI |
| TypeScript lint | `npm run lint` | CI |
| Schema sync | Custom migration validator | CI |
| API contract | Contract test suite | CI |

### 3.4 Review Gates

| Gate | Requirement |
|------|-------------|
| PR merge | All CI checks pass |
| Phase transition | Validation doc + owner sign-off |
| Production deploy | Go-live checklist complete |

---

## 4. Scaling Considerations (Future)

### 4.1 When to Consider

These should remain LATER items until metrics justify:

| Concern | Trigger Metric | Action |
|---------|----------------|--------|
| Database performance | p95 query latency > 100ms | Index optimization, read replicas |
| API latency | p95 > 200ms | Profile, cache, CDN |
| Container scaling | CPU > 70% sustained | Horizontal scaling |
| Storage costs | R2 > $100/mo | Lifecycle policies, compression |

### 4.2 What NOT to Pre-Optimize

- Caching layers (add when metrics show need)
- Message queues (add when async processing needed)
- Search infrastructure (Postgres full-text is sufficient initially)
- Multi-region (single region until user demand)

---

## 5. Extension Points

### 5.1 Designed for Extension

| Extension Point | Mechanism | Example |
|-----------------|-----------|---------|
| New feature routes | Add `routes/<feature>.rs`, wire in `api.rs` | New "journal" feature |
| New gamification events | Add to `activity_events` triggers | "listened to track" event |
| New achievement types | Add condition parser in gamification | "streak shield used" |
| New market item types | Add category in `market_items` | "custom reward" |
| New admin functions | Add route under `/admin/*` | "bulk user import" |

### 5.2 Integration Points

| Integration | Recommended Approach | Anti-Pattern |
|-------------|---------------------|--------------|
| Analytics | Server-side events to analytics API | Client-side tracking |
| Email | Transactional email service (SendGrid, etc.) | Custom SMTP |
| Push notifications | FCM/APNS via backend | Client-direct |
| Payments (future) | Stripe server-side SDK | Client-side tokens |

---

## 6. Technical Debt Register

### 6.1 Known Debt (Accept for Now)

| Debt | Reason | Payoff Trigger |
|------|--------|----------------|
| Admin backup/restore stubs | External tooling (pg_dump) preferred | Never (intentional) |
| Analysis route stub | Awaiting decision (FGAP-010) | DEC-006 decision |
| Warning baseline (1100 warnings) | Pre-existing, not increasing | Dedicated cleanup sprint |

### 6.2 Debt to Avoid Accruing

| Pattern | Why Problematic |
|---------|-----------------|
| Inline SQL strings without constants | Harder to refactor |
| Hardcoded configuration | Environment inflexibility |
| Test data in production code | Security, maintenance |
| Commented-out code | Confusion, false signals |

---

## 7. Module Boundaries

### 7.1 Current Module Map

```
app/backend/crates/api/src/
├── routes/           # HTTP handlers by domain
│   ├── auth.rs       # Auth + session (402 lines)
│   ├── gamification.rs
│   ├── focus.rs
│   ├── habits.rs
│   ├── goals.rs
│   ├── quests.rs
│   ├── calendar.rs
│   ├── daily_plan.rs
│   ├── exercise.rs
│   ├── books.rs
│   ├── market.rs
│   ├── learn.rs
│   ├── reference.rs  # 816 lines (largest)
│   ├── onboarding.rs
│   ├── infobase.rs
│   ├── ideas.rs
│   ├── user.rs
│   ├── feedback.rs
│   ├── blobs.rs      # R2 storage
│   ├── admin.rs
│   ├── health.rs
│   └── api.rs        # Router composition
├── db/               # Database layer by domain
│   ├── *_models.rs   # Rust structs
│   └── *_repos.rs    # Query functions
├── shared/           # Cross-cutting concerns
│   ├── auth/         # Auth extraction
│   ├── http/         # Response helpers
│   ├── db/           # DB utilities
│   ├── ids.rs        # Typed IDs
│   └── audit.rs      # Audit logging
└── lib.rs            # Crate root
```

### 7.2 Dependency Rules

| Module | Can Depend On | Cannot Depend On |
|--------|---------------|------------------|
| routes/* | db/*, shared/* | Other routes/* |
| db/* | shared/* | routes/* |
| shared/* | External crates only | db/*, routes/* |

### 7.3 Future Crate Boundaries (If Needed)

```
app/backend/crates/
├── api/           # HTTP layer (current monolith)
├── core/          # Business logic (extract if > 5000 LOC)
├── db/            # Database layer (extract if multiple DBs)
└── shared/        # Cross-crate utilities
```

**Trigger:** Only split when single crate exceeds 10,000 LOC or compile times exceed 60 seconds.

---

## 8. Security Evolution

### 8.1 Current Model (Locked)

Per copilot-instructions:
- Cookie: `Domain=ecent.online; SameSite=None; Secure; HttpOnly`
- CSRF: Origin verification (DEC-002=A)
- RBAC: Database-backed roles (DEC-004=B)
- Secrets: Azure Key Vault

### 8.2 Future Considerations

| Enhancement | When | Implementation |
|-------------|------|----------------|
| Rate limiting | If abuse detected | Tower middleware |
| IP blocking | If abuse detected | Middleware + admin UI |
| Audit log queries | Admin request | Admin console feature |
| Session revocation | Security incident response | Already supported |
| 2FA | User demand | TOTP via authenticators table |

---

## References

- [FEATURE_OWNERSHIP_MAP.md](./migration/FEATURE_OWNERSHIP_MAP.md)
- [BACKEND_SUBMODS_LAYOUT.md](./migration/BACKEND_SUBMODS_LAYOUT.md)
- [SHARED_TYPES_STRATEGY.md](./migration/SHARED_TYPES_STRATEGY.md)
- [security_model.md](./migration/security_model.md)
- [copilot-instructions.md](../../.github/copilot-instructions.md)
