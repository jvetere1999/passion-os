#!/usr/bin/env python3
"""
Create valid RGBA icon files for Tauri build with brand colors.
Generates PNG files with RGBA color space using the Ignition brand red.
"""
import os
from PIL import Image, ImageDraw

icons_dir = "app/watcher/icons"
os.makedirs(icons_dir, exist_ok=True)

# Brand color from the app icon SVG: #DC2626 (ignition red)
BRAND_RED = (220, 38, 38, 255)  # RGBA

# Define output sizes
sizes_with_names = [
    (32, "32x32.png"),
    (128, "128x128.png"),
    (256, "128x128@2x.png"),  # @2x is 2x the size
    (128, "tray_icon.png"),
]

print("Creating brand-colored icon files...")

for size, filename in sizes_with_names:
    # Create RGBA image with brand color
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple flame-like shape using the brand red
    # Circle as a simple placeholder that maintains the brand identity
    margin = size // 8
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill=BRAND_RED
    )
    
    filepath = os.path.join(icons_dir, filename)
    img.save(filepath, "PNG")
    print(f"[OK] Created {filepath} ({size}x{size} RGBA)")

print("\n[OK] All PNG icons created with brand colors in RGBA format")
print("[NOTE] icon.icns and icon.ico must be generated separately on their respective platforms")
