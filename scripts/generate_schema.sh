#!/bin/bash
# Convenience wrapper for schema generator
cd "$(dirname "$0")/tools/schema-generator" && python3 generate_all.py "$@"
