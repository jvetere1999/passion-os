# Testing & Validation Infrastructure

**Status**: Ready for use  
**Created**: January 12, 2026  
**Last Updated**: January 12, 2026

This document describes the comprehensive testing and validation infrastructure added to ensure code quality, API compliance, and production readiness.

---

## Quick Start

### Run All Tests
```bash
./scripts/run-tests.sh
```

### Validate Project
```bash
./scripts/validate-all.sh
```

### Validate API Compliance
```bash
./scripts/validate-api.sh
```

---

## Infrastructure Overview

### Testing Stack

```
┌─────────────────────────────────────┐
│  Playwright Test Framework          │
├─────────────────────────────────────┤
│  ├─ API Tests (api-*.spec.ts)       │
│  ├─ Response Format Tests           │
│  ├─ E2E Tests (api-e2e.spec.ts)    │
│  └─ Integration Tests               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Docker Compose Test Environment    │
├─────────────────────────────────────┤
│  ├─ PostgreSQL 17                   │
│  ├─ MinIO (S3-compatible)           │
│  └─ Backend API (AUTH_DEV_BYPASS)   │
└─────────────────────────────────────┘
```

---

## Scripts Guide

### 1. `./scripts/run-tests.sh`

Runs comprehensive test suites with proper environment setup.

**Usage**:
```bash
./scripts/run-tests.sh                 # Run all tests
./scripts/run-tests.sh --api           # API tests only
./scripts/run-tests.sh --e2e           # E2E tests only
./scripts/run-tests.sh --format        # Response format tests only
./scripts/run-tests.sh --cleanup       # Clean up after tests
./scripts/run-tests.sh --verbose       # Verbose output
```

**What It Does**:
1. Starts Docker Compose services (PostgreSQL, MinIO, API)
2. Waits for services to be healthy
3. Runs requested test suite(s)
4. Optionally cleans up Docker resources
5. Generates test report

**Output**:
```
Response Format Regression Tests
✓ Quests API returns correct format
✓ Goals API returns correct format
✓ Habits API returns correct format
...

========================================================================
Test Summary
========================================================================
✓ Response format tests passed
✓ API tests passed
✓ E2E tests passed

All tests passed!
```

**Environment**:
- `API_BASE_URL` - Backend URL (default: http://localhost:8080)
- `DEBUG` - Set to 'true' for verbose output

---

### 2. `./scripts/validate-api.sh`

Validates that API endpoints conform to required standards.

**Usage**:
```bash
./scripts/validate-api.sh              # Full validation
./scripts/validate-api.sh --format     # Response format only
./scripts/validate-api.sh --types      # Type definitions only
./scripts/validate-api.sh --lint       # Frontend/Backend lint
```

**What It Validates**:
1. Backend response format uses resource-specific keys (not generic 'data')
2. Frontend API clients extract correct response fields
3. TypeScript type definitions match backend contracts
4. Playwright test coverage for API responses
5. Frontend linting (ESLint)
6. Backend type checking (cargo check)

**Output**:
```
Phase 1: Backend Response Format Validation
✓ Backend response format validated (8 files checked)

Phase 2: Frontend API Client Validation
✓ Correct extraction in quests.ts: response.quests
✓ Correct extraction in goals.ts: response.goals
✓ All frontend API clients validated

Phase 3: TypeScript Type Definitions
✓ Type definition found: Quest
✓ Type definition found: Goal
✓ All type definitions validated

========================================================================
Validation Summary
========================================================================
ℹ Total checks: 12
✓ 12 passed
✓ 0 failed

Pass rate: 100%

✅ PROJECT VALIDATION PASSED
```

---

### 3. `./scripts/validate-all.sh`

Comprehensive project validation including all checks.

**Usage**:
```bash
./scripts/validate-all.sh              # Full validation
./scripts/validate-all.sh --fix        # Auto-fix issues
./scripts/validate-all.sh --quick      # Skip time-consuming checks
```

**What It Validates**:
1. Backend Rust formatting (cargo fmt)
2. Backend linting (cargo clippy)
3. Backend type checking (cargo check)
4. Frontend linting (ESLint)
5. Frontend type checking (TypeScript)
6. Frontend build (Next.js production build)
7. API response format compliance
8. Test suite availability
9. npm vulnerability audit
10. Key files existence

**Output**:
```
========================================================================
1. BACKEND VALIDATION (Rust/Cargo)
========================================================================
✓ Cargo.toml exists
✓ Code formatting valid
✓ Clippy checks passed
✓ Type checking passed (0 errors)

========================================================================
2. FRONTEND VALIDATION (TypeScript/React)
========================================================================
✓ package.json exists
✓ Dependencies installed (node_modules found)
✓ ESLint: 0 errors
✓ TypeScript: 0 errors
✓ Production build successful

...

========================================================================
VALIDATION SUMMARY
========================================================================
ℹ Total checks: 18
✓ 18 passed
✓ 0 failed

Pass rate: 100%

✅ PROJECT VALIDATION PASSED

Next steps:
1. Run comprehensive tests: ./scripts/run-tests.sh
2. Review changes: git diff
3. Push to production: git push origin production
```

---

## Test Suites

### 1. Response Format Regression Tests (`tests/api-response-format.spec.ts`)

**Purpose**: Validates that API endpoints return data in the correct format (Decision A implementation).

**What It Tests**:
- Quests API returns `{ quests: [...], total: number }`
- Goals API returns `{ goals: [...], total: number }`
- Habits API returns `{ habits: [...], total: number }`
- Focus API returns `{ sessions: [...] }` or `{ stats: {...} }`
- Exercise API returns `{ workouts: [...] }`
- Books API returns `{ books: [...], total: number }`
- Learning API returns `{ items: [...] }` or `{ lessons: [...] }`
- Ideas API returns `{ ideas: [...] }`
- Settings API returns `{ settings: {...} }` or `{ user: {...} }`
- Error responses include proper error details

**Key Assertions**:
```typescript
// Critical: Must have resource-specific key, NOT 'data'
expect(data).toHaveProperty('quests');
expect(data).not.toHaveProperty('data');
```

**Run Alone**:
```bash
npx playwright test tests/api-response-format.spec.ts
```

**Number of Tests**: 25+ test cases

---

### 2. API Endpoint Tests (`tests/api-*.spec.ts`)

**Purpose**: Comprehensive testing of all API endpoints.

**Coverage**:
- API authentication and authorization
- CRUD operations for all resources
- Error handling (401, 403, 404, 400, 500)
- Data validation
- Cross-endpoint consistency

**Run Alone**:
```bash
npx playwright test --config=playwright.api.config.ts
```

---

### 3. E2E Tests (`tests/api-e2e.spec.ts`)

**Purpose**: End-to-end testing of complete user workflows.

**Coverage**:
- User authentication flow
- Creating and managing quests
- Tracking goals and habits
- Focus session management
- Workout tracking
- Reading progress tracking

**Run Alone**:
```bash
npx playwright test tests/api-e2e.spec.ts
```

---

## Docker Compose Environments

### Development Environment (`infra/docker-compose.yml`)

**Services**:
- PostgreSQL 17 (port 5432)
- MinIO S3-compatible storage (port 9000)
- Optional: Backend API, Frontend, Admin

**Usage**:
```bash
# Start all services
docker compose -f infra/docker-compose.yml up -d

# Start only database
docker compose -f infra/docker-compose.yml up -d postgres

# View logs
docker compose -f infra/docker-compose.yml logs -f

# Stop services
docker compose -f infra/docker-compose.yml down
```

### E2E Testing Environment (`infra/docker-compose.e2e.yml`)

**Special Features**:
- Ephemeral storage (cleanup after tests)
- AUTH_DEV_BYPASS enabled (for testing without OAuth)
- Optimized for test performance
- Separate ports to avoid conflicts

**Usage**:
```bash
# Used automatically by ./scripts/run-tests.sh
# Or manually:
docker compose -f infra/docker-compose.e2e.yml up -d
```

---

## API Testing Examples

### Manual API Testing with curl

```bash
# Start test environment
./scripts/run-tests.sh &

# Wait for startup...
sleep 10

# Test with dev bypass headers
curl -X GET http://localhost:8080/api/quests \
  -H "X-Dev-User-ID: dev_user_local" \
  -H "X-Dev-User-Email: dev@local.test" \
  -H "X-Dev-User-Name: Local Dev User" \
  -H "Content-Type: application/json"

# Expected response:
# { "quests": [...], "total": 0 }

# NOT:
# { "data": [...] }  # Wrong!
```

### Playwright Test Example

```typescript
test('GET /api/quests returns { quests: [...] }', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/api/quests`, {
    headers: {
      'X-Dev-User-ID': DEV_USER.id,
      'X-Dev-User-Email': DEV_USER.email,
      'X-Dev-User-Name': DEV_USER.name,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();

  // CRITICAL: Must have 'quests' key
  expect(data).toHaveProperty('quests');
  expect(data).not.toHaveProperty('data');
});
```

---

## Continuous Integration

### GitHub Actions Workflow

Tests are automatically run on:
- Every push to production/main
- Every pull request
- Nightly (comprehensive validation)

**Workflow File**: `.github/workflows/test.yml`

**What Runs**:
1. Backend validation (cargo check, clippy)
2. Frontend validation (ESLint, TypeScript)
3. API response format tests
4. Full E2E test suite
5. Deployment validation

---

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if ports are in use
lsof -i :5432   # PostgreSQL
lsof -i :9000   # MinIO
lsof -i :8080   # API

# Stop and remove old containers
docker compose -f infra/docker-compose.yml down -v
docker system prune -f

# Restart
./scripts/run-tests.sh
```

### Tests Timeout

```bash
# Services not ready yet
# Increase wait time in run-tests.sh (line ~120)
wait_for_service "api" 180  # Increased from 120

# Or check logs
docker compose -f infra/docker-compose.yml logs api
```

### Test Database Issues

```bash
# Reset database
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d postgres

# Or manually
PGPASSWORD=ignition_dev psql -h localhost -U ignition -d ignition -f app/database/reset.sql
```

### Response Format Test Failures

**Problem**: Tests expect `{ quests: [...] }` but getting `{ data: [...] }`

**Solution**:
1. Check backend returns correct format
2. Verify frontend extracts correctly
3. Run validation script: `./scripts/validate-api.sh --format`

---

## Best Practices

### Adding New Tests

1. **Identify test type**:
   - API contract test → `tests/api-*.spec.ts`
   - E2E workflow → `tests/api-e2e.spec.ts`
   - Integration → `tests/integration/*.spec.ts`

2. **Use dev bypass headers**:
   ```typescript
   const headers = {
     'X-Dev-User-ID': 'dev_user_local',
     'X-Dev-User-Email': 'dev@local.test',
     'X-Dev-User-Name': 'Local Dev User',
   };
   ```

3. **Test response format**:
   ```typescript
   // Always verify correct response key
   expect(data).toHaveProperty('quests');  // ✓ Good
   expect(data).toHaveProperty('data');    // ✗ Bad
   ```

4. **Include error cases**:
   ```typescript
   test('401 Unauthorized includes error details', async ({ request }) => {
     const response = await request.get(`${API_BASE_URL}/api/quests`);
     expect(response.status()).toBe(401);
     const data = await response.json();
     expect(data.error || data.message).toBeTruthy();
   });
   ```

### Before Deploying

```bash
# 1. Run full validation
./scripts/validate-all.sh

# 2. Run all tests
./scripts/run-tests.sh

# 3. Review changes
git diff
git log -p

# 4. Push when ready
git push origin production
```

---

## Performance Notes

| Script | Time | Purpose |
|--------|------|---------|
| `run-tests.sh` | 2-5 min | Quick validation, single worker |
| `validate-api.sh` | 30 sec | Static code analysis |
| `validate-all.sh` | 3-8 min | Comprehensive validation + build |

**Optimization Tips**:
- Use `--quick` flag to skip slow checks
- Run `--api` only during rapid iteration
- Run full validation before pushing

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/run-tests.sh` | Main test runner |
| `scripts/validate-api.sh` | API compliance validation |
| `scripts/validate-all.sh` | Full project validation |
| `tests/api-response-format.spec.ts` | Response format tests (NEW) |
| `tests/api-*.spec.ts` | API endpoint tests |
| `tests/api-e2e.spec.ts` | E2E workflow tests |
| `playwright.api.config.ts` | Playwright API test config |
| `infra/docker-compose.yml` | Dev environment |
| `infra/docker-compose.e2e.yml` | E2E test environment |

---

## Questions?

For more details:
- **Testing strategy**: See `docs/CLEANUP_STRATEGY.md`
- **API contracts**: See `docs/API_SPECIFICATION.md` (to be created)
- **Deployment**: See `docs/DEPLOYMENT.md`
- **Development**: See `docs/DEVELOPMENT.md`
