# Frontend Developer Setup

Complete guide to setting up the Ignition frontend for local development.

---

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 22+ LTS | `node --version` |
| npm | 10+ | `npm --version` |
| Docker | 24+ | `docker --version` |
| Git | 2.40+ | `git --version` |

---

## Repository Layout

```
app/
├── frontend/              # Next.js frontend (this doc)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/
│   │   │   ├── api/       # API client wrappers
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   └── utils/     # Utility functions
│   │   └── styles/        # CSS and tokens
│   ├── public/            # Static assets
│   └── tests/             # Playwright E2E tests
├── backend/               # Rust API (see backend docs)
├── admin/                 # Admin console (separate Next.js app)
├── database/              # PostgreSQL migrations
└── r2/                    # R2 storage configuration
```

---

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/passion-os-next.git
cd passion-os-next

# Checkout correct branch
git checkout refactor/stack-split

# Navigate to frontend
cd app/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# API endpoint (local backend or production)
NEXT_PUBLIC_API_URL=http://localhost:8080

# For local development with auth bypass (optional)
NEXT_PUBLIC_DEV_MODE=true
```

### 4. Start Backend Services

Option A: Full Docker stack (recommended for first setup):

```bash
# From project root
cd ../../infra
docker compose --profile dev up -d
```

Option B: Backend only (if developing frontend independently):

```bash
cd ../../infra
docker compose --profile full up -d
```

Option C: Use production API (not recommended):

```bash
# In .env.local
NEXT_PUBLIC_API_URL=https://api.ecent.online
```

### 5. Run Frontend

```bash
# Development server with hot reload
npm run dev

# Frontend available at http://localhost:3000
```

---

## Development Workflow

### File Structure Patterns

#### Pages (App Router)

```
src/app/
├── (app)/              # Authenticated routes
│   ├── layout.tsx      # App shell with sidebar
│   ├── today/          # Dashboard
│   ├── focus/          # Focus timer
│   ├── quests/         # Quests feature
│   └── ...
├── (auth)/             # Auth routes
│   ├── login/
│   └── logout/
├── layout.tsx          # Root layout
└── page.tsx            # Landing page
```

#### API Clients

All API calls go through the client wrapper:

```typescript
// src/lib/api/client.ts - centralized API client
import { apiGet, apiPost } from '@/lib/api/client';

// Feature-specific clients wrap the base client
// src/lib/api/focus.ts
export async function getFocusSessions() {
  return apiGet<FocusSession[]>('/api/focus/sessions');
}
```

#### Components

```
src/components/
├── ui/                 # Base UI components (Button, Card, etc.)
├── shell/              # Layout components (Header, Sidebar)
├── focus/              # Feature-specific components
├── quests/
└── ...
```

---

## API Client Usage

### Base Pattern

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client';

// GET request
const sessions = await apiGet<FocusSession[]>('/api/focus/sessions');

// GET with query params
const filtered = await apiGet<Quest[]>('/api/quests', {
  params: { status: 'active', limit: 10 }
});

// POST request
const newSession = await apiPost<FocusSession>('/api/focus/sessions', {
  duration: 25,
  type: 'pomodoro'
});

// PUT request
await apiPut(`/api/focus/sessions/${id}`, { completed: true });

// DELETE request
await apiDelete(`/api/quests/${id}`);
```

### Error Handling

```typescript
import { ApiError } from '@/lib/api/client';

try {
  const data = await apiGet('/api/protected');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      // Redirect to login
    } else if (error.isNotFound()) {
      // Handle 404
    } else if (error.isValidation()) {
      // Show validation errors
      console.log(error.details);
    }
  }
}
```

---

## Authentication

### How It Works

1. Frontend redirects to `/api/auth/login?provider=google` (or `azure`)
2. Backend handles OAuth flow with provider
3. Backend sets session cookie: `Domain=ecent.online; SameSite=None; Secure; HttpOnly`
4. Frontend includes credentials in all API requests
5. Backend validates session on each request

### Local Development

For local development, you have two options:

**Option A:** Real OAuth (recommended)

- Configure OAuth credentials in backend `.env`
- Use ngrok or similar for callback URLs
- Full auth flow works locally

**Option B:** Dev bypass (quick testing)

- Set `AUTH_DEV_BYPASS=true` in backend
- Only works on `localhost` / `127.0.0.1`
- Automatically creates test user session

### Checking Auth State

```typescript
// Server component
import { getSession } from '@/lib/auth/session';

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return <Dashboard user={session.user} />;
}

// Client component
import { useSession } from '@/lib/hooks/useSession';

function UserMenu() {
  const { session, loading } = useSession();
  if (loading) return <Skeleton />;
  if (!session) return <LoginButton />;
  return <Avatar user={session.user} />;
}
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Ensure backend is running first
cd ../../infra && docker compose --profile full up -d

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test focus.spec.ts

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Writing E2E Tests

```typescript
// tests/focus.spec.ts
import { test, expect } from '@playwright/test';

test('can start focus session', async ({ page }) => {
  await page.goto('/focus');
  await page.click('[data-testid="start-session"]');
  await expect(page.locator('[data-testid="timer"]')).toBeVisible();
});
```

---

## Build and Deploy

### Production Build

```bash
npm run build
npm run start
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
npm run lint:fix
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend CORS allows `http://localhost:3000` |
| 401 on all requests | Check if backend is running and cookies are set |
| OAuth callback fails | Verify callback URL matches OAuth app config |
| Types out of sync | Regenerate types from backend OpenAPI spec |

### Debug Tools

```bash
# Check API connectivity
curl http://localhost:8080/health

# Check frontend build
npm run build 2>&1 | head -50

# Check TypeScript errors
npx tsc --noEmit
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.ecent.online` | Backend API URL |
| `NEXT_PUBLIC_DEV_MODE` | No | `false` | Enable dev features |
| `NEXT_TELEMETRY_DISABLED` | No | `1` | Disable Next.js telemetry |

---

## Related Documentation

- [Backend Developer Setup](../backend/developer-setup.md)
- [API Reference](../backend/api-reference.md)
- [Component Library](./components.md)
- [Testing Guide](./testing.md)
