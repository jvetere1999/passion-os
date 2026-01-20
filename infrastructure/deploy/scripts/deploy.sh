#!/bin/bash
# Ignition - Deployment Script
#
# Usage: ./deploy.sh <version>
# Example: ./deploy.sh v1.0.0
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - .env file configured
#   - Migrations already applied (or use --migrate flag)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/production/docker-compose.yml"
LOG_DIR="${DEPLOY_DIR}/../.tmp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "Usage: $0 <version> [--migrate]"
    echo ""
    echo "Arguments:"
    echo "  version    Image tag to deploy (e.g., v1.0.0)"
    echo "  --migrate  Apply pending migrations before deploying"
    echo ""
    echo "Examples:"
    echo "  $0 v1.0.0"
    echo "  $0 v1.0.0 --migrate"
    exit 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if [ ! -f "${DEPLOY_DIR}/production/.env" ]; then
        log_error ".env file not found. Copy .env.example and configure it."
        exit 1
    fi

    log_info "Prerequisites OK"
}

create_backup() {
    log_info "Creating database backup..."

    mkdir -p "${LOG_DIR}"
    local backup_file="${LOG_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"

    docker exec ignition-postgres pg_dump -U ignition ignition > "${backup_file}" 2>&1 || {
        log_warn "Backup failed (database may not exist yet)"
    }

    log_info "Backup saved to ${backup_file}"
}

apply_migrations() {
    log_info "Applying migrations..."

    local migrations_dir="${DEPLOY_DIR}/../app/database/migrations"

    for f in "${migrations_dir}"/000*.sql; do
        if [[ "$f" != *".down.sql" ]]; then
            log_info "Applying $(basename "$f")..."
            docker exec -i ignition-postgres psql -U ignition -d ignition < "$f" \
                > "${LOG_DIR}/migration_$(basename "$f").log" 2>&1 || {
                log_error "Migration failed: $(basename "$f")"
                exit 1
            }
        fi
    done

    log_info "Migrations complete"
}

deploy() {
    local version="$1"

    log_info "Deploying version ${version}..."

    # Export version for compose
    export IMAGE_TAG="${version}"

    # Pull new image (if using registry)
    # docker pull "ignition-api:${version}"

    # Deploy with compose
    docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans \
        > "${LOG_DIR}/deploy.log" 2>&1

    log_info "Containers started"
}

health_check() {
    log_info "Running health check..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
            log_info "Health check passed"
            return 0
        fi

        log_info "Waiting for health check (attempt ${attempt}/${max_attempts})..."
        sleep 2
        ((attempt++))
    done

    log_error "Health check failed after ${max_attempts} attempts"
    return 1
}

# Main
main() {
    if [ $# -lt 1 ]; then
        usage
    fi

    local version="$1"
    local do_migrate=false

    if [ "${2:-}" == "--migrate" ]; then
        do_migrate=true
    fi

    echo "=========================================="
    echo "  Ignition Deployment"
    echo "  Version: ${version}"
    echo "  Migrate: ${do_migrate}"
    echo "=========================================="

    check_prerequisites
    create_backup

    if [ "$do_migrate" = true ]; then
        apply_migrations
    fi

    deploy "$version"

    if health_check; then
        log_info "=========================================="
        log_info "  Deployment successful!"
        log_info "  Version: ${version}"
        log_info "=========================================="
    else
        log_error "Deployment failed - consider rollback"
        log_error "Run: ./rollback.sh <previous-version>"
        exit 1
    fi
}

main "$@"

