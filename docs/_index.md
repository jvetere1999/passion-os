# 📚 Ignition Documentation Hub

Welcome to Ignition's comprehensive documentation. This page serves as your navigation hub for all project resources.

---

## 🚀 Quick Start

**New to Ignition?** Start here:
- [Project Overview](../README.md)
- [Getting Started Guide](guides/setup.md) *(coming soon)*
- [Architecture Overview](architecture/README.md)

---

## 📖 Core Guides

### Release & Versioning
- [Versioning System](guides/versioning.md) - Semantic versioning, release channels, and processes
- [Release Strategy](guides/release-strategy.md) - Timeline, phases, quality gates
- [Deployment Procedures](guides/deployment.md) *(see infrastructure/deploy/README.md)*

### Development
- [Contributing Guidelines](guides/contributing.md) *(coming soon)*
- [Architecture & Design](architecture/README.md) - System design, database schema, API design
- [Development Setup](guides/setup.md) *(coming soon)*

---

## 📋 Code Standards

Follow these standards when contributing to Ignition:

- [Backend Import Style](standards/backend-imports.md) - Rust/import conventions
- [Frontend Style Guide](standards/frontend-style.md) - React/TypeScript conventions
- [Logging Standards](standards/logging.md) - How to log effectively
- [Testing Guidelines](standards/testing.md) - Writing E2E and unit tests

---

## 🔌 API Documentation

### OpenAPI Specification
- [Full OpenAPI Spec](api/openapi/openapi.yaml) - Complete REST API specification
- [API Reference](api/reference.md) *(coming soon)*
- [Endpoints](api/endpoints.md) *(see openapi.yaml for details)*

### Backend
- [API Architecture](architecture/api.md) - REST API design and patterns
- [Database Schema](architecture/database.md) - PostgreSQL schema
- [Migrations](architecture/migrations.md) *(see app/database/migrations/)*

---

## 🏗️ Architecture

Understand the system design:

- [System Overview](architecture/overview.md)
- [Database Schema](architecture/database.md)
- [API Design](architecture/api.md)
- [Frontend Architecture](architecture/frontend.md)
- [Service Worker](architecture/service-worker.md)
- [Authentication Flow](architecture/authentication.md)

---

## 🛡️ Security

Security-related documentation:

- [Security Policies](security/policies.md)
- [Authentication & Authorization](security/auth.md)
- [Data Protection](security/data-protection.md)
- [Service Worker Security](architecture/service-worker.md) - Per-user caching, endpoint whitelist, TTL

---

## 📊 Project

Project management and tracking:

- [Current Status](../management/current-state.md)
- [Implementation Plan](../management/implementation-plan.md)
- [Status Reports](../management/status-reports/)
- [Meeting Notes](project/meeting-notes.md) *(coming soon)*

---

## 🔧 Infrastructure

Deployment and infrastructure documentation:

- **Deployment**: See [infrastructure/deploy/README.md](../infrastructure/deploy/README.md)
- **Monitoring**: See [infrastructure/monitoring/](../infrastructure/monitoring/)
- **CI/CD**: See [.github/workflows/](../.github/workflows/)
- **Database**: See [Neon PostgreSQL](https://neon.tech/)
- **Backend Hosting**: See [Fly.io](https://fly.io/)
- **Frontend Hosting**: See [Cloudflare Workers](https://workers.cloudflare.com/)

---

## 🧪 Testing

Testing strategies and frameworks:

- [E2E Tests](tests/) - Playwright test suite
- [Testing Guidelines](standards/testing.md)
- [Backend Testing](standards/backend-testing.md)

---

## 📦 Release History

See [CHANGELOG.md](../CHANGELOG.md) for:
- What's new in each release
- Bug fixes and improvements
- Security updates
- Known limitations

---

## 🗂️ Directory Structure

```
docs/
├── _index.md              ← You are here
├── guides/                ← How-to guides
│   ├── versioning.md
│   ├── release-strategy.md
│   ├── deployment.md
│   └── setup.md
├── standards/             ← Code standards & conventions
│   ├── backend-imports.md
│   ├── frontend-style.md
│   ├── logging.md
│   └── testing.md
├── api/                   ← API documentation
│   ├── openapi/
│   │   └── openapi.yaml   ← REST API specification
│   └── reference.md
├── architecture/          ← System design
│   ├── overview.md
│   ├── database.md
│   ├── api.md
│   ├── frontend.md
│   ├── service-worker.md
│   └── authentication.md
├── security/              ← Security documentation
│   ├── policies.md
│   ├── auth.md
│   └── data-protection.md
└── project/               ← Project management
    ├── meeting-notes.md
    └── roadmap.md
```

---

## 🔍 Finding What You Need

### By Role

**Product Manager?**
→ [Project Status](../management/current-state.md) | [Release Strategy](guides/release-strategy.md) | [Architecture](architecture/overview.md)

**Backend Engineer?**
→ [Backend Standards](standards/backend-imports.md) | [API Design](architecture/api.md) | [Database](architecture/database.md)

**Frontend Engineer?**
→ [Frontend Standards](standards/frontend-style.md) | [Architecture](architecture/frontend.md) | [API Reference](api/reference.md)

**DevOps/Infrastructure?**
→ [Deployment Guide](../infrastructure/deploy/README.md) | [Monitoring](../infrastructure/monitoring/) | [CI/CD](../.github/workflows/)

**Security?**
→ [Security Policies](security/policies.md) | [Authentication](security/auth.md) | [Data Protection](security/data-protection.md)

### By Task

**I want to...**

- **Make a release** → [Release Strategy](guides/release-strategy.md) + [Versioning](guides/versioning.md)
- **Deploy to production** → [infrastructure/deploy/README.md](../infrastructure/deploy/README.md)
- **Write backend code** → [Backend Standards](standards/backend-imports.md) + [API Design](architecture/api.md)
- **Write frontend code** → [Frontend Standards](standards/frontend-style.md) + [Architecture](architecture/frontend.md)
- **Write tests** → [Testing Guidelines](standards/testing.md)
- **Review code** → [Code Standards](standards/) + [Logging](standards/logging.md)
- **Understand the system** → [Architecture](architecture/overview.md) + [Database](architecture/database.md)
- **Check project status** → [Current State](../management/current-state.md) + [Status Reports](../management/status-reports/)

---

## 📞 FAQ

**Q: Where do I find deployment instructions?**
→ [infrastructure/deploy/README.md](../infrastructure/deploy/README.md)

**Q: How do I make a release?**
→ [guides/versioning.md](guides/versioning.md) - `npm run release:patch/minor/major`

**Q: What's the API specification?**
→ [api/openapi/openapi.yaml](api/openapi/openapi.yaml)

**Q: Where's the database schema?**
→ [architecture/database.md](architecture/database.md)

**Q: How do I set up the project?**
→ [README.md](../README.md) (root) - or [guides/setup.md](guides/setup.md) when available

**Q: What coding standards apply?**
→ [standards/](standards/) directory - Backend, Frontend, Logging, Testing

**Q: Where are the CI/CD pipelines?**
→ [.github/workflows/](../.github/workflows/) directory

---

## 🚦 Status & Next Steps

- ✅ **Documentation Hub** - Created and organized
- ✅ **Versioning & Release** - [guides/versioning.md](guides/versioning.md) + [guides/release-strategy.md](guides/release-strategy.md)
- ✅ **API Documentation** - [api/openapi/openapi.yaml](api/openapi/openapi.yaml)
- 📋 **Architecture Docs** - In progress, see [architecture/](architecture/)
- 📋 **Security Docs** - In progress, see [security/](security/)
- 🟡 **Setup Guide** - Planned - [guides/setup.md](guides/setup.md)
- 🟡 **Contributing Guidelines** - Planned - [guides/contributing.md](guides/contributing.md)

---

## 📝 Version

**Ignition Version:** 1.0.0-beta.1  
**Release Channel:** Beta  
**Last Updated:** January 20, 2026

For release notes, see [CHANGELOG.md](../CHANGELOG.md)

---

## 🔗 Quick Links

- **GitHub Repository**: https://github.com/jvetere1999/ignition
- **GitHub Releases**: https://github.com/jvetere1999/ignition/releases
- **Project Status**: [management/current-state.md](../management/current-state.md)
- **Infrastructure**: [infrastructure/deploy/README.md](../infrastructure/deploy/README.md)
- **Changelog**: [CHANGELOG.md](../CHANGELOG.md)

---

**Happy coding! 🚀**  
If you have questions, see [FAQ](#-faq) or check the relevant documentation section above.
