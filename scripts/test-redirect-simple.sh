#!/bin/bash
#
# Simple Smoke Test for Redirect Service
# Usage: ./scripts/test-redirect-simple.sh [BASE_URL]
# Example: ./scripts/test-redirect-simple.sh http://localhost:8787
#
# This is MUCH simpler than Playwright/JSDOM for basic redirect testing!
#

set -e  # Exit on error

BASE_URL="${1:-http://localhost:8787}"
PASS=0
FAIL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🧪 Testing Redirect Service at: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  echo -n "Testing $name... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$response" = "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
    ((PASS++))
  else
    echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response)"
    ((FAIL++))
  fi
}

# Test 1: Bootstrap HTML
test_endpoint "Bootstrap HTML" \
  "$BASE_URL/" \
  "200"

# Test 2: Direct redirect with valid URL
test_endpoint "Valid redirect" \
  "$BASE_URL/r?to=https://example.com" \
  "302"

# Test 3: URL encoding with parameters
test_endpoint "URL with parameters" \
  "$BASE_URL/r?to=https%3A%2F%2Fexample.com%3Futm_source%3Dtest" \
  "302"

# Test 4: Invalid URL format
test_endpoint "Invalid URL rejection" \
  "$BASE_URL/r?to=not-a-valid-url" \
  "400"

# Test 5: Missing parameter
test_endpoint "Missing parameter" \
  "$BASE_URL/r" \
  "400"

# Test 6: Domain allowlist (adjust based on your config)
# This might be 302 (allowed) or 403 (blocked) depending on ALLOWED_DOMAINS
echo -n "Testing Domain allowlist... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/r?to=https://test.com")
if [ "$response" = "302" ] || [ "$response" = "403" ]; then
  echo -e "${GREEN}✅ PASS${NC} (Status: $response - validation working)"
  ((PASS++))
else
  echo -e "${RED}❌ FAIL${NC} (Expected: 302 or 403, Got: $response)"
  ((FAIL++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo -e "  ${GREEN}✅ Passed: $PASS${NC}"
echo -e "  ${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Manual test in browser: $BASE_URL/#https://google.com"
  echo "  2. Verify auto-redirect works"
  echo "  3. Deploy to production! 🚀"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
  exit 1
fi
