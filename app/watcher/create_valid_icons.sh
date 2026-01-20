#!/bin/bash
# Create minimal valid PNG icon files using base64

cd /Users/Shared/passion-os-next/app/watcher/icons

# Minimal 1x1 transparent PNG (valid PNG file)
PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Decode and write PNG files
for file in 32x32.png 128x128.png 128x128@2x.png tray_icon.png; do
    echo "$PNG_BASE64" | base64 -d > "$file"
    echo "Created $file"
done

# Create a minimal ICO file (just copy PNG data with ICO header bytes)
# ICO header: 00 00 01 00 01 00 20 20 00 01 00 18 04 00 36 00 00 00 16 00 00 00
ICO_HEADER="0000010001002020000100180400360000001600000028000000200000004000000001001800000000000001000000000000000000000000000000000000FFFFFF"

echo "$ICO_HEADER" | xxd -r -p > icon.ico
echo "Created icon.ico"

ls -lh *.png *.ico
