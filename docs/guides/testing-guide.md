# Testing Guide - Redirect Service

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Guides](./README.md)**

---

**Last Updated**: 2025-10-31
**Version**: 1.0
**Status**: Complete

---

## Table of Contents

1. [Test Coverage Overview](#test-coverage-overview)
2. [Server-Side Testing (Vitest)](#server-side-testing-vitest)
3. [E2E Testing Strategies](#e2e-testing-strategies)
4. [Manual Testing Procedures](#manual-testing-procedures)
5. [CI/CD Integration](#cicd-integration)
6. [Test Maintenance](#test-maintenance)

---

## Test Coverage Overview

### Current Test Suite Status

```
Total Tests: 303
Passing:     298 (98.3%)
Failing:     5 (router observability - Story 5.2 scope)

Test Distribution:
├── Unit Tests:         185 tests (validation, utils, analytics)
├── Integration Tests:   91 tests (routes, middleware, error handling)
├── E2E Tests:          20 tests (analytics router, legacy upgrade)
└── Security Tests:      7 tests (domain allowlist, XSS prevention)
```

### Coverage by Epic

| Epic | Feature | Test Coverage | Status |
|------|---------|---------------|--------|
| Epic 1 | Core Redirect | 95%+ | ✅ Complete |
| Epic 2 | Error Handling | 95%+ | ✅ Complete |
| Epic 3 | Domain Allowlist | 95%+ | ✅ Complete |
| Epic 5 | Structured Logging | 70% | ⚠️ Partial |
| Epic 7 | Analytics Router | 95%+ | ✅ Complete |

---

## Server-Side Testing (Vitest)

### What Server-Side Tests CAN Verify

✅ **High Confidence (95%+):**
- HTTP API contracts (request/response)
- Validation logic (URL format, domain allowlist)
- Error handling (400/403/500 responses)
- Security rules enforcement
- URL encoding/decoding
- Parameter extraction and merging
- KV operations (with mocks)

⚠️ **Medium Confidence (70%):**
- HTML structure (string matching only)
- JavaScript code presence (not execution)

❌ **Cannot Test (Need Browser):**
- JavaScript execution
- Hash fragment extraction (`#url`)
- `window.location` operations
- Client-side navigation
- Browser-specific APIs
- Real user timing/performance

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- test/unit
npm test -- test/integration
npm test -- test/e2e

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch

# Run specific file
npm test -- test/e2e/legacy-upgrade.e2e.test.ts
```

### Test Structure

```
test/
├── unit/                    # Pure logic testing
│   └── lib/
│       ├── analytics/       # Analytics module tests
│       │   ├── providers/   # Provider factory tests (ga4.test.ts, etc.)
│       │   ├── types.test.ts
│       │   ├── router.test.ts
│       │   ├── registry.test.ts
│       │   └── tracking-service.test.ts
│       ├── handlers/        # Route handlers
│       └── middlewares/     # Middleware logic
│
├── integration/             # Component integration
│   └── analytics/
│       └── ga4-integration.test.ts
│
├── e2e/                     # End-to-end flows
│   ├── legacy-upgrade.e2e.test.ts       # Server-side E2E
│   └── analytics-router.e2e.test.ts
│
├── security/                # Security-focused tests
│   └── security-tests.test.ts
│
├── fixtures/                # Test data
│   └── env.ts               # Environment configurations
│
└── utils/                   # Test helpers
    ├── mock-kv.ts           # KV namespace mock
    ├── mock-providers.ts    # Analytics provider mocks
    └── mock-analytics.ts    # Analytics test utilities
```

---

## E2E Testing Strategies

### Strategy Overview

```
┌──────────────────────────────────────────────────────────┐
│ Approach 1: Server-Side E2E (Current - RECOMMENDED)     │
├──────────────────────────────────────────────────────────┤
│ Tool:       Vitest                                       │
│ Time:       <1 second                                    │
│ Setup:      Done ✅                                      │
│ Coverage:   95%+ (API logic, validation, security)      │
│ Confidence: High for server-side behavior               │
│                                                           │
│ ✅ PROS:                                                 │
│   - Extremely fast feedback                              │
│   - No browser overhead                                  │
│   - Easy to maintain                                     │
│   - CI/CD friendly                                       │
│                                                           │
│ ❌ CONS:                                                 │
│   - Cannot test JavaScript execution                     │
│   - Cannot test hash fragments                           │
│   - No visual verification                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Approach 2: Manual Browser Testing (RECOMMENDED)        │
├──────────────────────────────────────────────────────────┤
│ Tool:       Real browser                                 │
│ Time:       3-5 minutes                                  │
│ Setup:      wrangler dev                                 │
│ Coverage:   100% (real user flow)                        │
│ Confidence: Perfect (actual browser behavior)            │
│                                                           │
│ ✅ PROS:                                                 │
│   - 100% accurate                                        │
│   - Visual verification                                  │
│   - Zero test code                                       │
│   - Extremely simple                                     │
│                                                           │
│ ❌ CONS:                                                 │
│   - Manual effort required                               │
│   - Not automated                                        │
│   - Requires human time                                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Approach 3: Bash Smoke Test (Optional)                  │
├──────────────────────────────────────────────────────────┤
│ Tool:       curl + bash                                  │
│ Time:       <1 second                                    │
│ Setup:      Done ✅                                      │
│ Coverage:   80% (API endpoints only)                     │
│ Confidence: High for server endpoints                    │
│                                                           │
│ ✅ PROS:                                                 │
│   - Fast automated check                                 │
│   - No dependencies                                      │
│   - CI/CD friendly                                       │
│   - Simple bash script                                   │
│                                                           │
│ ❌ CONS:                                                 │
│   - Still cannot test JavaScript                         │
│   - No visual verification                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Approach 4: Browser Automation (NOT RECOMMENDED)        │
├──────────────────────────────────────────────────────────┤
│ Tool:       Playwright / Puppeteer / JSDOM              │
│ Time:       6+ hours setup, 2-5s per test               │
│ Setup:      Complex, ~300MB dependencies                 │
│ Coverage:   95% (similar to manual, but automated)       │
│ Confidence: High for automated scenarios                 │
│                                                           │
│ ✅ PROS:                                                 │
│   - Fully automated                                      │
│   - Can test JavaScript execution                        │
│   - Screenshots/videos possible                          │
│                                                           │
│ ❌ CONS:                                                 │
│   - OVERKILL for simple redirect!                       │
│   - Complex setup and maintenance                        │
│   - Slow execution                                       │
│   - Heavy dependencies                                   │
│   - Flaky tests common                                   │
│                                                           │
│ 🚫 NOT WORTH IT FOR THIS PROJECT                        │
└──────────────────────────────────────────────────────────┘
```

### Recommended Strategy: Hybrid Approach

```
Development Cycle:
1. Write code
2. Run Vitest (server-side) → <1s feedback ✅
3. Fix issues quickly
4. Commit

Pre-Deployment:
1. Run bash smoke test (optional) → 1s ✅
2. Manual browser test → 3 min ✅
3. Deploy to dev environment
4. Manual verification → 2 min ✅
5. Deploy to production

Post-Deployment:
1. Monitor Cloudflare Analytics
2. Check error rates
3. Review redirect metrics
```

---

## Manual Testing Procedures

### Local Development Testing

#### Setup
```bash
# Start development server
wrangler dev

# Server will start at http://localhost:8787
```

#### Test Cases

**Test 1: Basic Hash Fragment Redirect** (30 seconds)
```
1. Open browser: http://localhost:8787/#https://google.com
2. Expected: Auto-redirect to https://google.com
3. Verify: URL in browser bar is google.com
✅ PASS / ❌ FAIL
```

**Test 2: Tracking Parameters Preservation** (30 seconds)
```
1. Open: http://localhost:8787/#https://google.com?utm_source=test&utm_campaign=demo
2. Expected: Redirect with parameters intact
3. Verify: google.com URL includes utm_source and utm_campaign
✅ PASS / ❌ FAIL
```

**Test 3: isNoRedirect Parameter** (30 seconds)
```
1. Open: http://localhost:8787/?isNoRedirect=1#https://google.com
2. Expected: NO auto-redirect (shows link to click)
3. Verify: Page displays clickable link
4. Click link manually
5. Verify: Redirect works when clicked
✅ PASS / ❌ FAIL
```

**Test 4: Fallback URL** (30 seconds)
```
1. Open: http://localhost:8787/ (no hash fragment)
2. Expected: Redirect to DEFAULT_REDIRECT_URL
3. Verify: Redirects to configured fallback (example.com)
✅ PASS / ❌ FAIL
```

**Test 5: Invalid URL Validation** (30 seconds)
```
1. Manually construct: http://localhost:8787/r?to=not-a-valid-url
2. Expected: 400 Bad Request error
3. Verify: Error message about invalid format
✅ PASS / ❌ FAIL
```

**Test 6: Domain Allowlist** (30 seconds)
```
1. Try: http://localhost:8787/r?to=https://blocked-domain.com
2. Expected: 403 Forbidden (if allowlist enabled)
   OR: 302 Redirect (if allowlist disabled)
3. Verify: Behavior matches configuration
✅ PASS / ❌ FAIL
```

**Total Time: ~3 minutes for complete manual test suite**

### Production Verification Testing

After deploying to production:

```bash
# Replace with your actual domain
PROD_URL="https://your-domain.com"

# Test 1: Bootstrap endpoint
curl -I $PROD_URL/
# Expected: 200 OK, Content-Type: text/html

# Test 2: Direct redirect
curl -I "$PROD_URL/r?to=https://google.com"
# Expected: 302 Found, Location: https://google.com

# Test 3: Manual browser test
# Open: https://your-domain.com/#https://google.com
# Expected: Auto-redirect works
```

---

## CI/CD Integration

### Automated Smoke Test Script

File: `scripts/test-redirect-simple.sh`

```bash
#!/bin/bash
# Quick smoke test for CI/CD pipelines

BASE_URL="${1:-http://localhost:8787}"

# Test bootstrap endpoint
if curl -sf -o /dev/null "$BASE_URL/"; then
  echo "✅ Bootstrap endpoint OK"
else
  echo "❌ Bootstrap endpoint failed"
  exit 1
fi

# Test redirect endpoint
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/r?to=https://google.com")
if [ "$status" = "302" ]; then
  echo "✅ Redirect endpoint OK"
else
  echo "❌ Redirect endpoint failed (status: $status)"
  exit 1
fi

echo "🎉 Smoke tests passed!"
```

### GitHub Actions Workflow Example

```yaml
# .github/workflows/test.yml
name: Test Redirect Service

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Vitest tests
        run: npm test

      - name: Deploy to dev (if main branch)
        if: github.ref == 'refs/heads/main'
        run: npx wrangler deploy --env dev
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Run smoke tests against dev
        if: github.ref == 'refs/heads/main'
        run: ./scripts/test-redirect-simple.sh https://dev.your-domain.com
```

---

## Test Maintenance

### When Tests Fail

**Server-Side Test Failures:**

1. **KV Binding Errors**
   ```
   Error: Cannot read properties of undefined (reading 'get')
   ```
   → Add `defaultTestEnv` parameter to test request:
   ```typescript
   await testApp.request('/r?to=url', {}, defaultTestEnv)
   ```

2. **Domain Allowlist Failures**
   ```
   Error: Expected 302, received 403
   ```
   → Use allowed domains from `test/fixtures/env.ts`:
   - `example.com`
   - `test.com`

3. **Validation Errors**
   ```
   Error: Expected 400, received 302
   ```
   → Verify URL format matches validation rules in `src/lib/validation.ts`

### Updating Tests After Code Changes

**When adding new validation rules:**
1. Update unit tests in `test/unit/lib/validation.test.ts`
2. Update integration tests in `test/integration/routes/`
3. Update manual test checklist above
4. Update bash smoke test script

**When changing redirect behavior:**
1. Update E2E tests in `test/e2e/legacy-upgrade.e2e.test.ts`
2. Update tech spec documentation
3. Update manual test procedures
4. Notify team of behavior change

### Test Documentation Updates

Keep these files in sync when making changes:
- `docs/testing-guide.md` (this file)
- `docs/testing-methodology-server-vs-browser.md`
- `docs/testing-strategy-simple.md`
- `test/e2e/legacy-upgrade.e2e.test.ts` (inline comments)

---

## 🎯 Test File Placement Rules (IMPORTANT!)

### File Location Rules - **CRITICAL FOR AVOIDING IMPORT ERRORS**

```bash
# ✅ CORRECT PATTERNS

# Source: src/lib/analytics/ga4/provider.ts
# Test: test/unit/lib/analytics/providers/ga4.test.ts
# Note: Provider tests go in providers/, NOT in ga4/ subdirectory!

# Source: src/lib/analytics/types.ts
# Test: test/unit/lib/analytics/types.test.ts

# Source: src/lib/analytics/router.ts
# Test: test/unit/lib/analytics/router.test.ts

# ❌ WRONG PATTERNS (CAUSES IMPORT ERRORS!)

# Don't create test subdirectories that mirror source subdirectories
# test/unit/lib/analytics/ga4/provider.test.ts  # WRONG! Don't create ga4/ in tests!

# Don't put tests in source directory
# src/lib/analytics/provider.test.ts  # WRONG!

# Don't create deep nested test structures
# test/unit/lib/analytics/ga4/utils/helpers/provider.test.ts  # WRONG!
```

### Import Path Calculation Examples

```typescript
// ✅ CORRECT - From test/unit/lib/analytics/providers/ga4.test.ts
import { GA4Provider } from '../../../../../src/lib/analytics/ga4/provider'
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types'

// ✅ CORRECT - From test/unit/lib/analytics/tracking-service.test.ts
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types'
import { createTestEnv } from '../../../fixtures/env'

// ❌ WRONG - These paths don't exist!
import { Something } from '../../../../src/lib/analytics/ga4/utils/helper'
import { OtherThing } from '../../../src/lib/analytics/ga4/subdir/file'
```

### Before Creating Test Files - **CHECKLIST**

```bash
# 1. Check if test file already exists
find test -name "*ga4*"

# 2. Check correct test directory structure
ls -la test/unit/lib/analytics/providers/

# 3. Verify source file exists
ls -la src/lib/analytics/ga4/provider.ts

# 4. Calculate correct relative path
# From: test/unit/lib/analytics/providers/ga4.test.ts
# To:   src/lib/analytics/ga4/provider.ts
# Path: ../../../../../src/lib/analytics/ga4/provider.ts
```

### File Creation Decision Tree

```
Need to test [module]?

├─ Is it a provider factory?
│  └─ Yes → test/unit/lib/analytics/providers/[module].test.ts
│
├─ Is it a type definition?
│  └─ Yes → test/unit/lib/analytics/types.test.ts
│
├─ Is it core analytics logic?
│  └─ Yes → test/unit/lib/analytics/[module].test.ts
│
└─ Is it integration testing?
   └─ Yes → test/integration/analytics/[module]-integration.test.ts
```

---

## Common Testing Scenarios

### Testing New Features

**Example: Adding new redirect parameter**

1. Write unit test for parameter parsing:
   ```typescript
   // test/unit/lib/parameter-extraction.test.ts
   it('should extract new parameter', () => {
     const params = extractParams('https://example.com?newParam=value')
     expect(params.newParam).toBe('value')
   })
   ```

2. Write integration test:
   ```typescript
   // test/integration/redirect-endpoint.test.ts
   it('should preserve new parameter through redirect', async () => {
     const response = await app.request('/r?to=https://example.com?newParam=value')
     expect(response.headers.get('location')).toContain('newParam=value')
   })
   ```

3. Add to manual test checklist
4. Update bash smoke test if needed

### Testing Bug Fixes

**Example: Fixing encoding issue**

1. Write regression test first:
   ```typescript
   it('should handle special characters without double-encoding', async () => {
     const url = 'https://example.com?q=hello world'
     const response = await app.request('/r?to=' + encodeURIComponent(url))
     expect(response.headers.get('location')).toBe(url)
   })
   ```

2. Fix the bug
3. Verify test passes
4. Add to manual test checklist if user-facing

---

## Performance Testing

### Server-Side Performance

Current test in `test/e2e/legacy-upgrade.e2e.test.ts`:

```typescript
it('should measure performance: bootstrap HTML generation vs direct redirect', async () => {
  const directStart = performance.now()
  const directResponse = await testApp.request(`/r?to=${targetUrl}`)
  const directTime = performance.now() - directStart

  const bootstrapStart = performance.now()
  const bootstrapResponse = await testApp.request('/')
  const bootstrapTime = performance.now() - bootstrapStart

  // Both should be fast (<100ms in test environment)
  expect(bootstrapTime).toBeLessThan(100)
})
```

**Limitations:**
- Only measures server response time (~1ms)
- Does NOT include client-side JavaScript execution (~200ms)
- Does NOT include network latency
- Does NOT reflect real user experience

### Real Performance Monitoring

Use Cloudflare Analytics for actual performance data:
- Request duration (p50, p95, p99)
- Error rates by endpoint
- Geographic latency distribution
- Cache hit rates

---

## Troubleshooting

### Test Environment Issues

**Problem: Tests work locally but fail in CI**
```
✅ Solution: Verify environment variables are set in CI
- Check GitHub Secrets configuration
- Verify wrangler.toml has correct bindings
```

**Problem: Intermittent test failures**
```
✅ Solution: Add proper async/await handling
- Ensure all promises are awaited
- Add timeout for long-running operations
```

**Problem: KV operations timing out**
```
✅ Solution: Use mock KV in tests
- Import createMockKV from test/utils/mock-kv.ts
- Pass defaultTestEnv to all test requests
```

---

## References

### Related Documentation
- **Test Methodology**: `docs/testing-methodology-server-vs-browser.md`
- **Simple Strategy**: `docs/testing-strategy-simple.md`
- **Story 7.9 Report**: `docs/story-7.9-completion-report.md`
- **Tech Spec Epic 7**: `docs/tech-spec-epic-7.md`

### Test Files
- **Server-Side E2E**: `test/e2e/legacy-upgrade.e2e.test.ts`
- **Analytics E2E**: `test/e2e/analytics-router.e2e.test.ts`
- **Smoke Test Script**: `scripts/test-redirect-simple.sh`
- **Test Fixtures**: `test/fixtures/env.ts`
- **Mock Utilities**: `test/utils/mock-kv.ts`

### External Resources
- Vitest Documentation: https://vitest.dev
- Cloudflare Workers Testing: https://developers.cloudflare.com/workers/testing
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler

---

## Summary

**Current Testing Approach (RECOMMENDED):**
```
✅ Vitest (server-side)      → <1s, 98.3% pass rate
✅ Manual testing             → 3 min, 100% confidence
✅ Bash smoke test (optional) → 1s, automated check
✅ Production monitoring      → Continuous, real data
```

**NOT Recommended:**
```
❌ Playwright/Puppeteer → Overkill for simple redirect
❌ JSDOM               → Too complex for minimal gain
```

**Why This Works:**
- Fast feedback loop during development
- High confidence in server-side logic (95%+)
- Simple manual verification for client-side behavior
- Zero overhead from heavy browser automation
- Easy to maintain and understand

**Result:**
> Ship faster. Test smarter. Keep it simple. ✅

---

**Document Version**: 1.0
**Last Review**: 2025-10-31
**Next Review**: Before Epic 8 deployment

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Guides](./README.md)**
