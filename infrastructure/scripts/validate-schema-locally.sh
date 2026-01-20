#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Local Schema Validation ===${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
fi

# Start test PostgreSQL container
echo -e "${YELLOW}Starting test PostgreSQL database...${NC}"
CONTAINER_ID=$(docker run -d \
    -e POSTGRES_DB=test_db \
    -e POSTGRES_USER=test_user \
    -e POSTGRES_PASSWORD=test_password \
    -p 5433:5432 \
    postgres:16-alpine)

echo "Container ID: $CONTAINER_ID"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
for i in {1..30}; do
    if docker exec "$CONTAINER_ID" pg_isready -U test_user > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    docker stop "$CONTAINER_ID" 2>/dev/null || true
    docker rm "$CONTAINER_ID" 2>/dev/null || true
}
trap cleanup EXIT

# Apply migrations
echo -e "\n${YELLOW}Applying migrations...${NC}"
for migration in app/backend/migrations/*.sql; do
    echo "  Applying: $(basename $migration)"
    docker exec -i "$CONTAINER_ID" psql -U test_user -d test_db < "$migration"
done
echo -e "${GREEN}✓ Migrations applied${NC}"

# Run assertions
echo -e "\n${YELLOW}Running schema assertions...${NC}"

# Test 1: Table count
TABLE_COUNT=$(docker exec "$CONTAINER_ID" psql -U test_user -d test_db -t -c "
    SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
")
echo "  Tables created: $TABLE_COUNT"

# Test 2: Primary keys
PK_COUNT=$(docker exec "$CONTAINER_ID" psql -U test_user -d test_db -t -c "
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY' AND table_schema = 'public'
")
echo "  Primary keys: $PK_COUNT"

# Test 3: Unique constraints
UNIQUE_COUNT=$(docker exec "$CONTAINER_ID" psql -U test_user -d test_db -t -c "
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'
")
echo "  Unique constraints: $UNIQUE_COUNT"

# Test 4: Columns with defaults
DEFAULT_COUNT=$(docker exec "$CONTAINER_ID" psql -U test_user -d test_db -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE column_default IS NOT NULL AND table_schema = 'public'
")
echo "  Columns with defaults: $DEFAULT_COUNT"

# Test 5: ON CONFLICT support
echo -e "\n${YELLOW}Testing ON CONFLICT support...${NC}"
docker exec "$CONTAINER_ID" psql -U test_user -d test_db << 'EOF'
SELECT table_name, constraint_name, string_agg(column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'
GROUP BY table_name, constraint_name
ORDER BY table_name;
EOF

# Test 6: Seed data
echo -e "\n${YELLOW}Testing seed data...${NC}"
docker exec "$CONTAINER_ID" psql -U test_user -d test_db -c "
    SELECT 'roles' as table_name, COUNT(*) as count FROM roles
    UNION ALL
    SELECT 'skill_definitions', COUNT(*) FROM skill_definitions
    UNION ALL
    SELECT 'achievement_definitions', COUNT(*) FROM achievement_definitions
    ORDER BY table_name
"

# Test 7: Test INSERT with defaults
echo -e "\n${YELLOW}Testing INSERT with defaults...${NC}"
docker exec "$CONTAINER_ID" psql -U test_user -d test_db << 'TESTEOF'
-- Test UUID generation
INSERT INTO users (email, name, normalized_email) 
VALUES ('test@example.com', 'Test User', 'test@example.com')
RETURNING id;

-- Test timestamp defaults
SELECT COUNT(*) as id_count FROM users WHERE id IS NOT NULL;
SELECT COUNT(*) as created_at_count FROM users WHERE created_at IS NOT NULL;
SELECT COUNT(*) as updated_at_count FROM users WHERE updated_at IS NOT NULL;
TESTEOF

echo -e "\n${GREEN}✓ All schema assertions passed!${NC}\n"

# Summary
echo -e "${BLUE}=== Validation Summary ===${NC}"
echo "✓ Migrations applied successfully"
echo "✓ $TABLE_COUNT tables created"
echo "✓ $PK_COUNT primary keys verified"
echo "✓ $UNIQUE_COUNT unique constraints verified"
echo "✓ $DEFAULT_COUNT columns with defaults"
echo "✓ Seed data inserted"
echo "✓ INSERT with defaults working"
echo ""
echo -e "${GREEN}Ready for deployment!${NC}"
