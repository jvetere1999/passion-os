#!/bin/bash
# ============================================================================
# Ignition Local Database Reset Script
# Drops all tables and re-applies migrations + seed data
# ============================================================================

set -e

echo "============================================"
echo "Ignition Local Database Reset"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirm
echo -e "${YELLOW}WARNING: This will DELETE all local database data.${NC}"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Removing local Wrangler state..."
rm -rf .wrangler/state
echo -e "${GREEN}Done.${NC}"

echo ""
echo "Step 2: Applying migrations..."
wrangler d1 migrations apply passion_os --local > .tmp/reset-migrations.log 2>&1
echo -e "${GREEN}Done. See .tmp/reset-migrations.log${NC}"

echo ""
echo "Step 3: Applying seed data..."
wrangler d1 execute passion_os --local --file=migrations/0020_seed_data.sql > .tmp/reset-seed.log 2>&1
echo -e "${GREEN}Done. See .tmp/reset-seed.log${NC}"

echo ""
echo "============================================"
echo -e "${GREEN}Local database reset complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "  npm run dev       # Start development server"
echo "  npm run dev:local # Start with local D1"

