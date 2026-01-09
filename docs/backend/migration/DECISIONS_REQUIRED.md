"Decisions that cannot be inferred from code. Requires owner input before proceeding."

# Decisions Required

**Date:** January 6, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Document decisions that require owner/lead input

---

## Summary

| Decision | Category | Urgency | Blocking |
|----------|----------|---------|----------|
| DECISION-001 | Auth | High | ✅ Resolved (A) |
| DECISION-002 | Security | High | ✅ Resolved (A) |
| DECISION-003 | Code Quality | Low | ✅ Resolved (C) |
| DECISION-005 | Warnings | Medium | Yes - Phase 24 |
| DECISION-006 | API Design | Low | Yes - FGAP-010 |

---

## DECISION-001: Session Migration Strategy {#decision-001}

### Context

Current state:
- Auth.js v5 stores sessions in D1 `sessions` table
- Session tokens are in NextAuth format
- Active users have valid session cookies

Target state:
- Rust backend with custom session management
- Sessions stored in PostgreSQL
- New session token format

### Options

| Option | Effort | UX Impact | Security |
|--------|--------|-----------|----------|
| **A: Force re-auth** | Low | All users must sign in again | Clean break, new security boundary |
| **B: Token migration** | High | Seamless for users | Token format compatibility risks |
| **C: Dual-read grace period** | Medium | Gradual transition | Complexity, potential gaps |

### Recommendation

**Option A: Force re-authentication**

Rationale:
- Clean security boundary for new backend
- No legacy token format compatibility concerns
- Simpler implementation
- One-time inconvenience vs ongoing complexity
- Cutover during low-traffic window minimizes impact

### Decision Needed

- [ ] Approved: Force re-auth (Option A)
- [ ] Approved: Token migration (Option B)
- [ ] Approved: Dual-read (Option C)
- [ ] Other: _______________

**Decision By:** Product/Engineering Lead  
**Deadline:** Before auth implementation begins

---

## DECISION-002: CSRF Protection Mechanism {#decision-002}

### Context

Per copilot-instructions:
- Cookies must use `SameSite=None; Secure; HttpOnly`
- `SameSite=None` requires explicit CSRF protection
- Current Auth.js uses built-in CSRF (won't be available in Rust)

### Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: Origin header verification** | Verify Origin/Referer headers match allowed domains | Simple, no tokens | Relies on browser headers |
| **B: Double-submit cookie** | CSRF token in cookie + request header | Stateless | Extra cookie overhead |
| **C: Synchronizer token** | Server-generated token in session + form | Standard pattern | Stateful, storage overhead |

### Recommendation

**Option A: Origin header verification**

Rationale:
- API-only backend (no form submissions)
- All state-changing requests come from known frontend origin
- Simpler than token management
- Combined with strict CORS provides strong protection

Implementation:
```rust
// Pseudo-code for Tower middleware
fn verify_origin(request: &Request) -> bool {
    let origin = request.headers().get("Origin");
    let allowed = ["https://ignition.ecent.online", "https://admin.ignition.ecent.online"];
    allowed.contains(&origin)
}
```

### Decision Needed

- [ ] Approved: Origin verification (Option A)
- [ ] Approved: Double-submit cookie (Option B)
- [ ] Approved: Synchronizer token (Option C)
- [ ] Other: _______________

**Decision By:** Security/Engineering Lead  
**Deadline:** Before auth middleware implementation

---

## DECISION-003: Lint Warning Resolution Timing {#decision-003}

### Context

Per copilot-instructions:
- "Zero errors and zero warnings for typecheck, lint, unit tests, e2e tests, builds"

Current state:
- 44 pre-existing lint warnings
- All are in frontend code (will move to `app/frontend/`)
- None block builds or tests

### Options

| Option | When | Effort | Risk |
|--------|------|--------|------|
| **A: Fix now** | Before migration | ~2-4 hours | Delays migration start |
| **B: Fix during migration** | As files are touched | Incremental | Some files may be missed |
| **C: Fix post-migration** | After stack split complete | Batch | Delays zero-warning goal |

### Recommendation

**Option B: Fix during frontend migration**

Rationale:
- Most efficient - fixes applied while file is already being modified
- Ensures all touched files meet standard
- Doesn't delay backend work
- Natural enforcement via PR reviews

### Decision Needed

- [ ] Approved: Fix now (Option A)
- [ ] Approved: Fix during migration (Option B)
- [ ] Approved: Fix post-migration (Option C)

**Decision By:** Engineering Lead  
**Deadline:** Flexible - not blocking

---

## DECISION-005: New Warnings and Backend Baseline {#decision-005}

### Context

Pre-deprecation gate validation identified:

1. **Frontend new warnings (+3):**
   - `TrackVisualizer.tsx` has 3 unused variables
   - `exercise.ts` has 1 unused import (`apiPut`)
   - Current: 47 warnings in `app/frontend/src/`
   - Baseline was: 44 warnings in `src/`

2. **Backend has no baseline:**
   - 206 Rust warnings from `cargo check`
   - Mostly unused imports (~150) from route scaffolding
   - Dead code (~30), unused variables (~20)

### Options

| Option | Frontend | Backend | Effort | Impact |
|--------|----------|---------|--------|--------|
| **A: Fix all before deprecation** | Fix 4 warnings | Fix 206 warnings | High | Cleanest baseline |
| **B: Add to baseline, deprecate now** | Add 4 to baseline | Accept 206 as baseline | Low | Quick unblock |
| **C: Fix frontend only, defer backend** | Fix 4 warnings | Accept 206, fix later | Medium | Compromise |
| **D: Fix unused imports only** | Fix 4 warnings | Fix ~150 imports | Medium-High | Reduces 70%+ of warnings |

### Recommendation

**Option C: Fix frontend only, defer backend**

Rationale:
- Frontend delta is small (4 warnings) - quick fix
- Backend warnings are from scaffolding (not bugs)
- DEC-003=C already chose post-migration lint fix
- Backend baseline can be established and fixed incrementally

### Decision Needed

- [ ] Approved: Fix all before deprecation (Option A)
- [ ] Approved: Add to baseline, deprecate now (Option B)
- [ ] Approved: Fix frontend only, defer backend (Option C)
- [ ] Approved: Fix unused imports only (Option D)

**Decision By:** Engineering Lead  
**Deadline:** Before Phase 24 (Legacy Deprecation)  
**Blocks:** ACTION-051, ACTION-052

---

## DECISION-006: Analysis Route Architecture {#decision-006}

### Context (Discovered During Parity Audit)

Current state:
- `/api/analysis` exists as a stub route in `api.rs:107-109`
- Returns empty JSON, no real implementation
- No dedicated `analysis.rs` module exists
- Reference tracks already have `/api/reference/tracks/:id/analysis` endpoint

### Questions

1. Is `/api/analysis` meant to be a standalone feature?
2. Is it a duplicate of reference track analysis?
3. Should it be removed?

### Evidence

```rust
// api.rs:107-109
fn analysis_routes() -> Router<Arc<AppState>> {
    Router::new().route("/", get(stub_get))
}
```

Reference tracks analysis already exists in `reference.rs` at:
- `GET /api/reference/tracks/:id/analysis` - Get analysis
- `POST /api/reference/tracks/:id/analysis` - Generate analysis

### Options

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A: Remove standalone** | Delete `/api/analysis` route, use reference tracks analysis | Low | Simplifies API |
| **B: Implement standalone** | Create `analysis.rs` for cross-feature analysis | High | New feature work |
| **C: Alias to reference** | Route `/api/analysis` to reference tracks analysis | Low | Backwards compat |

### Recommendation

**Option A: Remove standalone**

Rationale:
- No existing frontend uses `/api/analysis` directly
- Reference tracks analysis is fully implemented
- Reduces API surface complexity
- Stub is dead code

### Decision Needed

- [ ] Approved: Remove standalone (Option A)
- [ ] Approved: Implement standalone (Option B)
- [ ] Approved: Alias to reference (Option C)
- [ ] Other: _______________

**Decision By:** Engineering Lead  
**Deadline:** Before frontend swap  
**Blocks:** FGAP-010

---

## Decision Log

| Decision | Date | Outcome | Decided By |
|----------|------|---------|------------|
| DECISION-001 | January 6, 2026 | A (Force re-auth) | Owner |
| DECISION-002 | January 6, 2026 | A (Origin verification) | Owner |
| DECISION-003 | January 6, 2026 | C (Post-migration) | Owner |
| DECISION-005 | Pending | - | - |

---

## References

- [LATER.md](./LATER.md) - Items blocked by these decisions
- [DECISIONS.md](./DECISIONS.md) - Chosen decisions record
- [PRE_DEPRECATED_GATE.md](./PRE_DEPRECATED_GATE.md) - Pre-deprecation validation
- [auth_inventory.md](./auth_inventory.md) - Current auth implementation
- [validation_01.md](./validation_01.md) - Lint warning details

