#!/bin/bash
# Deploy Ignition API to Cloudflare Containers
#
# Prerequisites:
#   - Docker running locally
#   - wrangler authenticated
#   - secrets configured (run set-secrets.sh first)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "========================================"
echo "Ignition API - Cloudflare Containers Deploy"
echo "========================================"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Deploy
echo "Building and deploying container..."
echo "This may take several minutes on first deploy."
echo ""

npx wrangler deploy

echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
echo ""
echo "Container will take a few minutes to provision."
echo "Check status: npx wrangler containers list"
echo ""
echo "API available at: https://api.ecent.online"
