# GitHub Actions Deployment Setup

This project uses GitHub Actions to automatically deploy to Cloudflare Workers on push to `main`.

## Required GitHub Secrets

Go to your GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret

### 1. CLOUDFLARE_ACCOUNT_ID

Your Cloudflare account ID:
```
a08001a88403e4e3c51ebd59d71093ec
```

### 2. CLOUDFLARE_API_TOKEN

Create a new API token at https://dash.cloudflare.com/profile/api-tokens with these permissions:

**Account permissions:**
- D1: Edit
- Workers R2 Storage: Edit (if using R2)

**Zone permissions:**
- (None required for workers.dev subdomain)

**Account Resources:**
- Include: Your account

**Zone Resources:**
- Include: All zones (or specific zone if using custom domain)

Copy the generated token and add it as `CLOUDFLARE_API_TOKEN` secret.

## How It Works

1. Push to `main` branch triggers the workflow
2. GitHub Actions:
   - Checks out code
   - Installs dependencies
   - Runs D1 migrations
   - Builds Next.js app
   - Builds Cloudflare Worker
   - Deploys to Cloudflare Workers

## Manual Deployment

You can still deploy manually:
```bash
npm run deploy
```

## Workflow File

The workflow is defined in `.github/workflows/deploy.yml`

## Triggering Manual Deploy

You can also trigger a deploy manually from the GitHub Actions tab using "Run workflow".

