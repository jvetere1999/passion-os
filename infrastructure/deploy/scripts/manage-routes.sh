#!/bin/bash
# Cloudflare Workers Route Management Script
# 
# This script helps manage route assignments for the Ignition stack.
# Run with: bash scripts/manage-routes.sh <command>
#
# Prerequisites:
#   - CLOUDFLARE_API_TOKEN set (Workers Routes:Edit, Zone:Read)
#   - CLOUDFLARE_ZONE_ID set (or use default)
#   - jq installed for JSON parsing

set -euo pipefail

# Configuration
ZONE_ID="${CLOUDFLARE_ZONE_ID:-your-zone-id-here}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
API_BASE="https://api.cloudflare.com/client/v4"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

check_auth() {
    if [ -z "$API_TOKEN" ]; then
        echo_error "CLOUDFLARE_API_TOKEN not set"
        echo "Create a token at: https://dash.cloudflare.com/profile/api-tokens"
        echo "Required permissions: Workers Routes:Edit, Zone:Read"
        exit 1
    fi
}

# List all routes in the zone
list_routes() {
    check_auth
    echo_info "Listing routes for zone: $ZONE_ID"
    
    curl -s -X GET "$API_BASE/zones/$ZONE_ID/workers/routes" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" | jq '.result[] | {id, pattern, script}'
}

# Delete a route by ID
delete_route() {
    check_auth
    local route_id="$1"
    echo_warn "Deleting route: $route_id"
    
    curl -s -X DELETE "$API_BASE/zones/$ZONE_ID/workers/routes/$route_id" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" | jq '.success'
}

# Find and delete routes assigned to wrong worker
unassign_frontend_routes() {
    check_auth
    echo_info "Finding routes on ignition-frontend that should be on ignition-landing..."
    
    # Get all routes
    routes=$(curl -s -X GET "$API_BASE/zones/$ZONE_ID/workers/routes" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    # Find routes to remove (ignition.ecent.online on ignition-frontend)
    echo "$routes" | jq -r '.result[] | select(.script == "ignition-frontend") | select(.pattern | test("^(www\\.)?ignition\\.ecent\\.online")) | .id' | while read -r route_id; do
        if [ -n "$route_id" ]; then
            echo_warn "Removing route $route_id from ignition-frontend"
            delete_route "$route_id"
        fi
    done
    
    echo_info "Done. Now deploy ignition-landing to claim the routes."
}

# Get zone ID by name (for convenience)
get_zone_id() {
    check_auth
    local zone_name="${1:-ecent.online}"
    curl -s -X GET "$API_BASE/zones?name=$zone_name" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id'
}

# Show current architecture
show_architecture() {
    cat << 'EOF'
Ignition Cloudflare Architecture:
=================================

ignition.ecent.online/* ──────────────> ignition-landing (Worker)
www.ignition.ecent.online/* ──────────>     │
                                            ├── Static pages (/, /about, /privacy, /terms)
                                            ├── Auth flow with loading screen (/auth/signin)
                                            └── Proxy to frontend container (other routes)
                                                    │
                                                    v
ignition-cloud.ecent.online ──────────> ignition-frontend (Container)
                                            └── Next.js app

api.ecent.online/* ───────────────────> ignition-api (Container)
                                            └── Rust Axum backend

admin.ignition.ecent.online/* ────────> ignition-admin (future)
                                            └── Next.js admin console

Required DNS Records (Cloudflare):
- ignition.ecent.online      -> Workers route
- www.ignition.ecent.online  -> Workers route  
- ignition-cloud.ecent.online -> Workers route (custom domain)
- api.ecent.online           -> Workers route
- admin.ignition.ecent.online -> Workers route (future)
EOF
}

# Deploy in correct order
deploy_stack() {
    check_auth
    echo_info "Deploying Ignition stack in correct order..."
    
    # 1. First, remove conflicting routes
    echo_step "Step 1: Cleaning up route conflicts..."
    unassign_frontend_routes || echo_warn "Route cleanup skipped (may not be needed)"
    
    # 2. Deploy API container
    echo_step "Step 2: Deploying API container..."
    (cd "$(dirname "$0")/../cloudflare-containers" && npx wrangler deploy)
    
    # 3. Deploy frontend container  
    echo_step "Step 3: Deploying frontend container..."
    (cd "$(dirname "$0")/../cloudflare-frontend" && npx wrangler deploy)
    
    # 4. Deploy landing page (last, needs routes cleared)
    echo_step "Step 4: Deploying landing page..."
    (cd "$(dirname "$0")/../cloudflare-landing" && npx wrangler deploy)
    
    echo_info "Stack deployment complete!"
}

# Verify secrets are set
check_secrets() {
    echo_info "Checking required secrets for ignition-api..."
    
    required_secrets=(
        "DATABASE_URL"
        "SESSION_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "AZURE_CLIENT_ID"
        "AZURE_CLIENT_SECRET"
        "AZURE_TENANT_ID"
    )
    
    echo ""
    echo "Required secrets for ignition-api container:"
    for secret in "${required_secrets[@]}"; do
        echo "  - $secret"
    done
    echo ""
    echo "Set secrets with:"
    echo "  npx wrangler secret put <SECRET_NAME> --config deploy/cloudflare-containers/wrangler.toml"
    echo ""
    echo "Or bulk set from .env file:"
    echo "  cat .env | while IFS='=' read -r key value; do"
    echo "    echo \"\$value\" | npx wrangler secret put \"\$key\" --config deploy/cloudflare-containers/wrangler.toml"
    echo "  done"
}

# Main
case "${1:-help}" in
    list|routes)
        list_routes
        ;;
    zone-id)
        get_zone_id "${2:-ecent.online}"
        ;;
    unassign)
        unassign_frontend_routes
        ;;
    delete)
        if [ -z "${2:-}" ]; then
            echo_error "Usage: $0 delete <route-id>"
            exit 1
        fi
        delete_route "$2"
        ;;
    architecture|arch)
        show_architecture
        ;;
    deploy)
        deploy_stack
        ;;
    secrets)
        check_secrets
        ;;
    help|--help|-h)
        cat << EOF
Usage: $0 <command>

Commands:
  list, routes        List all routes in the zone (requires API token)
  zone-id [name]      Get zone ID for a domain (default: ecent.online)
  unassign            Remove conflicting routes from ignition-frontend
  delete <route-id>   Delete a specific route by ID
  architecture        Show the target architecture diagram
  deploy              Deploy the full stack in correct order
  secrets             Show required secrets and how to set them
  help                Show this help message

Environment Variables:
  CLOUDFLARE_API_TOKEN   API token with Workers Routes:Edit, Zone:Read
  CLOUDFLARE_ZONE_ID     Zone ID for ecent.online

Quick Start:
  1. Get zone ID:   export CLOUDFLARE_ZONE_ID=\$($0 zone-id ecent.online)
  2. List routes:   $0 list
  3. Fix conflict:  $0 unassign
  4. Deploy all:    $0 deploy

Manual Alternative (Cloudflare Dashboard):
  https://dash.cloudflare.com/<account-id>/workers/overview
  Click on ignition-frontend -> Settings -> Routes -> Remove the conflicting routes
EOF
        ;;
    *)
        echo_error "Unknown command: $1"
        echo "Run '$0 help' for usage."
        exit 1
        ;;
esac
