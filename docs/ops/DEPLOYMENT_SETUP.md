# Production Deployment Setup

Complete setup guide for automated deployment pipeline on the `deploy` branch.

## Overview

**Deploy Branch Strategy:**
- `main` = development/feature work
- `deploy` = triggers full production deployment
- Every push to `deploy` = complete rebuild (Neon wipe + Fly deploy + Frontend deploy)

**Until base functionality is reached:**
- Complete database wipe each deployment
- No migration tracking
- Fresh start every time

## Prerequisites

- GitHub repository with Actions enabled
- Fly.io account with API token
- Neon database with connection string
- Cloudflare account with API token
- Admin access to GitHub repo settings

---

## Step 1: Create Deploy Branch

```bash
cd /Users/Shared/passion-os-next

# Create deploy branch from main
git checkout main
git pull origin main
git checkout -b deploy
git push origin deploy

# Set deploy as protected branch (recommended)
```

### GitHub Branch Protection (Optional but Recommended)

1. Go to repo Settings → Branches
2. Add branch protection rule for `deploy`
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require conversation resolution before merging
4. Save

---

## Step 2: GitHub Secrets Configuration

### Required Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

#### 1. `FLY_API_TOKEN`
```bash
# Get your Fly.io API token
flyctl auth token

# Add to GitHub Secrets:
# Name: FLY_API_TOKEN
# Value: <paste token>
```

**How to get:**
- Login: `flyctl auth login`
- Get token: `flyctl auth token`
- Copy entire token string

#### 2. `NEON_DATABASE_URL`
```bash
# Get from Neon console: console.neon.tech
# Format: postgres://username:password@host/database?sslmode=require

# Add to GitHub Secrets:
# Name: NEON_DATABASE_URL
# Value: postgres://...
```

**How to get:**
1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details"
4. Copy "Connection string" with password visible
5. Ensure `?sslmode=require` at the end

#### 3. `CLOUDFLARE_API_TOKEN`
```bash
# Get from Cloudflare dashboard

# Add to GitHub Secrets:
# Name: CLOUDFLARE_API_TOKEN
# Value: <paste token>
```

**How to get:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Configure:
   - Permissions: Account > Cloudflare Workers Scripts > Edit
   - Account Resources: Include > Your Account
5. Create token and copy immediately

#### 4. `SLACK_WEBHOOK` (Optional)
```bash
# For deployment notifications

# Add to GitHub Secrets:
# Name: SLACK_WEBHOOK
# Value: https://hooks.slack.com/services/...
```

**How to get:**
1. Go to https://api.slack.com/apps
2. Create app or select existing
3. Enable "Incoming Webhooks"
4. Add webhook to your channel
5. Copy webhook URL

---

## Step 3: GitHub Environment Setup

Go to: **Settings → Environments → New environment**

### Create "production" Environment

1. **Name:** `production`
2. **Protection rules:**
   - ✅ Required reviewers: Add yourself
   - ✅ Wait timer: 0 minutes (or add delay if desired)
3. **Deployment branches:** `deploy` only
4. **Environment secrets:** (can override repo secrets here if needed)
5. Save environment

**Why:** Adds manual approval gate before:
- Wiping Neon database
- Deploying to production

---

## Step 4: Fly.io Configuration

### Verify App Exists
```bash
flyctl apps list | grep ignition-api
```

### If App Doesn't Exist
```bash
cd app/backend
flyctl launch --name ignition-api --no-deploy
```

### Configure Fly App for CI/CD
```bash
# Set deploy strategy
flyctl deploy --strategy immediate --app ignition-api --remote-only

# Verify
flyctl status --app ignition-api
```

**Important:** 
- `--remote-only` flag in workflow = builds on Fly's servers (faster, more reliable)
- `--strategy immediate` = replace machines immediately (not rolling)

---

## Step 5: Neon Configuration

### Verify Database Access
```bash
psql "$NEON_DATABASE_URL" -c "SELECT version()"
```

### Create Backup Connection String (Recommended)
```bash
# In Neon console:
# 1. Go to your project
# 2. Create a new branch called "main-backup"
# 3. Get connection string for backup branch
# 4. Store safely (not in GitHub)
```

**Why:** If production Neon gets corrupted, you have a backup branch.

---

## Step 6: Cloudflare Workers Configuration

### Frontend Setup
```bash
cd app/frontend

# Login to Cloudflare
npx wrangler login

# Verify wrangler.toml exists
cat wrangler.toml

# Should show:
# name = "ignition-frontend"
# compatibility_date = "2024-01-01"
```

### Admin Setup
```bash
cd app/admin

# Verify wrangler.toml exists
cat wrangler.toml

# Should show:
# name = "ignition-admin"
```

**If wrangler.toml missing:**
```toml
# app/frontend/wrangler.toml
name = "ignition-frontend"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "ignition-frontend"
route = "ignition.ecent.online/*"
```

---

## Step 7: Test Deployment Locally

### Generate Schema
```bash
cd /Users/Shared/passion-os-next
./generate_schema.sh
```

### Validate Locally
```bash
./scripts/validate-schema-locally.sh
```

### Manual Deploy Test (Before CI/CD)
```bash
# Test Neon connection
psql "$NEON_DATABASE_URL" -c "SELECT 1"

# Test Fly deploy
cd app/backend
flyctl deploy --app ignition-api

# Test frontend deploy
cd ../frontend
npm run build
npx wrangler deploy --dry-run
```

---

## Step 8: First Deployment

### Commit and Push to Deploy Branch
```bash
# Make sure you're on deploy branch
git checkout deploy

# Commit workflow file
git add .github/workflows/deploy-production.yml
git commit -m "Add production deployment pipeline"

# Push to trigger deployment
git push origin deploy
```

### Monitor Deployment

1. **Go to GitHub Actions:**
   - https://github.com/YOUR_USERNAME/passion-os-next/actions

2. **Watch workflow:**
   - ✅ Pre-deployment checks
   - ⏸️  Wipe and rebuild Neon (requires approval)
   - ✅ Deploy backend to Fly
   - ✅ Deploy frontend to Cloudflare
   - ✅ Deploy admin to Cloudflare
   - ✅ Post-deployment tests

3. **Manual approval required:**
   - Click "Review deployments"
   - Select "production"
   - Click "Approve and deploy"

### Verify Deployment

```bash
# Backend health
curl https://api.ecent.online/health

# Frontend
curl -I https://ignition.ecent.online

# Admin
curl -I https://admin.ecent.online
```

---

## Workflow Usage

### Regular Development

```bash
# Work on main branch
git checkout main
git pull
# ... make changes ...
git push origin main
```

### Deploy to Production

```bash
# Merge main into deploy
git checkout deploy
git merge main
git push origin deploy

# Or create PR: main → deploy
# Then merge after review
```

### Rollback

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin deploy

# Option 2: Reset to previous commit
git reset --hard <commit-hash>
git push --force origin deploy

# Option 3: Cherry-pick good commits
git checkout deploy
git reset --hard <last-good-commit>
git push --force origin deploy
```

---

## Troubleshooting

### "FLY_API_TOKEN is not set"
- Verify secret exists: Settings → Secrets → FLY_API_TOKEN
- Get new token: `flyctl auth token`
- Update secret with new token

### "Cannot connect to Neon"
- Test locally: `psql "$NEON_DATABASE_URL" -c "SELECT 1"`
- Verify connection string format includes `?sslmode=require`
- Check Neon console for connection limits
- Verify IP not blocked (GitHub Actions IPs are allowed by default)

### "Cloudflare deployment failed"
- Check CLOUDFLARE_API_TOKEN permissions
- Verify wrangler.toml exists in app/frontend and app/admin
- Test locally: `npx wrangler deploy --dry-run`

### "Manual approval not showing"
- Verify "production" environment exists
- Check environment has required reviewers
- Ensure you're in the reviewers list

### "Backend deployment timeout"
- Check Fly.io status: https://status.fly.io
- View logs: `flyctl logs --app ignition-api`
- Machines might be stopped: `flyctl machines list --app ignition-api`

### "Schema validation failed"
- Run locally: `./scripts/validate-schema-locally.sh`
- Check schema.json syntax
- Ensure migrations are up to date: `./generate_schema.sh`

---

## Advanced: Azure DevOps Alternative

If GitHub Actions becomes limiting, migrate to Azure DevOps:

### Advantages of ADO
- ✅ Better YAML debugging
- ✅ Built-in artifact management
- ✅ More generous free tier
- ✅ Better Windows support
- ✅ Integration with Azure services

### Migration Path
1. Create Azure DevOps project
2. Import GitHub repo
3. Convert workflows to `azure-pipelines.yml`
4. Set up service connections
5. Configure variable groups

**Cost comparison:**
- GitHub Actions: 2000 minutes/month free
- Azure DevOps: 1800 minutes/month free (but better features)

**Recommendation:** Stick with GitHub Actions for now. Only migrate if:
- Need more than 2000 minutes/month
- Heavy Azure integration required
- Need advanced pipeline features

---

## Maintenance

### Weekly Tasks
```bash
# 1. Check deployment logs
# GitHub Actions → Latest workflow run

# 2. Verify all services healthy
./scripts/validate-production.sh

# 3. Export schema backup
./scripts/neon-migrate.sh export
```

### Monthly Tasks
- Review GitHub Actions usage (Settings → Billing)
- Check Fly.io resource usage
- Audit Cloudflare Workers invocations
- Review Neon database size

### Before Major Changes
```bash
# 1. Export current Neon schema
./scripts/neon-migrate.sh export

# 2. Test locally
./scripts/validate-schema-locally.sh

# 3. Create PR to deploy branch
# 4. Review thoroughly
# 5. Merge and monitor deployment
```

---

## Support Resources

### Documentation
- GitHub Actions: https://docs.github.com/actions
- Fly.io: https://fly.io/docs
- Neon: https://neon.tech/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers

### Status Pages
- GitHub: https://www.githubstatus.com
- Fly.io: https://status.fly.io
- Neon: https://neonstatus.com
- Cloudflare: https://www.cloudflarestatus.com

### Emergency Contacts
- Add your team's contact info here
- Slack channel: #deployments
- On-call rotation: PagerDuty

---

## Next Steps After Setup

1. ✅ Complete all steps above
2. ✅ Run first deployment
3. ✅ Verify all services work
4. ✅ Document any issues encountered
5. ✅ Set up monitoring/alerts
6. ✅ Create runbook for common issues
7. ✅ Train team on deployment process
