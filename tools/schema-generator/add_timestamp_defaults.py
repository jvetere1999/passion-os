#!/usr/bin/env python3
"""
Add DEFAULT NOW() to all timestamp fields that need it.
Run this once to fix the schema.json file.
"""
import json
from pathlib import Path

# Fields that should get NOW() default
TIMESTAMP_FIELDS_WITH_NOW = [
    'created_at',
    'updated_at',
    'granted_at',
    'earned_at',
    'completed_at',
    'started_at',
    'added_at',
    'accepted_at',
    'achieved_at',
    'computed_at',
]

# Fields that should NOT get NOW() default (they're set explicitly)
EXPLICIT_TIMESTAMP_FIELDS = [
    'expires_at',
    'expires',
    'start_time',
    'end_time',
    'ended_at',
    'finished_at',
    'completed_date',
    'date',
    'target_date',
    'due_date',
    'birth_date',
]

def main():
    script_dir = Path(__file__).parent
    schema_path = script_dir / 'schema.json'
    
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    changes = []
    
    for table_name, table_def in schema['tables'].items():
        for field_name, field_def in table_def['fields'].items():
            # Check if it's a timestamp field without a default
            is_timestamp = field_def.get('type') in ['TIMESTAMPTZ', 'TIMESTAMP', 'DATE']
            is_not_nullable = field_def.get('nullable') == False
            has_no_default = 'default' not in field_def
            
            if is_timestamp and is_not_nullable and has_no_default:
                # Determine if it should get NOW() default
                should_add_now = any(pattern in field_name for pattern in TIMESTAMP_FIELDS_WITH_NOW)
                is_explicit = any(pattern in field_name for pattern in EXPLICIT_TIMESTAMP_FIELDS)
                
                if should_add_now and not is_explicit:
                    field_def['default'] = 'NOW()'
                    changes.append(f"{table_name}.{field_name}")
    
    # Write updated schema
    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ Added NOW() defaults to {len(changes)} fields:")
    for change in sorted(changes):
        print(f"  - {change}")

if __name__ == '__main__':
    main()
