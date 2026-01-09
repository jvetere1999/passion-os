# Privacy Policy

**Effective Date:** January 8, 2026  
**Last Updated:** January 8, 2026  
**Version:** 2.0

---

## 1. Introduction

This Privacy Policy describes how Ignition ("we", "us", "our") collects, uses, and protects information when you use our productivity application ("Service").

---

## 2. Information We Collect

### 2.1 Account Information

When you create an account, we collect:
- **Email address** (from OAuth provider)
- **Display name** (from OAuth provider)
- **Profile picture URL** (from OAuth provider)
- **OAuth provider identifier** (Google or Microsoft)

### 2.2 Usage Data

We automatically collect:
- Focus session durations and completion status
- Quest progress and completion data
- Calendar events and planner data you create
- Exercise logs and workout data
- Habit completion records
- Learning progress (lessons, reviews)
- Skill progression and XP earned
- Virtual currency (coins) balance and transactions
- Last activity timestamp (when you last used any feature)
- Aggregate counts of feature usage by type

**Privacy Note:** We collect *when* and *what type* of activity occurred, but not the content of your work. For example, we know you completed a focus session, but not what you were focusing on.

### 2.3 Technical Data

- Browser type and version
- Device type (desktop, mobile, tablet)
- General geographic region (country level only)

---

## 3. How We Use Your Information

We use collected information to:
- Provide and maintain the Service
- Track your progress across focus sessions, quests, and goals
- Calculate and display your skill levels and achievements
- Sync your data across devices
- Send important account notifications
- Improve and optimize the Service
- Respond to your feedback and support requests
- Provide a personalized experience based on your usage patterns (see 3.1)

### 3.1 Personalized Experience (Optional)

When enabled, we may use aggregate counts of your feature usage to personalize your Today dashboard. This includes:

- **Quick Picks:** Showing shortcuts to features you use most frequently
- **Resume Suggestions:** Reminding you of features you used recently
- **Interest Prompts:** Suggesting features related to your usage patterns

This personalization:
- Uses only aggregate counts (e.g., "15 focus sessions in 14 days"), not content
- Is based on explicit, deterministic rules (not AI or machine learning)
- Can be disabled by contacting us (see Section 11)
- Does not share any data with third parties

We also use your last activity timestamp to provide a gentler experience if you return after an extended absence (e.g., showing fewer options initially to reduce overwhelm). This feature is designed to support users, not to track or judge them.

---

## 4. Data Retention

| Data Type | Retention Period | Notes |
|-----------|-----------------|-------|
| Account data | Until account deletion | Or 30 days after deletion request |
| Activity events | 2 years rolling | Older events are automatically purged |
| Session logs | 90 days | For debugging and support |
| Audit logs | 1 year | Security and compliance |
| Backup data | 30 days | Rotated automatically |

### 4.1 Automatic Data Cleanup

Our system automatically:
- Purges activity events older than 2 years
- Clears session logs older than 90 days
- Removes soft-deleted accounts after 30 days
- Rotates backup files after 30 days

### 4.2 Account Deletion

When you request account deletion:
1. Your account is immediately soft-deleted (hidden from the system)
2. After 30 days, all data is permanently removed
3. Backups containing your data expire within 30 days
4. You may cancel deletion within the 30-day period by contacting us

---

## 5. Data Storage and Security

### 5.1 Where Data Is Stored

- **Database:** PostgreSQL hosted on secure cloud infrastructure
- **File Storage:** Cloudflare R2 (S3-compatible) for audio and media files
- **Region:** Data is processed in the United States

### 5.2 Security Measures

We implement:
- HTTPS/TLS encryption for all data in transit
- Encrypted database connections
- Secure session cookies (HttpOnly, Secure, SameSite)
- Role-based access control for internal systems
- Regular security audits
- Automated vulnerability scanning

---

## 6. Third-Party Services

We use the following third-party services:

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google OAuth | Authentication | Email, name, profile picture |
| Microsoft OAuth | Authentication | Email, name, profile picture |
| Cloudflare | CDN, DDoS protection | IP address (not logged) |
| Google AdSense | Advertising (if enabled) | Anonymous usage data |

We do not sell your personal data to third parties.

---

## 7. Cookies and Local Storage

We use:
- **Session cookies:** For authentication (HttpOnly, Secure, SameSite=None)
- **Local storage:** For theme preferences, expand/collapse states, and UI settings
- **Session storage:** For temporary UI state within a browser session (e.g., acknowledgment banners)

Session storage data is automatically cleared when you close your browser.

We do not use third-party tracking cookies or advertising cookies beyond those required by AdSense.

---

## 8. Your Rights

You have the right to:
- **Access:** Request a copy of your data
- **Correction:** Update inaccurate information
- **Deletion:** Request account and data deletion
- **Export:** Receive your data in a portable format (JSON)
- **Restriction:** Limit how we process your data
- **Withdraw Consent:** For optional features like personalization

To exercise these rights, contact us at privacy@ecent.online.

---

## 9. Children's Privacy

Our Service is intended for users 16 years and older. We do not knowingly collect data from children under 16. If you believe we have collected data from a child under 16, please contact us immediately.

---

## 10. International Users

If you are accessing our Service from outside the United States, please be aware that your data will be transferred to and processed in the United States. By using our Service, you consent to this transfer.

---

## 11. Contact Us

For privacy-related questions or requests:

- **Email:** privacy@ecent.online
- **General Support:** support@ecent.online

We will respond to privacy requests within 30 days.

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:
- Posting the new policy on this page
- Updating the "Last Updated" date
- Sending an email notification for significant changes

---

## Appendix A: Data Fields Reference

### User Table

| Field | Purpose | Retention |
|-------|---------|-----------|
| `id` | Unique identifier | Until deletion |
| `email` | Account identification | Until deletion |
| `name` | Display name | Until deletion |
| `image` | Profile picture URL | Until deletion |
| `created_at` | Account creation date | Until deletion |
| `last_activity_at` | Last feature usage | Until deletion |
| `tos_accepted` | Terms acceptance status | Until deletion |

### Activity Events

| Field | Purpose | Retention |
|-------|---------|-----------|
| `event_type` | Type of activity | 2 years |
| `created_at` | When activity occurred | 2 years |
| `xp_earned` | XP awarded | 2 years |
| `coins_earned` | Coins awarded | 2 years |
| `entity_type` | Related item category | 2 years |

---

**End of Privacy Policy**
