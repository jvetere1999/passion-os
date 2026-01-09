#!/bin/bash
# Ignition - Health Check Script
#
# Usage: ./health-check.sh [--url <url>] [--timeout <seconds>] [--retries <count>]
# Example: ./health-check.sh
# Example: ./health-check.sh --url https://api.ecent.online/health --timeout 5 --retries 10
#
# This script:
#   1. Checks backend health endpoint
#   2. Validates response structure
#   3. Reports version and status

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${DEPLOY_DIR}/../.tmp"

# Defaults
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/health}"
TIMEOUT=5
RETRIES=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "Usage: $0 [--url <url>] [--timeout <seconds>] [--retries <count>]"
    echo ""
    echo "Options:"
    echo "  --url       Health endpoint URL (default: http://localhost:8080/health)"
    echo "  --timeout   Request timeout in seconds (default: 5)"
    echo "  --retries   Number of retry attempts (default: 3)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --url https://api.ecent.online/health"
    echo "  $0 --timeout 10 --retries 5"
    exit 1
}

# Parse arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --url)
            HEALTH_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --retries)
            RETRIES="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            log_error "Unknown argument: $1"
            usage
            ;;
    esac
done

check_health() {
    local attempt=1
    local response=""
    local status_code=""

    mkdir -p "${LOG_DIR}"

    while [ $attempt -le $RETRIES ]; do
        log_info "Health check attempt ${attempt}/${RETRIES}..."

        # Make request, capture response and status code
        response=$(curl -sf \
            --max-time "${TIMEOUT}" \
            -w "\n%{http_code}" \
            "${HEALTH_URL}" 2>"${LOG_DIR}/health_check_error.log") || true

        if [ -n "$response" ]; then
            # Extract status code (last line)
            status_code=$(echo "$response" | tail -n1)
            # Extract body (everything except last line)
            body=$(echo "$response" | sed '$d')

            if [ "$status_code" = "200" ]; then
                log_info "Health check passed (HTTP 200)"

                # Parse and display response
                if command -v jq &> /dev/null; then
                    echo "$body" | jq . 2>/dev/null || echo "$body"

                    # Extract version if present
                    version=$(echo "$body" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
                    status=$(echo "$body" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

                    log_info "Status: ${status}"
                    log_info "Version: ${version}"
                else
                    echo "$body"
                fi

                return 0
            fi
        fi

        log_warn "Attempt ${attempt} failed, retrying..."
        sleep 2
        ((attempt++))
    done

    log_error "Health check failed after ${RETRIES} attempts"

    # Show error log if exists
    if [ -f "${LOG_DIR}/health_check_error.log" ]; then
        log_error "Last error:"
        cat "${LOG_DIR}/health_check_error.log" 2>/dev/null || true
    fi

    return 1
}

check_database() {
    log_info "Checking database connectivity..."

    if docker exec ignition-postgres pg_isready -U ignition > /dev/null 2>&1; then
        log_info "Database: READY"
        return 0
    else
        log_error "Database: NOT READY"
        return 1
    fi
}

check_containers() {
    log_info "Checking container status..."

    local api_status
    local pg_status
    api_status=$(docker inspect -f '{{.State.Status}}' ignition-api 2>/dev/null || echo "not found")
    pg_status=$(docker inspect -f '{{.State.Status}}' ignition-postgres 2>/dev/null || echo "not found")

    echo "  ignition-api:      ${api_status}"
    echo "  ignition-postgres: ${pg_status}"

    if [ "$api_status" = "running" ] && [ "$pg_status" = "running" ]; then
        log_info "All containers running"
        return 0
    else
        log_error "Some containers not running"
        return 1
    fi
}

# Main
main() {
    echo "=========================================="
    echo "  Ignition Health Check"
    echo "  URL: ${HEALTH_URL}"
    echo "=========================================="

    local exit_code=0

    # Check containers
    check_containers || exit_code=1

    # Check database
    check_database || exit_code=1

    # Check API health
    check_health || exit_code=1

    echo "=========================================="
    if [ $exit_code -eq 0 ]; then
        log_info "All checks passed!"
    else
        log_error "Some checks failed!"
    fi
    echo "=========================================="

    exit $exit_code
}

main

