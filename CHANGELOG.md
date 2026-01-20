# Changelog

All notable changes to Ignition are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - 2026-01-20

### Added
- Initial beta release of Ignition
- Complete authentication system with OAuth (Google, Microsoft) and WebAuthn passkeys
- Vault lock/unlock system with 10-minute inactivity timeout
- Goal tracking system with progress visualization
- Journal entries with full E2E encryption
- Service worker with browser caching (endpoint whitelist, per-user isolation, TTL)
- Cross-device synchronization for vault state
- Admin dashboard for user management and analytics
- Tauri desktop DAW watcher application (macOS ARM64/Intel, Windows x64)
- Recovery codes for account recovery
- Comprehensive API with 20+ endpoints
- Database schema with PostgreSQL

### Security
- OAuth redirect URI validation
- CSRF protection on all state-changing operations
- Session-based authentication with secure cookies
- E2E encryption for sensitive data (vault contents, entries)
- Service worker hardening: endpoint whitelist, per-user cache isolation, TTL expiration

### Infrastructure
- GitHub Actions CI/CD for multi-platform builds
- Cloudflare Workers for frontend deployment
- Fly.io for backend deployment
- GitHub container registry for Docker images
- Service worker with cache invalidation

### Fixed
- Vault lock 401 errors on unauthenticated pages (auth check before API calls)
- Service worker security issues (endpoint whitelist, user cache isolation)
- GitHub Actions artifact upload failures (glob pattern fixes)
- Tauri Windows build issues (.msi generation)

### Known Limitations
- Vault E2E encryption key derivation limited to available entropy
- Service worker caching only supports GET requests
- 5-minute cache TTL for API endpoints
- Onboarding flow requires passkey registration on signup

---

For deployment instructions, see [DEPLOYMENT.md](./deploy/README.md).
For architecture overview, see [ARCHITECTURE.md](./docs/architecture/README.md).
