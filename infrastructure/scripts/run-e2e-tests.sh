#!/bin/bash
# E2E Test Runner
#
# Starts the E2E test infrastructure and runs API tests.
#
# Usage:
#   ./scripts/run-e2e-tests.sh          # Run all E2E tests
#   ./scripts/run-e2e-tests.sh --keep   # Don't tear down after tests
#
# Prerequisites:
#   - Docker and docker compose installed
#   - Node.js and pnpm installed
#   - Playwright installed (pnpm install)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.e2e.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
KEEP_RUNNING=false
if [[ "$1" == "--keep" ]]; then
  KEEP_RUNNING=true
fi

# Cleanup function
cleanup() {
  if [[ "$KEEP_RUNNING" == "false" ]]; then
    log_info "Tearing down E2E infrastructure..."
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
  else
    log_warn "Leaving infrastructure running (--keep flag)"
    log_info "To stop: docker compose -f $COMPOSE_FILE down -v"
  fi
}

# Register cleanup on exit
trap cleanup EXIT

# Start infrastructure
log_info "Starting E2E test infrastructure..."
docker compose -f "$COMPOSE_FILE" up -d --build

# Wait for API to be healthy
log_info "Waiting for API to be healthy..."
MAX_RETRIES=30
RETRY_COUNT=0
API_URL="http://localhost:8081"

until curl -sf "$API_URL/health" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [[ $RETRY_COUNT -ge $MAX_RETRIES ]]; then
    log_error "API failed to become healthy after $MAX_RETRIES retries"
    docker compose -f "$COMPOSE_FILE" logs api-e2e
    exit 1
  fi
  log_info "Waiting for API... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

log_info "API is healthy at $API_URL"

# Run tests
log_info "Running E2E tests..."
cd "$ROOT_DIR"

# Run Playwright tests with the E2E API URL
API_BASE_URL="$API_URL" npx playwright test tests/api-e2e.spec.ts --reporter=list

TEST_EXIT_CODE=$?

if [[ $TEST_EXIT_CODE -eq 0 ]]; then
  log_info "All E2E tests passed!"
else
  log_error "E2E tests failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE
