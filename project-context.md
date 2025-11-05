
# ✅ Context Prime Complete - Project Understanding

## 📚 Key Documentation Files

  Core Docs:
  - docs/prd.md - Product Requirements Document
  - docs/architecture.md - Technical architecture & decisions
  - docs/epics.md - Epic breakdown (18 stories total)
  - docs/sprint-status.yaml - Current development status
  - docs/test-suite-structure.md - Test organization guide ⭐ NEW

  Story Context:
  - Stories: docs/stories/story-*.md
  - Contexts: docs/stories/story-context-*.xml


---

## 📋 Technical Stack

###  Core Technologies:
  - Runtime: Cloudflare Workers (compatibility_date: 2025-10-24)
  - Framework: Hono v4.4.0 (ultra-fast web framework)
  - Language: TypeScript v5.9+ (strict mode, ES2022 target)
  - Data Store: Cloudflare KV (namespace: REDIRECT_KV for URL mappings)
    - Note: Analytics retry queue deferred to Epic 9 - current implementation is fire-and-forget
  - Validation: Zod v4.1.0 + @hono/zod-validator v0.7.0
  - Testing: Vitest v4.0.3 + Miniflare v3.20250718.2

### Project Structure

```
+-- docs/                               # Documents
+-- cloudflareRedirect/                 # Project code base 
¦   +-- src/
¦   ¦   +-- index.ts                    # Entry point - Hono app initialization
¦   ¦   +-- routes/
¦   ¦   ¦   +-- redirect.ts             # /r endpoint - canonical server-side redirect
¦   ¦   ¦   +-- bootstrap.ts            # / endpoint - legacy client upgrade bootstrap
¦   ¦   +-- lib/
¦   ¦   ¦   +-- analytics/              # Analytics abstraction layer
¦   ¦   ¦   +-- validation.ts           # Zod schemas for URL validation
¦   ¦   ¦   +-- tracking.ts             # GA4 Measurement Protocol integration
¦   ¦   ¦   +-- kv-store.ts             # KV operations (get/put redirect mappings)
¦   ¦   ¦   +-- errors.ts               # Custom error classes (RedirectError)
¦   ¦   ¦   +-- config.ts               # Environment configuration management
¦   ¦   +-- types/
¦   ¦   ¦   +-- env.ts                  # Environment bindings type definitions
¦   ¦   +-- utils/
¦   ¦       +-- logger.ts               # Custom structured logger
¦   +-- test/
¦   ¦   +-- setup.ts                    # Global test setup
¦   ¦   +-- helpers/                    # Test utilities & helpers
¦   ¦   ¦   +-- config.ts               # Test environment mocks
¦   ¦   +-- fixtures/                   # Test fixtures & mock data
¦   ¦   ¦   +-- env.ts                  # Environment test fixtures
¦   ¦   +-- unit/                       # Unit Tests (isolated component tests)
¦   ¦   ¦   +-- lib/                    # Library module unit tests
¦   ¦   ¦   ¦   +-- analytics/          # Analytics module unit tests
¦   ¦   ¦   ¦   +-- validation.test.ts  # Validation logic tests
¦   ¦   ¦   ¦   +-- tracking.test.ts    # Tracking functions tests
¦   ¦   ¦   ¦   +-- kv-store.test.ts    # KV operations tests
¦   ¦   ¦   ¦   +-- config.test.ts      # Config management tests
¦   ¦   ¦   +-- routes/                 # Route function unit tests
¦   ¦   ¦       +-- parse-destination.test.ts
¦   ¦   +-- integration/                # Integration Tests (component interactions)
¦   ¦   ¦   +-- routes/                 # HTTP route integration tests
¦   ¦   ¦   ¦   +-- redirect-basic.test.ts
¦   ¦   ¦   ¦   +-- redirect-validation.test.ts
¦   ¦   ¦   ¦   +-- bootstrap-legacy.test.ts
¦   ¦   ¦   +-- redirect-endpoint.test.ts
¦   ¦   ¦   +-- error-handling.test.ts
¦   ¦   +-- e2e/                        # End-to-End Tests (complete workflows)
¦   ¦   ¦   +-- analytics-router.e2e.test.ts
¦   ¦   ¦   +-- legacy-upgrade.e2e.test.ts
¦   ¦   +-- utils/                      # Test utilities
¦   ¦   ¦   +-- common.test-utils.ts
¦   ¦   ¦   +-- mock-analytics.ts
¦   ¦   +-- wrangler.toml               # Cloudflare Workers configuration
¦   ¦   +-- vitest.config.ts            # Vitest + Miniflare test configuration
¦   ¦   +-- tsconfig.json               # TypeScript configuration
¦   ¦   +-- package.json                # Dependencies and scripts
¦   ¦   +-- .prettierrc                 # Code formatting rules
¦   ¦   +-- .eslintrc.json              # Linting rules
¦   ¦   +-- README.md                   # Setup and deployment documentation
```

### Test Structure

```
  Testing Pyramid Organization:
  test/
  ├── unit/                  # 22 test files
  │   ├── lib/               # Library unit tests
  │   │   ├── analytics/     # Analytics module tests
  │   │   ├── validation.test.ts
  │   │   ├── tracking.test.ts
  │   │   └── config.test.ts
  │   └── routes/            # Route function tests
  ├── integration/           # 12 test files
  │   ├── routes/            # HTTP integration tests
  │   └── error-handling.test.ts
  ├── e2e/                   # 2 test files
  │   ├── analytics-router.e2e.test.ts
  │   └── legacy-upgrade.e2e.test.ts
  ├── fixtures/              # Test data & env mocks
  ├── helpers/               # Test utilities
  └── utils/                 # Common test helpers
```

####  Test Commands:

```bash
  - npm test - All tests
  - npm test -- test/unit - Unit tests only
  - npm test -- test/integration - Integration tests only
  - npm test -- --coverage - With coverage
```  