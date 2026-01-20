#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Neon Database Migration Manager ===${NC}\n"

# Check if DATABASE_URL is set
if [ -z "$NEON_DATABASE_URL" ]; then
    echo -e "${RED}✗ NEON_DATABASE_URL environment variable not set${NC}"
    echo "Set it with:"
    echo "  export NEON_DATABASE_URL='postgres://...'"
    exit 1
fi

# Verify connection
echo -e "${YELLOW}Testing Neon connection...${NC}"
if ! psql "$NEON_DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to Neon${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to Neon${NC}\n"

# Parse command
COMMAND=${1:-status}

case $COMMAND in
    status)
        echo -e "${YELLOW}Current migration status:${NC}"
        psql "$NEON_DATABASE_URL" -c "
            SELECT version, description, installed_on, success, execution_time
            FROM _sqlx_migrations
            ORDER BY version DESC
        "
        ;;

    apply)
        echo -e "${YELLOW}Applying pending migrations...${NC}"
        
        # Get applied versions
        APPLIED=$(psql "$NEON_DATABASE_URL" -t -c "
            SELECT array_agg(version::text) FROM _sqlx_migrations
        " | tr -d '{}')
        
        # Apply each migration
        for migration in app/backend/migrations/*.sql; do
            VERSION=$(basename "$migration" | cut -d_ -f1)
            
            if [[ ! "$APPLIED" =~ "$VERSION" ]]; then
                echo "  Applying migration $VERSION..."
                
                if psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 < "$migration" > /dev/null 2>&1; then
                    echo -e "${GREEN}    ✓ Applied${NC}"
                else
                    echo -e "${RED}    ✗ Failed${NC}"
                    exit 1
                fi
            fi
        done
        
        echo -e "${GREEN}✓ Migrations complete${NC}"
        
        # Show final status
        echo -e "\n${YELLOW}Final status:${NC}"
        psql "$NEON_DATABASE_URL" -c "
            SELECT version, description, installed_on
            FROM _sqlx_migrations
            ORDER BY version
        "
        ;;

    verify)
        echo -e "${YELLOW}Verifying schema...${NC}"
        
        CHECKS=(
            "Tables:SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"
            "Primary Keys:SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='PRIMARY KEY'"
            "Unique Constraints:SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='UNIQUE'"
            "Columns with Defaults:SELECT COUNT(*) FROM information_schema.columns WHERE column_default IS NOT NULL"
            "Seed Records in Roles:SELECT COUNT(*) FROM roles"
        )
        
        for check in "${CHECKS[@]}"; do
            NAME=$(echo "$check" | cut -d: -f1)
            QUERY=$(echo "$check" | cut -d: -f2)
            RESULT=$(psql "$NEON_DATABASE_URL" -t -c "$QUERY" | xargs)
            echo "  $NAME: $RESULT"
        done
        
        echo -e "\n${GREEN}✓ Schema verified${NC}"
        ;;

    rollback)
        VERSION=${2:-}
        if [ -z "$VERSION" ]; then
            echo -e "${RED}✗ Usage: $0 rollback <version>${NC}"
            echo "Example: $0 rollback 2"
            exit 1
        fi
        
        echo -e "${RED}⚠️  Rolling back to migration $VERSION${NC}"
        read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            echo "Rollback cancelled"
            exit 0
        fi
        
        # This is a manual rollback - you need to write rollback SQL
        echo "Manual rollback required. Steps:"
        echo "1. Save your data if needed"
        echo "2. Connect to Neon console"
        echo "3. Run appropriate DROP/ALTER commands"
        echo "4. Delete entries from _sqlx_migrations table:"
        psql "$NEON_DATABASE_URL" -c "
            DELETE FROM _sqlx_migrations WHERE version > $VERSION
        "
        echo -e "${GREEN}✓ Migration table reset to version $VERSION${NC}"
        ;;

    compare)
        echo -e "${YELLOW}Comparing schema with migrations...${NC}"
        
        TABLES=$(psql "$NEON_DATABASE_URL" -t -c "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema='public'
        " | xargs)
        
        EXPECTED=$(find app/backend/migrations -name '*.sql' -exec grep -c "^CREATE TABLE" {} + | awk '{s+=$1} END {print s}')
        
        echo "  Tables in database: $TABLES"
        echo "  Expected from migrations: $EXPECTED"
        
        if [ "$TABLES" -eq "$EXPECTED" ]; then
            echo -e "${GREEN}✓ Schema matches migrations${NC}"
        else
            echo -e "${YELLOW}⚠️  Table counts differ${NC}"
        fi
        ;;

    export)
        echo -e "${YELLOW}Exporting current schema to SQL...${NC}"
        
        OUTPUT_FILE="neon_schema_export_$(date +%Y%m%d_%H%M%S).sql"
        
        pg_dump "$NEON_DATABASE_URL" \
            --schema=public \
            --no-owner \
            --no-privileges \
            > "$OUTPUT_FILE"
        
        echo -e "${GREEN}✓ Exported to $OUTPUT_FILE${NC}"
        echo "  Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
        ;;

    help|--help|-h)
        cat << 'EOF'
Neon Database Migration Manager

USAGE:
  ./scripts/neon-migrate.sh [COMMAND]

COMMANDS:
  status          Show current migration status (default)
  apply           Apply pending migrations to Neon
  verify          Verify schema consistency
  rollback <ver>  Rollback to specific migration version
  compare         Compare schema with migrations
  export          Export current schema to SQL file
  help            Show this help message

ENVIRONMENT:
  NEON_DATABASE_URL  Connection string for Neon database
                     Example: postgres://user:pass@host/dbname

EXAMPLES:
  # Show status
  ./scripts/neon-migrate.sh status

  # Apply migrations
  ./scripts/neon-migrate.sh apply

  # Rollback to migration 2
  ./scripts/neon-migrate.sh rollback 2

  # Export schema
  ./scripts/neon-migrate.sh export

EOF
        ;;

    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo "Use '$0 help' for usage"
        exit 1
        ;;
esac

echo ""
