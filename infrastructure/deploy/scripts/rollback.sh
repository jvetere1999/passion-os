#!/bin/bash
# Ignition - Rollback Script
#
# Usage: ./rollback.sh <version> [--with-migrations <target-migration>]
# Example: ./rollback.sh v1.0.0
# Example: ./rollback.sh v1.0.0 --with-migrations 0005
#
# This script:
#   1. Creates a backup
#   2. Optionally rolls back migrations
#   3. Deploys the target version
#   4. Verifies health

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/production/docker-compose.yml"
LOG_DIR="${DEPLOY_DIR}/../.tmp"
MIGRATIONS_DIR="${DEPLOY_DIR}/../app/database/migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "Usage: $0 <version> [--with-migrations <target-migration>]"
    echo ""
    echo "Arguments:"
    echo "  version              Image tag to rollback to (e.g., v1.0.0)"
    echo "  --with-migrations    Rollback to specific migration number (e.g., 0005)"
    echo ""
    echo "Examples:"
    echo "  $0 v1.0.0                              # Image rollback only"
    echo "  $0 v1.0.0 --with-migrations 0005       # Image + migrations"
    exit 1
}

create_backup() {
    log_info "Creating backup before rollback..."

    mkdir -p "${LOG_DIR}"
    local backup_file="${LOG_DIR}/rollback_backup_$(date +%Y%m%d_%H%M%S).sql"

    docker exec ignition-postgres pg_dump -U ignition ignition > "${backup_file}" 2>&1 || {
        log_error "Backup failed!"
        exit 1
    }

    log_info "Backup saved to ${backup_file}"
}

stop_api() {
    log_info "Stopping API..."
    docker compose -f "${COMPOSE_FILE}" stop api > /dev/null 2>&1 || true
}

rollback_migrations() {
    local target="$1"

    log_info "Rolling back migrations to ${target}..."

    # Get list of down migrations in reverse order
    local migrations=()
    for f in "${MIGRATIONS_DIR}"/000*.down.sql; do
        local num=$(basename "$f" | cut -d'_' -f1)
        if [[ "$num" > "$target" ]]; then
            migrations+=("$f")
        fi
    done

    # Sort in reverse order
    IFS=$'\n' sorted=($(sort -r <<<"${migrations[*]}")); unset IFS

    for f in "${sorted[@]}"; do
        log_info "Applying $(basename "$f")..."
        docker exec -i ignition-postgres psql -U ignition -d ignition < "$f" \
            > "${LOG_DIR}/rollback_migration_$(basename "$f").log" 2>&1 || {
            log_error "Migration rollback failed: $(basename "$f")"
            exit 1
        }
    done

    log_info "Migrations rolled back to ${target}"
}

deploy_version() {
    local version="$1"

    log_info "Deploying version ${version}..."

    export IMAGE_TAG="${version}"

    docker compose -f "${COMPOSE_FILE}" up -d api --remove-orphans \
        > "${LOG_DIR}/rollback_deploy.log" 2>&1

    log_info "Version ${version} deployed"
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

        log_info "Waiting (${attempt}/${max_attempts})..."
        sleep 2
        ((attempt++))
    done

    log_error "Health check failed"
    return 1
}

# Main
main() {
    if [ $# -lt 1 ]; then
        usage
    fi

    local version="$1"
    local target_migration=""

    shift
    while [ $# -gt 0 ]; do
        case "$1" in
            --with-migrations)
                target_migration="$2"
                shift 2
                ;;
            *)
                usage
                ;;
        esac
    done

    echo "=========================================="
    echo "  Ignition Rollback"
    echo "  Target Version: ${version}"
    if [ -n "$target_migration" ]; then
        echo "  Target Migration: ${target_migration}"
    fi
    echo "=========================================="

    read -p "Are you sure you want to rollback? (y/N) " confirm
    if [[ "$confirm" != [yY] ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    create_backup
    stop_api

    if [ -n "$target_migration" ]; then
        rollback_migrations "$target_migration"
    fi

    deploy_version "$version"

    if health_check; then
        log_info "=========================================="
        log_info "  Rollback successful!"
        log_info "  Version: ${version}"
        log_info "=========================================="
    else
        log_error "Rollback failed - manual intervention required"
        log_error "Backup available at ${LOG_DIR}/"
        exit 1
    fi
}

main "$@"

