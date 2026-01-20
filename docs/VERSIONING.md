# Versioning & Release System

Ignition uses **semantic versioning** with automated release management starting from **beta 1.0**.

## Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE.BUILD]
1.0.0-beta.1
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes
- **PRERELEASE**: `beta`, `rc` (release candidate)
- **BUILD**: Pre-release build number

## Release Channels

| Channel | Version Format | Stability | Use Case |
|---------|---|---|---|
| **Beta** | `1.0.0-beta.X` | Testing | Early features, breaking changes ok |
| **RC** | `1.0.0-rc.X` | Pre-release | Release candidate, minimal changes |
| **Stable** | `1.0.0` | Production | General availability |

## Current State

- **Current Version**: `1.0.0-beta.1`
- **Release Channel**: Beta
- **Started**: January 20, 2026

## How to Release

### Patch Release (Bug Fixes)
```bash
npm run release:patch
# 1.0.0-beta.1 → 1.0.0-beta.2 (if in beta)
# 1.0.0 → 1.0.1 (if stable)
```

### Minor Release (New Features)
```bash
npm run release:minor
# 1.0.0-beta.1 → 1.1.0-beta.1
# 1.0.0 → 1.1.0
```

### Major Release (Breaking Changes)
```bash
npm run release:major
# 1.0.0 → 2.0.0
```

### Beta Release (Prerelease)
```bash
npm run release:beta
# 1.0.0 → 1.0.0-beta.1
# 1.0.0-beta.1 → 1.0.0-beta.2
```

### RC Release (Release Candidate)
```bash
npm run release:rc
# 1.0.0-beta.5 → 1.0.0-rc.1
# 1.0.0-rc.1 → 1.0.0-rc.2
```

## Release Process

The automated release script (`scripts/release.js`) performs these steps:

### 1. Version Calculation
- Reads current version from `VERSION.json`
- Calculates new version based on bump type
- Validates semantic version format

### 2. File Updates
- **VERSION.json**: Central version source, release history
- **package.json**: All components (frontend, admin, watcher)
- **Cargo.toml**: Backend (Rust)
- **CHANGELOG.md**: Release notes and highlights

### 3. Git Operations
- **Commit**: Semantic commit message with release type
- **Tag**: Annotated git tag with full release notes
- **Push**: Commits and tags to production branch

### 4. Deployment
- GitHub Actions automatically triggered by tag push
- Multi-platform builds (macOS ARM64/Intel, Windows x64)
- Artifact uploads to releases
- Frontend deployed to Cloudflare Workers
- Backend deployed to Fly.io

## VERSION.json Structure

```json
{
  "productName": "Ignition",
  "currentVersion": "1.0.0-beta.1",
  "releaseChannel": "beta",
  "lastReleaseDate": "2026-01-20",
  "versionHistory": [
    {
      "version": "1.0.0-beta.1",
      "releaseDate": "2026-01-20",
      "channel": "beta",
      "notes": "Initial beta release",
      "highlights": [...]
    }
  ],
  "components": {
    "frontend": { "version": "1.1.0", "synced": false },
    "backend": { "version": "1.0.0", "synced": true },
    ...
  }
}
```

## Component Versions

Each component can have its own version, but releases sync all to the same:

| Component | Current | Path | Status |
|-----------|---------|------|--------|
| Frontend | 1.1.0 | app/frontend | Will sync on release |
| Backend | 1.0.0 | app/backend | Synced |
| Admin | 1.0.0 | app/admin | Synced |
| Watcher | 0.1.2 | app/watcher | Will sync on release |
| Database | 1.0.0 | app/database | Synced |

## Git Tagging

Tags follow semantic versioning:

```
v1.0.0-beta.1  - Beta release
v1.0.0-rc.1    - Release candidate
v1.0.0         - Stable release
```

View all releases:
```bash
git tag -l "v*"
```

View specific release:
```bash
git show v1.0.0-beta.1
```

## Deployment Trigger

GitHub Actions workflow automatically triggers on tag push:

1. **Tag Detection**: Watches for `v*` tags on production branch
2. **Build Matrix**: 
   - macOS ARM64 (M1/M2/M3)
   - macOS Intel (x64)
   - Windows x64
3. **Artifacts**: Desktop app installers (.dmg, .msi)
4. **Frontend**: Deployed to Cloudflare Workers
5. **Backend**: Deployed to Fly.io
6. **Release**: GitHub release created with artifacts

## Rollback Procedures

If a release has critical issues:

```bash
# Revert tag
git tag -d v1.0.0
git push origin --delete v1.0.0

# Revert commit
git revert <commit-hash>
git push origin production

# Deploy previous version
git tag v1.0.0 <previous-commit>
git push origin v1.0.0
```

## Release Checklist

Before running a release:

- [ ] All tests pass (`npm run test:all`)
- [ ] No lint errors (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] CHANGELOG.md updated with highlights
- [ ] Documentation updated
- [ ] Security audit complete
- [ ] Performance benchmarks acceptable
- [ ] Rollback plan documented

## Release Naming Convention

```
commit message format:
  chore: release v1.0.0

release tag format:
  v1.0.0-beta.1
  v1.0.0-rc.1
  v1.0.0

CHANGELOG heading:
  ## [1.0.0] - 2026-01-20
```

## Semantic Commit Messages

Releases use semantic commit format:

```
chore: release v1.0.0

Release type: patch
Release notes: Bug fixes and security updates
```

This helps with automatic changelog generation and version tracking.

## Integration with CI/CD

The `.github/workflows/deploy-production.yml` workflow:

1. Triggers on tag push matching `v*`
2. Checks out production branch
3. Reads VERSION.json
4. Builds all platforms
5. Uploads artifacts
6. Deploys to production
7. Creates GitHub release

## Monitoring Releases

### Version in Application

The current version is available at runtime:

```typescript
// Frontend - fetch version
const response = await fetch('/api/version');
const { version } = await response.json();
console.log(`Running Ignition v${version}`);
```

### Deployment Status

Monitor GitHub Actions for deployment:
```
Settings → Actions → Deploy Production
```

### Release History

View all releases:
```
GitHub.com/jvetere1999/ignition/releases
```

## FAQ

**Q: When should I use beta vs rc?**
- Beta: During development, breaking changes acceptable
- RC: Final testing before stable, only critical fixes
- Stable: Production ready

**Q: Can I skip prerelease and go straight to stable?**
- Yes: Use `release:major`, `release:minor`, `release:patch` for stable

**Q: What if release fails?**
- Check git status
- Verify VERSION.json is valid JSON
- Ensure all package.json files exist
- Run rollback procedures

**Q: How do I include detailed release notes?**
- Edit CHANGELOG.md before running release
- The script will preserve changelog entries

## Examples

### Release beta 2
```bash
npm run release:beta
# Commits v1.0.0-beta.2 tag
# GitHub Actions deploys to staging
```

### Release beta to stable
```bash
npm run release:major  # or release:minor/release:patch
# Commits v1.0.0 tag
# GitHub Actions deploys to production
# Creates GitHub release with artifacts
```

### Quick patch for critical bug
```bash
git commit -am "fix: critical security issue"
npm run release:patch
# v1.0.0 → v1.0.1
# Deployed immediately
```
