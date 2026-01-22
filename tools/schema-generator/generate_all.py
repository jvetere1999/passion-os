#!/usr/bin/env python3
"""
Generate Rust, TypeScript, SQL, and Seeds from schema.json

Single source of truth: schema.json defines all table schemas, seed data, and type mappings.

Usage:
  python generate_all.py                    # Generate all with defaults
  python generate_all.py --validate         # Validate schema without generating
  python generate_all.py --dry-run          # Show what would be generated
  python generate_all.py --sql-only         # Only generate SQL files
  python generate_all.py --rust PATH        # Override Rust output path
  python generate_all.py --ts PATH          # Override TypeScript output path
  python generate_all.py --migrations PATH  # Override migrations directory
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent.parent
SCHEMA_FILE = REPO_ROOT / 'app/database/config/schema.json'

# Default output paths (all go directly to app folders)
DEFAULT_PATHS = {
    'rust': REPO_ROOT / 'app/backend/crates/api/src/db/generated.rs',
    'ts': REPO_ROOT / 'app/frontend/src/lib/generated_types.ts',
    'migrations': REPO_ROOT / 'app/backend/migrations',
    'sql_path': REPO_ROOT / 'app/backend/migrations/0001_schema.sql',
    'seeds_path': REPO_ROOT / 'app/backend/migrations/0002_seeds.sql',
    # Archive copies with schema date
    'archive': REPO_ROOT / 'agent/archive/generated',
}

# Rust reserved keywords needing r# prefix
RUST_KEYWORDS = {
    'type', 'match', 'use', 'ref', 'self', 'super', 'crate', 'mod', 
    'move', 'mut', 'pub', 'static', 'trait', 'where', 'async', 'await', 'dyn'
}

# =============================================================================
# DOMAIN ORGANIZATION
# =============================================================================

DOMAINS = {
    "auth": {
        "title": "Authentication & Authorization",
        "tables": [
            "users", "sessions", "accounts", "authenticators", 
            "verification_tokens", "roles", "entitlements", "role_entitlements",
            "user_roles", "oauth_state"
        ]
    },
    "gamification": {
        "title": "Gamification & Progress",
        "tables": [
            "user_progress", "user_wallet", "wallet_transactions",
            "skill_definitions", "user_skills", "streaks",
            "achievement_definitions", "user_achievements",
            "universal_quests", "user_quests", "activity_events"
        ]
    },
    "focus": {
        "title": "Focus Timer & Sessions",
        "tables": ["focus_sessions", "focus_pause_state", "focus_settings"]
    },
    "habits_goals": {
        "title": "Habits & Goals",
        "tables": [
            "habits", "habit_completions", "habit_schedules",
            "goals", "goal_milestones", "goal_progress"
        ]
    },
    "books": {
        "title": "Reading & Books",
        "tables": ["books", "reading_sessions", "book_notes", "book_highlights"]
    },
    "fitness": {
        "title": "Fitness & Exercise",
        "tables": [
            "workout_templates", "workout_exercises", "workout_sessions",
            "workout_sets", "exercise_definitions", "personal_records",
            "daily_calories", "exercise_settings"
        ]
    },
    "learning": {
        "title": "Learning & Courses",
        "tables": [
            "learn_topics", "learn_lessons", "learn_quizzes", "learn_quiz_questions",
            "user_lesson_progress", "user_quiz_attempts"
        ]
    },
    "market": {
        "title": "Shop & Market",
        "tables": ["market_items", "user_inventory", "user_purchases"]
    },
    "calendar": {
        "title": "Calendar & Planning",
        "tables": ["calendar_events", "daily_plans", "daily_reflections"]
    },
    "frames": {
        "title": "Analysis Frames",
        "tables": ["analysis_frame_manifests", "analysis_frame_data", "analysis_events"]
    },
    "music": {
        "title": "Music Analysis",
        "tables": ["music_analyses", "music_sections", "music_key_changes", "music_stems", "music_settings"]
    },
    "sync": {
        "title": "Sync & Settings",
        "tables": ["sync_queue", "user_preferences", "user_settings", "feature_flags"]
    },
    "content": {
        "title": "Content & References",
        "tables": ["infobase_items", "inbox_items", "ideas", "references_library", "tags", "tag_associations"]
    },
    "onboarding": {
        "title": "Onboarding",
        "tables": ["onboarding_flows", "onboarding_steps", "user_onboarding"]
    },
    "admin": {
        "title": "Admin & Platform",
        "tables": ["feedback", "system_stats", "schema_version", "audit_log", "email_templates", "notification_templates"]
    }
}

# =============================================================================
# HELPERS
# =============================================================================

def get_domain_for_table(table_name: str) -> tuple[str, str]:
    """Get (domain_key, domain_title) for a table"""
    for key, domain in DOMAINS.items():
        if table_name in domain['tables']:
            return key, domain['title']
    return "other", "Other Tables"

def rust_field_name(name: str) -> str:
    """Escape Rust reserved keywords"""
    return f"r#{name}" if name in RUST_KEYWORDS else name

def singular_name(plural: str) -> str:
    """Convert plural table name to singular"""
    if plural.endswith('ies'):
        return plural[:-3] + 'y'
    if plural.endswith('es') and not plural.endswith('ses'):
        return plural[:-2]
    if plural.endswith('s') and not plural.endswith('ss'):
        return plural[:-1]
    return plural

def pascal_case(snake: str) -> str:
    """Convert snake_case to PascalCase"""
    return ''.join(word.capitalize() for word in snake.split('_'))

def format_sql_value(val: Any, field_type: str) -> str:
    """Convert Python value to SQL literal"""
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict):
        return f"'{json.dumps(val)}'"
    if isinstance(val, str):
        return f"'{val.replace(chr(39), chr(39)+chr(39))}'"
    return f"'{val}'"

# =============================================================================
# SCHEMA VALIDATION
# =============================================================================

def validate_schema(schema: dict) -> list[str]:
    """Validate schema.json and return list of errors"""
    errors = []
    
    if 'version' not in schema:
        errors.append("Missing 'version' field")
    if 'tables' not in schema:
        errors.append("Missing 'tables' field")
        return errors
    if 'type_mappings' not in schema:
        errors.append("Missing 'type_mappings' field")
        return errors
    
    type_mappings = schema['type_mappings']
    
    for table_name, table_def in schema['tables'].items():
        if 'fields' not in table_def:
            errors.append(f"Table '{table_name}': missing 'fields'")
            continue
        if 'rust_type' not in table_def:
            errors.append(f"Table '{table_name}': missing 'rust_type'")
        if 'ts_type' not in table_def:
            errors.append(f"Table '{table_name}': missing 'ts_type'")
            
        for field_name, field_def in table_def['fields'].items():
            if 'type' not in field_def:
                errors.append(f"Table '{table_name}'.{field_name}: missing 'type'")
            elif field_def['type'] not in type_mappings:
                errors.append(f"Table '{table_name}'.{field_name}: unknown type '{field_def['type']}'")
    
    # Validate seeds reference valid tables and columns
    for seed_table, seed_def in schema.get('seeds', {}).items():
        if seed_table not in schema['tables']:
            errors.append(f"Seed '{seed_table}': table not found in schema")
            continue
        table_fields = schema['tables'][seed_table]['fields']
        reference_fields = set(seed_def.get('references', {}).keys())
        for record in seed_def.get('records', []):
            for col in record.keys():
                # Skip validation for reference fields - they resolve to actual columns
                if col in reference_fields:
                    continue
                if col not in table_fields:
                    errors.append(f"Seed '{seed_table}': column '{col}' not in table schema")
                    break
    
    return errors

# =============================================================================
# GENERATORS
# =============================================================================

class SchemaGenerator:
    def __init__(self, schema: dict):
        self.schema = schema
        self.version = schema.get('version', '0.0.0')
        self.generated_at = schema.get('generated_at', datetime.now().strftime('%Y-%m-%d'))
        self.tables = schema['tables']
        self.type_mappings = schema['type_mappings']
        self.seeds = schema.get('seeds', {})
        
        # Group tables by domain
        self.tables_by_domain: dict[str, list[tuple[str, dict]]] = {}
        for table_name, table_def in self.tables.items():
            domain_key, _ = get_domain_for_table(table_name)
            if domain_key not in self.tables_by_domain:
                self.tables_by_domain[domain_key] = []
            self.tables_by_domain[domain_key].append((table_name, table_def))
        
        # Sort tables within each domain
        for domain_key in self.tables_by_domain:
            self.tables_by_domain[domain_key].sort(key=lambda x: x[0])
    
    # -------------------------------------------------------------------------
    # HELPERS
    # -------------------------------------------------------------------------
    
    def _generate_deterministic_uuid(self, namespace: str, name: str) -> str:
        """Generate deterministic UUID for seed data"""
        import uuid
        seed_namespace = uuid.UUID('11111111-1111-1111-1111-111111111111')
        return str(uuid.uuid5(seed_namespace, f"{namespace}:{name}"))
    
    # -------------------------------------------------------------------------
    # RUST GENERATION
    # -------------------------------------------------------------------------
    
    def _rust_struct(self, table_name: str, table_def: dict) -> list[str]:
        """Generate Rust struct for a table"""
        lines = [
            f"/// Database model for `{table_name}` table",
            "#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]",
            f"pub struct {table_def['rust_type']} {{"
        ]
        for field_name, field_def in table_def['fields'].items():
            rust_type = self.type_mappings[field_def['type']]['rust']
            if field_def.get('nullable'):
                rust_type = f"Option<{rust_type}>"
            lines.append(f"    pub {rust_field_name(field_name)}: {rust_type},")
        lines.append("}")
        return lines
    
    def generate_rust(self) -> str:
        """Generate organized Rust module"""
        lines = [
            f"// GENERATED FROM schema.json v{self.version} - DO NOT EDIT",
            f"// Generated: {self.generated_at}",
            "//",
            "// Source of truth for database types. Import from here.",
            "//",
            "// Domains:",
        ]
        
        # TOC
        for domain in DOMAINS.values():
            lines.append(f"//   - {domain['title']}")
        lines.append("//   - Other Tables")
        lines.extend([
            "",
            "#![allow(dead_code)]",
            "",
            "use chrono::{DateTime, NaiveDate, Utc};",
            "use serde::{Deserialize, Serialize};",
            "use sqlx::FromRow;",
            "use uuid::Uuid;",
            ""
        ])
        
        # Generate by domain
        for domain_key, domain in DOMAINS.items():
            tables = self.tables_by_domain.get(domain_key, [])
            if not tables:
                continue
            lines.extend([
                "// " + "=" * 77,
                f"// {domain['title'].upper()}",
                "// " + "=" * 77,
                ""
            ])
            for table_name, table_def in tables:
                lines.extend(self._rust_struct(table_name, table_def))
                lines.append("")
        
        # Other tables
        if "other" in self.tables_by_domain:
            lines.extend([
                "// " + "=" * 77,
                "// OTHER TABLES",
                "// " + "=" * 77,
                ""
            ])
            for table_name, table_def in self.tables_by_domain["other"]:
                lines.extend(self._rust_struct(table_name, table_def))
                lines.append("")
        
        # Type aliases
        lines.extend([
            "// " + "=" * 77,
            "// TYPE ALIASES",
            "// " + "=" * 77,
            ""
        ])
        for table_name, table_def in sorted(self.tables.items()):
            struct_name = table_def['rust_type']
            singular = pascal_case(singular_name(table_name))
            if singular != struct_name:
                lines.append(f"pub type {singular} = {struct_name};")
        
        lines.extend([
            "",
            f"/// Schema version",
            f'pub const SCHEMA_VERSION: &str = "{self.version}";',
            ""
        ])
        
        return '\n'.join(lines)
    
    # -------------------------------------------------------------------------
    # TYPESCRIPT GENERATION
    # -------------------------------------------------------------------------
    
    def _ts_interface(self, table_name: str, table_def: dict) -> list[str]:
        """Generate TypeScript interface for a table"""
        lines = [
            f"/** Database model for `{table_name}` table */",
            f"export interface {table_def['ts_type']} {{"
        ]
        for field_name, field_def in table_def['fields'].items():
            ts_type = self.type_mappings[field_def['type']]['typescript']
            optional = '?' if field_def.get('nullable') else ''
            lines.append(f"  {field_name}{optional}: {ts_type};")
        lines.append("}")
        return lines
    
    def generate_typescript(self) -> str:
        """Generate organized TypeScript module"""
        lines = [
            f"// GENERATED FROM schema.json v{self.version} - DO NOT EDIT",
            f"// Generated: {self.generated_at}",
            "//",
            "// Source of truth for database types. Import from here.",
            "//",
            "// Domains:",
        ]
        
        for domain in DOMAINS.values():
            lines.append(f"//   - {domain['title']}")
        lines.append("//   - Other Tables")
        lines.append("")
        
        # Generate by domain
        for domain_key, domain in DOMAINS.items():
            tables = self.tables_by_domain.get(domain_key, [])
            if not tables:
                continue
            lines.extend([
                "// " + "=" * 77,
                f"// {domain['title'].upper()}",
                "// " + "=" * 77,
                ""
            ])
            for table_name, table_def in tables:
                lines.extend(self._ts_interface(table_name, table_def))
                lines.append("")
        
        # Other tables
        if "other" in self.tables_by_domain:
            lines.extend([
                "// " + "=" * 77,
                "// OTHER TABLES",
                "// " + "=" * 77,
                ""
            ])
            for table_name, table_def in self.tables_by_domain["other"]:
                lines.extend(self._ts_interface(table_name, table_def))
                lines.append("")
        
        # Type aliases
        lines.extend([
            "// " + "=" * 77,
            "// TYPE ALIASES",
            "// " + "=" * 77,
            ""
        ])
        for table_name, table_def in sorted(self.tables.items()):
            interface_name = table_def['ts_type']
            singular = pascal_case(singular_name(table_name))
            if singular != interface_name:
                lines.append(f"export type {singular} = {interface_name};")
        
        lines.extend([
            "",
            f'export const SCHEMA_VERSION = "{self.version}";',
            "",
            "// " + "=" * 77,
            "// UTILITY TYPES",
            "// " + "=" * 77,
            "",
            "/** Create input - omit auto-generated fields */",
            "export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;",
            "",
            "/** Update input - all fields optional except id */",
            "export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>> & { id: string };",
            "",
            "/** Paginated response */",
            "export interface PaginatedResponse<T> {",
            "  data: T[];",
            "  total: number;",
            "  page: number;",
            "  pageSize: number;",
            "  hasMore: boolean;",
            "}",
            ""
        ])
        
        return '\n'.join(lines)
    
    # -------------------------------------------------------------------------
    # SQL GENERATION
    # -------------------------------------------------------------------------
    
    def generate_sql(self) -> str:
        """Generate PostgreSQL schema DDL organized by domain"""
        lines = [
            f"-- GENERATED FROM schema.json v{self.version} - DO NOT EDIT",
            f"-- Generated: {self.generated_at}",
            "--",
            "-- PostgreSQL schema for Passion OS",
            "-- Run with: sqlx migrate run",
            "",
            "-- =============================================================================",
            "-- SCHEMA VERSION TRACKING",
            "-- =============================================================================",
            "",
            "CREATE TABLE IF NOT EXISTS schema_version (",
            "    version TEXT PRIMARY KEY,",
            "    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
            "    description TEXT",
            ");",
            "",
            f"INSERT INTO schema_version (version, description)",
            f"VALUES ('{self.version}', 'Generated from schema.json')",
            "ON CONFLICT (version) DO NOTHING;",
            ""
        ]
        
        # Generate tables by domain
        for domain_key, domain in DOMAINS.items():
            tables = self.tables_by_domain.get(domain_key, [])
            if not tables:
                continue
            lines.extend([
                "",
                "-- " + "=" * 77,
                f"-- {domain['title'].upper()}",
                "-- " + "=" * 77,
            ])
            for table_name, table_def in tables:
                lines.append("")
                lines.append(f"CREATE TABLE {table_name} (")
                cols = []
                for field_name, field_def in table_def['fields'].items():
                    pg_type = self.type_mappings[field_def['type']]['postgres']
                    constraints = []
                    if field_def.get('primary'):
                        constraints.append('PRIMARY KEY')
                    if not field_def.get('nullable') and not field_def.get('primary'):
                        constraints.append('NOT NULL')
                    # Add DEFAULT clause if specified
                    if 'default' in field_def:
                        constraints.append(f"DEFAULT {field_def['default']}")
                    col_line = f"    {field_name} {pg_type}"
                    if constraints:
                        col_line += ' ' + ' '.join(constraints)
                    cols.append(col_line)
                lines.append(',\n'.join(cols))
                lines.append(");")
        
        # Other tables
        if "other" in self.tables_by_domain:
            lines.extend([
                "",
                "-- " + "=" * 77,
                "-- OTHER TABLES",
                "-- " + "=" * 77,
            ])
            for table_name, table_def in self.tables_by_domain["other"]:
                lines.append("")
                lines.append(f"CREATE TABLE {table_name} (")
                cols = []
                for field_name, field_def in table_def['fields'].items():
                    pg_type = self.type_mappings[field_def['type']]['postgres']
                    constraints = []
                    if field_def.get('primary'):
                        constraints.append('PRIMARY KEY')
                    if not field_def.get('nullable') and not field_def.get('primary'):
                        constraints.append('NOT NULL')
                    # Add DEFAULT clause if specified
                    if 'default' in field_def:
                        constraints.append(f"DEFAULT {field_def['default']}")
                    col_line = f"    {field_name} {pg_type}"
                    if constraints:
                        col_line += ' ' + ' '.join(constraints)
                    cols.append(col_line)
                lines.append(',\n'.join(cols))
                lines.append(");")
        
        # Constraints and indexes
        lines.extend([
            "",
            "-- " + "=" * 77,
            "-- UNIQUE CONSTRAINTS",
            "-- " + "=" * 77,
            "",
            "-- Single column unique constraints",
            "ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);",
            "ALTER TABLE sessions ADD CONSTRAINT sessions_token_unique UNIQUE (token);",
            "ALTER TABLE skill_definitions ADD CONSTRAINT skill_definitions_key_unique UNIQUE (key);",
            "ALTER TABLE achievement_definitions ADD CONSTRAINT achievement_definitions_key_unique UNIQUE (key);",
            "ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);",
            "ALTER TABLE entitlements ADD CONSTRAINT entitlements_name_unique UNIQUE (name);",
            "ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_flag_name_unique UNIQUE (flag_name);",
            "ALTER TABLE learn_topics ADD CONSTRAINT learn_topics_key_unique UNIQUE (key);",
            "ALTER TABLE onboarding_flows ADD CONSTRAINT onboarding_flows_name_unique UNIQUE (name);",
            "ALTER TABLE market_items ADD CONSTRAINT market_items_key_unique UNIQUE (key);",
            "",
            "-- Composite unique constraints for ON CONFLICT operations",
            "ALTER TABLE accounts ADD CONSTRAINT accounts_provider_account_unique UNIQUE (provider, provider_account_id);",
            "ALTER TABLE focus_pause_state ADD CONSTRAINT focus_pause_state_session_unique UNIQUE (session_id);",
            "ALTER TABLE user_lesson_progress ADD CONSTRAINT user_lesson_progress_unique UNIQUE (user_id, lesson_id);",
            "ALTER TABLE user_drill_stats ADD CONSTRAINT user_drill_stats_unique UNIQUE (user_id, drill_id);",
            "ALTER TABLE user_skills ADD CONSTRAINT user_skills_user_unique UNIQUE (user_id);",
            "ALTER TABLE user_purchases ADD CONSTRAINT user_purchases_unique UNIQUE (user_id, item_id);",
            "ALTER TABLE user_settings ADD CONSTRAINT user_settings_unique UNIQUE (user_id);",
            "ALTER TABLE user_onboarding_state ADD CONSTRAINT user_onboarding_state_user_unique UNIQUE (user_id);",
            "ALTER TABLE user_onboarding_responses ADD CONSTRAINT user_onboarding_responses_unique UNIQUE (user_id, step_id);",
            "ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id);",
            "",
            "-- " + "=" * 77,
            "-- INDEXES",
            "-- " + "=" * 77,
            "",
            "-- Auth",
            "CREATE INDEX idx_sessions_user_id ON sessions(user_id);",
            "CREATE INDEX idx_sessions_token ON sessions(token);",
            "CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);",
            "CREATE INDEX idx_accounts_user_id ON accounts(user_id);",
            "CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);",
            "",
            "-- User data",
            "CREATE INDEX idx_habits_user_id ON habits(user_id);",
            "CREATE INDEX idx_goals_user_id ON goals(user_id);",
            "CREATE INDEX idx_books_user_id ON books(user_id);",
            "CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);",
            "CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);",
            "CREATE INDEX idx_activity_events_user_id ON activity_events(user_id);",
            "CREATE INDEX idx_user_wallet_user_id ON user_wallet(user_id);",
            "CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);",
            "",
            "-- Timestamps",
            "CREATE INDEX idx_activity_events_created_at ON activity_events(created_at);",
            "CREATE INDEX idx_focus_sessions_started_at ON focus_sessions(started_at);",
            "CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at);",
            ""
        ])
        
        return '\n'.join(lines)
    
    # -------------------------------------------------------------------------
    # SEEDS GENERATION
    # -------------------------------------------------------------------------
    
    def generate_seeds(self) -> str:
        """Generate seed data SQL from schema.json seeds section"""
        if not self.seeds:
            return f"-- No seeds defined in schema.json v{self.version}\n"
        
        # First pass: Build ID lookups for reference resolution
        lookup_tables = {}
        for table_name, seed_def in self.seeds.items():
            records = seed_def.get('records', [])
            unique_key = seed_def.get('unique_key')
            
            lookup_tables[table_name] = {}
            for i, record in enumerate(records):
                # Generate or use existing ID
                record_id = record.get('id') or self._generate_deterministic_uuid(table_name, str(i))
                
                # Build lookup entry based on unique key
                if isinstance(unique_key, list):
                    # Multiple column unique key
                    for key_col in unique_key:
                        key_value = record.get(key_col)
                        if key_value:
                            lookup_key = f"{key_col}={key_value}"
                            lookup_tables[table_name][lookup_key] = record_id
                elif isinstance(unique_key, str):
                    # Single column unique key
                    key_value = record.get(unique_key)
                    if key_value:
                        lookup_key = f"{unique_key}={key_value}"
                        lookup_tables[table_name][lookup_key] = record_id
        
        lines = [
            f"-- GENERATED SEEDS FROM schema.json v{self.version}",
            f"-- Generated: {self.generated_at}",
            "--",
            "-- Seed data for Passion OS. Run after schema migration.",
            ""
        ]
        
        # Process seeds in order to handle references
        table_order = ['workouts', 'exercise_definitions', 'workout_sections', 'workout_exercises']
        ordered_seeds = {}
        
        for table in table_order:
            if table in self.seeds:
                ordered_seeds[table] = self.seeds[table]
        
        # Add remaining seeds
        for table, seed_def in self.seeds.items():
            if table not in ordered_seeds:
                ordered_seeds[table] = seed_def
        
        for table_name, seed_def in ordered_seeds.items():
            if table_name not in self.tables:
                continue
            
            table_schema = self.tables[table_name]
            table_fields = table_schema['fields']
            unique_key = seed_def.get('unique_key')
            records = seed_def.get('records', [])
            references = seed_def.get('references', {})
            
            if not records:
                continue
            
            lines.extend([
                f"-- {'=' * 60}",
                f"-- {table_name.upper()} ({len(records)} records)",
                f"-- {'=' * 60}"
            ])
            
            # Build column list - exclude reference fields
            sample = records[0]
            insert_cols = []
            for auto_col in ['id', 'created_at', 'updated_at']:
                if auto_col in table_fields:
                    insert_cols.append(auto_col)
            
            for col in sample.keys():
                # Skip reference fields - we'll use target columns instead
                if col in references:
                    ref_def = references[col]
                    target_col = ref_def['target_column']
                    if target_col in table_fields and target_col not in insert_cols:
                        insert_cols.append(target_col)
                elif col not in insert_cols and col in table_fields:
                    insert_cols.append(col)
            
            lines.append(f"INSERT INTO {table_name} ({', '.join(insert_cols)})")
            lines.append("VALUES")
            
            value_rows = []
            for record in records:
                values = []
                for col in insert_cols:
                    value = None
                    
                    if col == 'id':
                        # Use existing ID or generate one
                        value = record.get('id')
                        if value is None:
                            value = 'gen_random_uuid()'
                            field_type = 'UUID'
                        else:
                            field_type = table_fields.get(col, {}).get('type', 'TEXT')
                        values.append(format_sql_value(value, field_type) if value != 'gen_random_uuid()' else value)
                    elif col in ('created_at', 'updated_at'):
                        values.append('NOW()')
                    else:
                        # Check if this is a target column for a reference
                        is_ref_target = False
                        for ref_field, ref_def in references.items():
                            if ref_def['target_column'] == col:
                                is_ref_target = True
                                # Look up the referenced ID
                                ref_value = record.get(ref_field)
                                ref_table = ref_def['ref_table']
                                ref_column = ref_def['ref_column']
                                
                                if ref_value and ref_table in lookup_tables:
                                    lookup_key = f"{ref_column}={ref_value}"
                                    if lookup_key in lookup_tables[ref_table]:
                                        value = lookup_tables[ref_table][lookup_key]
                                        field_type = table_fields.get(col, {}).get('type', 'TEXT')
                                        values.append(format_sql_value(value, field_type))
                                    else:
                                        values.append('NULL')
                                else:
                                    values.append('NULL')
                                break
                        
                        if not is_ref_target:
                            field_type = table_fields.get(col, {}).get('type', 'TEXT')
                            value = record.get(col)
                            values.append(format_sql_value(value, field_type))
                
                value_rows.append(f"    ({', '.join(values)})")
            
            lines.append(',\n'.join(value_rows))
            lines.append(f"ON CONFLICT ({unique_key}) DO NOTHING;" if unique_key else "ON CONFLICT DO NOTHING;")
            lines.append("")
        
        # Summary
        lines.extend([
            "-- Summary",
            "DO $$",
            "BEGIN"
        ])
        for table_name, seed_def in self.seeds.items():
            count = len(seed_def.get('records', []))
            if count:
                lines.append(f"    RAISE NOTICE '  ✓ {table_name}: {count} records';")
        lines.extend(["END $$;", ""])
        
        return '\n'.join(lines)

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Generate code from schema.json')
    parser.add_argument('--validate', action='store_true', help='Validate schema only')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be generated')
    parser.add_argument('--sql-only', action='store_true', help='Generate only SQL files')
    parser.add_argument('--rust', type=Path, help='Rust output path')
    parser.add_argument('--ts', type=Path, help='TypeScript output path')
    parser.add_argument('--migrations', type=Path, help='Migrations directory')
    parser.add_argument('--no-archive', action='store_true', help='Skip archive copies with schema date')
    args = parser.parse_args()
    
    # Load schema
    if not SCHEMA_FILE.exists():
        print(f"❌ Schema file not found: {SCHEMA_FILE}")
        sys.exit(1)
    
    with open(SCHEMA_FILE) as f:
        schema = json.load(f)
    
    # Validate
    errors = validate_schema(schema)
    if errors:
        print(f"❌ Schema validation failed ({len(errors)} errors):")
        for err in errors:
            print(f"   - {err}")
        sys.exit(1)
    
    if args.validate:
        print(f"✓ Schema v{schema['version']} is valid ({len(schema['tables'])} tables)")
        return
    
    # Generate
    gen = SchemaGenerator(schema)
    
    rust_content = gen.generate_rust()
    ts_content = gen.generate_typescript()
    sql_content = gen.generate_sql()
    seeds_content = gen.generate_seeds()
    
    # Paths - all go directly to app folders
    rust_path = args.rust or DEFAULT_PATHS['rust']
    ts_path = args.ts or DEFAULT_PATHS['ts']
    migrations_dir = args.migrations or DEFAULT_PATHS['migrations']
    sql_path = DEFAULT_PATHS['sql_path']
    seeds_path = DEFAULT_PATHS['seeds_path']
    
    if args.dry_run:
        print(f"Would generate (schema v{schema['version']}):")
        print(f"  Rust:       {rust_path} ({len(rust_content)} bytes)")
        print(f"  TypeScript: {ts_path} ({len(ts_content)} bytes)")
        print(f"  Schema:     {sql_path} ({len(sql_content)} bytes)")
        print(f"  Seeds:      {seeds_path} ({len(seeds_content)} bytes)")
        return
    
    # Ensure directories exist
    rust_path.parent.mkdir(parents=True, exist_ok=True)
    ts_path.parent.mkdir(parents=True, exist_ok=True)
    migrations_dir.mkdir(parents=True, exist_ok=True)
    
    # Write files directly to app folders
    outputs = []
    
    if not args.sql_only:
        # Remove old generated.rs if exists to ensure clean generation
        if rust_path.exists():
            rust_path.unlink()
        rust_path.write_text(rust_content)
        outputs.append(('Rust', rust_path))
        
        # Remove old generated_types.ts if exists to ensure clean generation
        if ts_path.exists():
            ts_path.unlink()
        ts_path.write_text(ts_content)
        outputs.append(('TypeScript', ts_path))
    
    # Remove old migration files if exist to ensure clean generation
    if sql_path.exists():
        sql_path.unlink()
    sql_path.write_text(sql_content)
    outputs.append(('Schema', sql_path))
    
    if seeds_path.exists():
        seeds_path.unlink()
    seeds_path.write_text(seeds_content)
    outputs.append(('Seeds', seeds_path))
    
    # Archive copies with schema version/date
    if not args.no_archive:
        archive_dir = DEFAULT_PATHS['archive']
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        schema_version = schema.get('version', 'unknown')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        archive_prefix = f"v{schema_version}_{timestamp}"
        
        if not args.sql_only:
            archive_rust = archive_dir / f"{archive_prefix}_generated.rs"
            archive_rust.write_text(rust_content)
            
            archive_ts = archive_dir / f"{archive_prefix}_generated_types.ts"
            archive_ts.write_text(ts_content)
        
        archive_sql = archive_dir / f"{archive_prefix}_schema.sql"
        archive_sql.write_text(sql_content)
        
        archive_seeds = archive_dir / f"{archive_prefix}_seeds.sql"
        archive_seeds.write_text(seeds_content)
        
        # Clean up old archives (keep last 5)
        try:
            archive_files = sorted(archive_dir.glob('v*_*.sql'), key=lambda p: p.stat().st_mtime, reverse=True)
            for old_file in archive_files[5:]:
                old_file.unlink()
            # Also clean Rust and TypeScript archives
            for pattern in ['v*_generated.rs', 'v*_generated_types.ts']:
                for old_file in sorted(archive_dir.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)[5:]:
                    old_file.unlink()
        except Exception:
            pass  # Ignore cleanup errors
    
    # Summary
    seed_count = sum(len(s.get('records', [])) for s in schema.get('seeds', {}).values())
    print(f"✓ Generated from schema.json v{schema['version']} ({len(schema['tables'])} tables, {seed_count} seed records)")
    print()
    for label, path in outputs:
        print(f"  {label:12} → {path}")
    
    if not args.no_archive:
        print()
        print(f"  Archive copies → {DEFAULT_PATHS['archive']} (v{schema_version}_{timestamp}_*)")

if __name__ == '__main__':
    main()
