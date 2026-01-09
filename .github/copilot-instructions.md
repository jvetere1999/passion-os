ASSUME WE ARE ALWAYS ON BRANCH refactor/stack-split
LIMIT VALIDATION CALLS TO THE FINAL CALL ALL FILE EDITS SHOULD HAPPEN BEFORE TERMINAL COMMANDS FOR EFFIECNY
IN ADDITION EVERY PHASE IS FOLLOWED BY A GAP ANALYSIS AND VALIDATION STEP LIMIT THOSE INSIDE OF NON GAP AND VALIDATION PROMPTS
[]:
# Copilot Instructions - Ignition (Stack Split / Backend-First) v3

## Absolute Rules (follow to the T)
- Root is the project root directory.
- Work only on branch: `refactor/stack-split`

## Target Repo Layout (parallel siblings notation)
Notation:
- `{a,b,c}` means `a`, `b`, `c` are siblings in the same parent directory.
- Nested braces indicate a child directory containing parallel siblings.

Required structure:

root/
{infra, deploy, deprecated, docs, app}/

root/docs/
{user, frontend, backend, buisness}/

root/app/
{admin, frontend, backend, database, r2}/

## Artifact Location Rules
- Migration docs live under: `docs/backend/migration/`
- Do not create new markdown elsewhere unless explicitly instructed.

## Translation/movement policy (deprecated mirror)
- When a piece of functionality has been fully translated/moved into the new target location and validated:
  move the old implementation into:
  `deprecated/<original-relative-path>`
  mirroring the same structure.
- Do not delete old code until the new path is proven working (tests + functional validation).
- Do not leave duplicate live implementations in two places; once the new path is active, legacy must be moved to `deprecated/`.

## Outcomes (Non-negotiable)
- Newest stable versions of: Rust, Next.js, React, Node, Postgres.
- Backend is a Rust monolith (Axum + Tower) running in containers.
- All business logic, OAuth, sessions, RBAC, and all API routes live in the backend at:
  - https://api.ecent.online
- Frontend is UI-only (SSR/RSC allowed). Frontend performs 0% auth logic beyond storing and forwarding cookies.
- Admin console is separate UI at:
  - https://admin.ignition.ecent.online
  - Uses the same backend under `/admin/*`
- Database: Postgres only (D1 fully removed). Schema may be optimized.
- Redis: not used initially.
- Storage: R2 remains, but all R2 access is backend-only.
- No back-compat and no public API guarantees.
- Deprecate feature flags (do not expand a feature-flag system).

## Security Model (must be implemented, not hand-waved)
- Cookie strategy (locked):
  - Domain=ecent.online; SameSite=None; Secure; HttpOnly
- SameSite=None requires:
  - CSRF protection for browser state-changing requests
  - strict Origin verification rules
  - session fixation prevention (rotate session on privilege change/login)
- RBAC: user-borne gating stored locally (roles/entitlements model), fed by OAuth identity.
- Secrets: Azure Key Vault.
- Security monitoring and audit trails visible in admin console.

## Canonical Tracking Files (REQUIRED)
All tracking files live under: `docs/backend/migration/`

- Unknown facts: `UNKNOWN.md`
  - Unknown facts only; no action items.
- Required actions: `gaps.md`
  - Action items only; reference UNKNOWN-XXX IDs. Do not restate unknowns.
- Owner decision backlog: `DECISIONS_REQUIRED.md`
  - Decisions that cannot be inferred from code.
- Owner decision record: `DECISIONS.md`
  - Explicit chosen options; single source of truth.
- Work queues:
  - `NOW.md` (repo-auditable / can do now)
  - `LATER.md` (external console/provisioning + deployment/DNS/TLS)

## Decision Discipline (STRICT)
- Never invent decisions.
- If a decision is required:
  - add it to DECISIONS_REQUIRED.md
  - mark dependent ACTIONs as Blocked in gaps.md
  - keep related UNKNOWNs open with "Decision required" note
- When the owner provides decisions (fills DECISIONS.md), you MUST:
  - apply them across planning docs
  - update gaps.md and UNKNOWN.md accordingly
  - proceed only if the phase blockers are satisfied

## Common Work Rules (apply to every task)
- Prefer segmented, reversible changes.
- Do not run commands mid-edit “to see what happens”. Edit first, then validate.
- Treat terminal output as inaccessible:
  - Redirect stdout+stderr to `.tmp/<name>.log 2>&1`
  - Read logs via file viewer/editor APIs only
  - Never use `cat`, `tail`, `head`, `less`, `more`, `type`
- Zero errors and zero warnings for:
  - typecheck, lint, unit tests, e2e tests, builds
  - If a warning is unavoidable, document exact warning text + rationale + plan and require explicit owner approval in docs/backend/migration/exceptions.md.

## Testing Requirements (tests-first, functional)
- Add or update functional tests to prove “full functionality restored”.
- Prefer Playwright flows for critical journeys:
  - OAuth login (Google + Azure)
  - session persistence across refresh
  - RBAC gating to admin console
  - representative CRUD flow per major suite
- Add backend integration tests for:
  - auth/session rotation
  - CSRF/origin enforcement
  - RBAC checks
  - R2 signed URL authorization

## API Rules
- No Next.js API routes for business logic in the final state.
- All API calls go through backend at api.ecent.online (frontend uses a single API client wrapper).
- Ensure consistent error contracts and input validation.
- Never leak secrets in logs or responses.

## Database Rules (Postgres only)
- All schema changes via migrations under `app/database/`.
- Parameterized queries only.
- Explicit transaction boundaries.
- Include audit/event log support for admin monitoring.

## Storage Rules (R2 backend-only)
- Frontend never receives R2 credentials.
- Prefer short-lived signed URLs scoped to user authorization.
- Prevent IDOR on downloads.

## Execution Rules (strict)
- Complete all intended code changes before running any terminal command.
- For any command execution:
  - Redirect output to `.tmp/<name>.log 2>&1`
  - Read logs via editor/file viewer only
- Never use cat/head/tail/less/more/type.

## Minimal Hand-Coding Principle
- Prefer mechanical transformations, codemods, scripted moves, and reusable templates over bespoke per-file edits.
- When manual edits are required, batch them and validate immediately with tests.

## No-Regression Warnings Policy (DEC-003=C)
- Pre-existing warnings are allowed **only as a fixed baseline** (see `docs/backend/migration/warnings_baseline.md`).
- Warnings must **never increase** beyond the baseline count.
- Any file newly created or materially edited must be **warning-free**.
- Every validation doc must report:
  - total warnings
  - delta vs baseline (must be ≤ 0)
  - list of new warnings (must be empty)
- If delta > 0, the validation **fails** and work is blocked until resolved.

## Plan Freshness Rule (prevents stale docs drift)
- Every implementation prompt must:
  - Read `PHASE_GATE.md`, `feature_parity_checklist.md`, `NOW.md`, `LATER.md` before starting
  - Update them as part of completion criteria
- If any of those files are missing or older than the current phase's work, stop and update them first.
- Stale planning docs are a blocking condition.

## Schema Optimization Policy (prevents semantic drift)
- Default to **1:1 schema translation** from D1 to Postgres.
- Any optimization requires an entry in `docs/backend/migration/schema_exceptions.md`:
  - table name
  - what changes
  - why safe (rationale)
  - how parity is proven (tests/queries)
- Optimizations without schema_exceptions.md entries are not allowed.

## Local Dev Auth Bypass Guardrails
- Dev bypass (if any) must follow `docs/backend/migration/local_dev_auth_bypass.md`.
- Bypass is allowed **only** when:
  - `NODE_ENV=development` AND
  - host is `localhost` or `127.0.0.1`
- Must **hard-fail** in non-local environments even if bypass env flag is set.
- Require a backend integration test that asserts:
  - bypass is rejected when `ENV=production` (or equivalent)
  - bypass is rejected when host is not localhost
- No "temporary" exceptions without explicit owner approval in exceptions.md.

---

## Architecture Quick Reference

### Stack
- **Backend:** Rust (Axum + Tower) at `app/backend/crates/api/`
- **Frontend:** Next.js at `app/frontend/`
- **Admin:** Separate Next.js app at `app/admin/`
- **Database:** PostgreSQL, migrations at `app/database/migrations/`
- **Storage:** R2 via backend only

### SQLx Pattern (CRITICAL - no compile-time macros)
Always use runtime query binding, NOT compile-time macros:
```rust
// ✅ CORRECT - runtime binding
sqlx::query_as::<_, MyType>("SELECT * FROM table WHERE id = $1")
    .bind(id)
    .fetch_one(pool)
    .await

// ❌ WRONG - compile-time macro (no DATABASE_URL at build)
sqlx::query_as!(MyType, "SELECT * FROM table WHERE id = $1", id)
```

### Frontend API Client Pattern
All API clients in `app/frontend/src/lib/api/` follow this structure:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',  // Required for cookie auth
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}
```

### Backend Route Pattern
Routes in `app/backend/crates/api/src/routes/`:
- Models in `db/<feature>_models.rs`
- Repos in `db/<feature>_repos.rs`
- Handlers in `routes/<feature>.rs`
- Wire in `routes/api.rs` via `.nest("/feature", feature::router())`

### Test Pattern (Playwright)
E2E tests in `tests/*.spec.ts`:
```typescript
test("API returns valid response", async ({ request }) => {
  const response = await request.get("/api/endpoint");
  expect([200, 401]).toContain(response.status()); // 401 = not authed
});
```

