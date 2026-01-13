#!/bin/bash
cd /Users/Shared/passion-os-next
git commit -m "Pitfall fixes: Update documentation and error handling

Fixed pitfalls identified in Jan 14 scan:
- OnboardingProvider: Updated stale comments (DISABLED -> ENABLED)
- ReferenceLibrary: Clarified placeholder documentation
- FocusTracks: Updated TODO comment with clearer status
- admin.rs: Replaced unwrap with Result error handling
- blobs.rs: Replaced unwrap with proper error propagation
- admin_templates.rs: Improved test error handling
- auth.rs: Fixed UUID parsing with descriptive error

Error Handling:
- Serialization errors now return AppError
- Response building errors properly handled
- Better error messages throughout

Validation: Frontend lints pass, 0 errors"

echo "Commit complete, now pushing..."
git push origin production
