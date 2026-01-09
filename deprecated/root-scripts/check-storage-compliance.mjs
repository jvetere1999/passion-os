#!/usr/bin/env node
/**
 * Storage Compliance Check
 * Scans source files for forbidden localStorage/sessionStorage usage
 *
 * Usage: node scripts/check-storage-compliance.mjs
 *
 * Exit codes:
 *   0 = All checks pass
 *   1 = Violations found
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

// ============================================
// Configuration
// ============================================

// Forbidden localStorage keys that affect behavior
const FORBIDDEN_KEYS = [
  // These should use D1 instead
  "passion_wallet_v1",
  "passion_rewards_v1",
  "passion_purchases_v1",
  // Note: focus_paused_state is allowed as cache with D1 fallback
  // "focus_paused_state",
];

// Patterns that indicate potentially forbidden usage
const WARNING_PATTERNS = [
  // Direct wallet/balance manipulation
  /localStorage\.(get|set)Item\(['"](wallet|balance|purchases|rewards)/i,
  // Direct quest progress without API
  /localStorage\.(get|set)Item\(['"]quest.*progress/i,
];

// Files/directories to skip
const SKIP_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  ".tmp",
];

// File extensions to check
const CHECK_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

// ============================================
// Scanner
// ============================================

function scanFile(filePath) {
  const violations = [];
  const warnings = [];

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for forbidden keys
      for (const key of FORBIDDEN_KEYS) {
        if (line.includes(`"${key}"`) || line.includes(`'${key}'`)) {
          violations.push({
            file: filePath,
            line: lineNum,
            key,
            snippet: line.trim().substring(0, 100),
          });
        }
      }

      // Check for warning patterns
      for (const pattern of WARNING_PATTERNS) {
        if (pattern.test(line)) {
          warnings.push({
            file: filePath,
            line: lineNum,
            pattern: pattern.toString(),
            snippet: line.trim().substring(0, 100),
          });
        }
      }
    });
  } catch (err) {
    // Skip files that can't be read
  }

  return { violations, warnings };
}

function scanDirectory(dirPath, results = { violations: [], warnings: [] }) {
  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      if (SKIP_DIRS.includes(entry)) continue;

      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, results);
      } else if (stat.isFile()) {
        const ext = entry.substring(entry.lastIndexOf("."));
        if (CHECK_EXTENSIONS.includes(ext)) {
          const fileResults = scanFile(fullPath);
          results.violations.push(...fileResults.violations);
          results.warnings.push(...fileResults.warnings);
        }
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }

  return results;
}

// ============================================
// Main
// ============================================

function main() {
  console.log("Storage Compliance Check");
  console.log("========================\n");

  const srcPath = join(process.cwd(), "src");
  const results = scanDirectory(srcPath);

  // Report violations
  if (results.violations.length > 0) {
    console.log("VIOLATIONS (must fix):\n");
    for (const v of results.violations) {
      console.log(`  ${relative(process.cwd(), v.file)}:${v.line}`);
      console.log(`    Key: ${v.key}`);
      console.log(`    Code: ${v.snippet}`);
      console.log();
    }
  } else {
    console.log("No forbidden key violations found.\n");
  }

  // Report warnings
  if (results.warnings.length > 0) {
    console.log("WARNINGS (review recommended):\n");
    for (const w of results.warnings) {
      console.log(`  ${relative(process.cwd(), w.file)}:${w.line}`);
      console.log(`    Pattern: ${w.pattern}`);
      console.log(`    Code: ${w.snippet}`);
      console.log();
    }
  }

  // Summary
  console.log("Summary:");
  console.log(`  Violations: ${results.violations.length}`);
  console.log(`  Warnings: ${results.warnings.length}`);

  // Exit with error if violations found
  if (results.violations.length > 0) {
    console.log("\nFAILED: Fix violations before committing.");
    process.exit(1);
  }

  console.log("\nPASSED: No forbidden storage keys found.");
  process.exit(0);
}

main();

