#!/bin/bash

# Deploy backend to Fly.io
# This script handles backend deployment with health checks

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/app/backend/Cargo.toml" ]; then
    log_error "Backend Cargo.toml not found at expected location"
    exit 1
fi

echo -e "${BLUE}=== BACKEND DEPLOYMENT ===${NC}\n"

# Step 1: Pre-deployment checks
log_info "Running pre-deployment checks..."
if ! bash "$SCRIPT_DIR/pre-deploy-checks.sh"; then
    log_error "Pre-deployment checks failed"
    exit 1
fi

# Step 2: Build backend
log_info "Building backend..."
cd "$PROJECT_ROOT/app/backend"

if ! cargo build --release 2>&1 | tail -20; then
    log_error "Backend build failed"
    exit 1
fi

log_success "Backend built successfully"

# Step 3: Deploy to Fly.io
log_info "Deploying to Fly.io..."

if command -v flyctl &> /dev/null; then
    if ! flyctl deploy --remote-only; then
        log_error "Fly.io deployment failed"
        exit 1
    fi
    log_success "Backend deployed to Fly.io"
else
    log_error "flyctl CLI not found. Install from https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Step 4: Health check
log_info "Waiting for health check..."
sleep 5

HEALTH_URL="https://api.ecent.online/health"
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "$HEALTH_URL" | grep -q '"status":"ok"'; then
        log_success "Backend health check passed"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_info "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Backend health check failed after $MAX_RETRIES attempts"
    exit 1
fi

# Step 5: Verify connectivity
log_info "Verifying backend connectivity..."

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
    log_success "Backend is responding correctly (HTTP $HTTP_CODE)"
else
    log_error "Unexpected HTTP response: $HTTP_CODE"
    exit 1
fi

echo -e "\n${GREEN}=== BACKEND DEPLOYMENT COMPLETE ===${NC}"
exit 0
