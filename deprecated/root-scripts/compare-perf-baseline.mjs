#!/usr/bin/env node

/**
 * Compare Performance Baseline
 *
 * Compares current perf report against baseline and reports regressions.
 * Exit code 1 if significant regressions detected.
 *
 * Usage:
 *   node scripts/compare-perf-baseline.mjs
 *
 * Environment:
 *   PERF_REGRESSION_THRESHOLD - Percent increase to flag as regression (default: 50)
 */

import fs from 'fs';
import path from 'path';

const THRESHOLD_PERCENT = parseInt(process.env.PERF_REGRESSION_THRESHOLD || '50', 10);

const baselinePath = path.join(process.cwd(), 'tests', 'fixtures', 'reference-tracks-perf-baseline.json');
const reportPath = path.join(process.cwd(), '.tmp', 'perf-report.json');

function main() {
  console.log('📊 Reference Tracks Performance Comparison\n');
  console.log(`Threshold: ${THRESHOLD_PERCENT}% regression is flagged\n`);

  // Load baseline
  if (!fs.existsSync(baselinePath)) {
    console.error('❌ Baseline file not found:', baselinePath);
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  console.log(`Baseline version: ${baseline.version}`);
  console.log(`Baseline timestamp: ${baseline.timestamp}\n`);

  // Load current report
  if (!fs.existsSync(reportPath)) {
    console.warn('⚠️  No perf report found at:', reportPath);
    console.log('Run the golden suite first: npm run test:golden\n');
    process.exit(0); // Not an error, just no data
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  console.log(`Report timestamp: ${report.timestamp}\n`);

  if (!report.metrics || Object.keys(report.metrics).length === 0) {
    console.warn('⚠️  No metrics in report');
    process.exit(0);
  }

  // Compare
  let regressions = 0;
  const results = [];

  for (const [metricId, value] of Object.entries(report.metrics)) {
    const baselineMetric = baseline.measurements[metricId];

    if (!baselineMetric) {
      results.push({
        metric: metricId,
        current: value,
        baseline: 'N/A',
        status: '🆕 NEW',
      });
      continue;
    }

    const baselineP95 = baselineMetric.p95;
    const percentChange = ((value - baselineP95) / baselineP95) * 100;

    let status;
    if (percentChange > THRESHOLD_PERCENT) {
      status = `🔴 REGRESSION (+${percentChange.toFixed(1)}%)`;
      regressions++;
    } else if (percentChange > 0) {
      status = `🟡 SLOWER (+${percentChange.toFixed(1)}%)`;
    } else if (percentChange < -20) {
      status = `🟢 FASTER (${percentChange.toFixed(1)}%)`;
    } else {
      status = '✅ OK';
    }

    results.push({
      metric: metricId,
      current: `${value}ms`,
      baseline: `${baselineP95}ms (p95)`,
      status,
    });
  }

  // Print table
  console.log('Metric          | Current    | Baseline   | Status');
  console.log('----------------|------------|------------|------------------');

  for (const row of results) {
    const metric = row.metric.padEnd(15);
    const current = String(row.current).padEnd(10);
    const baseline = String(row.baseline).padEnd(10);
    console.log(`${metric} | ${current} | ${baseline} | ${row.status}`);
  }

  console.log('\n');

  // Summary
  if (regressions > 0) {
    console.error(`❌ ${regressions} regression(s) detected!`);
    console.error('Review the metrics above and investigate performance issues.');
    process.exit(1);
  } else {
    console.log('✅ No significant regressions detected');
    process.exit(0);
  }
}

main();
