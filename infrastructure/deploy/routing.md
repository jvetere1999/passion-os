# Ignition Routing Configuration

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Production routing configuration for cutover

---

## Domain Structure

```
                    ┌─────────────────────────────────────┐
                    │         Load Balancer / CDN         │
                    │      (Cloudflare / nginx / etc)     │
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ignition.ecent.online│   │api.ecent.online     │   │admin.ignition.      │
│                     │   │                     │   │   ecent.online      │
│   Frontend (UI)     │   │   Backend (API)     │   │   Admin Console     │
│   Static / SSR      │   │   Rust / Axum       │   │   Static / SSR      │
└─────────────────────┘   └──────────┬──────────┘   └─────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │    PostgreSQL 17    │
                          │   (ignition-db)     │
                          └─────────────────────┘
```

---

## DNS Records

### Production

| Record | Type | Value | TTL | Notes |
|--------|------|-------|-----|-------|
| `ignition.ecent.online` | A/AAAA | CDN IP | 300 | Frontend |
| `api.ecent.online` | A/AAAA | Backend IP | 300 | API backend |
| `admin.ignition.ecent.online` | A/AAAA | CDN IP | 300 | Admin UI |

### DNS Cutover Sequence

1. **T-24h:** Reduce TTL to 300s on all records
2. **T-0:** Update DNS records to new infrastructure
3. **T+5m:** Verify propagation via multiple DNS resolvers
4. **T+1h:** Confirm all traffic on new infrastructure
5. **T+24h:** (Optional) Increase TTL back to 3600s

---

## TLS Certificates

### Requirements

| Domain | Certificate | Provider |
|--------|-------------|----------|
| `ignition.ecent.online` | Wildcard or SAN | Cloudflare / Let's Encrypt |
| `api.ecent.online` | Dedicated or SAN | Cloudflare / Let's Encrypt |
| `admin.ignition.ecent.online` | Covered by wildcard | Same as frontend |

### Certificate Checklist

- [ ] Certificates provisioned for all domains
- [ ] Auto-renewal configured
- [ ] Certificate chain validated
- [ ] HSTS headers configured (after stable)

---

## Load Balancer Configuration

### Backend (api.ecent.online)

```nginx
# Example nginx configuration

upstream backend {
    server ignition-api:8080;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.ecent.online;

    ssl_certificate /etc/ssl/api.ecent.online.pem;
    ssl_certificate_key /etc/ssl/api.ecent.online.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Health check (no auth required)
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

---

## CORS Configuration

### Allowed Origins (Backend)

```rust
const ALLOWED_ORIGINS: &[&str] = &[
    "https://ignition.ecent.online",
    "https://admin.ignition.ecent.online",
];

// Development only (when SERVER_ENVIRONMENT=development)
const DEV_ORIGINS: &[&str] = &[
    "http://localhost:3000",
    "http://localhost:3001",
];
```

### CORS Headers

| Header | Production Value |
|--------|------------------|
| `Access-Control-Allow-Origin` | Request origin if in allowlist |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, PATCH, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization, X-Request-ID` |
| `Access-Control-Max-Age` | `86400` |

---

## Cookie Configuration

### Session Cookie

```
Set-Cookie: session=<token>; Domain=ecent.online; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000
```

| Attribute | Value | Reason |
|-----------|-------|--------|
| `Domain` | `ecent.online` | Shared across all subdomains |
| `SameSite` | `None` | Required for cross-origin API calls |
| `Secure` | `true` | Required for SameSite=None |
| `HttpOnly` | `true` | XSS protection |
| `Max-Age` | `2592000` | 30 days |

---

## Health Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Liveness | `{"status":"healthy","version":"v1.0.0"}` |
| `GET /health/ready` | Readiness | `{"status":"ready","db":"connected"}` |
| `GET /health/db` | DB check | `{"status":"connected","latency_ms":5}` |

---

## Rate Limiting (Future)

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/auth/*` | 10 | 1 minute |
| `/api/*` (authenticated) | 100 | 1 minute |
| `/api/*` (unauthenticated) | 20 | 1 minute |
| `/admin/*` | 50 | 1 minute |

---

## Monitoring Endpoints

| Path | Metrics |
|------|---------|
| `/metrics` | Prometheus format (if enabled) |
| `/health` | JSON health status |

---

## References

- [docs/backend/migration/routing_and_domains.md](../docs/backend/migration/routing_and_domains.md)
- [docs/backend/migration/security_model.md](../docs/backend/migration/security_model.md)
- [deploy/rollback.md](./rollback.md)

