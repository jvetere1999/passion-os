# Backend Documentation

Developer documentation for the Ignition backend (Rust/Axum).

## Contents

| Document | Description |
|----------|-------------|
| [Developer Setup](./developer-setup.md) | Local development environment setup |
| [Architecture](./architecture.md) | Backend structure and patterns |
| [API Reference](./api-reference.md) | Complete API endpoint documentation |
| [Database](./database.md) | Schema and migration guide |
| [Authentication](./authentication.md) | OAuth and session handling |
| [Admin API](./admin-api.md) | Admin console endpoints |
| [Testing](./testing.md) | Testing strategy and patterns |

## Quick Reference

- **Location:** `app/backend/`
- **Framework:** Axum + Tower (Rust)
- **Database:** PostgreSQL 17
- **Storage:** Cloudflare R2 (S3-compatible)
- **API URL:** https://api.ecent.online

## API Modules

| Module | Path | Description |
|--------|------|-------------|
| Auth | `/auth/*` | OAuth login/logout, session management |
| Focus | `/api/focus/*` | Focus sessions and timer |
| Quests | `/api/quests/*` | Quest CRUD and progress |
| Habits | `/api/habits/*` | Habit tracking |
| Goals | `/api/goals/*` | Goal management |
| Calendar | `/api/calendar/*` | Calendar events |
| Exercise | `/api/exercise/*` | Workouts and programs |
| Market | `/api/market/*` | Rewards shop |
| Learn | `/api/learn/*` | Learning modules |
| Gamification | `/api/gamification/*` | XP, coins, skills |
| Admin | `/admin/*` | Admin-only operations |

## Related Docs

- [Frontend Documentation](../frontend/README.md)
- [Migration Status](./migration/README.md)
- [Ops Runbooks](./ops/README.md)
