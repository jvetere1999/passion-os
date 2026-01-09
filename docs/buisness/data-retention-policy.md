# Data Retention Policy

**Effective Date:** January 8, 2026  
**Version:** 1.0

---

## Overview

This document defines data retention periods and cleanup policies for the Ignition platform.

---

## Retention Schedule

### User Data

| Data Type | Retention Period | Cleanup Method |
|-----------|-----------------|----------------|
| User accounts | Until deletion requested | Manual request |
| Profile information | Until account deletion | Cascades with account |
| Terms acceptance | Until account deletion | Cascades with account |

### Activity Data

| Data Type | Retention Period | Cleanup Method |
|-----------|-----------------|----------------|
| Activity events | 2 years rolling | Automated weekly purge |
| Focus sessions | 2 years rolling | Automated weekly purge |
| Habit logs | 2 years rolling | Automated weekly purge |
| Quest completions | 2 years rolling | Automated weekly purge |

### System Data

| Data Type | Retention Period | Cleanup Method |
|-----------|-----------------|----------------|
| Session records | 90 days | Automated daily purge |
| Audit logs | 1 year | Automated monthly archive |
| Error logs | 30 days | Log rotation |
| Access logs | 7 days | Log rotation |

### Backup Data

| Data Type | Retention Period | Cleanup Method |
|-----------|-----------------|----------------|
| Database backups | 30 days | Automated rotation |
| Storage snapshots | 30 days | Automated rotation |
| Pre-migration backups | 90 days | Manual review required |

---

## Account Deletion Process

### Soft Delete Phase (Days 0-30)

1. User requests deletion
2. Account marked as `deleted_at = NOW()`
3. User loses access immediately
4. Data retained but hidden from queries
5. User can request cancellation within 30 days

### Hard Delete Phase (Day 30+)

1. Automated job runs daily
2. Accounts with `deleted_at` > 30 days selected
3. All related data permanently removed:
   - Activity events
   - Focus sessions
   - Habits and logs
   - Goals and milestones
   - Quest progress
   - Market transactions
   - Stored files (R2)
4. User record removed
5. Audit log entry created (anonymized)

### Cascade Order

```sql
-- Deletion cascades in this order:
1. sessions (user_id FK)
2. activity_events (user_id FK)
3. focus_sessions (user_id FK)
4. habits (user_id FK)
5. habit_logs (habit_id FK -> habits)
6. goals (user_id FK)
7. milestones (goal_id FK -> goals)
8. quest_progress (user_id FK)
9. market_purchases (user_id FK)
10. user_skills (user_id FK)
11. user_achievements (user_id FK)
12. wallets (user_id FK)
13. users (id PK)
```

---

## Automated Cleanup Jobs

### Daily Jobs

| Job | Time (UTC) | Description |
|-----|-----------|-------------|
| `cleanup_expired_sessions` | 02:00 | Remove sessions older than 90 days |
| `cleanup_deleted_accounts` | 03:00 | Hard delete accounts past 30-day window |

### Weekly Jobs

| Job | Time (UTC) | Description |
|-----|-----------|-------------|
| `purge_old_activity` | Sunday 04:00 | Remove activity events older than 2 years |
| `purge_old_focus` | Sunday 04:30 | Remove focus sessions older than 2 years |
| `purge_old_habits` | Sunday 05:00 | Remove habit logs older than 2 years |

### Monthly Jobs

| Job | Time (UTC) | Description |
|-----|-----------|-------------|
| `archive_audit_logs` | 1st 06:00 | Archive audit logs older than 1 year |
| `cleanup_orphan_files` | 1st 07:00 | Remove R2 files without DB references |

---

## Data Export Rights

Users may request a full export of their data:

### Export Format

```json
{
  "export_date": "2026-01-08T12:00:00Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Display Name",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "gamification": {
    "total_xp": 12500,
    "level": 15,
    "coins": 340,
    "skills": [...]
  },
  "activity_events": [...],
  "focus_sessions": [...],
  "habits": [...],
  "goals": [...],
  "quests": [...]
}
```

### Export Request Process

1. User submits request via support email
2. Admin generates export (within 7 days)
3. User receives secure download link (valid 48 hours)
4. Export file deleted after download or expiry

---

## Exceptions

### Legal Hold

When subject to legal hold:
1. Automated deletion paused for specified accounts
2. Manual review required before any deletion
3. Legal team notified of expiring holds

### Regulatory Requirements

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| GDPR (EU) | Right to erasure | 30-day deletion window |
| CCPA (CA) | Right to delete | 30-day deletion window |
| Tax records | 7-year retention | Purchases archived separately |

---

## Compliance Verification

### Monthly Audit

- Count of soft-deleted accounts
- Count of hard-deleted accounts
- Oldest activity event (should be < 2 years)
- Oldest session record (should be < 90 days)

### Annual Review

- Policy review and updates
- Retention period appropriateness
- Compliance with new regulations
- Cost optimization for storage

---

## References

- [Privacy Policy](../user/privacy-policy.md)
- [Compliance Overview](./compliance.md)
- [Ops Runbook: Data Cleanup](../backend/ops/runbook-data-cleanup.md)
