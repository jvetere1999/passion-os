#!/usr/bin/env node
/**
 * Current State Snapshot Generator
 * Generates docs/status/Current_State_Snapshot.md deterministically
 *
 * Usage: npx tsx scripts/generate-current-state.ts
 *
 * Output:
 * - Feature flag table (from src/lib/flags/index.ts)
 * - Today logic module status (from src/lib/today/)
 * - Database migration status (from migrations/)
 * - Build/test status (from last run)
 *
 * No secrets, no runtime data. Pure static analysis.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, basename } from "path";

const ROOT = process.cwd();
const OUTPUT_PATH = join(ROOT, "docs/status/Current_State_Snapshot.md");

interface FlagInfo {
  name: string;
  default: boolean;
  description: string;
}

interface ModuleInfo {
  name: string;
  testCount: number;
  hasTests: boolean;
}

interface MigrationInfo {
  version: number;
  name: string;
  filename: string;
}

/**
 * Extract flag info from src/lib/flags/index.ts
 */
function extractFlags(): FlagInfo[] {
  const flagsPath = join(ROOT, "src/lib/flags/index.ts");
  if (!existsSync(flagsPath)) {
    return [];
  }

  const content = readFileSync(flagsPath, "utf-8");
  const flags: FlagInfo[] = [];

  // Match flag definitions in FLAGS object
  const flagRegex = /\/\*\*\s*([\s\S]*?)\*\/\s*(\w+):\s*(true|false)/g;
  let match;

  while ((match = flagRegex.exec(content)) !== null) {
    const comment = match[1];
    const name = match[2];
    const defaultValue = match[3] === "true";

    // Extract first line of description
    const descMatch = comment.match(/\*\s*(.+?)(?:\n|When)/);
    const description = descMatch ? descMatch[1].trim() : "";

    if (name.startsWith("TODAY_")) {
      flags.push({ name, default: defaultValue, description });
    }
  }

  return flags;
}

/**
 * Get Today logic modules from src/lib/today/
 */
function getTodayModules(): ModuleInfo[] {
  const todayPath = join(ROOT, "src/lib/today");
  if (!existsSync(todayPath)) {
    return [];
  }

  const modules: ModuleInfo[] = [];
  const files = readdirSync(todayPath);

  for (const file of files) {
    if (file.endsWith(".ts") && !file.startsWith("index")) {
      const name = file.replace(".ts", "");
      const testPath = join(todayPath, "__tests__", `${name}.test.ts`);
      const hasTests = existsSync(testPath);

      let testCount = 0;
      if (hasTests) {
        const testContent = readFileSync(testPath, "utf-8");
        const itMatches = testContent.match(/\bit\(/g);
        testCount = itMatches ? itMatches.length : 0;
      }

      modules.push({ name, hasTests, testCount });
    }
  }

  return modules;
}

/**
 * Get migrations from migrations/
 */
function getMigrations(): MigrationInfo[] {
  const migrationsPath = join(ROOT, "migrations");
  if (!existsSync(migrationsPath)) {
    return [];
  }

  const files = readdirSync(migrationsPath)
    .filter(f => f.endsWith(".sql"))
    .sort();

  return files.map(filename => {
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (match) {
      return {
        version: parseInt(match[1], 10),
        name: match[2],
        filename
      };
    }
    return { version: 0, name: filename, filename };
  });
}

/**
 * Get current DB version from backup route
 */
function getCurrentDBVersion(): { version: number; name: string } {
  const backupPath = join(ROOT, "src/app/api/admin/backup/route.ts");
  if (!existsSync(backupPath)) {
    return { version: 0, name: "unknown" };
  }

  const content = readFileSync(backupPath, "utf-8");
  const versionMatch = content.match(/CURRENT_DB_VERSION\s*=\s*(\d+)/);
  const nameMatch = content.match(/CURRENT_DB_VERSION_NAME\s*=\s*["']([^"']+)["']/);

  return {
    version: versionMatch ? parseInt(versionMatch[1], 10) : 0,
    name: nameMatch ? nameMatch[1] : "unknown"
  };
}

/**
 * Count total tests
 */
function countTests(): number {
  const testDirs = [
    join(ROOT, "src/lib/today/__tests__"),
    join(ROOT, "src/lib/db/__tests__"),
    join(ROOT, "src/lib/data/__tests__"),
    join(ROOT, "src/lib/themes/__tests__"),
    join(ROOT, "src/lib/storage/__tests__"),
    join(ROOT, "src/lib/auth/__tests__"),
    join(ROOT, "src/lib/perf/__tests__"),
  ];

  let total = 0;

  for (const dir of testDirs) {
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith(".test.ts"));
    for (const file of files) {
      const content = readFileSync(join(dir, file), "utf-8");
      const itMatches = content.match(/\bit\(/g);
      total += itMatches ? itMatches.length : 0;
    }
  }

  return total;
}

/**
 * Generate the markdown snapshot
 */
function generateSnapshot(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const flags = extractFlags();
  const modules = getTodayModules();
  const migrations = getMigrations();
  const dbVersion = getCurrentDBVersion();
  const testCount = countTests();

  const lines: string[] = [
    "# Current State Snapshot",
    "",
    `**Generated:** ${dateStr}`,
    `**Generator:** scripts/generate-current-state.ts`,
    "",
    "---",
    "",
    "## Feature Flags",
    "",
    "| Flag | Default | Description |",
    "|------|---------|-------------|",
  ];

  for (const flag of flags) {
    lines.push(`| ${flag.name} | ${flag.default ? "ON" : "OFF"} | ${flag.description} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Today Logic Modules");
  lines.push("");
  lines.push("| Module | Tests | Count |");
  lines.push("|--------|-------|-------|");

  for (const mod of modules) {
    const testStatus = mod.hasTests ? "YES" : "NO";
    lines.push(`| ${mod.name} | ${testStatus} | ${mod.testCount} |`);
  }

  const totalModuleTests = modules.reduce((sum, m) => sum + m.testCount, 0);
  lines.push(`| **Total** | - | **${totalModuleTests}** |`);

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Database Status");
  lines.push("");
  lines.push(`**Current Version:** ${dbVersion.version} (${dbVersion.name})`);
  lines.push("");
  lines.push("### Migrations");
  lines.push("");
  lines.push("| Version | Name |");
  lines.push("|---------|------|");

  for (const mig of migrations.slice(-5)) {
    lines.push(`| ${mig.version} | ${mig.name} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Test Summary");
  lines.push("");
  lines.push(`**Total Unit Tests:** ${testCount}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Directory Structure");
  lines.push("");
  lines.push("```");
  lines.push("src/lib/");
  lines.push("  flags/          # Feature flag definitions");
  lines.push("  today/          # Today Starter Engine logic");
  lines.push("  db/             # D1 repositories");
  lines.push("  ui/             # UI contract and components");
  lines.push("docs/");
  lines.push("  status/         # Current state snapshot");
  lines.push("  today/          # Today-related specifications");
  lines.push("  ops/            # Operations and migrations");
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Auto-generated. Do not edit manually.*");
  lines.push("");

  return lines.join("\n");
}

// Main execution
const snapshot = generateSnapshot();
writeFileSync(OUTPUT_PATH, snapshot);
console.log(`Generated: ${OUTPUT_PATH}`);

