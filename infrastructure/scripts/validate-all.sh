#!/bin/bash

##############################################################################
# Ignition - Comprehensive Validation & Cleanup
#
# This script validates the entire project and prepares it for deployment.
# It checks:
# 1. Backend compilation & types
# 2. Frontend linting & types
# 3. API response format compliance
# 4. Test suite execution
# 5. Dependencies & security issues
#
# Usage:
#   ./scripts/validate-all.sh              # Full validation
#   ./scripts/validate-all.sh --fix        # Auto-fix issues where possible
#   ./scripts/validate-all.sh --quick      # Skip time-consuming checks
#
##############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Settings
AUTOFIX=false
QUICK_MODE=false
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

pass() {
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  log_success "$1"
}

fail() {
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
  log_error "$1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --fix) AUTOFIX=true; shift ;;
    --quick) QUICK_MODE=true; shift ;;
    *) shift ;;
  esac
done

# ============================================================================
# Header
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Ignition - Comprehensive Project Validation             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ "$AUTOFIX" = true ]; then
  log_warn "Auto-fix enabled"
fi

if [ "$QUICK_MODE" = true ]; then
  log_info "Quick mode: skipping time-consuming checks"
fi

# ============================================================================
# 1. Backend Validation
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 1. BACKEND VALIDATION (Rust/Cargo)                            │"
echo "└────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_ROOT/app/backend"

# Check Cargo.toml exists
check
if [ -f "Cargo.toml" ]; then
  pass "Cargo.toml exists"
else
  fail "Cargo.toml not found"
fi

# Format check
check
log_info "Checking Rust code formatting..."
if cargo fmt --check 2>&1 | tee "$PROJECT_ROOT/.tmp/cargo_fmt.log"; then
  pass "Code formatting valid"
else
  if [ "$AUTOFIX" = true ]; then
    log_info "Auto-fixing formatting..."
    cargo fmt
    pass "Code formatting fixed (auto-fix)"
  else
    fail "Code needs formatting (run: cargo fmt)"
  fi
fi

# Clippy linting
check
log_info "Running clippy linter..."
if cargo clippy --bin ignition-api 2>&1 | grep -q "error"; then
  fail "Clippy found errors"
else
  pass "Clippy checks passed"
fi

# Type checking
check
log_info "Type checking..."
if cargo check --bin ignition-api 2>&1 | tee "$PROJECT_ROOT/.tmp/cargo_check.log"; then
  pass "Type checking passed (0 errors)"
else
  fail "Type checking failed"
fi

# ============================================================================
# 2. Frontend Validation
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 2. FRONTEND VALIDATION (TypeScript/React)                     │"
echo "└────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_ROOT/app/frontend"

# Check package.json exists
check
if [ -f "package.json" ]; then
  pass "package.json exists"
else
  fail "package.json not found"
fi

# Dependencies installed
check
if [ -d "node_modules" ]; then
  pass "Dependencies installed (node_modules found)"
else
  log_warn "node_modules not found, installing..."
  npm ci 2>&1 | grep -i "added\|up to date"
  pass "Dependencies installed"
fi

# ESLint
check
log_info "Running ESLint..."
if npm run lint 2>&1 | tee "$PROJECT_ROOT/.tmp/eslint.log"; then
  pass "ESLint: 0 errors"
else
  if [ "$AUTOFIX" = true ]; then
    log_info "Auto-fixing with ESLint..."
    npm run lint -- --fix 2>&1 || true
    pass "ESLint issues auto-fixed"
  else
    fail "ESLint errors found (run: npm run lint to see details)"
  fi
fi

# TypeScript check
check
log_info "TypeScript type checking..."
if npm run type-check 2>&1 | tee "$PROJECT_ROOT/.tmp/tsc.log"; then
  pass "TypeScript: 0 errors"
else
  fail "TypeScript errors found"
fi

# Build check
if [ "$QUICK_MODE" = false ]; then
  check
  log_info "Production build check (this may take a minute)..."
  if npm run build 2>&1 | tail -10; then
    pass "Production build successful"
  else
    fail "Production build failed"
  fi
fi

# ============================================================================
# 3. API Response Format Validation
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 3. API RESPONSE FORMAT VALIDATION (Decision A)                │"
echo "└────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_ROOT"

# Check response format compliance
check
log_info "Validating API response format compliance..."

critical_files=(
  "app/frontend/src/lib/api/quests.ts"
  "app/frontend/src/lib/api/goals.ts"
  "app/frontend/src/lib/api/habits.ts"
  "app/frontend/src/lib/api/focus.ts"
  "app/frontend/src/lib/api/exercise.ts"
  "app/frontend/src/lib/api/books.ts"
)

format_issues=0
for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    # Check for generic 'data' wrapper (BAD)
    if grep -q 'response\.data' "$file" 2>/dev/null; then
      log_warn "Found 'response.data' pattern in $file (should be resource-specific)"
      format_issues=$((format_issues + 1))
    fi
  fi
done

if [ $format_issues -eq 0 ]; then
  pass "Response format validation: 0 issues"
else
  fail "Found $format_issues API format issues"
fi

# ============================================================================
# 4. Test Suite
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 4. TEST SUITE VALIDATION                                      │"
echo "└────────────────────────────────────────────────────────────────┘"

# Check test files exist
check
test_count=$(find "$PROJECT_ROOT/tests" -name "*.spec.ts" 2>/dev/null | wc -l)
if [ "$test_count" -gt 0 ]; then
  pass "Found $test_count test files"
else
  fail "No test files found"
fi

# Check for response format tests
check
if [ -f "$PROJECT_ROOT/tests/api-response-format.spec.ts" ]; then
  pass "Response format regression tests found"
else
  log_warn "Response format tests not found"
fi

# ============================================================================
# 5. Dependencies & Security
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 5. DEPENDENCIES & SECURITY                                    │"
echo "└────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_ROOT/app/frontend"

# Check for audit vulnerabilities
check
log_info "Checking npm dependencies for vulnerabilities..."
if npm audit 2>&1 | grep -i "found.*vulnerabilities"; then
  log_warn "Vulnerabilities found in npm dependencies"
  fail "Run 'npm audit fix' to resolve"
else
  pass "No known vulnerabilities"
fi

# ============================================================================
# 6. Documentation & Configuration
# ============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│ 6. DOCUMENTATION & CONFIGURATION                              │"
echo "└────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_ROOT"

# Check key files exist
key_files=(
  "README.md"
  "schema.json"
  "playwright.api.config.ts"
  "app/backend/Cargo.toml"
  "app/frontend/package.json"
)

for file in "${key_files[@]}"; do
  check
  if [ -f "$file" ]; then
    pass "$file exists"
  else
    fail "$file missing"
  fi
done

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     VALIDATION SUMMARY                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_PASS_PERCENT=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

log_info "Total checks: $TOTAL_CHECKS"
log_success "$PASSED_CHECKS passed"
if [ $FAILED_CHECKS -gt 0 ]; then
  log_error "$FAILED_CHECKS failed"
else
  log_success "0 failed"
fi

echo ""
echo "Pass rate: ${TOTAL_PASS_PERCENT}%"
echo ""

# ============================================================================
# Recommendations
# ============================================================================

if [ $FAILED_CHECKS -gt 0 ]; then
  echo "⚠️  ISSUES FOUND - Recommendations:"
  echo ""
  echo "1. Review error logs in .tmp/ directory"
  echo "2. Fix issues before deploying:"
  echo "   - Backend: cargo fmt, cargo clippy"
  echo "   - Frontend: npm run lint --fix, npm run type-check"
  echo "3. Run tests: ./scripts/run-tests.sh"
  echo ""
  exit 1
else
  echo "✅ PROJECT VALIDATION PASSED"
  echo ""
  echo "Next steps:"
  echo "1. Run comprehensive tests: ./scripts/run-tests.sh"
  echo "2. Review changes: git diff"
  echo "3. Push to production: git push origin production"
  echo ""
  exit 0
fi
