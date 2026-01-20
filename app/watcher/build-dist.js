#!/usr/bin/env node
/**
 * Cross-platform build distribution script
 * Copies built Next.js output from src-frontend/out to ../dist
 * Works on Windows, macOS, and Linux
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, 'src-frontend', 'out');
const dst = path.join(__dirname, '..', 'dist');

console.log(`[build-dist] Copying from: ${src}`);
console.log(`[build-dist] Copying to: ${dst}`);

/**
 * Recursively copy directory
 */
function copyDir(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
    console.log(`[build-dist] Created directory: ${destination}`);
  }

  // Read all files/directories in source
  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const srcFile = path.join(source, file);
    const dstFile = path.join(destination, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcFile, dstFile);
    } else {
      // Copy files
      fs.copyFileSync(srcFile, dstFile);
      console.log(`[build-dist] Copied: ${path.relative(__dirname, dstFile)}`);
    }
  });
}

try {
  if (!fs.existsSync(src)) {
    console.error(`[build-dist] ERROR: Source directory does not exist: ${src}`);
    process.exit(1);
  }

  copyDir(src, dst);
  console.log('[build-dist] ✓ Distribution built successfully');
} catch (error) {
  console.error('[build-dist] ERROR:', error.message);
  process.exit(1);
}
