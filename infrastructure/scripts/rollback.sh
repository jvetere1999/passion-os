#!/bin/bash

# Rollback deployment
# Reverts to the last known good version

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

echo -e "${BLUE}=== DEPLOYMENT ROLLBACK ===${NC}\n"

# Confirm rollback
echo -e "${YELLOW}WARNING: This will rollback to the previous deployment!${NC}"
read -p "Type 'yes' to confirm rollback: " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Step 1: Backend rollback
log_info "Rolling back backend..."

if command -v flyctl &> /dev/null; then
    # Get previous release
    PREVIOUS_RELEASE=$(flyctl releases --limit 2 | tail -1 | awk '{print $1}')
    
    if [ -z "$PREVIOUS_RELEASE" ]; then
        log_error "No previous release found"
        exit 1
    fi
    
    log_info "Rolling back to release: $PREVIOUS_RELEASE"
    
    if flyctl releases rollback "$PREVIOUS_RELEASE"; then
        log_success "Backend rolled back"
    else
        log_error "Backend rollback failed"
        exit 1
    fi
else
    log_error "flyctl not installed"
    exit 1
fi

# Step 2: Frontend rollback (via GitHub)
log_info "Rolling back frontend..."
log_info "Frontend uses GitHub deployments"
log_info "To rollback frontend, manually trigger previous deployment"
log_info "Or re-push the previous commit to main branch"

# Step 3: Database recovery (if needed)
log_warning "Database changes are NOT automatically rolled back"
log_info "If migrations were applied, you may need manual recovery"
log_info "Check backups at: /backups/passion_os_*.sql"

# Step 4: Health check
log_info "Checking system health..."
sleep 10

if curl -s https://api.ecent.online/health | grep -q '"status"'; then
    log_success "System health check passed"
else
    log_error "System health check failed"
    exit 1
fi

echo -e "\n${GREEN}✓ ROLLBACK COMPLETE${NC}"
echo ""
echo "Actions:"
echo "  1. Review error logs: https://logs.ecent.online"
echo "  2. Identify the issue"
echo "  3. Fix and re-deploy"
echo ""
echo "Questions?"
echo "  See: https://wiki.ecent.online/runbooks"
