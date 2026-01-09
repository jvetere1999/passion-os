#!/usr/bin/env node
/**
 * PageSpeed Insights API Script
 *
 * Captures PSI metrics for desktop and mobile
 *
 * Usage:
 *   PSI_API_KEY=your-api-key node scripts/psi.mjs [url]
 *
 * Writes results to .perf/psi-desktop.json and .perf/psi-mobile.json
 */

const TARGET_URL = process.argv[2] || 'https://passion-os.ecent.online';
const API_KEY = process.env.PSI_API_KEY;

if (!API_KEY) {
  console.log('Warning: PSI_API_KEY not set. Using rate-limited anonymous access.');
}

async function runPSI(url, strategy) {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('strategy', strategy);
  apiUrl.searchParams.set('category', 'performance');
  apiUrl.searchParams.set('category', 'accessibility');
  apiUrl.searchParams.set('category', 'best-practices');
  apiUrl.searchParams.set('category', 'seo');

  if (API_KEY) {
    apiUrl.searchParams.set('key', API_KEY);
  }

  console.log(`Running PSI for ${url} (${strategy})...`);

  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    throw new Error(`PSI API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function extractMetrics(result) {
  const lighthouse = result.lighthouseResult;
  if (!lighthouse) {
    return { error: 'No lighthouse result' };
  }

  const categories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};

  return {
    scores: {
      performance: categories.performance?.score ?? null,
      accessibility: categories.accessibility?.score ?? null,
      bestPractices: categories['best-practices']?.score ?? null,
      seo: categories.seo?.score ?? null,
    },
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue ?? null,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue ?? null,
      totalBlockingTime: audits['total-blocking-time']?.numericValue ?? null,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue ?? null,
      speedIndex: audits['speed-index']?.numericValue ?? null,
      interactive: audits['interactive']?.numericValue ?? null,
    },
    serverResponseTime: audits['server-response-time']?.numericValue ?? null,
    mainThreadWork: audits['mainthread-work-breakdown']?.numericValue ?? null,
    bootupTime: audits['bootup-time']?.numericValue ?? null,
  };
}

async function main() {
  console.log(`PageSpeed Insights Test`);
  console.log(`Target URL: ${TARGET_URL}`);
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
  };

  const fs = await import('fs');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), '.perf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const strategy of ['desktop', 'mobile']) {
    try {
      const psiResult = await runPSI(TARGET_URL, strategy);
      const metrics = extractMetrics(psiResult);

      const output = {
        ...results,
        strategy,
        metrics,
        raw: psiResult,
      };

      const outputPath = path.join(outputDir, `psi-${strategy}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(`Results written to ${outputPath}`);

      // Print summary
      console.log(`\n${strategy.toUpperCase()} Summary:`);
      console.log(`  Performance: ${(metrics.scores.performance * 100).toFixed(0)}`);
      console.log(`  LCP: ${metrics.metrics.largestContentfulPaint?.toFixed(0)}ms`);
      console.log(`  TBT: ${metrics.metrics.totalBlockingTime?.toFixed(0)}ms`);
      console.log(`  Server Response: ${metrics.serverResponseTime?.toFixed(0)}ms`);

    } catch (error) {
      console.error(`Error testing ${strategy}:`, error.message);

      const outputPath = path.join(outputDir, `psi-${strategy}.json`);
      fs.writeFileSync(outputPath, JSON.stringify({
        ...results,
        strategy,
        error: error.message,
      }, null, 2));
    }
  }
}

main().catch(console.error);

