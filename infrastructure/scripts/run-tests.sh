#!/bin/bash

##############################################################################
# Ignition - Comprehensive Testing Script
#
# This script runs all tests (API, E2E, Regression) with proper setup.
# It handles docker-compose orchestration, database setup, and reporting.
#
# Usage:
#   ./scripts/run-tests.sh                 # Run all tests
#   ./scripts/run-tests.sh --api           # API tests only
#   ./scripts/run-tests.sh --e2e           # E2E tests only
#   ./scripts/run-tests.sh --format        # Response format regression tests only
#   ./scripts/run-tests.sh --cleanup       # Clean up after tests
#   ./scripts/run-tests.sh --verbose       # Verbose output
#
# Environment:
#   API_BASE_URL - Backend URL (default: http://localhost:8080)
#   POSTGRES_URL - Database URL (auto-set from docker-compose)
#   DEBUG - Set to 'true' for verbose output
#
##############################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infra"
TESTS_DIR="$PROJECT_ROOT/tests"

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
POSTGRES_USER="${POSTGRES_USER:-ignition}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-ignition_dev}"
POSTGRES_DB="${POSTGRES_DB:-ignition}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Test groups
RUN_API_TESTS=false
RUN_E2E_TESTS=false
RUN_FORMAT_TESTS=false
RUN_ALL_TESTS=true
CLEANUP_AFTER=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

print_header() {
  echo ""
  echo "========================================================================"
  echo "$1"
  echo "========================================================================"
}

# Wait for service to be healthy
wait_for_service() {
  local service=$1
  local max_attempts=$2
  local attempt=0

  case $service in
    postgres)
      log_info "Waiting for PostgreSQL..."
      while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $POSTGRES_PORT 2>/dev/null; then
          log_success "PostgreSQL is ready"
          return 0
        fi
        attempt=$((attempt + 1))
        if [ $((attempt % 5)) -eq 0 ]; then
          log_warn "Waiting... (attempt $attempt/$max_attempts)"
        fi
        sleep 1
      done
      log_error "PostgreSQL did not start"
      return 1
      ;;
    api)
      log_info "Waiting for API..."
      while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
          log_success "API is ready"
          return 0
        fi
        attempt=$((attempt + 1))
        if [ $((attempt % 5)) -eq 0 ]; then
          log_warn "Waiting... (attempt $attempt/$max_attempts)"
        fi
        sleep 1
      done
      log_error "API did not start"
      return 1
      ;;
  esac
}

# ============================================================================
# Parse Arguments
# ============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --api)
      RUN_ALL_TESTS=false
      RUN_API_TESTS=true
      shift
      ;;
    --e2e)
      RUN_ALL_TESTS=false
      RUN_E2E_TESTS=true
      shift
      ;;
    --format)
      RUN_ALL_TESTS=false
      RUN_FORMAT_TESTS=true
      shift
      ;;
    --cleanup)
      CLEANUP_AFTER=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      grep "^# " "$0" | sed 's/^# //'
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set default test selection
if [ "$RUN_ALL_TESTS" = true ]; then
  RUN_API_TESTS=true
  RUN_E2E_TESTS=true
  RUN_FORMAT_TESTS=true
fi

# ============================================================================
# Startup
# ============================================================================

print_header "Starting Ignition Test Infrastructure"

log_info "Project root: $PROJECT_ROOT"
log_info "API Base URL: $API_BASE_URL"
log_info "PostgreSQL: $POSTGRES_USER@localhost:$POSTGRES_PORT/$POSTGRES_DB"

# Check prerequisites
if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  log_error "npm is not installed"
  exit 1
fi

log_success "Prerequisites satisfied"

# Start docker-compose services
print_header "Starting Docker Compose Services"

log_info "Starting PostgreSQL, MinIO, and backend API..."
cd "$INFRA_DIR"

if ! docker compose -f docker-compose.yml --profile full up -d; then
  log_error "Failed to start docker compose services"
  exit 1
fi

log_success "Docker services started"

# Wait for services to be healthy
wait_for_service "postgres" 60 || exit 1
wait_for_service "api" 120 || exit 1

# ============================================================================
# Database Setup
# ============================================================================

print_header "Database Setup"

log_info "Running migrations..."

# Wait a moment for migrations to complete
sleep 2

# Verify database is ready
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" >/dev/null 2>&1; then
  log_success "Database is ready"
else
  log_error "Database verification failed"
  exit 1
fi

# ============================================================================
# Run Tests
# ============================================================================

cd "$PROJECT_ROOT"

FAILED_TESTS=0
PASSED_TESTS=0

# Response Format Tests
if [ "$RUN_FORMAT_TESTS" = true ]; then
  print_header "Response Format Regression Tests"
  log_info "Testing API response format standardization (Decision A)..."

  if [ "$VERBOSE" = true ]; then
    npx playwright test "$TESTS_DIR/api-response-format.spec.ts" --reporter=verbose || FAILED_TESTS=$((FAILED_TESTS + 1))
  else
    npx playwright test "$TESTS_DIR/api-response-format.spec.ts" --reporter=list || FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  if [ $FAILED_TESTS -eq 0 ]; then
    log_success "Response format tests passed"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    log_warn "Response format tests failed"
  fi
fi

# API Tests
if [ "$RUN_API_TESTS" = true ]; then
  print_header "API Endpoint Tests"
  log_info "Running comprehensive API tests..."

  if [ "$VERBOSE" = true ]; then
    npx playwright test --config=playwright.api.config.ts --reporter=verbose || FAILED_TESTS=$((FAILED_TESTS + 1))
  else
    npx playwright test --config=playwright.api.config.ts --reporter=list || FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  if [ $FAILED_TESTS -eq 0 ]; then
    log_success "API tests passed"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    log_warn "Some API tests failed"
  fi
fi

# E2E Tests
if [ "$RUN_E2E_TESTS" = true ]; then
  print_header "E2E UI Tests"
  log_info "Running end-to-end tests..."

  if [ "$VERBOSE" = true ]; then
    npx playwright test tests/api-e2e.spec.ts --reporter=verbose || FAILED_TESTS=$((FAILED_TESTS + 1))
  else
    npx playwright test tests/api-e2e.spec.ts --reporter=list || FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  if [ $FAILED_TESTS -eq 0 ]; then
    log_success "E2E tests passed"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    log_warn "Some E2E tests failed"
  fi
fi

# ============================================================================
# Cleanup
# ============================================================================

print_header "Test Summary"

if [ $PASSED_TESTS -gt 0 ]; then
  log_success "$PASSED_TESTS test group(s) passed"
fi

if [ $FAILED_TESTS -gt 0 ]; then
  log_error "$FAILED_TESTS test group(s) failed"
fi

if [ "$CLEANUP_AFTER" = true ]; then
  print_header "Cleanup"
  log_info "Stopping docker-compose services..."

  cd "$INFRA_DIR"
  docker compose -f docker-compose.yml down || log_warn "Partial cleanup (OK)"

  log_success "Cleanup complete"
fi

# Exit with failure if any tests failed
if [ $FAILED_TESTS -gt 0 ]; then
  exit 1
fi

log_success "All tests passed!"
exit 0
