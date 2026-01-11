# COPILOT_INSTRUCTIONS (Agent Operating System)

You are a repo agent operating inside this repository.

## Absolute rules
- Assume repo root is the current working directory.
- Work only on the user-specified branch (or create it if permitted).
- **No deletions.** If you must replace code/content, move the old version to:
  `deprecated/<original-relative-path>` (mirror directory structure).
- Do not assume facts. If something is unknown, record it in `agent/UNKNOWN.md` with an ID `UNKNOWN-###` and cite evidence.
- No production code changes during discovery/phase-gate steps.

## Debugging rules (REQUIRED)
Before making ANY code changes:
1. Document all planned changes in `DEBUGGING.md` with clear categories
2. List complete change set in chat message to user
3. Run lint tests on all modified files BEFORE editing
4. Update `DEBUGGING.md` with lint test results
5. Wait for explicit user approval before executing changes
6. Do NOT commit unless user explicitly approves with "commit" or "push"
7. When committing, include detailed changelog in commit message

## Terminal rules (if commands are used)
- Treat terminal output as inaccessible.
- Redirect all command output to log files under `.tmp/`:
  - Example: `cmd ... > .tmp/name.log 2>&1`
- Read logs via the file viewer only.
- Never use `cat`, `tail`, `head`, `less`, `more`, or `type`.

## Validation rules
- Zero errors.
- Warnings must not increase vs baseline.
- Any newly created or materially edited file must be warning-free.
- Required validations at checkpoints:
  - typecheck
  - lint
  - unit tests
  - e2e tests if UI was touched
  - builds if shipping artifacts

## State tracking mandate (REQUIRED)
Maintain all state under:

```
agent/
  CURRENT_STATE.md
  PROGRESS.md
  PHASE_GATE.md
  DECISIONS_REQUIRED.md
  DECISIONS.md
  DECISIONS_REGISTER.md
  UNKNOWN.md
  gaps.md
  DRIFT_REPORT.md
  validation_*.md
```

Rules:
- Unknown facts only in `agent/UNKNOWN.md` (IDs: `UNKNOWN-###`).
- Action items only in `agent/gaps.md` (IDs: `ACTION-###`).
- Decisions only in `agent/DECISIONS.md` + `agent/DECISIONS_REGISTER.md` (IDs: `DEC-###`).
- Gating only in `agent/PHASE_GATE.md`.
- No duplicate trackers elsewhere; link back to these files.

## Phase gate discipline
- Every major phase has a gate in `agent/PHASE_GATE.md`.
- Gate is **Ready** only with evidence: file paths + validation logs + test IDs.
- Otherwise **Blocked** with exact blocking IDs (UNKNOWN/ACTION/DEC/TEST).

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

### Deployment Rules (MANDATORY)
- **Frontend**: ALWAYS deploys via GitHub Actions → Cloudflare Workers. NEVER manually deploy frontend.
- **Backend**: Deploy via `flyctl deploy` from `app/backend/` directory.
- **Admin**: Deploys via GitHub Actions → Cloudflare Workers.
- Push changes to `main` branch to trigger frontend/admin deploys automatically.

