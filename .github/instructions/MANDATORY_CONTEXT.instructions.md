# Project Mandatory Context - Git & Deployment Workflow

**Status:** ACTIVE | **Decision ID:** DEC-001 | **Date:** January 11, 2026

---

## 🚨 MANDATORY - Non-Negotiable Requirement

All future development **MUST** follow this exact workflow:

```
dev → test → production → main
```

---

## Branch Structure

### 1. `dev` (Active Development)
- **Purpose:** Primary development branch
- **Merge from:** Feature branches (if team) or direct commits (solo)
- **Merge to:** `test` when ready for validation
- **CI/CD:** Linting on push (optional pre-commit)

### 2. `test` (Validation Gate)
- **Purpose:** Run full test suite before production
- **Merge from:** `dev` only
- **Merge to:** `production` only after ✅ all tests pass
- **CI/CD:** Full GitHub Actions test suite (unit, E2E, lint, type-check)

### 3. `production` (Live Deployment)
- **Purpose:** Trigger live production deployments
- **Merge from:** `test` only (after validation)
- **Merge to:** Auto-merges to `main` on successful deployment
- **CI/CD:** Selective deployment:
  - Backend → Fly.io (if `app/backend/**` changed)
  - Database → Neon (if `app/database/**` changed)
  - Frontend → Cloudflare Workers (if `app/frontend/**` changed)
  - Admin → Cloudflare Workers (if `app/admin/**` changed)

### 4. `main` (Status Mirror - READ-ONLY)
- **Purpose:** Always reflects last successful production state
- **Merge from:** Auto-merged from `production` on deployment success
- **Merge to:** Never (read-only for deployment status)
- **CI/CD:** No deployments; status tracking only
- **Direct Commits:** ❌ FORBIDDEN

---

## Workflow Steps

### Step 0: Schema Changes MUST Regenerate Migrations (Critical)

**IF YOU MODIFY `schema.json`:**

```bash
# After editing schema.json, IMMEDIATELY regenerate migrations
cd /Users/Shared/passion-os-next
./generate_schema.sh

# This regenerates:
# ✅ app/backend/migrations/0001_schema.sql (database schema)
# ✅ app/frontend/src/lib/generated_types.ts (TypeScript types)
# ✅ app/backend/crates/api/src/db/generated.rs (Rust models)
# ✅ app/backend/migrations/0002_seeds.sql (seed data)

# Stage the regenerated files
git add app/backend/migrations/ app/frontend/src/lib/generated_types.ts app/backend/crates/api/src/db/generated.rs

# Verify no errors in regenerated code
cargo check --bin ignition-api    # Backend must compile
npm run lint                        # Frontend must lint cleanly
```

**⚠️ CRITICAL FAILURE SCENARIO:**
- You edit `schema.json` but DON'T run `generate_schema.sh`
- Changes deploy to `production`
- Database migration has OLD schema, code expects NEW schema
- Result: `column "X" does not exist` errors in production
- Solution: Must rollback `production` branch and regenerate

---

### Step 1: Make Changes on `dev`
```bash
git checkout dev
git pull origin dev
# Make your changes
git add .
git commit -m "feat: descriptive message"
git push origin dev
```

### Step 2: Merge to `test` for Validation
```bash
git checkout test
git pull origin test
git merge --no-ff dev  # Preserve history
git push origin test
# ⏳ Wait for GitHub Actions tests to complete
```

### Step 3: Merge to `production` for Deployment
```bash
# After all tests pass ✅
git checkout production
git pull origin production
git merge --no-ff test  # Preserve history
git push origin production
# ⏳ Wait for production deployment
# 🎯 Selective jobs run based on changed paths
```

### Step 4: Main Auto-Updates (Automatic)
```bash
# GitHub Actions automatically:
# 1. Waits for deployment to complete successfully
# 2. Checks out main
# 3. Resets to production
# 4. Pushes to main
# ✅ No manual action needed
```

---

## Path-Based Selective Deployment

The `production` workflow intelligently skips jobs when paths don't change:

```yaml
Pre-deployment checks
├─ Triggers on: app/backend/**, app/database/**, tools/schema-generator/**
└─ Skips if: Only frontend/admin changes

Neon Database Migration
├─ Triggers on: app/database/**, app/backend/migrations/**, tools/schema-generator/**
└─ Skips if: Only frontend/admin changes

Backend Deployment (Fly.io)
├─ Triggers on: app/backend/**, app/database/**, tools/schema-generator/**
└─ Skips if: Only frontend/admin changes

Frontend Deployment (Cloudflare)
├─ Triggers on: app/frontend/**
└─ Skips if: Backend/admin-only changes

Admin Deployment (Cloudflare)
├─ Triggers on: app/admin/**
└─ Skips if: Backend/frontend-only changes
```

**Example:** If you only change frontend code, the workflow runs in seconds:
- ✅ Deploy Frontend
- ⏭️ Skip Pre-deployment checks
- ⏭️ Skip Neon migration
- ⏭️ Skip Backend deployment
- ⏭️ Skip Admin deployment

---

## Critical Rules (Enforced)

| Rule | Violation | Consequence |
|------|-----------|------------|
| Never commit directly to `production` | ❌ Force push attempt | Reject (branch protection) |
| Never commit directly to `main` | ❌ Direct commit | Reject (branch protection) |
| Never force push | ❌ `git push --force` | Manual review required |
| Always wait for tests in `test` | ⏭️ Skip to `production` | Unvalidated code in production |
| Always use merge (not rebase) | ⏭️ Rebase to `production` | History lost, rollback broken |
| **ALWAYS regenerate schema after editing `schema.json`** | ❌ Commit `schema.json` without running `generate_schema.sh` | Production deploy fails with "column does not exist" errors |
| **Verify regenerated code compiles** | ❌ Run `generate_schema.sh` but skip `cargo check` | Compilation errors block production deployment |
| **Never edit migrations directly** | ❌ Hand-edit `app/backend/migrations/*.sql` | Migrations out of sync with schema.json; regeneration overwrites changes |

---

## Team Workflow (If Multiple Developers)

```
Your Feature
  ↓
git checkout -b feature/my-feature dev
git push origin feature/my-feature
  ↓
Create Pull Request (feature/my-feature → dev)
  ↓
Code Review
  ↓
Merge to dev
  ↓
git checkout dev
git pull origin dev
  ↓
Continue with Step 2 (merge dev → test)
```

---

## Emergency Rollback

If production breaks:

```bash
# Option 1: Revert the specific commit
git checkout production
git revert <commit-hash>
git push origin production
# → Triggers new deployment that undoes the change

# Option 2: Revert entire last merge
git checkout production
git revert -m 1 <merge-commit-hash>
git push origin production
# → Triggers deployment with previous state
```

**DO NOT:**
- ❌ Force push to undo
- ❌ Commit directly to fix
- ❌ Bypass `test` branch validation

---

## Commands Quick Reference

```bash
# Check current branch
git branch -v

# Switch and update
git checkout <branch> && git pull origin <branch>

# Make a commit
git add . && git commit -m "message" && git push origin <branch>

# Merge without fast-forward (preserves history)
git merge --no-ff <source-branch>

# View commits being merged
git log --oneline <current>..<source>

# View branch graph
git log --oneline --all --graph

# List all branches (local and remote)
git branch -a

# Delete a local branch
git branch -d <branch>

# Delete a remote branch
git push origin --delete <branch>
```

---

## Status & Monitoring

### Check Deployment Status
1. Push to `production`
2. Navigate to: https://github.com/jvetere1999/ignition/actions
3. Find workflow: "Deploy to Production"
4. View job logs for details

### Check Which Jobs Ran
- Click the workflow run
- See green/gray checkmarks
  - ✅ Green = Ran and passed
  - ⏭️ Gray = Skipped (no relevant changes)

### Monitor Main Branch Status
- `main` branch is **read-only** (mirrors `production`)
- Always check `main` equals latest `production` state
- If diverged: Production deployment failed

---

## Schema Management Workflow (CRITICAL)

### When to Regenerate

Regenerate schema **IMMEDIATELY** after ANY edit to `schema.json`:

```
Edit schema.json
   ↓
Run: ./generate_schema.sh
   ↓
Verify: cargo check + npm lint
   ↓
Stage & commit regenerated files
   ↓
Follow normal dev → test → production workflow
```

### What Gets Regenerated

The `generate_schema.sh` script (at repo root) updates:

| File | Source | Purpose | Must Commit |
|------|--------|---------|-------------|
| `app/backend/migrations/0001_schema.sql` | `schema.json` | PostgreSQL DDL for all tables | ✅ YES |
| `app/backend/migrations/0002_seeds.sql` | `schema.json` | Default seed data for enums/lookups | ✅ YES |
| `app/frontend/src/lib/generated_types.ts` | `schema.json` | TypeScript interfaces for API responses | ✅ YES |
| `app/backend/crates/api/src/db/generated.rs` | `schema.json` | Rust models for database rows | ✅ YES |

### Validation After Regeneration

```bash
# Step 1: Backend must compile
cd app/backend
cargo check --bin ignition-api
# Expected: "Finished `dev` profile..."
# If errors: Fix schema.json, rerun generate_schema.sh

# Step 2: Frontend must lint
cd ../frontend
npm run lint
# Expected: "0 errors found"
# If errors: Check generated_types.ts for type issues

# Step 3: Check git diff
git diff app/backend/migrations/0001_schema.sql
# Verify changes match your schema.json edits
# Look for: CREATE TABLE, ALTER TABLE, ADD COLUMN, DROP COLUMN
```

### If Schema Regeneration Fails

```bash
# Clear any partial regeneration
git checkout app/backend/migrations/ app/frontend/src/lib/generated_types.ts app/backend/crates/api/src/db/generated.rs

# Check schema.json for syntax errors
cat schema.json | python3 -m json.tool > /dev/null
# If error: Fix JSON syntax

# Re-run generation with verbose output
cd /Users/Shared/passion-os-next
python3 tools/schema-generator/generate_all.py --verbose
```

### Deployment Implication

When schema changes deploy to `production`:

```
Push to production branch
   ↓
GitHub Actions downloads deployment branch
   ↓
Checks for changes in: app/backend/migrations/**
   ↓
IF CHANGED: Triggers Neon database migration
   ├─ Pulls ALL migrations from repo
   ├─ Applies only NEW migrations (not already run)
   ├─ IF ERROR: Deployment stops, main is NOT updated
   └─ Database now has the new schema
   ↓
IF NOT CHANGED: Skips Neon step
   ├─ Uses existing database schema
   └─ If code expects new columns: "column does not exist" errors
   ↓
Backend deployment proceeds (or rolls back if DB migration failed)
```

---

## Next Steps

- [ ] Ensure branch protection rules are set:
  - `production` and `main` require PRs
  - `main` requires status checks
  - Restrict force pushes on all branches
- [ ] Configure GitHub Actions to:
  - Auto-merge `production` → `main` on success
  - Block pushes if tests fail in `test`
- [ ] Team training on this workflow
- [ ] Document rollback procedures
- [ ] Set up Slack notifications for deployments

---

## Questions?

Refer to [.github/GIT_WORKFLOW.md](/.github/GIT_WORKFLOW.md) for detailed examples and troubleshooting.
