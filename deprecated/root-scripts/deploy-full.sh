#!/bin/bash
# Full deployment script for Passion OS
# Runs: test -> build -> build:worker -> deploy

set -e

echo "=== Passion OS Full Deployment ==="
echo "Started at $(date)"
echo ""

# Create log directory
mkdir -p .tmp

# Step 1: Run tests
echo "[1/4] Running unit tests..."
npm run test:unit > .tmp/test-unit.log 2>&1 || {
  echo "Unit tests failed. Check .tmp/test-unit.log"
  exit 1
}
echo "Unit tests passed."

# Step 2: Build Next.js
echo "[2/4] Building Next.js..."
npm run build > .tmp/build.log 2>&1 || {
  echo "Build failed. Check .tmp/build.log"
  exit 1
}
echo "Next.js build complete."

# Step 3: Build Worker
echo "[3/4] Building Cloudflare Worker..."
npm run build:worker > .tmp/build-worker.log 2>&1 || {
  echo "Worker build failed. Check .tmp/build-worker.log"
  exit 1
}
echo "Worker build complete."

# Step 4: Deploy
echo "[4/4] Deploying to Cloudflare..."
wrangler deploy > .tmp/deploy.log 2>&1 || {
  echo "Deploy failed. Check .tmp/deploy.log"
  exit 1
}

# Extract deployed URL
DEPLOYED_URL=$(grep -o 'https://[^ ]*workers.dev' .tmp/deploy.log | head -1)

echo ""
echo "=== Deployment Complete ==="
echo "Deployed to: $DEPLOYED_URL"
echo "Finished at $(date)"

