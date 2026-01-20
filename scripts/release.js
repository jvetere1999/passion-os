#!/usr/bin/env node

/**
 * Automated Versioning System for Ignition Production Releases
 * 
 * Usage:
 *   npm run release:patch    - Release patch version (1.0.0 -> 1.0.1)
 *   npm run release:minor    - Release minor version (1.0.0 -> 1.1.0)
 *   npm run release:major    - Release major version (1.0.0 -> 2.0.0)
 *   npm run release:beta     - Release beta version (1.0.0 -> 1.0.0-beta.X)
 * 
 * Process:
 * 1. Updates VERSION.json with new version
 * 2. Updates package.json in all components
 * 3. Creates CHANGELOG entry
 * 4. Commits changes with semantic message
 * 5. Creates annotated git tag
 * 6. Pushes to production branch
 * 7. Triggers GitHub Actions deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION_FILE = path.join(__dirname, 'VERSION.json');
const CHANGELOG_FILE = path.join(__dirname, 'CHANGELOG.md');

const components = [
  { name: 'frontend', path: 'app/frontend/package.json' },
  { name: 'admin', path: 'app/admin/package.json' },
  { name: 'backend', path: 'app/backend/Cargo.toml' },
  { name: 'watcher', path: 'app/watcher/package.json' },
];

// Parse semantic version
function parseVersion(version) {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)(?:-(.+?))?(?:\.(\d+))?$/);
  if (!match) throw new Error(`Invalid version format: ${version}`);
  
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4] || null,
    prereleaseBuild: match[5] ? parseInt(match[5]) : 0,
  };
}

// Format semantic version
function formatVersion(parsed) {
  const base = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  if (parsed.prerelease) {
    return `${base}-${parsed.prerelease}.${parsed.prereleaseBuild}`;
  }
  return base;
}

// Increment version
function bumpVersion(currentVersion, bumpType) {
  const parsed = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      parsed.prerelease = null;
      parsed.prereleaseBuild = 0;
      break;
    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      parsed.prerelease = null;
      parsed.prereleaseBuild = 0;
      break;
    case 'patch':
      parsed.patch += 1;
      parsed.prerelease = null;
      parsed.prereleaseBuild = 0;
      break;
    case 'beta':
      if (parsed.prerelease === 'beta') {
        parsed.prereleaseBuild += 1;
      } else {
        parsed.prerelease = 'beta';
        parsed.prereleaseBuild = 1;
      }
      break;
    case 'rc':
      if (parsed.prerelease === 'rc') {
        parsed.prereleaseBuild += 1;
      } else {
        parsed.prerelease = 'rc';
        parsed.prereleaseBuild = 1;
      }
      break;
    default:
      throw new Error(`Unknown bump type: ${bumpType}`);
  }

  return formatVersion(parsed);
}

// Update VERSION.json
function updateVersionFile(newVersion, releaseNotes) {
  const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  
  versionData.currentVersion = newVersion;
  versionData.lastReleaseDate = new Date().toISOString().split('T')[0];
  
  // Add to history
  versionData.versionHistory.unshift({
    version: newVersion,
    releaseDate: new Date().toISOString().split('T')[0],
    channel: newVersion.includes('beta') ? 'beta' : newVersion.includes('rc') ? 'rc' : 'stable',
    notes: releaseNotes || 'Production release',
    highlights: [],
  });
  
  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
  console.log(`✓ Updated VERSION.json to ${newVersion}`);
}

// Update package.json files
function updatePackageFiles(newVersion, bumpType) {
  components.forEach(({ name, path: pkgPath }) => {
    if (!fs.existsSync(pkgPath)) {
      console.log(`⊘ Skipped ${name} (${pkgPath} not found)`);
      return;
    }

    if (pkgPath.endsWith('.toml')) {
      // Handle Cargo.toml
      let content = fs.readFileSync(pkgPath, 'utf8');
      const oldVersion = content.match(/^version = "([^"]+)"/m)?.[1];
      content = content.replace(/^version = "[^"]+"/m, `version = "${newVersion}"`);
      fs.writeFileSync(pkgPath, content);
      console.log(`✓ Updated ${name} version: ${oldVersion} → ${newVersion}`);
    } else {
      // Handle package.json
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const oldVersion = pkg.version;
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`✓ Updated ${name} version: ${oldVersion} → ${newVersion}`);
    }
  });
}

// Update CHANGELOG.md
function updateChangelog(newVersion, releaseNotes) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `## [${newVersion}] - ${date}\n\n${releaseNotes || 'See git log for details'}\n\n`;
  
  let changelog = '';
  if (fs.existsSync(CHANGELOG_FILE)) {
    changelog = fs.readFileSync(CHANGELOG_FILE, 'utf8');
  }

  fs.writeFileSync(CHANGELOG_FILE, entry + changelog);
  console.log(`✓ Updated CHANGELOG.md`);
}

// Git operations
function gitCommitAndTag(newVersion, releaseNotes, bumpType) {
  try {
    // Stage files
    execSync('git add VERSION.json app/*/package.json app/backend/Cargo.toml CHANGELOG.md', { stdio: 'inherit' });
    
    // Commit
    const commitMsg = `chore: release v${newVersion}

Release type: ${bumpType}
Release notes: ${releaseNotes || 'See CHANGELOG.md for details'}`;
    
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
    console.log(`✓ Git commit created`);
    
    // Tag
    const tagMsg = `Release ${newVersion}\n\n${releaseNotes || 'See CHANGELOG.md for details'}`;
    execSync(`git tag -a v${newVersion} -m "${tagMsg}"`, { stdio: 'inherit' });
    console.log(`✓ Git tag created: v${newVersion}`);
    
    return true;
  } catch (err) {
    console.error('✗ Git operation failed:', err.message);
    return false;
  }
}

// Push to production
function pushToProduction(newVersion) {
  try {
    execSync('git push origin production', { stdio: 'inherit' });
    console.log(`✓ Pushed commits to production branch`);
    
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
    console.log(`✓ Pushed tag v${newVersion} to origin`);
    
    return true;
  } catch (err) {
    console.error('✗ Push failed:', err.message);
    return false;
  }
}

// Main release function
function release(bumpType, releaseNotes) {
  console.log(`\n🚀 Starting ${bumpType.toUpperCase()} release...\n`);

  try {
    // Read current version
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const currentVersion = versionData.currentVersion;
    console.log(`Current version: ${currentVersion}`);
    
    // Calculate new version
    const newVersion = bumpVersion(currentVersion, bumpType);
    console.log(`New version: ${newVersion}\n`);
    
    // Update files
    updateVersionFile(newVersion, releaseNotes);
    updatePackageFiles(newVersion, bumpType);
    updateChangelog(newVersion, releaseNotes);
    
    console.log('');
    
    // Git operations
    if (!gitCommitAndTag(newVersion, releaseNotes, bumpType)) {
      throw new Error('Git operations failed');
    }
    
    console.log('');
    
    // Push
    if (!pushToProduction(newVersion)) {
      throw new Error('Push to production failed');
    }
    
    console.log(`\n✅ Release v${newVersion} complete!\n`);
    console.log(`GitHub Actions will deploy automatically after tag push.\n`);
    
  } catch (err) {
    console.error(`\n❌ Release failed: ${err.message}\n`);
    process.exit(1);
  }
}

// Parse arguments
const bumpType = process.argv[2] || 'patch';
const releaseNotes = process.argv[3] || '';

if (!['major', 'minor', 'patch', 'beta', 'rc'].includes(bumpType)) {
  console.error(`Invalid bump type: ${bumpType}`);
  console.error(`Valid types: major, minor, patch, beta, rc`);
  process.exit(1);
}

release(bumpType, releaseNotes);
