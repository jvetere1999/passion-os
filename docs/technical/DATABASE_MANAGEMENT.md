# Neon Database Management

Complete workflow for validating and managing schema migrations against Neon production database.

## Setup

### 1. Add GitHub Secrets

Add these to your repo settings (Settings > Secrets and variables > Actions):

```
NEON_DATABASE_URL
  PostgreSQL connection string from Neon console
  Format: postgres://user:password@host/dbname?sslmode=require
```

Optional:
```
SLACK_WEBHOOK
  For deployment notifications
```

### 2. GitHub Actions Workflows

Two automatic workflows:

#### `neon-migrations.yml` (Automatic)
- **On PR:** Validates schema changes against Neon (dry-run)
- **On main merge:** Applies migrations to Neon automatically
- **Requires:** Environment approval for production changes

## Local Usage

### Check Current Status
```bash
export NEON_DATABASE_URL="postgres://..."
./scripts/neon-migrate.sh status
```

Shows:
- Applied migrations
- Timestamps
- Execution times

### Apply Migrations Manually
```bash
./scripts/neon-migrate.sh apply
```

Applies pending migrations to Neon:
1. Detects already-applied migrations
2. Applies only pending ones
3. Verifies each application
4. Shows final status

### Verify Schema
```bash
./scripts/neon-migrate.sh verify
```

Checks:
- Table count
- Primary keys exist
- Unique constraints exist
- Column defaults present
- Seed data populated

### Compare Schema vs Migrations
```bash
./scripts/neon-migrate.sh compare
```

Ensures database schema matches migration files.

### Rollback
```bash
./scripts/neon-migrate.sh rollback 2
```

Rollback to migration version 2:
1. **Prompts for confirmation** (safety)
2. Deletes applied migrations from tracking
3. Manual SQL changes required (if any)

### Export Schema
```bash
./scripts/neon-migrate.sh export
```

Creates dated SQL backup:
- File: `neon_schema_export_20260111_120000.sql`
- Contains: Full schema without data
- Use for: Disaster recovery, comparison

## Workflow

### Regular Development
```bash
# 1. Edit schema
vim tools/schema-generator/schema.json

# 2. Regenerate migrations
./generate_schema.sh

# 3. Test locally
./scripts/validate-schema-locally.sh

# 4. Push to GitHub
git push origin feature-branch

# 5. Create PR - GitHub Actions automatically:
#    - Validates against Neon (dry-run)
#    - Comments with migration report
#    - Checks for breaking changes
#    - Requires approval for production changes

# 6. Merge PR - GitHub Actions automatically:
#    - Applies migrations to Neon
#    - Verifies schema afterward
#    - Sends Slack notification
```

### Production Stability Checkpoint

Once you reach initial stability:

```bash
# 1. Manual verification
./scripts/neon-migrate.sh status
./scripts/neon-migrate.sh verify

# 2. Export schema for reference
./scripts/neon-migrate.sh export

# 3. All future changes go through:
#    - Local validation
#    - PR approval
#    - Automated application to Neon
```

## Safety Features

### Automatic Checks
✓ Migration syntax validation
✓ Naming convention verification
✓ Breaking change detection
✓ Dry-run preview on PR
✓ Manual approval gate for production
✓ Post-migration verification

### Manual Safeguards
- Rollback capability (version-based)
- Schema export/backup
- Status tracking in `_sqlx_migrations` table
- Slack notifications on success/failure
- Environment-based approval requirements

## Troubleshooting

### "Cannot connect to Neon"
```bash
# Verify connection string
psql "$NEON_DATABASE_URL" -c "SELECT 1"

# Check Neon console for:
- Database name correct
- Connection string not expired
- IP whitelisting (if applicable)
```

### "Migration already applied"
The system tracks applied migrations in `_sqlx_migrations` table.
- To reset: Use `rollback` command
- Manual reset: DELETE from _sqlx_migrations table

### "Breaking change detected"
GitHub Actions warns but allows. For major schema changes:
1. Create dedicated migration file with careful steps
2. Add comments explaining the change
3. Test locally first
4. Review in PR before merge

### Neon Connection Issues
1. Check Neon console is accessible
2. Verify DATABASE_URL in GitHub Secrets
3. Test locally: `psql "$NEON_DATABASE_URL" -c "SELECT 1"`
4. Check network/firewall if needed

## CI/CD Integration

### When Schema Changes
```mermaid
graph TD
    A["Edit schema.json"] -->|generate_schema.sh| B["Generate migrations"]
    B -->|git push| C["GitHub Actions"]
    C -->|validate-schema-locally.sh| D{Validation OK?}
    D -->|No| E["Fail CI"]
    D -->|Yes| F["Dry-run on Neon"]
    F --> G["Comment PR with report"]
    G -->|Approve & Merge| H["Apply to Neon"]
    H --> I{Success?}
    I -->|Yes| J["Slack notification"]
    I -->|No| K["Rollback plan"]
```

## Best Practices

1. **Always test locally first**
   ```bash
   ./scripts/validate-schema-locally.sh
   ```

2. **Review migrations in PR**
   - Check SQL syntax
   - Look for breaking changes
   - Verify constraints and defaults

3. **Never force-push after merge**
   - Migrations are immutable once applied
   - Create new migration for changes

4. **Regular exports**
   ```bash
   ./scripts/neon-migrate.sh export
   ```
   Keep weekly backups of schema

5. **Monitor Slack notifications**
   - Deployment success/failures
   - Quick alerting for issues

## Advanced: Conditional Migrations

For backwards-compatible changes:

```sql
-- 0003_add_optional_column.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name='users' AND column_name='new_field'
  ) THEN
    ALTER TABLE users ADD COLUMN new_field TEXT;
  END IF;
END $$;
```

## Rollback Strategy

If schema change causes issues:

1. **Identify problem**
   ```bash
   ./scripts/neon-migrate.sh status
   ```

2. **Create hotfix migration**
   ```bash
   # 0004_rollback_problematic_change.sql
   # Implement inverse of change
   ```

3. **Apply hotfix**
   ```bash
   ./scripts/neon-migrate.sh apply
   ```

4. **Never delete migrations** - create new ones instead

## Support

For Neon-specific issues:
- https://neon.tech/docs
- https://console.neon.tech/
- Database logs available in Neon console
