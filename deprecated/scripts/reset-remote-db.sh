 #!/bin/bash
# ============================================================================
# Ignition Remote Database Reset Script
# DANGER: This will DELETE all production/staging data
# Requires confirmation and backup before proceeding
# ============================================================================

set -e

echo "============================================"
echo "Ignition REMOTE Database Reset"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Safety checks
echo -e "${RED}!!! DANGER !!!${NC}"
echo ""
echo "This script will DELETE all data in the REMOTE (production) database."
echo "This action is IRREVERSIBLE without a backup."
echo ""

# First confirmation
read -p "Type 'I UNDERSTAND' to continue: " CONFIRM1
if [[ "$CONFIRM1" != "I UNDERSTAND" ]]; then
    echo "Aborted."
    exit 1
fi

# Backup prompt
echo ""
echo -e "${YELLOW}Step 0: Backup${NC}"
echo "Have you created a backup? Run this first if not:"
echo "  curl -X POST https://ignition.ecent.online/api/admin/backup > backup_$(date +%Y%m%d_%H%M%S).json"
echo ""
read -p "Do you have a backup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create a backup first. Aborted."
    exit 1
fi

# Final confirmation
echo ""
echo -e "${RED}FINAL CONFIRMATION${NC}"
read -p "Type 'DELETE PRODUCTION DATA' to proceed: " CONFIRM2
if [[ "$CONFIRM2" != "DELETE PRODUCTION DATA" ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "============================================"
echo "Proceeding with remote database reset..."
echo "============================================"
echo ""

# Step 1: Drop all existing tables
echo "Step 1: Dropping existing tables..."
# Note: D1 doesn't support DROP DATABASE, so we drop tables individually
# This is done via a drop script

cat > .tmp/drop_all_tables.sql << 'EOF'
-- Drop all tables in dependency order (children before parents)
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS market_items;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievement_definitions;
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS skill_definitions;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS points_ledger;
DROP TABLE IF EXISTS user_wallet;
DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS user_drill_stats;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS learn_drills;
DROP TABLE IF EXISTS learn_lessons;
DROP TABLE IF EXISTS learn_topics;
DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS daily_plans;
DROP TABLE IF EXISTS plan_templates;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS focus_sessions;
DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS ideas;
DROP TABLE IF EXISTS infobase_entries;
DROP TABLE IF EXISTS ignition_packs;
DROP TABLE IF EXISTS daw_shortcuts;
DROP TABLE IF EXISTS glossary_terms;
DROP TABLE IF EXISTS track_analysis_cache;
DROP TABLE IF EXISTS user_onboarding_state;
DROP TABLE IF EXISTS onboarding_steps;
DROP TABLE IF EXISTS onboarding_flows;
DROP TABLE IF EXISTS user_ui_modules;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS access_requests;
DROP TABLE IF EXISTS authenticators;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS db_metadata;
DROP TABLE IF EXISTS d1_migrations;
EOF

wrangler d1 execute passion_os --remote --file=.tmp/drop_all_tables.sql > .tmp/reset-remote-drop.log 2>&1
echo -e "${GREEN}Tables dropped. See .tmp/reset-remote-drop.log${NC}"

# Step 2: Apply schema migration
echo ""
echo "Step 2: Applying schema migration..."
wrangler d1 execute passion_os --remote --file=migrations/0020_full_reset_v2.sql > .tmp/reset-remote-schema.log 2>&1
echo -e "${GREEN}Schema applied. See .tmp/reset-remote-schema.log${NC}"

# Step 3: Apply seed data
echo ""
echo "Step 3: Applying seed data..."
wrangler d1 execute passion_os --remote --file=migrations/0020_seed_data.sql > .tmp/reset-remote-seed.log 2>&1
echo -e "${GREEN}Seed data applied. See .tmp/reset-remote-seed.log${NC}"

echo ""
echo "============================================"
echo -e "${GREEN}Remote database reset complete!${NC}"
echo "============================================"
echo ""
echo "IMPORTANT: You must redeploy the application:"
echo "  npm run deploy"
echo ""
echo "All users will need to re-authenticate."

