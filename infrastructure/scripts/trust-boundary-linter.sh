#!/usr/bin/env bash

# Trust Boundary Linter - Enforces that all cryptographic functions are marked with trust boundaries
# This script is run by GitHub Actions to catch security regressions before merge
# 
# Markers detected:
#   - server_trusted!()     - Server-side business logic (can use plaintext)
#   - client_private!()     - Client-side crypto (never transmits plaintext)
#   - e2ee_boundary!()      - E2EE boundary (decryption/encryption)
#
# Exit codes:
#   0 - All crypto functions properly marked
#   1 - Found unmarked or improperly marked cryptographic functions
#   2 - Configuration error

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_SRC="$PROJECT_ROOT/app/backend/crates/api/src"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Regex patterns for cryptographic functions
CRYPTO_PATTERNS=(
    "fn.*encrypt"           # Functions with "encrypt" in name
    "fn.*decrypt"           # Functions with "decrypt" in name
    "fn.*derive.*key"       # Functions deriving keys
    "fn.*hash.*password"    # Password hashing functions
    "fn.*bcrypt"            # Bcrypt operations
    "fn.*scrypt"            # Scrypt operations
    "fn.*pbkdf"             # PBKDF operations
    "fn.*aes"               # AES operations
    "fn.*sign"              # Signature operations
)

# Regex patterns for allowed/expected markers
MARKER_PATTERNS=(
    "server_trusted!()"
    "client_private!()"
    "e2ee_boundary!()"
    "// server_trusted"  # Also allow as comments
    "// client_private"
    "// e2ee_boundary"
)

echo -e "${YELLOW}[TRUST BOUNDARY LINTER]${NC}"
echo "Scanning: $BACKEND_SRC"
echo ""

# Find all Rust source files
mapfile -t RUST_FILES < <(find "$BACKEND_SRC" -name "*.rs" -type f)

if [[ ${#RUST_FILES[@]} -eq 0 ]]; then
    echo -e "${RED}ERROR: No Rust files found in $BACKEND_SRC${NC}"
    exit 2
fi

echo "Found ${#RUST_FILES[@]} Rust files to scan"
echo ""

# Scan each file
for file in "${RUST_FILES[@]}"; do
    LINE_NUM=1
    
    while IFS= read -r line; do
        # Check if this line matches any crypto pattern
        IS_CRYPTO=false
        for pattern in "${CRYPTO_PATTERNS[@]}"; do
            if [[ $line =~ $pattern ]]; then
                IS_CRYPTO=true
                break
            fi
        done
        
        if [[ "$IS_CRYPTO" == "true" ]]; then
            # Found a potential crypto function - check for markers in this line or previous lines
            # Get previous 5 lines for context
            PREV_CONTEXT=$(sed -n "$((LINE_NUM-5)),$((LINE_NUM))p" "$file" 2>/dev/null || echo "")
            
            HAS_MARKER=false
            for marker in "${MARKER_PATTERNS[@]}"; do
                if echo "$PREV_CONTEXT" | grep -q "$marker"; then
                    HAS_MARKER=true
                    break
                fi
            done
            
            if [[ "$HAS_MARKER" == "false" ]]; then
                # Found unmarked crypto function!
                ((ERRORS++))
                echo -e "${RED}❌ UNMARKED CRYPTO:${NC} $file:$LINE_NUM"
                echo "   Pattern matched, no marker found"
                echo "   Code: $line"
                echo ""
            fi
        fi
        
        ((LINE_NUM++))
    done < "$file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}SUMMARY:${NC}"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $ERRORS -gt 0 ]]; then
    echo ""
    echo -e "${RED}FAILED:${NC} Found $ERRORS unmarked cryptographic functions"
    echo ""
    echo "To fix, add one of these markers BEFORE the function:"
    echo "  - #[server_trusted] if running server-side business logic"
    echo "  - #[client_private] if performing client-side crypto"
    echo "  - #[e2ee_boundary] if crossing E2EE boundary (decrypt/encrypt)"
    echo ""
    echo "See: app/backend/crates/api/src/middleware/trust_boundary.rs"
    exit 1
else
    echo -e "${GREEN}✅ PASSED:${NC} All cryptographic functions properly marked"
    exit 0
fi
