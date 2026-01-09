#!/bin/bash
# check-markdown-policy.sh
# Ensures markdown files are only in allowed locations

set -e

echo "Checking markdown file policy..."

# Find markdown files outside allowed locations
violations=$(find . -name "*.md" \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./docs/*" \
  -not -path "./agent/*" \
  -not -name "README.md" \
  2>/dev/null)

if [ -n "$violations" ]; then
  echo "ERROR: Markdown files found outside allowed locations:"
  echo "$violations"
  echo ""
  echo "Allowed locations:"
  echo "  - /README.md (root only)"
  echo "  - /docs/**/*.md"
  echo "  - /agent/**/*.md"
  echo ""
  echo "Please move these files to /docs or /agent"
  exit 1
fi

echo "Markdown policy check passed!"
exit 0

