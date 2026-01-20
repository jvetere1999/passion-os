#!/bin/bash

# Health check and smoke tests
# Run critical API tests after deployment

set -e

API_URL="${API_URL:-https://api.ecent.online}"
BASE_URL="${BASE_URL:-https://ecent.online}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_test() { echo -e "${BLUE}→${NC} $1"; }
log_pass() { echo -e "${GREEN}✓${NC} $1"; }
log_fail() { echo -e "${RED}✗${NC} $1"; }

FAILED=0

echo -e "${BLUE}=== SMOKE TESTS ===${NC}\n"

# Test 1: Health endpoint
log_test "Testing /health endpoint..."
if curl -s "$API_URL/health" | grep -q '"status"'; then
    log_pass "Health endpoint responding"
else
    log_fail "Health endpoint failed"
    FAILED=$((FAILED + 1))
fi

# Test 2: Frontend loads
log_test "Testing frontend availability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ]; then
    log_pass "Frontend loading (HTTP $HTTP_CODE)"
else
    log_fail "Frontend unavailable (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
fi

# Test 3: Database connectivity
log_test "Testing database connectivity..."
DB_TEST=$(curl -s "$API_URL/api/status" 2>/dev/null || echo '{"db":"failed"}')
if echo "$DB_TEST" | grep -q "connected\|ok"; then
    log_pass "Database connected"
else
    log_fail "Database check failed"
    FAILED=$((FAILED + 1))
fi

# Test 4: OAuth endpoints
log_test "Testing OAuth redirect..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$API_URL/api/auth/signin/google")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    log_pass "OAuth endpoint responding (HTTP $HTTP_CODE)"
else
    log_fail "OAuth endpoint failed (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
fi

# Test 5: API response time
log_test "Checking API response time..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$API_URL/health")
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
    log_pass "API response fast ($RESPONSE_TIME seconds)"
else
    log_fail "API response slow ($RESPONSE_TIME seconds)"
fi

# Test 6: CORS headers
log_test "Checking CORS headers..."
if curl -s -I "$API_URL/health" | grep -q "Access-Control"; then
    log_pass "CORS headers present"
else
    log_fail "CORS headers missing"
fi

# Summary
echo -e "\n${BLUE}=== TEST SUMMARY ===${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED test(s) failed${NC}"
    exit 1
fi
