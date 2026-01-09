# Passion OS — Post-Migration Release Notes

**Version:** 2.0.0  
**Release Date:** January 2026  
**Status:** Stack Modernization Complete

---

## What's New

We've completely rebuilt the backend infrastructure of Passion OS to be faster, more reliable, and more secure. Here's what changed and what it means for you.

---

## 🚀 Performance Improvements

### Faster Load Times
- **Today page** now loads significantly faster
- **Focus timer** starts instantly
- **Workout logging** responds more quickly

### Improved Reliability
- More stable session handling
- Better error recovery
- Consistent experience across devices

---

## 🔐 Security Enhancements

### Improved Session Security
- Sessions are now more secure
- Better protection against session hijacking
- Automatic session refresh

### Enhanced Data Protection
- All data encrypted in transit
- Improved access controls
- Better audit logging for your peace of mind

---

## 🔄 What Stayed the Same

Everything you love about Passion OS works exactly as before:

| Feature | Status |
|---------|--------|
| **Focus Timer** | ✅ Same great Pomodoro experience |
| **Workout Builder** | ✅ All your exercises and PRs preserved |
| **Book Tracker** | ✅ Reading history intact |
| **Quests & Achievements** | ✅ All progress saved |
| **XP & Levels** | ✅ Exactly where you left off |
| **Streaks** | ✅ Preserved and protected |
| **Market & Rewards** | ✅ Coins and purchases intact |
| **Reference Tracks** | ✅ All your audio files safe |

---

## ⚠️ One-Time Actions Required

### Re-Authentication
You will need to **sign in again** after this update. This is a one-time requirement due to the security improvements.

**How to sign in:**
1. Go to [passion-os.ecent.online](https://passion-os.ecent.online)
2. Click "Sign In"
3. Choose Google or Microsoft
4. You're all set!

**Your data is safe.** All your progress, achievements, workouts, and content are preserved.

---

## 📱 Mobile Experience

The mobile web app (`/m/*`) continues to work exactly as before:
- iOS/iPadOS installable PWA
- Same responsive design
- All features accessible

---

## 🎮 Gamification

### Preserved
- ✅ Your current level and XP
- ✅ All earned achievements
- ✅ Skill progress and stars
- ✅ Streak history
- ✅ Coin balance
- ✅ Market purchases (redeemed and unredeemed)

### Unchanged Mechanics
- XP curve remains the same
- Skill star requirements unchanged
- Achievement conditions unchanged
- Market prices unchanged

---

## 📊 Data & Privacy

### What We Store
No changes to what data we collect. We continue to store only:
- Account information (email, name from OAuth provider)
- Your activity data (workouts, focus sessions, reading, etc.)
- Your progress (XP, achievements, streaks)
- Your content (books, goals, reference tracks, etc.)

### What We Don't Store
- Passwords (OAuth only)
- Payment information (no paid features)
- Location data
- Third-party tracking data

### Your Rights
You continue to have full control:
- **Export:** Download all your data anytime (Settings → Export Data)
- **Delete:** Permanently delete your account (Settings → Delete Account)
- **Privacy Policy:** [privacy-policy.md](./privacy-policy.md)

---

## 🐛 Known Issues

None at this time. If you encounter any issues:
1. Try signing out and back in
2. Clear your browser cache
3. Contact us via Feedback (in the app)

---

## 💬 Feedback

We'd love to hear from you! Use the in-app Feedback feature to:
- Report issues
- Suggest improvements
- Share what you love

---

## 📅 What's Coming Next

We're continuing to improve Passion OS with features designed to help you start and stay consistent:

### Coming Soon
- **One-Tap Focus:** Start sessions even faster
- **Achievement Previews:** See what's almost unlocked
- **Weekly Recaps:** Optional email summaries of your progress
- **Streak Shields:** Gentle streak protection

### In Development
- **Skill Tree Visualization:** See your progress visually
- **Waveform Annotations:** Add notes to reference tracks
- **Smart Daily Plans:** Personalized suggestions

---

## 🙏 Thank You

Thank you for using Passion OS. This migration was a significant undertaking, and we did it to ensure the platform can grow with you for years to come.

Keep leveling up! 🎮

---

## Technical Details (For the Curious)

For those interested in the technical changes:

| Component | Before | After |
|-----------|--------|-------|
| Backend | Next.js API Routes | Rust (Axum) |
| Database | Cloudflare D1 (SQLite) | PostgreSQL |
| Auth | NextAuth.js | Custom Rust OAuth |
| Storage | Cloudflare R2 | R2 (backend-only access) |
| Hosting | Cloudflare Workers | Containers |

**Why Rust?**
- Faster response times
- Better memory safety
- Stronger type guarantees
- More predictable performance

**Why PostgreSQL?**
- Better scalability
- Richer query capabilities
- Industry-standard reliability
- Better tooling ecosystem

---

*Last updated: January 8, 2026*
