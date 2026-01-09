# Feature Configuration

**Version 10.1+: All features are permanently enabled.**

## Overview

All Starter Engine features are now part of the core platform. There are no feature flags to configure - everything is always on.

## Platform Features (Always Enabled)

| Feature | Description |
|---------|-------------|
| Decision Suppression | State-driven visibility rules to reduce decision paralysis |
| Next Action Resolver | Deterministic CTA selection based on user state |
| Momentum Feedback | "Good start" banner after first completion (session-scoped) |
| Soft Landing | Reduced choices after first action complete/abandon |
| Reduced Mode | Simplified view for users returning after 48+ hours |
| Dynamic UI | Personalized quick picks based on usage patterns |

## Migration from Feature Flags

If you're updating from a version with feature flags:

1. All `isTodayXxxEnabled()` functions now return `true`
2. The wrangler.toml no longer needs `FLAG_*` variables
3. No rollback via flags - use git revert if needed

## Backward Compatibility

The following functions remain for compatibility but always return `true`:

```typescript
import { 
  isTodayDecisionSuppressionEnabled,
  isTodayNextActionResolverEnabled,
  isTodayMomentumFeedbackEnabled,
  isTodaySoftLandingEnabled,
  isTodayReducedModeEnabled,
  isTodayDynamicUIEnabled,
} from "@/lib/flags";

// All return true
if (isTodayDecisionSuppressionEnabled()) {
  // Always executes
}
```

## Rollback Procedure

If a bug is discovered:

1. Identify the problematic feature
2. Fix the code directly or revert commits
3. Redeploy

There is no per-feature kill switch. The platform is now a unified experience.

## See Also

- `docs/starter-engine/Spec.md` - Feature specifications
- `docs/deploy/Checklist.md` - Deployment checklist

