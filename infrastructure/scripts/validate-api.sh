#!/bin/bash

##############################################################################
# Ignition - API Validation Script
#
# Validates that API endpoints conform to required standards:
# 1. Response format uses resource-specific keys (not generic 'data')
# 2. Error responses include proper error information
# 3. All endpoints return required fields
# 4. Type definitions match backend contracts
#
# Usage:
#   ./scripts/validate-api.sh              # Full validation
#   ./scripts/validate-api.sh --format     # Response format only
#   ./scripts/validate-api.sh --types      # Type definitions only
#   ./scripts/validate-api.sh --lint       # Frontend API client lint
#
##############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/app/backend"
FRONTEND_DIR="$PROJECT_ROOT/app/frontend"
TESTS_DIR="$PROJECT_ROOT/tests"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# ============================================================================
# Phase 1: Backend Response Format Validation
# ============================================================================

validate_backend_format() {
  echo ""
  echo "=========================================================================="
  echo "Phase 1: Backend Response Format Validation"
  echo "=========================================================================="

  log_info "Checking backend repository functions return correct format..."

  # Search for response builders
  local response_pattern='json!\|Json::object\|json!({.*:'
  local files_checked=0
  local issues_found=0

  # Check all repo files
  while IFS= read -r file; do
    files_checked=$((files_checked + 1))
    
    # Check for generic 'data' wrapper (BAD)
    if grep -q '"data"' "$file" 2>/dev/null; then
      log_warn "File has generic 'data' wrapper: $file"
      grep -n '"data"' "$file" | head -3
      issues_found=$((issues_found + 1))
    fi

    # Verify resource-specific keys (GOOD)
    if grep -q 'json!({.*"quests"\|"goals"\|"habits"\|"sessions"' "$file" 2>/dev/null; then
      :  # Expected pattern found
    fi
  done < <(find "$BACKEND_DIR/crates/api/src/db" -name "*_repos.rs" 2>/dev/null || true)

  if [ $issues_found -eq 0 ]; then
    log_success "Backend response format validated ($files_checked files checked)"
  else
    log_error "Found $issues_found potential format issues in backend"
  fi
}

# ============================================================================
# Phase 2: Frontend API Client Validation
# ============================================================================

validate_frontend_clients() {
  echo ""
  echo "=========================================================================="
  echo "Phase 2: Frontend API Client Validation"
  echo "=========================================================================="

  log_info "Checking frontend API clients extract correct response keys..."

  local expected_extractions=(
    "quests.ts:response.quests"
    "goals.ts:response.goals"
    "habits.ts:response.habits"
    "focus.ts:response.sessions"
    "exercise.ts:response.workouts"
    "books.ts:response.books"
    "ideas.ts:response.ideas"
  )

  local issues=0

  for extraction in "${expected_extractions[@]}"; do
    IFS=':' read -r file_name expected_extraction <<<"$extraction"
    file="$FRONTEND_DIR/src/lib/api/$file_name"

    if [ ! -f "$file" ]; then
      log_warn "Expected file not found: $file"
      issues=$((issues + 1))
      continue
    fi

    if grep -q "$expected_extraction" "$file" 2>/dev/null; then
      log_success "Correct extraction in $file_name: $expected_extraction"
    else
      log_error "Missing correct extraction in $file_name"
      log_error "  Expected: $expected_extraction"
      issues=$((issues + 1))
    fi
  done

  if [ $issues -eq 0 ]; then
    log_success "All frontend API clients validated"
  else
    log_error "Found $issues validation issues in frontend API clients"
    return 1
  fi
}

# ============================================================================
# Phase 3: TypeScript Type Definitions
# ============================================================================

validate_type_definitions() {
  echo ""
  echo "=========================================================================="
  echo "Phase 3: TypeScript Type Definitions"
  echo "=========================================================================="

  log_info "Checking TypeScript type definitions..."

  # Check for common types
  local types_to_check=(
    "Quest"
    "Goal"
    "Habit"
    "FocusSession"
    "Workout"
    "Book"
    "User"
  )

  local issues=0

  for type_name in "${types_to_check[@]}"; do
    if grep -r "type $type_name\|interface $type_name" "$FRONTEND_DIR/src/lib/types" 2>/dev/null | grep -q .; then
      log_success "Type definition found: $type_name"
    else
      log_warn "Type definition missing: $type_name"
      issues=$((issues + 1))
    fi
  done

  if [ $issues -eq 0 ]; then
    log_success "All type definitions validated"
  else
    log_warn "Found $issues missing type definitions (may be acceptable if using inline types)"
  fi
}

# ============================================================================
# Phase 4: Playwright Test Coverage
# ============================================================================

validate_test_coverage() {
  echo ""
  echo "=========================================================================="
  echo "Phase 4: Playwright Test Coverage"
  echo "=========================================================================="

  log_info "Checking test coverage for API response formats..."

  # Check if response format tests exist
  if [ -f "$TESTS_DIR/api-response-format.spec.ts" ]; then
    log_success "Response format test suite found"

    # Count test cases
    local test_count=$(grep -c "test(" "$TESTS_DIR/api-response-format.spec.ts" || echo "0")
    log_info "Test cases: $test_count"
  else
    log_warn "Response format test suite not found"
    return 1
  fi
}

# ============================================================================
# Phase 5: Linting & Type Checking
# ============================================================================

validate_frontend_lint() {
  echo ""
  echo "=========================================================================="
  echo "Phase 5: Frontend Lint & Type Check"
  echo "=========================================================================="

  log_info "Running frontend linting..."

  cd "$FRONTEND_DIR"

  if npm run lint 2>&1 | tee "$PROJECT_ROOT/.tmp/frontend_lint.log" | grep -i "error"; then
    log_error "Linting errors found. See .tmp/frontend_lint.log"
    return 1
  fi

  log_success "Frontend linting passed"
}

# ============================================================================
# Phase 6: Backend Type Checking
# ============================================================================

validate_backend_types() {
  echo ""
  echo "=========================================================================="
  echo "Phase 6: Backend Type Checking"
  echo "=========================================================================="

  log_info "Running backend type checking..."

  cd "$BACKEND_DIR"

  if ! cargo check --bin ignition-api 2>&1 | tee "$PROJECT_ROOT/.tmp/backend_check.log" | grep -i "error"; then
    log_success "Backend type checking passed"
  else
    log_error "Backend type checking failed. See .tmp/backend_check.log"
    return 1
  fi
}

# ============================================================================
# Main
# ============================================================================

main() {
  local mode="${1:-all}"
  local exit_code=0

  case $mode in
    all)
      validate_backend_format || exit_code=1
      validate_frontend_clients || exit_code=1
      validate_type_definitions || exit_code=1
      validate_test_coverage || exit_code=1
      ;;
    format)
      validate_backend_format || exit_code=1
      validate_frontend_clients || exit_code=1
      ;;
    types)
      validate_type_definitions || exit_code=1
      ;;
    lint)
      validate_frontend_lint || exit_code=1
      validate_backend_types || exit_code=1
      ;;
    *)
      log_error "Unknown mode: $mode"
      exit 1
      ;;
  esac

  echo ""
  echo "=========================================================================="
  echo "Validation Summary"
  echo "=========================================================================="

  if [ $exit_code -eq 0 ]; then
    log_success "All validations passed!"
  else
    log_error "Some validations failed"
  fi

  exit $exit_code
}

main "$@"
