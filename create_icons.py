#!/usr/bin/env python3
import os
import struct

# Create icons directory
icons_dir = "./icons"
os.makedirs(icons_dir, exist_ok=True)

# Minimal valid 1x1 transparent PNG (binary)
# This is the raw bytes of a 1x1 transparent PNG
png_bytes = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001"
    "0802000000907753de0000000a49444154789c6300010000"
    "05000100000a000a2a9f0d0a"
)

# Write tray_icon.png
with open(os.path.join(icons_dir, "tray_icon.png"), "wb") as f:
    f.write(png_bytes)

# Create minimal ICO file (32x32 icon)
# ICO file structure: header + image data
ico_bytes = bytes.fromhex(
    "0000010001002020000100180400360000001600000028"
    "000000200000004000000001001800000000000001000000"
    "00000000000000000000000000000000ffffff0000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000000000000000000000"
    "00000000000000000000000000000000"
)

# Write icon.ico
with open(os.path.join(icons_dir, "icon.ico"), "wb") as f:
    f.write(ico_bytes)

# List files
print("Icons created:")
for f in os.listdir(icons_dir):
    path = os.path.join(icons_dir, f)
    size = os.path.getsize(path)
    print(f"  {f}: {size} bytes")
