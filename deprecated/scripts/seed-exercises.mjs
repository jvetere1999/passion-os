#!/usr/bin/env node
/**
 * Database Seed Script
 * Seeds exercises from resources/exercises.json into D1
 *
 * Usage:
 *   npm run db:seed           # Seed to remote
 *   npm run db:seed:local     # Seed to local
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BATCH_SIZE = 50; // D1 has limits on batch size

// Read exercises JSON
const exercisesPath = join(process.cwd(), 'resources', 'exercises.json');
const exercises = JSON.parse(readFileSync(exercisesPath, 'utf-8'));

console.log(`Found ${exercises.length} exercises to seed`);

// Generate SQL inserts
const inserts = [];

for (const ex of exercises) {
  const id = `ex_${ex.id}`;
  const name = ex.name.replace(/'/g, "''");
  const description = (ex.instructions?.[0] || '').replace(/'/g, "''").substring(0, 500);
  const category = ex.category || 'strength';
  const muscleGroups = [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])].join(',');
  const equipment = ex.equipment || 'none';

  inserts.push(
    `INSERT OR IGNORE INTO exercises (id, name, description, category, muscle_groups, equipment, is_custom, user_id, created_at) VALUES ('${id}', '${name}', '${description}', '${category}', '${muscleGroups}', '${equipment}', 0, NULL, datetime('now'));`
  );
}

// Split into batches and write to file
const outputPath = join(process.cwd(), '.tmp', 'seed-exercises.sql');
writeFileSync(outputPath, inserts.join('\n'));

console.log(`Generated ${inserts.length} INSERT statements`);
console.log(`Written to: ${outputPath}`);
console.log('');
console.log('To apply to remote database:');
console.log('  wrangler d1 execute ignition --remote --file=.tmp/seed-exercises.sql');
console.log('');
console.log('To apply to local database:');
console.log('  wrangler d1 execute ignition --local --file=.tmp/seed-exercises.sql');

