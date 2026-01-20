#!/bin/bash

# Deployment pre-flight checks
# This script validates that the system is ready for deployment

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

FAILED_CHECKS=0
WARNINGS=0

echo -e "${BLUE}=== DEPLOYMENT PRE-FLIGHT CHECKS ===${NC}\n"

# 1. Code Quality Checks
echo -e "${BLUE}[1/6] Code Quality${NC}"
cd "$PROJECT_ROOT"

if ! cargo check 2>/dev/null; then
    log_error "Backend compilation failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    log_success "Backend compilation OK"
fi

if ! npm run lint 2>/dev/null; then
    log_warning "Frontend linting issues detected"
    WARNINGS=$((WARNINGS + 1))
else
    log_success "Frontend linting OK"
fi

# 2. Database Checks
echo -e "\n${BLUE}[2/6] Database Connection${NC}"

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    log_success "DATABASE_URL configured"
    
    # Try to connect to database
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Cannot connect to database"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
fi

# 3. Environment Variables
echo -e "\n${BLUE}[3/6] Environment Configuration${NC}"

required_vars=(
    "API_PORT"
    "FRONTEND_URL"
    "OAUTH_GOOGLE_CLIENT_ID"
    "OAUTH_GOOGLE_CLIENT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Missing required variable: $var"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        log_success "$var configured"
    fi
done

# 4. Docker Setup
echo -e "\n${BLUE}[4/6] Docker & Containers${NC}"

if command -v docker &> /dev/null; then
    log_success "Docker installed"
    
    if docker ps >/dev/null 2>&1; then
        log_success "Docker daemon running"
    else
        log_error "Docker daemon not accessible"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    log_warning "Docker not installed (optional for local deployment)"
fi

# 5. Storage & R2
echo -e "\n${BLUE}[5/6] Storage Configuration${NC}"

if [ -z "$R2_BUCKET_NAME" ]; then
    log_warning "R2_BUCKET_NAME not configured (optional)"
    WARNINGS=$((WARNINGS + 1))
else
    log_success "R2 configured"
fi

# 6. Security Checks
echo -e "\n${BLUE}[6/6] Security Verification${NC}"

if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    log_error "JWT_SECRET missing or too short (min 32 chars)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    log_success "JWT_SECRET configured"
fi

if [ -z "$SESSION_SECRET" ]; then
    log_error "SESSION_SECRET not configured"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    log_success "SESSION_SECRET configured"
fi

# Summary
echo -e "\n${BLUE}=== PRE-FLIGHT CHECK SUMMARY ===${NC}"
echo "Failed checks: $FAILED_CHECKS"
echo "Warnings: $WARNINGS"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL CHECKS PASSED - READY TO DEPLOY${NC}"
    exit 0
else
    echo -e "\n${RED}✗ DEPLOYMENT BLOCKED - $FAILED_CHECKS CHECKS FAILED${NC}"
    exit 1
fi
