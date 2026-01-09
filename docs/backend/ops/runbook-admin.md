# Runbook: Admin Console Operations

Procedures for admin console operations in Ignition.

---

## Access Requirements

- **Role:** Admin role in database (`user_roles.role = 'admin'`)
- **URL:** https://admin.ignition.ecent.online
- **Auth:** Same OAuth as main app (Google/Azure)

---

## Admin API Endpoints

Base URL: `https://api.ecent.online/admin`

### Available Modules

| Module | Endpoint | Description |
|--------|----------|-------------|
| Users | `/admin/users` | User management |
| Quests | `/admin/quests` | Quest CRUD |
| Skills | `/admin/skills` | Skill definitions |
| Feedback | `/admin/feedback` | User feedback review |
| Content | `/admin/content` | Static content |
| Stats | `/admin/stats` | Platform statistics |
| DB | `/admin/db` | Database utilities |
| Backup | `/admin/backup` | Backup/restore |
| Audit | `/admin/audit` | Audit log viewer |
| Templates | `/admin/templates` | Prompt templates |

---

## Common Operations

### Grant Admin Role

```sql
-- Connect to database
psql $DATABASE_URL

-- Find user by email
SELECT id, email, name FROM users WHERE email = 'admin@example.com';

-- Grant admin role
INSERT INTO user_roles (user_id, role, granted_at, granted_by)
VALUES ('user-uuid-here', 'admin', NOW(), 'system');

-- Verify
SELECT u.email, r.role FROM users u
JOIN user_roles r ON u.id = r.user_id
WHERE r.role = 'admin';
```

### Revoke Admin Role

```sql
-- Revoke admin role
DELETE FROM user_roles
WHERE user_id = 'user-uuid-here' AND role = 'admin';

-- Verify
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';
```

### View User Details

```bash
# Via API
curl -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/users/USER_UUID

# Via database
psql $DATABASE_URL -c "
  SELECT u.*, w.coins, w.total_xp
  FROM users u
  LEFT JOIN wallets w ON u.id = w.user_id
  WHERE u.id = 'USER_UUID'
"
```

### Delete User (Soft Delete)

```bash
# Via API
curl -X DELETE \
  -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/users/USER_UUID
```

### Force Cleanup User Data

```bash
# Use with caution - removes orphaned data
curl -X POST \
  -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/users/USER_UUID/cleanup
```

---

## Quest Management

### List All Quests

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/quests
```

### Create Quest

```bash
curl -X POST \
  -H "Cookie: session=$ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Quest",
    "description": "Quest description",
    "xp_reward": 100,
    "coin_reward": 10,
    "type": "daily",
    "requirements": [...]
  }' \
  https://api.ecent.online/admin/quests
```

### Update Quest

```bash
curl -X PUT \
  -H "Cookie: session=$ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "xp_reward": 150}' \
  https://api.ecent.online/admin/quests/QUEST_UUID
```

---

## Database Operations

### Health Check

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/db-health
```

Response:
```json
{
  "status": "healthy",
  "connections": 10,
  "max_connections": 100,
  "tables": 42,
  "indexes": 87
}
```

### Create Backup

```bash
# Trigger backup
curl -X POST \
  -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/backup

# Response includes backup ID
{"backup_id": "backup-2026-01-08-12-00-00", "status": "started"}
```

### Restore from Backup

⚠️ **Destructive operation - requires confirmation**

```bash
curl -X POST \
  -H "Cookie: session=$ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"backup_id": "backup-2026-01-08-12-00-00", "confirm": true}' \
  https://api.ecent.online/admin/restore
```

---

## Audit Log

### View Recent Audit Events

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  "https://api.ecent.online/admin/audit?limit=50"
```

### Filter by Event Type

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  "https://api.ecent.online/admin/audit?event_type=user.deleted&limit=20"
```

### Filter by User

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  "https://api.ecent.online/admin/audit?actor_id=USER_UUID"
```

---

## Statistics

### Platform Stats

```bash
curl -H "Cookie: session=$ADMIN_SESSION" \
  https://api.ecent.online/admin/stats
```

Response:
```json
{
  "users": {
    "total": 1500,
    "active_7d": 450,
    "active_30d": 890,
    "new_30d": 120
  },
  "sessions": {
    "focus_total": 25000,
    "focus_completed": 20000
  },
  "gamification": {
    "total_xp_earned": 5000000,
    "total_coins_earned": 250000
  }
}
```

---

## Security Guidelines

### Do's
- ✅ Always verify user identity before sensitive operations
- ✅ Log all admin actions (automatic via audit)
- ✅ Use least privilege principle
- ✅ Review audit log regularly

### Don'ts
- ❌ Never share admin credentials
- ❌ Never run database queries without backup
- ❌ Never delete data without confirmation
- ❌ Never access user data without business need

---

## Troubleshooting

### Cannot Access Admin Console

1. Verify you have admin role:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'YOUR_UUID' AND role = 'admin';
   ```
2. Clear browser cache/cookies
3. Try incognito mode
4. Check session cookie is set

### API Returns 403 Forbidden

1. Verify session cookie is included
2. Verify admin role is granted
3. Check CSRF token (required for POST/PUT/DELETE)

### Backup Fails

1. Check storage credentials
2. Verify R2 bucket exists
3. Check disk space
4. Review backup logs

---

## Related Docs

- [Deployment Runbook](./runbook-deployment.md)
- [Database Runbook](./runbook-database.md)
- [Admin API Reference](../admin-api.md)
