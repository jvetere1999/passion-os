#!/usr/bin/env python3
"""
Add gen_random_uuid() default to ALL UUID primary key id columns.
Part of systematic database consistency fix.
"""
import json
from pathlib import Path

def main():
    script_dir = Path(__file__).parent
    schema_path = script_dir / 'schema.json'
    
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    changes = []
    
    for table_name, table_def in schema['tables'].items():
        for field_name, field_def in table_def['fields'].items():
            # Check if it's a UUID primary key without default
            is_uuid = field_def.get('type') == 'UUID'
            is_primary = field_def.get('primary') == True
            has_no_default = 'default' not in field_def
            
            if is_uuid and is_primary and has_no_default:
                field_def['default'] = 'gen_random_uuid()'
                changes.append(f"{table_name}.{field_name}")
    
    # Write updated schema
    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ Added gen_random_uuid() defaults to {len(changes)} UUID primary keys:")
    for change in sorted(changes):
        print(f"  - {change}")

if __name__ == '__main__':
    main()
