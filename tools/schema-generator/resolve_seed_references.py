#!/usr/bin/env python3
"""
Resolve seed data references from schema.json

Converts human-readable seed references (workout_name, section_name, exercise_name)
into actual database UUIDs, generating deterministic UUIDs for reproducibility.

The output is a modified schema.json with all references resolved to actual IDs.
"""
import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent.parent
SCHEMA_FILE = REPO_ROOT / 'app/database/config/schema.json'

# UUID namespace for deterministic ID generation
SEED_NAMESPACE = uuid.UUID('11111111-1111-1111-1111-111111111111')


def generate_deterministic_uuid(namespace: str, name: str) -> str:
    """Generate a deterministic UUID for a seed record"""
    return str(uuid.uuid5(SEED_NAMESPACE, f"{namespace}:{name}"))


def resolve_seed_references(schema: dict) -> dict:
    """Resolve all seed references to actual IDs"""
    seeds = schema.get('seeds', {})
    if not seeds:
        return schema
    
    # First pass: Generate IDs and build lookup tables
    lookup_tables: Dict[str, Dict[str, str]] = {}
    
    for table_name in ['workouts', 'exercise_definitions', 'workout_sections', 'workout_exercises']:
        if table_name not in seeds:
            continue
        
        seed_def = seeds[table_name]
        lookup_tables[table_name] = {}
        
        records = seed_def.get('records', [])
        unique_key = seed_def.get('unique_key')
        
        for i, record in enumerate(records):
            # Generate deterministic ID if not present
            if 'id' not in record:
                if isinstance(unique_key, list):
                    key_values = tuple(str(record.get(k, '')) for k in unique_key)
                    record_id = generate_deterministic_uuid(table_name, '|'.join(key_values))
                else:
                    record_id = generate_deterministic_uuid(table_name, str(i))
                record['id'] = record_id
            
            # Build lookup: key -> id
            if isinstance(unique_key, list):
                for key_col in unique_key:
                    lookup_key = record.get(key_col)
                    if lookup_key:
                        # Store both individual keys and combined keys
                        lookup_tables[table_name][f"{key_col}={lookup_key}"] = record.get('id')
            elif isinstance(unique_key, str):
                lookup_key = record.get(unique_key)
                if lookup_key:
                    lookup_tables[table_name][lookup_key] = record.get('id')
    
    # Second pass: Resolve references
    if 'workout_sections' in seeds:
        seed_def = seeds['workout_sections']
        records = seed_def.get('records', [])
        references = seed_def.get('references', {})
        
        for record in records:
            # Resolve workout_name -> workout_id
            if 'workout_name' in record:
                workout_name = record['workout_name']
                # Look for this in workouts seed
                if 'workouts' in lookup_tables:
                    for lookup_key, workout_id in lookup_tables['workouts'].items():
                        if lookup_key.startswith('name='):
                            name = lookup_key.replace('name=', '')
                            if name == workout_name:
                                record['workout_id'] = workout_id
                                break
                
                # Remove the reference field
                del record['workout_name']
    
    if 'workout_exercises' in seeds:
        seed_def = seeds['workout_exercises']
        records = seed_def.get('records', [])
        
        for record in records:
            # Resolve workout_name -> workout_id
            if 'workout_name' in record:
                workout_name = record['workout_name']
                if 'workouts' in lookup_tables:
                    for lookup_key, workout_id in lookup_tables['workouts'].items():
                        if lookup_key.startswith('name='):
                            name = lookup_key.replace('name=', '')
                            if name == workout_name:
                                record['workout_id'] = workout_id
                                break
                del record['workout_name']
            
            # Resolve exercise_name -> exercise_id
            if 'exercise_name' in record:
                exercise_name = record['exercise_name']
                if 'exercise_definitions' in lookup_tables:
                    for lookup_key, exercise_id in lookup_tables['exercise_definitions'].items():
                        if lookup_key.startswith('name='):
                            name = lookup_key.replace('name=', '')
                            if name == exercise_name:
                                record['exercise_id'] = exercise_id
                                break
                del record['exercise_name']
            
            # Resolve section_name -> section_id (with join on workout_id)
            if 'section_name' in record and 'workout_id' in record:
                section_name = record['section_name']
                workout_id = record['workout_id']
                
                # Find the section in workout_sections that matches
                if 'workout_sections' in seeds:
                    ws_records = seeds['workout_sections'].get('records', [])
                    for ws_record in ws_records:
                        if (ws_record.get('name') == section_name and 
                            ws_record.get('workout_id') == workout_id):
                            record['section_id'] = ws_record.get('id')
                            break
                
                del record['section_name']
    
    return schema


def main():
    parser_args = sys.argv[1:] if len(sys.argv) > 1 else []
    output_file = None
    
    if '--output' in parser_args:
        idx = parser_args.index('--output')
        output_file = Path(parser_args[idx + 1]) if idx + 1 < len(parser_args) else None
    
    # Load schema
    if not SCHEMA_FILE.exists():
        print(f"❌ Schema file not found: {SCHEMA_FILE}")
        sys.exit(1)
    
    with open(SCHEMA_FILE) as f:
        schema = json.load(f)
    
    print(f"📋 Resolving seed references in schema v{schema.get('version', 'unknown')}...")
    
    # Resolve references
    resolved_schema = resolve_seed_references(schema)
    
    # Output
    if output_file:
        output_file.write_text(json.dumps(resolved_schema, indent=2))
        print(f"✓ Resolved schema written to {output_file}")
    else:
        print(json.dumps(resolved_schema, indent=2))
    
    print("✓ All seed references resolved successfully")


if __name__ == '__main__':
    main()
