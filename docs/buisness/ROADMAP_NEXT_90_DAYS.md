# Passion OS / Ignition — 90-Day Roadmap

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Status:** Post-Migration Planning Phase  
**Author:** Architecture Recommender

---

## Executive Summary

With the backend-first migration at 99% backend parity (95/96 routes) and 89% overall parity (84/94 live routes), this roadmap outlines strategic next steps across three horizons. The focus is on **completing cutover**, **stabilizing for users**, and **extending the starter-engine philosophy**.

---

## Horizon Overview

| Horizon | Timeframe | Theme | Key Outcomes |
|---------|-----------|-------|--------------|
| **H1** | Weeks 1-2 | Complete & Cutover | Close remaining gaps, go-live, deprecate legacy |
| **H2** | Weeks 3-4 | Stabilize & Polish | Performance tuning, UX refinements, monitoring |
| **H3** | Weeks 5-12 | Extend & Delight | New features aligned with ADHD-friendly philosophy |

---

## Horizon 1: Complete & Cutover (Weeks 1-2)

### Objective
Close the 2 open feature gaps, execute production cutover, and complete legacy deprecation.

### Work Items

| ID | Item | Effort | Risk | Success Metric | Dependencies |
|----|------|--------|------|----------------|--------------|
| H1-01 | Wire reference router (FGAP-009) | S | Low | 9 reference routes functional | None |
| H1-02 | Decide Analysis route (FGAP-010/DEC-006) | XS | Low | Route removed or implemented | Owner decision |
| H1-03 | Complete LATER-001–005 provisioning | M | Medium | All external resources provisioned | External console access |
| H1-04 | OAuth redirect URI updates (LATER-004) | S | High | OAuth login works on api.ecent.online | Console access |
| H1-05 | Execute go-live checklist | M | High | Production traffic on new backend | H1-01–04 |
| H1-06 | Move legacy code to `deprecated/` | S | Low | No duplicate live implementations | H1-05 |
| H1-07 | Update DNS/TLS (api.ecent.online) | S | Medium | HTTPS working, cookies set correctly | LATER-009–011 |

### Effort Legend
- XS: < 2 hours
- S: 2-4 hours
- M: 4-8 hours
- L: 1-3 days
- XL: 3+ days

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth redirect misconfiguration | Medium | Critical | Test with staging domain first |
| Session cookie domain mismatch | Low | High | Verify `Domain=ecent.online; SameSite=None; Secure; HttpOnly` |
| DNS propagation delay | Low | Medium | Use low TTL, have rollback plan |

### Success Criteria (H1)
- [ ] All 96 PARITY items at ✅ Done or 📌 Intentional Stub
- [ ] 0 open FGAPs (FGAP-009 closed, FGAP-010 resolved)
- [ ] Production traffic serving from api.ecent.online
- [ ] OAuth login working (Google + Azure)
- [ ] All legacy API routes in `deprecated/`

---

## Horizon 2: Stabilize & Polish (Weeks 3-4)

### Objective
Production stability, performance baselines, and UX polish before extending features.

### Work Items

| ID | Item | Effort | Risk | Success Metric | Dependencies |
|----|------|--------|------|----------------|--------------|
| H2-01 | Session cache implementation | M | Low | p95 latency < 50ms for authed requests | H1 complete |
| H2-02 | Connection pool tuning | S | Low | No connection exhaustion under load | H1 complete |
| H2-03 | Observability dashboard | M | Low | Metrics visible in admin console | H1 complete |
| H2-04 | Error budget monitoring | M | Low | SLO tracking active | H2-03 |
| H2-05 | Today page performance audit | S | Low | LCP < 2s on mobile | H1 complete |
| H2-06 | Deep cleanup execution | L | Low | All DEEP_CLEANUP_PLAN items checked | H1 complete |
| H2-07 | E2E test expansion (P1 items) | L | Low | 90%+ route coverage | H1 complete |
| H2-08 | Admin console security audit | M | Medium | RBAC tested, audit trail verified | H1 complete |

### Performance Targets

| Metric | Current (UNKNOWN) | Target | Measurement |
|--------|-------------------|--------|-------------|
| API p50 latency | UNKNOWN | < 30ms | Backend metrics |
| API p95 latency | UNKNOWN | < 100ms | Backend metrics |
| Today page LCP | UNKNOWN | < 2s | Lighthouse |
| OAuth flow time | UNKNOWN | < 3s | E2E test timing |

### Success Criteria (H2)
- [ ] Performance baselines documented
- [ ] Observability dashboard live
- [ ] DEEP_CLEANUP_PLAN 100% complete
- [ ] No P0 bugs in production for 7 days
- [ ] E2E coverage ≥ 90% of routes

---

## Horizon 3: Extend & Delight (Weeks 5-12)

### Objective
Extend the platform with new features aligned with the **starter-engine philosophy**: encourage starting, celebrate small wins, never punish.

### Theme: "Friction Reduction"

The core ADHD-friendly insight is that **starting is the hardest part**. All H3 features should reduce friction to start and amplify the reward of completing.

### Feature Recommendations

#### 3.1 Quick-Start Actions (P1 - Weeks 5-6)

| Feature | Description | Effort | Value | Risk |
|---------|-------------|--------|-------|------|
| **One-Tap Focus** | Start focus session from Today without navigation | S | High | Low |
| **Workout of the Day** | Pre-generated workout suggestion based on history | M | Medium | Low |
| **Smart Daily Plan** | AI-assisted plan generation based on energy/time | L | High | Medium |
| **Streak Shields** | Protect streaks with earned coins (gentle recovery) | S | Medium | Low |

**Success Metric:** 20% increase in sessions started per user per week.

#### 3.2 Ambient Progress (P1 - Weeks 7-8)

| Feature | Description | Effort | Value | Risk |
|---------|-------------|--------|-------|------|
| **Progress Pulse** | Subtle daily summary notification (opt-in) | M | Medium | Low |
| **Achievement Previews** | Show "almost there" achievements on Today | S | High | Low |
| **Weekly Recap Email** | Digest of XP, streaks, PRs (opt-in) | M | Medium | Low |
| **Skill Tree Visualization** | Visual skill progression map | L | High | Medium |

**Success Metric:** 15% improvement in 7-day retention.

#### 3.3 Reference Track Critical Listening (P2 - Weeks 9-10)

Leverage the fully-implemented reference tracks backend (816 lines in reference.rs):

| Feature | Description | Effort | Value | Risk |
|---------|-------------|--------|-------|------|
| **Waveform Annotations** | Add timestamped notes to tracks | M | High | Low |
| **A/B Comparison Mode** | Quick-switch between two tracks | L | High | Medium |
| **Frequency Analysis Overlay** | Spectral view on waveform | XL | Medium | High |
| **Listening Session XP** | Award XP for active listening sessions | S | Medium | Low |

**Success Metric:** 30% increase in reference track uploads.

#### 3.4 Social Accountability (P2 - Weeks 11-12)

| Feature | Description | Effort | Value | Risk |
|---------|-------------|--------|-------|------|
| **Accountability Partners** | Share progress with 1-3 trusted friends | XL | High | Medium |
| **Group Quests** | Collaborative challenges (opt-in) | XL | Medium | High |
| **Public Streaks** | Optional public streak display | M | Low | Low |

**UNKNOWN:** User appetite for social features. Recommend A/B testing.

**Success Metric:** 10% of users opt in to social features.

### Features to Avoid (Anti-Patterns)

| Anti-Pattern | Why Avoid | Alternative |
|--------------|-----------|-------------|
| Leaderboards | Pressure, comparison anxiety | Personal bests only |
| Punitive streak loss | Discourages return after break | Streak shields, gentle recovery |
| Complex unlock trees | Decision fatigue | Linear skill progression |
| Daily login rewards | Creates guilt, not value | Activity-based rewards |
| Limited-time events | FOMO pressure | Evergreen content |

---

## UNKNOWN Items (Require Evidence)

| ID | Unknown | Impact | How to Resolve |
|----|---------|--------|----------------|
| UNK-R01 | Current production latency metrics | H2 planning | Implement observability first |
| UNK-R02 | User retention rates | H3 prioritization | Add analytics tracking |
| UNK-R03 | Feature usage distribution | H3 prioritization | Add feature analytics |
| UNK-R04 | Mobile vs desktop split | UI prioritization | Add device analytics |
| UNK-R05 | Social feature appetite | H3-4 scoping | User survey or A/B test |

---

## Resource Assumptions

| Resource | Assumption | Risk if Wrong |
|----------|------------|---------------|
| Developer time | 1-2 developers, 50% capacity | Horizons slip |
| External access | Available for LATER-* items | H1 blocked |
| Owner decisions | Responsive within 24h | Items stall |
| Infrastructure budget | Postgres + R2 within budget | Must optimize or scale |

---

## Milestone Calendar

```
Week 1:  [H1] Wire reference router, Analysis decision, Provisioning
Week 2:  [H1] OAuth URIs, Go-live, Legacy deprecation, DNS/TLS
Week 3:  [H2] Session cache, Connection pool, Deep cleanup start
Week 4:  [H2] Observability, Error budgets, E2E expansion, Security audit
Week 5:  [H3] One-Tap Focus, Achievement Previews
Week 6:  [H3] Smart Daily Plan (design), Streak Shields
Week 7:  [H3] Progress Pulse, Weekly Recap Email
Week 8:  [H3] Skill Tree Visualization (design + MVP)
Week 9:  [H3] Waveform Annotations, Listening Session XP
Week 10: [H3] A/B Comparison Mode
Week 11: [H3] Accountability Partners (design)
Week 12: [H3] Accountability Partners (MVP), Retrospective
```

---

## Go/No-Go Criteria

### H1 → H2 Gate
- [ ] Production traffic stable for 48h
- [ ] No P0/P1 bugs open
- [ ] All LATER-* items resolved or explicitly deferred

### H2 → H3 Gate
- [ ] Performance baselines documented
- [ ] Deep cleanup complete
- [ ] E2E coverage ≥ 90%
- [ ] No P0 bugs for 7 days

---

## References

- [feature_parity_checklist.md](../backend/migration/feature_parity_checklist.md)
- [FEATURE_GAP_REGISTER.md](../backend/migration/FEATURE_GAP_REGISTER.md)
- [DEEP_CLEANUP_PLAN.md](../backend/migration/DEEP_CLEANUP_PLAN.md)
- [gamification-loop.md](../gamification-loop.md)
- [PRODUCT_SPEC.md](../PRODUCT_SPEC.md)
