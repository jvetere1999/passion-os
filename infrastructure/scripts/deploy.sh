#!/bin/bash

# Main deployment orchestration script
# Coordinates frontend, backend, and verification

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_section() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Parse arguments
DRY_RUN=${1:-false}
COMPONENT=${2:-all}  # all, frontend, backend

if [ "$DRY_RUN" = "--dry-run" ]; then
    log_info "Running in DRY-RUN mode - no changes will be made"
    DRY_RUN=true
else
    DRY_RUN=false
fi

log_section "PASSION OS DEPLOYMENT"

# Step 1: Pre-flight checks
log_section "STEP 1: PRE-FLIGHT CHECKS"
if ! bash "$SCRIPT_DIR/pre-deploy-checks.sh"; then
    log_error "Pre-flight checks failed!"
    exit 1
fi

# Step 2: Backend deployment
if [ "$COMPONENT" = "all" ] || [ "$COMPONENT" = "backend" ]; then
    log_section "STEP 2: BACKEND DEPLOYMENT"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would execute: bash $SCRIPT_DIR/deploy-backend.sh"
    else
        if ! bash "$SCRIPT_DIR/deploy-backend.sh"; then
            log_error "Backend deployment failed!"
            exit 1
        fi
    fi
fi

# Step 3: Frontend deployment
if [ "$COMPONENT" = "all" ] || [ "$COMPONENT" = "frontend" ]; then
    log_section "STEP 3: FRONTEND DEPLOYMENT"
    
    cd "$PROJECT_ROOT/app/frontend"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would deploy frontend via GitHub Actions"
    else
        log_info "Frontend deploys automatically via GitHub Actions"
        log_info "Pushed changes to main branch trigger deployment"
    fi
fi

# Step 4: Smoke tests
log_section "STEP 4: SMOKE TESTS"

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] Would run: bash $SCRIPT_DIR/smoke-tests.sh"
else
    if ! bash "$SCRIPT_DIR/smoke-tests.sh"; then
        log_error "Smoke tests failed!"
        exit 1
    fi
fi

# Step 5: Verification
log_section "STEP 5: FINAL VERIFICATION"

API_URL="https://api.ecent.online"
BASE_URL="https://ecent.online"

if [ "$DRY_RUN" = false ]; then
    # Check API health
    if curl -s "$API_URL/health" | grep -q '"status"'; then
        log_success "API is responding"
    else
        log_error "API not responding"
        exit 1
    fi

    # Check frontend
    if curl -s "$BASE_URL/" | grep -q "html" > /dev/null 2>&1; then
        log_success "Frontend is serving"
    else
        log_error "Frontend not serving"
        exit 1
    fi
fi

# Summary
log_section "DEPLOYMENT SUMMARY"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}This was a DRY-RUN. No changes were made.${NC}"
else
    echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
    echo ""
    echo "API: $API_URL"
    echo "Frontend: $BASE_URL"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor metrics at: https://monitoring.ecent.online"
    echo "  2. Check logs at: https://logs.ecent.online"
    echo "  3. Wait 24 hours for full stability"
    echo ""
    echo "Rollback (if needed):"
    echo "  bash $SCRIPT_DIR/rollback.sh"
fi

exit 0
