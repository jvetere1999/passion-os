---
name: schema-update-trigger
description: Trigger when the user asks to update the schema/migrations from schema.json (e.g., “update the schema”, “generate incremental migration”), guiding a manual, non-auto-run workflow that diffs schema.json, writes the next 000<n>.sql, and updates changes/changes.json without running on push.
---

# Schema Update Trigger

Use this skill when the user explicitly wants to generate an incremental migration from `schema.json`. This is a manual, opt-in flow; do not run in CI or automatically on push.

## Paths
- schema source: `app/database/config/schema.json`
- master schema snapshots: `tools/schema-generator/master_schema/` (e.g., `v2.0.0.json`)
- change log: `tools/schema-generator/changes/changes.json`
- migrations out: `app/backend/migrations/000<n>_incremental_update.sql`

## One-shot command (manual)
Run from repo root; this only generates files, it does not apply migrations:

```bash
python - <<'PY'
from pathlib import Path
import sys
sys.path.append("tools/schema-generator")
from generate_update import generate_incremental_update

result = generate_incremental_update(
    new_schema_path=Path("app/database/config/schema.json"),
    master_schema_dir=Path("tools/schema-generator/master_schema"),
    changes_log_path=Path("tools/schema-generator/changes/changes.json"),
    migrations_output_dir=Path("app/backend/migrations"),
)
print(result)
PY
```

## Workflow
1) Confirm intent and current schema changes.
2) Ensure `tools/schema-generator/changes/changes.json` exists (use the template in `references/changes-template.json` if missing; set `next_migration_number` to current last + 1).
3) Run the one-shot command above.
4) Review generated `000<n>_incremental_update.sql` and the appended entries in `changes/changes.json`.
5) Commit the new migration + updated change log + updated master schema snapshot if touched.

## Safeguards
- Do not auto-run in CI/CD; this is manual only.
- The generator only writes files—no DB changes are applied.
- If no changes are detected, it will exit with a warning and no migration.
