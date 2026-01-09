#!/usr/bin/env node
/**
 * Performance Baseline Script
 *
 * Hits suspected slow SSR/API routes with representative requests
 * to measure baseline latency, call counts, and timing breakdown.
 *
 * Usage:
 *   node scripts/repro.mjs [baseUrl]
 *
 * Writes results to .perf/baseline.json
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const ITERATIONS = 5;

// Routes to test
const TEST_ROUTES = [
  { path: '/api/focus/active', method: 'GET', name: 'focus-active', auth: true },
  { path: '/api/daily-plan', method: 'GET', name: 'daily-plan', auth: true },
  { path: '/api/quests', method: 'GET', name: 'quests', auth: true },
  { path: '/api/habits', method: 'GET', name: 'habits', auth: true },
  { path: '/api/focus?stats=true&period=day', method: 'GET', name: 'focus-stats', auth: true },
  { path: '/today', method: 'GET', name: 'today-page', auth: true, isPage: true },
  { path: '/focus', method: 'GET', name: 'focus-page', auth: true, isPage: true },
  { path: '/', method: 'GET', name: 'landing', auth: false, isPage: true },
];

// Session cookie for authenticated requests (set via env or args)
const SESSION_COOKIE = process.env.SESSION_COOKIE || '';

async function measureRoute(route) {
  const results = [];
  const headers = {
    'x-perf-debug': '1',
    'Accept': route.isPage ? 'text/html' : 'application/json',
  };

  if (route.auth && SESSION_COOKIE) {
    headers['Cookie'] = SESSION_COOKIE;
  }

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    try {
      const response = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        headers,
      });

      const end = performance.now();
      const latency = end - start;

      const serverTiming = response.headers.get('server-timing') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

      // Parse Server-Timing header
      const timings = {};
      if (serverTiming) {
        serverTiming.split(',').forEach(part => {
          const match = part.trim().match(/^(\w+);dur=([0-9.]+)/);
          if (match) {
            timings[match[1]] = parseFloat(match[2]);
          }
        });
      }

      results.push({
        iteration: i + 1,
        status: response.status,
        latency,
        contentLength,
        timings,
      });
    } catch (error) {
      results.push({
        iteration: i + 1,
        error: error.message,
        latency: 0,
      });
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 100));
  }

  return results;
}

function calculateStats(results) {
  const successful = results.filter(r => !r.error);
  if (successful.length === 0) {
    return { error: 'All requests failed' };
  }

  const latencies = successful.map(r => r.latency).sort((a, b) => a - b);
  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);

  return {
    count: successful.length,
    p50: latencies[p50Index],
    p95: latencies[Math.min(p95Index, latencies.length - 1)],
    min: latencies[0],
    max: latencies[latencies.length - 1],
    avgContentLength: successful.reduce((sum, r) => sum + r.contentLength, 0) / successful.length,
    timings: aggregateTimings(successful),
    errorCount: results.length - successful.length,
  };
}

function aggregateTimings(results) {
  const timingKeys = new Set();
  results.forEach(r => {
    if (r.timings) {
      Object.keys(r.timings).forEach(k => timingKeys.add(k));
    }
  });

  const aggregated = {};
  timingKeys.forEach(key => {
    const values = results.filter(r => r.timings?.[key]).map(r => r.timings[key]);
    if (values.length > 0) {
      values.sort((a, b) => a - b);
      aggregated[key] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.min(Math.floor(values.length * 0.95), values.length - 1)],
      };
    }
  });

  return aggregated;
}

async function main() {
  console.log(`Performance Baseline Test`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Session cookie: ${SESSION_COOKIE ? 'provided' : 'NOT PROVIDED (auth routes will fail)'}`);
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    iterations: ITERATIONS,
    routes: {},
  };

  for (const route of TEST_ROUTES) {
    console.log(`Testing ${route.name} (${route.path})...`);
    const routeResults = await measureRoute(route);
    const stats = calculateStats(routeResults);

    results.routes[route.name] = {
      path: route.path,
      method: route.method,
      auth: route.auth,
      isPage: route.isPage || false,
      raw: routeResults,
      stats,
    };

    if (stats.error) {
      console.log(`  ERROR: ${stats.error}`);
    } else {
      console.log(`  p50: ${stats.p50.toFixed(2)}ms, p95: ${stats.p95.toFixed(2)}ms, errors: ${stats.errorCount}`);
    }
  }

  // Write results
  const fs = await import('fs');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), '.perf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'baseline.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outputPath}`);
}

main().catch(console.error);

