# Operations Runbooks

Operational procedures for the Ignition backend and admin systems.

## Runbooks

| Runbook | Description | Urgency |
|---------|-------------|---------|
| [Deployment](./runbook-deployment.md) | Deploy new backend version | Standard |
| [Rollback](./runbook-rollback.md) | Emergency rollback procedure | High |
| [Database](./runbook-database.md) | Database maintenance and recovery | High |
| [Monitoring](./runbook-monitoring.md) | Health checks and alerting | Standard |
| [Data Cleanup](./runbook-data-cleanup.md) | Manual data cleanup procedures | Low |
| [Admin Operations](./runbook-admin.md) | Admin console operations | Standard |

## Quick Reference

### Service URLs

| Service | Production | Staging |
|---------|------------|---------|
| API | https://api.ecent.online | https://api-staging.ecent.online |
| Frontend | https://ignition.ecent.online | https://staging.ignition.ecent.online |
| Admin | https://admin.ignition.ecent.online | https://admin-staging.ignition.ecent.online |

### Health Endpoints

```bash
# API Health
curl https://api.ecent.online/health

# API Version
curl https://api.ecent.online/api/
```

### Emergency Contacts

| Role | Contact |
|------|---------|
| On-call Engineer | See PagerDuty |
| Database Admin | See Runbook |
| Security Lead | See Runbook |

## Related Docs

- [Backend Architecture](../architecture.md)
- [Developer Setup](../developer-setup.md)
- [Admin API](../admin-api.md)
