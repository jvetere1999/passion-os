# 🔐 Ignition OS Complete Encryption Specification

**Date:** January 14, 2026  
**Version:** 1.1 (Canonical)  
**Status:** Production Ready  
**Authority:** Master Feature Spec

---

## Table of Contents

1. [End-to-End Encryption (E2EE)](#end-to-end-encryption-e2ee)
2. [Cryptographic Standards](#cryptographic-standards)
3. [Vault Lock Policy](#vault-lock-policy)
4. [E2EE Boundary & Trust Model](#e2ee-boundary--trust-model)
5. [Implementation Status](#implementation-status)
6. [Forward-Looking Items](#forward-looking-items)
7. [Explicit Decisions](#explicit-decisions)
8. [Roadmap](#roadmap)

---

## End-to-End Encryption (E2EE)

### Goal

Encrypt user intellectual property so **only the user can decrypt**; server stores opaque blobs.

### Key Points

- ✅ Works with Google/Microsoft SSO
- ✅ Supports multiple devices
- ✅ Requires user-held vault secret (passphrase) separate from SSO
- ✅ Admin/database operators cannot read private content

### Architecture

```
User Vault Passphrase
  ↓
derive key (PBKDF2-HMAC-SHA256, 100k iterations, 16-byte salt)
  ↓
encrypt/decrypt private work (AES-256-GCM, 12-byte IV)
  ↓
opaque ciphertext stored in Postgres + R2
```

**Note:** v1 ships without KEK wrapping or Argon2id; those remain planned for v2.

### Vault Operations

| Operation | Status | Details |
|-----------|--------|---------|
| Init vault | ✅ Complete | First-time setup with passphrase |
| Unlock vault | ✅ Complete | Per session/device with key derivation |
| Rewrap KEK | ⏳ v2 | Passphrase change with re-encryption |
| Recovery codes | ⏳ v2 | One-time recovery flow with SSO re-auth |

### Record Rules

- **One encrypted blob per record** (immutable after creation)
- **IV:** 12 bytes (96-bit random, per-record)
- **Salt:** 16 bytes (128-bit random, per-record)
- **Payload format:**
  ```json
  {
    "iv": "base64-encoded-12-byte-iv",
    "salt": "base64-encoded-16-byte-salt",
    "cipher": "base64-encoded-ciphertext",
    "version": "v1"
  }
  ```
- **AAD:** Not used in v1 (future: bind user_id + record_id + type + version)

### DAW Files

- **Client-side chunking** with per-chunk nonce
- **R2 storage** for ciphertext blobs
- **Postgres metadata** pointers (hash, size, mtime, version)
- **Resumable uploads** with chunked metadata tracking (v2+)

---

## Cryptographic Standards

### CryptoPolicy v1.0.0

| Property | Value | Standard | Justification |
|----------|-------|----------|---------------|
| **Encryption Algorithm** | AES-256-GCM | NIST approved | AEAD mode, hardware acceleration available |
| **Key Derivation** | PBKDF2-HMAC-SHA256 | NIST SP 800-132 | Well-tested, resistant to GPU brute force |
| **KDF Iterations** | 100,000 | OWASP 2023 | ~600ms per derivation (acceptable latency) |
| **Salt Length** | 16 bytes | 128-bit | Sufficient entropy for uniqueness |
| **IV Length** | 12 bytes | 96-bit | Standard for GCM mode |
| **TLS Minimum** | 1.3 | IETF RFC 8446 | All HTTPS endpoints |
| **Key Size** | 256 bits | AES-256 | Maximum effective key length |

### Future Versions

**v2.0.0 (Not Yet Implemented):**
- Algorithm: ChaCha20-Poly1305 (alternative AEAD)
- KDF: Argon2id (memory-hard function)
- Iterations: 2 (Argon2 passes)
- Memory: 64 MB per derivation
- Parallelism: 4 threads
- DEK Wrapping: Per-record data encryption keys wrapped by KEK

**Migration Path:**
- `crypto_policy_version` stored in vault metadata
- Graceful deprecation of v1 over 12 months
- Dual-decryption support (v1 + v2) during transition
- Deterministic version bumping (admin-triggered)

---

## Vault Lock Policy

### Lock Triggers

| Trigger | Duration | Cross-Device | Auto-Relock | Force Lock |
|---------|----------|--------------|-------------|-----------|
| Idle activity | 10 minutes | ✅ Yes | ✅ Yes | N/A |
| App backgrounding | Immediate | ✅ Yes | ✅ Yes | N/A |
| Logout request | Immediate | ✅ Yes | N/A | ✅ Yes |
| Session rotation | Immediate | ✅ Yes | N/A | ✅ Yes |
| Admin force-lock | Immediate | ✅ Yes | N/A | ✅ Yes |
| Browser tab close | Immediate | N/A | N/A | N/A |

### Lock State Management

**In-Memory State (Frontend):**
- Vault sealed (locked flag = true)
- Plaintext keys purged from memory
- Search index disabled (queries blocked)
- Write ops blocked (401 Unauthorized)
- UI shows lock banner + unlock modal

**Database State (Backend):**
```sql
ALTER TABLE vaults ADD COLUMN locked_at TIMESTAMPTZ;
ALTER TABLE vaults ADD COLUMN lock_reason VARCHAR(50); -- 'idle', 'logout', 'admin', 'session_rotation'
ALTER TABLE vaults ADD COLUMN enforce_tier INT DEFAULT 0;
CREATE INDEX idx_vaults_locked_at ON vaults(user_id, locked_at);
```

**Sync Mechanism:**
- Backend stores lock state in `vaults.locked_at`
- Frontend polls `/api/sync/poll` every 30 seconds
- Cross-device detection: if any device locked, all devices lock
- Lock propagation: <2 seconds across devices (next poll cycle)

### Middleware: Block on Lock

**All write operations return 423 if vault locked:**
```rust
// Pseudocode
async fn protect_locked_vault(req) {
    if vault.locked_at.is_some() && req.method != GET {
        return Response::status(423)
            .header("Retry-After", "30")
            .json({"error": "Vault locked"})
    }
    next(req)
}
```

**Protected Endpoints:**
- `POST /api/ideas/*`
- `POST /api/infobase/*`
- `POST /api/journal/*`
- `POST /api/vault/unlock` (exception: allows unlock without lock check)
- All other mutations on encrypted content

### Unlock Flow

1. **User Action:** Click "Unlock" or perform first action after lock
2. **Show Modal:** Render `VaultUnlockModal` with passphrase input
3. **Derive Key:** Re-derive via PBKDF2 with stored salt
4. **Verify:** Compare derived key against `passphrase_hash`
5. **Load Key:** Store derived key in memory (React Context)
6. **API Call:** `POST /api/vault/unlock` to update database
7. **Async Rebuild:** Trigger search index rebuild in background
8. **Resume:** Unblock write ops, hide lock banner

---

## E2EE Boundary & Trust Model

### Content Encrypted (Private Work)

| Content Type | Encrypted | Server Can See | Search Support |
|--------------|-----------|-----------------|-----------------|
| Infobase entries | ✅ Yes (full text) | ❌ No | ✅ Client-side only |
| Ideas | ✅ Yes (full text) | ❌ No | ✅ Client-side only |
| Journal entries | ✅ Yes (full text) | ❌ No | ✅ Client-side only |
| Reference tracks (audio) | ✅ Yes (file) | ❌ No | N/A (audio) |
| DAW projects | ✅ Yes (file) | ❌ No | N/A (binary) |
| Tags (private) | ✅ Yes | ❌ No | ✅ Client-side |
| Metadata (private) | ✅ Yes | ❌ No | N/A |

### Metadata NOT Encrypted (Server Can See)

| Metadata | Status | Server Access | Reason |
|----------|--------|----------------|--------|
| Tags/categories | ❌ Plaintext | ✅ Read | Optional user flag for sensitivity |
| Timestamps | ❌ Plaintext | ✅ Read | Required for sorting/filtering |
| Completion flags | ❌ Plaintext | ✅ Read | Required for progress tracking |
| User-set metadata | ❌ Plaintext | ✅ Read | Can be marked private if needed |
| Created/updated dates | ❌ Plaintext | ✅ Read | Infrastructure requirement |

### What Server CANNOT Do (By Design)

- ❌ **Search** encrypted content (opaque to server)
- ❌ **Inspect plaintext** (keys never leave client)
- ❌ **Re-encrypt with admin key** (no master key exists)
- ❌ **Decrypt for support/analytics** (architecture prevents it)
- ❌ **Index full-text server-side** (impossible without decryption)
- ❌ **Modify ciphertext** (would break AEAD authentication)

### What Server CAN Do (Safe Operations)

- ✅ **Store opaque blobs** (server is dumb storage)
- ✅ **Count completions** (on plaintext metadata)
- ✅ **Filter by timestamps** (on plaintext dates)
- ✅ **Enforce retention policies** (on ciphertext, blind)
- ✅ **Log access patterns** (user_id + timestamp, not content)
- ✅ **Track last-modified** (for sync)
- ✅ **Backup/replicate** (encrypted data)

---

## Implementation Status

### ✅ TIER 1 COMPLETE: E2EE Infrastructure

#### Phase 1: Vault Lock Policy + Enforcement
**Duration:** 4.5 hours | **Status:** ✅ Complete & Deployed

**Deliverables:**
- ✅ Documentation: `docs/product/e2ee/vault-lock-policy.md`
- ✅ Schema: `vaults` table with lock columns
- ✅ Backend: Lock/unlock endpoints + middleware
- ✅ Frontend: Auto-lock timer (10m idle) + UI
- ✅ Cross-device: Polling + lock propagation
- ✅ Integration: VaultLockContext wired to all features
- ✅ Testing: Full E2E coverage

**Key Files:**
- Backend: `app/backend/crates/api/src/routes/vault.rs`
- Backend: `app/backend/crates/api/src/db/vault_repos.rs`
- Frontend: `app/frontend/src/contexts/VaultLockContext.tsx`
- Frontend: `app/frontend/src/components/VaultLockBanner.tsx`
- Frontend: `app/frontend/src/components/VaultUnlockModal.tsx`

#### Phase 2: CryptoPolicy Doc + Schema
**Duration:** 3.5 hours | **Status:** ✅ Complete & Deployed

**Deliverables:**
- ✅ Documentation: `docs/product/e2ee/crypto-policy.md` (11 sections)
- ✅ Schema: `crypto_policies` table (9 fields)
- ✅ Backend: 5 API endpoints (CRUD + deprecation)
- ✅ Models: `crypto_policy_models.rs`
- ✅ Repository: `crypto_policy_repos.rs`
- ✅ Routes: `/api/crypto-policy/*`

**Key Endpoints:**
- `GET /api/crypto-policy/current` — Get active policy
- `GET /api/crypto-policy/{version}` — Get specific version
- `GET /api/crypto-policy` — List all versions
- `POST /api/crypto-policy` — Create new version
- `POST /api/crypto-policy/{version}/deprecate` — Deprecate version

#### Phase 3: Client-Side Encrypted Search Index
**Duration:** 8 hours | **Status:** ✅ Complete & Production-Ready

**Deliverables:**
- ✅ Backend: Search API endpoints (GET /api/search)
- ✅ Frontend: SearchIndexManager (Trie + Tokenizer)
- ✅ UI Component: SearchBox (keyboard nav + dropdown)
- ✅ UI Component: IndexProgress (ETA + progress bar)
- ✅ Integration: Ideas page + Infobase page
- ✅ Database: IndexedDB storage + multi-tab safety
- ✅ Sync: Auto-rebuild on unlock, auto-clear on lock
- ✅ E2E Tests: 40+ comprehensive test cases
- ✅ Documentation: 6 implementation guides

**Key Files:**
- Backend: `app/backend/crates/api/src/routes/search.rs`
- Backend: `app/backend/crates/api/src/db/search_models.rs`
- Frontend: `app/frontend/src/lib/search/SearchIndexManager.ts`
- Frontend: `app/frontend/src/components/Search/SearchBox.tsx`
- Frontend: `app/frontend/src/components/Search/IndexProgress.tsx`
- Tests: `tests/search-integration.spec.ts` (40+ cases)

**Build Status:**
- Backend: `cargo check` → 0 errors ✅
- Frontend: `npm run typecheck` → 0 errors ✅
- Frontend: `npm run build` → 90 pages ✅

---

### ⏳ TIER 2: Privacy & UX (Future)

#### [ ] Privacy Modes UX (Private Work vs Standard)
- **Scope:** User-visible toggle for content sensitivity
- **Impact:** Affects sync, retention, audit trail
- **Dependencies:** Tier 1 complete ✅
- **Estimated:** 4-6h

#### [ ] DAW Project File Tracking + Versioning
- **Scope:** R2 versioning + metadata + chunked uploads
- **Impact:** Large file support with resumable uploads
- **Dependencies:** Tier 1 complete ✅
- **Estimated:** 8-10h

#### [ ] Observability Red Lines + CI Log Scanning
- **Scope:** Automated forbidden field detection
- **Impact:** Prevent accidental plaintext logging
- **Dependencies:** None (parallel)
- **Estimated:** 3-4h

---

### ❌ TIER 3: Advanced Features (Strategic)

#### [ ] DAW Folder Watcher Agent (Local Service)
- Watch designated project folders
- Send update events
- Explicit opt-in (no silent syncing)

#### [ ] Telemetry & Analytics Framework
- Privacy-first event capture
- No PII or ciphertext logging
- Decision outcome telemetry (safe)

#### [ ] Learning Path Recommendations
- Advanced sequencing algorithm

#### [ ] Starter Engine V2 (Decision Intelligence)
- Neo4j projection for transitions
- Deterministic ranking
- Explainability + telemetry

#### [ ] Friend List + Secondary Revocable Keys
- Per-friend wrapping keys
- Key rotation on revocation
- v3+ feature

---

### ❌ TIER 4: Sync & Real-Time Infrastructure

#### [ ] Delta Sync Endpoint (`/api/sync/delta`)
- Incremental sync for all entities
- Client merge logic
- Conflict resolution

#### [ ] Real-Time Push Sync (WebSocket)
- Server → Client updates
- Multi-device coordination

#### [ ] Chunked Encryption Standard
- Per-chunk nonce generation
- Resumable metadata format

#### [ ] Deterministic File Identity
- Ciphertext hashes (better privacy)
- Accept dedup tradeoff

---

## Forward-Looking Items

### 1. Cryptographic & Trust Lifecycle

#### Algorithm Agility
- Migrate without breaking users
- Support dual-decryption during transition
- Versioned key formats
- Policy-driven deprecation

#### Trust Boundaries in Code
Mark modules as:
- `server_trusted` — API routes, business logic
- `client_private` — Vault service, crypto ops
- `e2ee_boundary` — Sync points, encryption/decryption

Example:
```rust
/// server_trusted
async fn get_today(state: AppState) -> Response { ... }

/// client_private
fn derive_key(passphrase: &str, salt: &[u8]) -> Vec<u8> { ... }

/// e2ee_boundary
async fn sync_poll(state: AppState) -> Response { ... }
```

### 2. Search, Indexing & UX Under E2EE

#### Client-Side Search Infrastructure
- Build index in memory or IndexedDB
- Regenerate on unlock
- Discard on lock/logout
- Deterministic encrypted tokens (v2)

#### Encrypted Data & Server-Driven Decisions Tension
**Rule:** Server decisions may only use non-content signals:
- Timestamps
- Counts
- Completion flags
- Explicit user-set metadata

**Not allowed:**
- Content analysis
- Keyword extraction
- Semantic relevance (requires plaintext)

### 3. UX Clarity Around "Privacy Modes"

#### Make Privacy an Explicit Mode
Users should understand:
- What is protected (encrypted)
- What is not (plaintext)
- What happens if they lose access

**Tie to:**
- Infobase entries
- Ideas
- Journal
- DAW projects

#### Recovery Friction as Feature
Intentionally slow recovery:
- Require explicit warnings
- Re-authenticate via SSO
- Multi-step confirmation flow

### 4. Offline, PWA & Long-Running Sessions

#### Offline + E2EE Reality Check
Mobile PWA + offline implies:
- Encrypted data cached locally
- KEK may need to persist (dangerous)

**Decisions to make:**
- Offline read: ✅ Allowed (after unlock)
- Offline write: ❌ Not allowed (no queued ciphertext)

**Define:**
- Max offline duration: 24 hours
- Auto-lock behavior: Yes, on backgrounding

#### Session + Vault Locking Policy
**When does vault auto-lock?**
- Tab close: ✅ Yes
- Inactivity (10m): ✅ Yes
- Device sleep: ✅ Yes (platform-dependent)
- Mobile backgrounding: ✅ Yes
- Focus timer running: ❌ No (exception: keep unlocked)

### 5. Admin, Support & Legal Reality

#### Admin UX for "We Cannot See This"
In admin views:
- Show encrypted records as opaque
- Display banner: "Content encrypted; not accessible"
- Prevent assuming plaintext

#### Legal & Compliance Positioning
**If you claim:** "Admins cannot read user data"  
**Then you must:**
- Update privacy policy
- Align data processing agreements
- Adjust support workflows

**Checklist Items:**
- ✅ E2EE claims checklist doc (`docs/ops/e2ee-claims-checklist.md`)
- ✅ Legal alignment (`Privacy_Policy_Update_Draft.md`)
- ✅ DPA addendum (`DPA_E2EE_Addendum.md`)
- ✅ Support scripts (`e2ee-support-scripts.md`)

### 6. DAW & Large File Future

#### Chunked Encryption as First-Class Primitive
Standardize:
- Chunk size: 64 KB or 1 MB (TBD)
- Per-chunk nonce: CSPRNG per chunk
- Metadata format: resumable upload tracking

#### Deterministic File Identity vs Privacy
**Decision:** Use ciphertext hashes
- Better: Privacy (no plaintext leakage)
- Worse: Deduplication loss
- Recommended: v1 ciphertext, v2 optional plaintext hashing

### 7. Observability Without Privacy Regression

#### Telemetry Red Lines
**Never log:**
- Ciphertext
- Large sizes (>1 MB)
- Timing patterns (could leak behavior)

**Add automated log scanning in CI:**
```yaml
forbidden_fields:
  - "cipher"
  - "ciphertext"
  - "plaintext"
  - "passphrase"
  - patterns: ["^.*_text$"]
```

#### Decision Outcome Telemetry (Safe)
Safe if:
- Payload IDs logged, not content
- Outcomes boolean/categorical
- User can opt out

---

## Explicit Decisions

### Resolved ✅

| Decision | Status | Details |
|----------|--------|---------|
| Crypto Algorithm (v1) | ✅ | AES-256-GCM (NIST approved AEAD) |
| KDF Function | ✅ | PBKDF2-HMAC-SHA256 (100k iterations) |
| Key Derivation Time | ✅ | ~600ms per unlock (acceptable) |
| Vault Unlock | ✅ | Once per session; auto-lock on idle (10m) |
| Offline Read | ✅ | Allowed after unlock |
| Offline Write | ✅ | Not allowed (no queued ciphertext) |
| Metadata Encryption | ✅ | Only IP-bearing content encrypted |
| Search Support | ✅ | Client-side IndexedDB (deterministic tokens) |
| Cross-Device Sync | ✅ | Polling `/api/sync/poll` (30s) |
| Collaboration | ✅ | Single-user v1/v2; friend keys v3+ |
| IV Handling | ✅ | Random 12-byte IV per record |
| Salt Handling | ✅ | Random 16-byte salt per record |

### Open ⏳

| Decision | Status | Details | Impact |
|----------|--------|---------|--------|
| Recovery Code Lifecycle | ⏳ | Rotation, revocation, invalidation | Tier 2 blocker |
| Vault Reset Policy | ⏳ | What is destroyed, confirmation flow | Tier 2 blocker |
| v2 Algorithm | ⏳ | ChaCha20-Poly1305 vs AES-GCM | Planned v2.0.0 |
| v2 KDF | ⏳ | Argon2id params (memory, parallelism) | Planned v2.0.0 |
| DEK Wrapping | ⏳ | Per-record vs KEK-wrapped | Planned v2.0.0 |
| Chunked Uploads | ⏳ | Chunk size, resumable format | DAW projects blocker |
| Collaboration Keys | ⏳ | Friend list + secondary keys | v3+ feature |

---

## Roadmap

### Q1 2026: Foundation (Current)
- ✅ Vault lock policy enforcement
- ✅ CryptoPolicy documentation & schema
- ✅ Client-side search index (IndexedDB)
- ✅ Legal/compliance alignment

### Q2 2026: Privacy & UX (Planned)
- [ ] Privacy modes UX (Private Work toggle)
- [ ] DAW project file versioning + R2
- [ ] Observability red lines + CI scanning

### Q3 2026: Advanced (Strategic)
- [ ] Recovery code lifecycle
- [ ] Vault reset UX
- [ ] DAW folder watcher agent

### Q4 2026+: Future
- [ ] v2.0.0 crypto migration (Argon2id + ChaCha20)
- [ ] Collaboration keys (friend list)
- [ ] Real-time WebSocket sync
- [ ] Delta sync endpoint
- [ ] Starter Engine V2 (Neo4j ranking)

---

## Top 5 Forward Priorities

1. **XSS Hardening + CSP** as a release gate for E2EE
2. **Client-side search strategy** for encrypted content ✅ DONE
3. **Vault lock/unlock & offline policy** ✅ DONE
4. **Crypto versioning & migration story** ✅ DONE
5. **Admin/support/legal alignment** with "we cannot decrypt" ✅ DOCUMENTED

---

## References

**Internal Documentation:**
- `docs/product/e2ee/vault-lock-policy.md` — Lock triggers & enforcement
- `docs/product/e2ee/crypto-policy.md` — Algorithm standards & versioning
- `docs/ops/e2ee-claims-checklist.md` — Support/legal alignment
- `Privacy_Policy_Update_Draft.md` — Legal positioning
- `DPA_E2EE_Addendum.md` — Data processing alignment
- `e2ee-support-scripts.md` — Customer support guidance

**External Standards:**
- NIST SP 800-132 (PBKDF2 specifications)
- NIST SP 800-38D (GCM mode)
- IETF RFC 3394 (Key wrap)
- IETF RFC 8446 (TLS 1.3)
- OWASP Password Storage Cheat Sheet

---

**Document Version:** 1.1 (Canonical + Implementation Complete)  
**Last Updated:** January 14, 2026  
**Status:** ✅ Production Ready  
**Next Review:** Q2 2026 (Recovery code lifecycle)
