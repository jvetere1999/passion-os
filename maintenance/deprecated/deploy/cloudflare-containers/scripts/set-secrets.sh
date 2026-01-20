#!/bin/bash
# Set secrets for Ignition API Container
# Run this after deployment to configure secrets

set -euo pipefail

echo "Setting secrets for ignition-api..."
echo "You will be prompted for each secret value."
echo ""

# Required secrets
SECRETS=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "AZURE_CLIENT_ID"
  "AZURE_CLIENT_SECRET"
  "AZURE_TENANT_ID"
  "STORAGE_ENDPOINT"
  "STORAGE_ACCESS_KEY_ID"
  "STORAGE_SECRET_ACCESS_KEY"
)

for secret in "${SECRETS[@]}"; do
  echo "Setting $secret..."
  npx wrangler secret put "$secret"
  echo ""
done

echo "All secrets configured successfully!"
