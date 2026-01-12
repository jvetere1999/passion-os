#!/usr/bin/env python3
"""
Add DEFAULT NOW() to all updated_at fields.
Run this after add_timestamp_defaults.py.
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
            if field_name == 'updated_at' and 'default' not in field_def:
                field_def['default'] = 'NOW()'
                changes.append(f"{table_name}.{field_name}")
    
    # Write updated schema
    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ Added NOW() defaults to {len(changes)} updated_at fields:")
    for change in sorted(changes):
        print(f"  - {change}")

if __name__ == '__main__':
    main()
