#!/usr/bin/env python3
"""
Create minimal valid icon files for Tauri build.
These are bare minimum PNG and ICO files that pass validation.
"""
import base64
import os
import struct

# Minimal 1x1 transparent PNG
# This is a valid, minimal PNG file 
MINIMAL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Decode to binary
png_data = base64.b64decode(MINIMAL_PNG_BASE64)

icons_dir = "app/watcher/icons"
os.makedirs(icons_dir, exist_ok=True)

# Write all PNG files  
for filename in ["32x32.png", "128x128.png", "128x128@2x.png", "tray_icon.png"]:
    filepath = os.path.join(icons_dir, filename)
    with open(filepath, "wb") as f:
        f.write(png_data)
    print(f"✓ Created {filepath} ({len(png_data)} bytes)")

# Create minimal ICO file 
# ICO format: 3-byte header + image data 
ico_data = struct.pack("<HHH", 0, 1, 1)  # Reserved, type (icon), count
ico_data += struct.pack("<BBBBIHHI", 1, 1, 0, 0, 1, 32, len(png_data), 22)  # Image entry
ico_data += png_data

ico_path = os.path.join(icons_dir, "icon.ico")
with open(ico_path, "wb") as f:
    f.write(ico_data)
print(f"✓ Created {ico_path} ({len(ico_data)} bytes)")
