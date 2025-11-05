# cloudflareRedirect - Epic Breakdown

**Author:** vanTT
**Date:** 2025-10-24
**Project Level:** 2
**Target Scale:** 17 stories across 5 epics (Level 2 appropriate)

---

## Overview

This document provides the detailed epic breakdown for cloudflareRedirect, expanding on the high-level epic list from the [PRD](./prd.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

**Epic Priority Structure:**

- **P0 (MVP - Required):** Epic 1, Epic 2, Epic 6 (Core redirect + tracking + security) - 12 stories
- **P1 (Important):** Epic 3, Epic 5 (Legacy support + monitoring) - 4 stories
- **P2 (Future):** Epic 4 (URL Management API - Admin UI deferred to separate project) - 0 stories

**Total Story Count:** 16 stories (1 project init + 15 feature stories)

---

## Epic 1: Core Redirect Engine

**Priority:** P0 (MVP - Required)

**Expanded Goal:**
Establish the foundational serverless redirect infrastructure on Cloudflare Workers using Hono framework. Implement server-side 301/302 redirects with KV-based URL mapping storage, proper HTTP response handling, and error management. This epic delivers the MVP redirect capability that all subsequent epics build upon.

**Architecture Components:** `routes/redirect.ts`, `lib/kv-store.ts`, `src/index.ts`

**Covers PRD Requirements:** FR1 (Server-side redirects), FR6 (Graceful handling), FR7 (URL encoding), NFR1-4 (Performance, Cost, Availability, Security foundation)

**Story Count:** 10 stories

---

### Story 1.1: Project Initialization with Hono Framework

**As a** developer,
**I want** to initialize the Cloudflare Workers project with Hono framework and basic configuration,
**So that** we have a working foundation with TypeScript, testing setup, and deployment pipeline ready for development.

**Acceptance Criteria:**
1. Project initialized using `npm create hono@latest cloudflareRedirect --template cloudflare-workers`
2. TypeScript v5.9+ configured with strict mode enabled
3. Wrangler configuration (`wrangler.toml`) set with compatibility_date 2025-10-24
4. KV namespace created and bound as `REDIRECT_KV` in wrangler.toml
5. Environment bindings type definition created in `src/types/env.ts`
6. Vitest v4.0+ and Miniflare configured for testing
7. Basic "Hello World" endpoint responds at `/` with 200 OK
8. Local dev server runs successfully via `npm run dev`
9. Project deploys to Cloudflare Workers staging environment
10. README.md updated with setup instructions

**Prerequisites:** None (First story in project)

---

### Story 1.2: KV Data Structure and CRUD Operations

**As a** developer,
**I want** to implement KV storage operations with JSON-based redirect data structure,
**So that** the system can store and retrieve URL mappings with metadata (redirect type, creation date).

**Acceptance Criteria:**
1. `RedirectData` interface defined in `src/types/env.ts` with fields: `url`, `type` ('permanent'|'temporary'), `created` (ISO 8601)
2. `lib/kv-store.ts` implements `getRedirect(path, kv)` function returning `RedirectData | null`
3. `lib/kv-store.ts` implements `putRedirect(path, data, kv)` function
4. Functions use KV's `.get(key, 'json')` for auto-parsing
5. Unit tests cover: successful get, get with non-existent key, successful put, JSON parsing
6. Miniflare integration tests verify KV operations with real namespace simulation
7. Error handling for malformed JSON in KV store
8. TypeScript types enforce correct data structure usage

**Prerequisites:** Story 1.1 (Project initialization with KV namespace binding)

---

### Story 1.3: Basic /r Endpoint with Redirect Logic

**As a** end user,
**I want** the `/r` endpoint to redirect me to the destination URL,
**So that** I can access target pages through short URLs.

**Acceptance Criteria:**
1. GET `/r?to=<url>` endpoint implemented in `routes/redirect.ts`
2. Endpoint validates `to` parameter exists (throws error if missing)
3. Endpoint performs URL decoding on `to` parameter
4. Endpoint returns HTTP 302 redirect with `Location` header set to destination
5. Response includes `Cache-Control: no-cache` header
6. Integration test verifies: request to `/r?to=https://example.com` returns 302 with correct Location header
7. Integration test verifies: request without `to` parameter returns 400 error
8. Endpoint handles URL-encoded destinations correctly (e.g., `%20` for spaces)

**Prerequisites:** Story 1.1 (Hono routing foundation)

---

### Story 1.4: Custom Error Classes and Global Error Handler

**As a** developer,
**I want** centralized error handling with custom error classes,
**So that** the system returns consistent, meaningful error responses with appropriate HTTP status codes.

**Acceptance Criteria:**
1. `RedirectError` class created in `lib/errors.ts` extending Error with properties: `statusCode`, `code`
2. Global error handler registered in `src/index.ts` using `app.onError()`
3. `RedirectError` instances return JSON: `{error: message, code: errorCode}` with correct status code
4. Unknown errors return 500 with generic message and log full error details
5. Unit tests cover: 400 validation error, 404 not found, 500 internal error
6. Integration test: invalid URL returns 400 with proper error JSON
7. Error responses use consistent format across all endpoints
8. Console logging includes error details for debugging

**Prerequisites:** Story 1.3 (Basic endpoint to apply error handling to)

---

### Story 1.5: Redirect Type Support (301 vs 302)

**As a** system administrator,
**I want** the system to support both permanent (301) and temporary (302) redirects based on configuration,
**So that** I can optimize SEO for permanent links while maintaining flexibility for temporary campaigns.

**Acceptance Criteria:**
1. `routes/redirect.ts` modified to check KV for redirect data (uses `getRedirect()` from Story 1.2)
2. If URL found in KV: redirect using type from `RedirectData.type` ('permanent' → 301, 'temporary' → 302)
3. If URL not in KV: fallback to 302 redirect (temporary) for direct `/r?to=...` usage
4. Integration test: KV entry with `type: 'permanent'` returns 301 redirect
5. Integration test: KV entry with `type: 'temporary'` returns 302 redirect
6. Integration test: Direct `/r?to=...` (not in KV) returns 302 redirect
7. Error handling: malformed KV data falls back to 302 and logs warning

**Prerequisites:** Story 1.2 (KV operations), Story 1.3 (Basic redirect), Story 1.4 (Error handling)

---

### Story 1.6: Environment Configuration Management

**As a** developer,
**I want** centralized environment configuration loading and validation,
**So that** all environment variables are properly validated at startup and easy to manage across development and production environments.

**Acceptance Criteria:**
1. Create `lib/config.ts` module with exported functions:
   - `loadConfig(env: Env)` - Loads and validates all environment variables
   - `validateRequiredEnvVars(env: Env)` - Throws descriptive error if required vars missing
   - `getEnvValue<T>(key: string, defaultValue?: T)` - Safe env value getter with type safety
2. Define required vs optional environment variables:
   - Required: None for MVP (all env vars have sensible defaults or are optional)
   - Optional: `ALLOWED_DOMAINS`, `ENABLE_TRACKING`, `DEFAULT_REDIRECT_URL`, `ANALYTICS_PROVIDERS`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `ANALYTICS_TIMEOUT_MS`
3. Config module includes validation logic:
   - If `ANALYTICS_PROVIDERS` includes "ga4", validate that `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are set
   - If `ALLOWED_DOMAINS` is set, validate format (comma-separated domains)
   - If `ANALYTICS_TIMEOUT_MS` is set, validate it's a positive number
4. Update `src/index.ts` to call `validateRequiredEnvVars()` on startup (catches config errors early)
5. Create `.env.example` file documenting all available environment variables with descriptions and example values
6. Update `README.md` with "Environment Configuration" section:
   - List all environment variables
   - Document required vs optional
   - Provide setup instructions for local development
   - Link to `.env.example`
7. Unit tests cover:
   - Valid configuration loads successfully
   - Missing required vars throw descriptive errors
   - Invalid format vars throw descriptive errors
   - Default values work correctly
   - Type safety of getEnvValue<T>()
8. Integration test verifies startup validation catches misconfiguration

**Prerequisites:** Story 1.1 (Project initialization), Story 1.4 (Error handling)

---

### Story 1.7: Test Environment Configuration

**As a** developer,
**I want** centralized test environment configuration and fixtures,
**So that** writing tests is easier and test environment setup is consistent across all test files.

**Acceptance Criteria:**
1. Create `test/fixtures/env.ts` with centralized test environment fixtures:
   - `defaultTestEnv`: Partial<Env> with sensible test defaults
   - `createTestEnv(overrides?: Partial<Env>): Env` - Factory function for creating test Env with overrides
   - `testEnvWithGA4`: Pre-configured Env with GA4 analytics enabled
   - `testEnvMinimal`: Minimal valid Env for basic tests
   - `testEnvInvalid`: Collection of invalid Env configs for validation tests
2. Create `test/helpers/config.ts` with test utilities:
   - `createMockEnv(overrides?: Partial<Env>): Env` - Wraps createTestEnv with better ergonomics
   - Export commonly used test env configurations
3. Update `.env.test` with test-specific environment variable defaults:
   - Use test-appropriate values (e.g., GA4_MEASUREMENT_ID="G-TEST123")
   - Document that this file is for test reference, not loaded by default
4. Update `vitest.config.ts` to define test environment setup:
   - Document how to use test fixtures in test files
   - Add comments about test env configuration approach
5. Refactor existing config tests (`test/unit/lib/config.test.ts`) to use new fixtures:
   - Replace inline mock Env objects with `createTestEnv()` calls
   - Demonstrate usage of test fixtures
6. Update `README.md` with "Testing Environment" subsection:
   - Document test fixtures location and usage
   - Provide examples of using `createTestEnv()` in tests
   - Link to test fixtures file
7. Create example test demonstrating fixture usage:
   - Show how to use `defaultTestEnv`, `createTestEnv()`, and `testEnvWithGA4`
   - Include in `test/fixtures/env.test.ts` as documentation
8. All existing tests continue to pass after refactoring

**Prerequisites:** Story 1.6 (Environment Configuration Management)

---

### Story 1.8: Raw `to` Query Support

**As a** campaign manager,
**I want** the redirect service to accept raw `to` parameters without pre-encoding,
**So that** links generated by external tools still resolve correctly without manual URL manipulation.

**Acceptance Criteria:**
1. Update `routes/redirect.ts` query parsing so that `n` must appear before `to`, and the handler locates the final `to=` segment using string extraction rather than `URLSearchParams.get`.
2. Treat the substring after `to=` as the destination: if it is URL-encoded decode it exactly once, otherwise use the raw value; maintain existing validation (protocol checks, allowlist, redirect type handling).
3. Ensure requests missing `n`, lacking `to`, or containing additional parameters after `to` return descriptive 400 errors without attempting a redirect.
4. Add unit and integration tests covering raw `to` (e.g., `/r?n=1&to=https://example.com?a=1&b=2`), encoded `to`, and error paths (missing `n`, misplaced `to`).
5. Update developer documentation (README redirect instructions or testing notes) to explain the new raw `to` support and URL-encoding expectations.

**Prerequisites:** Story 1.5 (Redirect Type Support 301 vs 302), Story 1.6 (Environment Configuration Management)

---

### Story 1.9: Debug Parameter Rename and Parsing Enhancements

**As a** developer-support lead,  
**I want** the redirect workflow to expose an explicit `debug` query parameter instead of the cryptic `n`, handling it consistently whether it appears in the outer request or within the destination URL,  
**So that** debugging flows are self-explanatory and instrumentation remains accurate even when links are generated by external tools.

**Acceptance Criteria:**
1. Replace usage of query parameter `n` with `debug` in `/r` handler, validation schema, and any dependent utilities; preserve backward-compatibility via a deprecation warning until rollout plan is confirmed.
2. Ensure the redirect logic detects `debug` when supplied either in the outer request (`/r?debug=1&to=...`) or embedded inside the destination (`...&to=https://example.com?debug=1`), without double-counting or leaking into the redirected URL.
3. Update parsing utilities to normalize query handling (including the raw `to` support from Story 1.8) and add unit/integration tests covering: debug-only, combined raw `to` with debug inside destination, and legacy `n` fallback (if retained).
4. Rename or update all affected documentation and developer surfaces (epics, PRD, architecture, README, story contexts/tests) to refer to `debug` instead of `n`, ensuring examples remain accurate.
5. Document rollout guidance and validation steps (e.g., observability expectations, log entries) demonstrating the new parameter name in debug responses.

**Prerequisites:** Story 1.8 (Raw `to` Query Support)

---

### Story 1.10: Refactor Redirect Handler - Extract Helper Functions

**As a** developer,
**I want** helper functions extracted from redirect.ts into dedicated lib modules,
**So that** the code is more maintainable, testable, and follows Single Responsibility Principle.

**Acceptance Criteria:**
1. Create `src/lib/query-parser.ts` module exporting:
   - `isDebugMode(value: string | undefined | null): boolean` - Debug parameter validation
   - `parseDestinationFromQuery(url: string): { destination: string; debugMode: boolean }` - Query parsing logic
2. Create `src/lib/response-builder.ts` module exporting:
   - `createDebugResponse(destination: string): Response` - Debug mode response builder
   - `createRedirectResponse(destination: string, type: 'permanent' | 'temporary'): Response` - Redirect response builder
3. Update `src/routes/redirect.ts` to import and use extracted functions
4. Refactored redirect.ts should contain ONLY routing logic (< 150 lines)
5. Move existing unit tests for helper functions to appropriate test files:
   - `test/unit/lib/query-parser.test.ts` for parsing logic
   - `test/unit/lib/response-builder.test.ts` for response builders
6. All integration tests continue to pass without modification (behavior unchanged)
7. TypeScript compilation succeeds with no errors
8. Code coverage maintained at ≥90% for affected modules

**Prerequisites:** Story 1.9 (Debug Parameter Rename and Parsing Enhancements)

**Story Type:** Refactoring (Technical Debt Reduction)

**Estimated Effort:** 2-4 hours

---

## Epic 2: Tracking Placeholder (Defer Full GA4 Integration)

**Priority:** P0 (MVP - Required)

**Expanded Goal:**
Provide minimal scaffolding (stubs and flags) for future tracking integration without implementing GA4 at this stage. Preserve interfaces and configuration to avoid rework while keeping MVP scope tight.

**Architecture Components:** `lib/tracking.ts` (stubs), configuration flags

**Covers PRD Requirements:** Preparation for FR2/FR3 (deferred); no GA4 wiring in P0

**Story Count:** 7 stories

---

### Story 2.1: Tracking Placeholder Stubs and Flags

**As a** developer,
**I want** to add no‑op tracking stubs and configuration flags,
**So that** the system can integrate full tracking later without refactoring MVP code.

**Acceptance Criteria:**
1. Create `lib/tracking.ts` with exported no‑op functions (`extractTrackingParams`, `buildGA4Payload`, `sendGA4Event`) that return placeholder values
2. Add env flag `ENABLE_TRACKING=false` documented in README; functions should short‑circuit when disabled
3. Add TODO comments referencing Epic 7 stories for future implementation
4. No network calls nor GA4 dependencies in P0
5. Unit tests assert stubs execute without side effects

**Prerequisites:** None

---

 ## Epic 3: Legacy Client Bootstrap

**Priority:** P1 (Important)

**Expanded Goal:**
Maintain backward compatibility with existing legacy `/#destination` URLs by implementing a lightweight client-side bootstrap at the `/` endpoint. This bootstrap detects fragment-based URLs, extracts the destination, and upgrades users to the server-side `/r?to=...` endpoint seamlessly, ensuring no broken links while enabling the migration to server-side redirects.

**Architecture Components:** `routes/bootstrap.ts`

**Covers PRD Requirements:** Section 5.9 (Hybrid technical solution - backward compatibility)

**Story Count:** 2 stories

---

### Story 3.1: Client-Side Bootstrap HTML at Root Endpoint

**As a** user with a legacy `/#destination` URL,
**I want** the root endpoint to detect my fragment-based URL and upgrade me to the server-side redirect,
**So that** my existing bookmarks and links continue to work without manual updates.

**Acceptance Criteria:**
1. `routes/bootstrap.ts` implements GET `/` endpoint serving minimal HTML response
2. HTML includes `<meta name="robots" content="noindex, nofollow">` to prevent indexing
3. HTML includes inline JavaScript (<2KB) that:
   - Reads `window.location.hash` and extracts destination URL
   - Reads query parameters (e.g., `?isNoRedirect=1`)
   - Constructs upgrade URL: `/r?to=<encoded-destination>&n=<isNoRedirect-value>`
   - Executes `window.location.replace()` to upgrade
4. HTML includes `<noscript>` fallback: "Please enable JavaScript to continue"
5. If no hash present: redirect to `DEFAULT_REDIRECT_URL` from environment
6. Integration test: `GET /#https://example.com` serves HTML with upgrade script
7. Integration test: `GET /` (no hash) redirects to default URL
8. Response headers include `Cache-Control: no-cache`

**Prerequisites:** Story 1.1 (Hono routing), Story 1.4 (Error handling for fallback)

---

### Story 3.2: Legacy URL Backward Compatibility Testing

**As a** QA engineer,
**I want** comprehensive tests proving legacy URLs work correctly,
**So that** we can confidently deploy without breaking existing user links.

**Acceptance Criteria:**
1. Integration test suite covers legacy URL scenarios:
   - `/#https://example.com` → upgrades to `/r?to=https://example.com`
   - `/#https://example.com?utm_source=fb` → preserves tracking params
   - `/?isNoRedirect=1#https://example.com` → upgrades with `n=1` parameter
   - `/` (no hash) → redirects to `DEFAULT_REDIRECT_URL`
2. E2E test verifies complete flow: legacy URL → bootstrap → upgrade → final redirect
3. Tests verify URL encoding is handled correctly in upgrade process
4. Tests verify special characters in destination URLs work (spaces, UTF-8)
5. Tests verify fragment with malformed URLs fail gracefully
6. Performance test: bootstrap upgrade adds <50ms overhead vs direct `/r` call
7. All tests pass consistently in CI/CD pipeline

**Prerequisites:** Story 3.1 (Bootstrap implementation), Story 1.3 (Target `/r` endpoint)

---

 ## Epic 5: Debugging & Monitoring

**Priority:** P1 (Important)

**Expanded Goal:**
Implement debugging capabilities and structured logging to enable troubleshooting, performance monitoring, and operational visibility. Support debug mode (`n=1` parameter) that suppresses redirects and returns JSON payload for tracking verification. Configure Hono logger middleware for automatic request/response logging and implement custom structured logging for business events.

**Architecture Components:** `utils/logger.ts`, `routes/redirect.ts` (debug mode), Hono logger middleware

**Covers PRD Requirements:** FR5 (Debugging mode), FR6 (Error logging)

**Story Count:** 2 stories

---

### Story 5.1: Debug Mode Implementation for Redirect Endpoint

**As a** developer or QA tester,
**I want** to use debug mode (`n=1`) to see tracking data without being redirected,
**So that** I can verify tracking parameters and payload structure before deployment.

**Acceptance Criteria:**
1. `/r` endpoint checks for `n` query parameter (values: '0' or '1')
2. When `n=1`: endpoint returns JSON response instead of redirect with structure:
   ```json
   {
     "destination": "https://example.com",
     "tracking_params": { "utm_source": "fb", ... },
     "redirect_type": "302",
     "note": "Debug mode - redirect suppressed"
   }
   ```
3. When `n=0` or omitted: normal redirect behavior (default)
4. Zod validation schema updated to accept `n` parameter as optional enum: `z.enum(['0', '1']).optional()`
5. Debug mode still extracts tracking params but does NOT send to GA4
6. Integration test: `/r?to=https://example.com&n=1` returns 200 JSON (no redirect)
7. Integration test: `/r?to=https://example.com&n=0` returns 302 redirect (normal)
8. Integration test: `/r?to=https://example.com` returns 302 redirect (default)
9. Debug response includes all tracking params found in destination URL

**Prerequisites:** Story 1.3 (Redirect endpoint), Story 1.4 (Error handling), Story 2.1 (Tracking extraction)

---

### Story 5.2: Structured Logging Infrastructure

**As a** operations engineer,
**I want** structured JSON logs for all requests and business events,
**So that** I can monitor performance, troubleshoot issues, and analyze redirect patterns in Cloudflare dashboard.

**Acceptance Criteria:**
1. Hono logger middleware configured in `src/index.ts` using `app.use('*', logger())`
2. Hono logger automatically logs: HTTP method, path, status code, response time for all requests
3. Custom structured logger created in `utils/logger.ts` with functions: `info()`, `error()`
4. Custom logger outputs JSON format: `{level, message, timestamp, ...metadata}`
5. Timestamp format: ISO 8601 (`new Date().toISOString()`)
6. Logger integrated in key locations:
   - Redirect processed: `appLogger.info('Redirect processed', {path, destination, tracking})`
   - Tracking sent: `appLogger.info('GA4 tracking sent', {success: true})`
   - Tracking failed: `appLogger.error('GA4 tracking failed', {error: err.message})`
   - Error handling: `appLogger.error('Request error', {error, statusCode})`
7. Unit tests verify logger outputs valid JSON structure
8. Integration test verifies Hono logger middleware logs requests
9. Logs are visible in Cloudflare Workers dashboard (staging environment test)

**Prerequisites:** Story 1.1 (Project foundation), Story 1.4 (Error handling integration)

---


 ## Epic 6: Security & Validation

**Priority:** P0 (MVP - Required)

**Expanded Goal:**
Implement comprehensive security measures to prevent vulnerabilities including open redirects, injection attacks, and malicious URL schemes. Use Zod schema validation with Hono validator middleware for type-safe input validation, enforce HTTP/HTTPS-only protocols, and provide optional domain allowlist configuration for enhanced security governance.

**Architecture Components:** `lib/validation.ts`, Zod schemas, Hono validator middleware

**Covers PRD Requirements:** FR6 (Graceful handling), FR7 (URL encoding), NFR4 (Security), Section 5.11 (Security considerations)

**Story Count:** 3 stories

---

### Story 6.1: Zod Schema Validation with Hono Validator Middleware

**As a** security-conscious developer,
**I want** all incoming URL parameters validated using Zod schemas before processing,
**So that** malformed or malicious inputs are rejected early with clear error messages.

**Acceptance Criteria:**
1. Install dependencies: `zod@^4.1.0` and `@hono/zod-validator@^0.7.0`
2. `lib/validation.ts` exports `redirectSchema` using Zod:
   ```typescript
   z.object({
     to: z.string().url(),
     n: z.enum(['0', '1']).optional()
   })
   ```
3. `/r` endpoint uses `zValidator('query', redirectSchema)` middleware from `@hono/zod-validator`
4. Invalid inputs automatically return 400 with validation error message
5. Validated data accessible via `c.req.valid('query')` with full TypeScript type safety
6. Unit tests verify schema validates: valid URLs, invalid URLs, missing `to`, optional `n` parameter
7. Integration test: `/r?to=invalid-url` returns 400 with Zod validation error
8. Integration test: `/r` (no params) returns 400 with "to is required" message
9. TypeScript compilation enforces correct types from validated data

**Prerequisites:** Story 1.1 (Project foundation), Story 1.4 (Error handling for validation errors)

---

### Story 6.2: Protocol Validation and Open Redirect Prevention

**As a** security officer,
**I want** the system to only allow HTTP/HTTPS URLs and reject dangerous protocols,
**So that** users cannot be redirected to malicious javascript:, data:, or file: URLs.

**Acceptance Criteria:**
1. Zod schema in `lib/validation.ts` updated with refinement:
   ```typescript
   to: z.string()
     .url()
     .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
       message: 'Only HTTP/HTTPS URLs allowed'
     })
   ```
2. URLs with non-HTTP schemes rejected: `javascript:`, `data:`, `file:`, `ftp:`, protocol-relative `//`
3. Empty strings and whitespace-only strings rejected
4. Unit tests cover rejected schemes: `javascript:alert(1)`, `data:text/html,...`, `file:///etc/passwd`, `ftp://example.com`
5. Unit tests verify accepted: `http://example.com`, `https://example.com`, `https://example.com/path?query=1`
6. Integration test: `/r?to=javascript:alert(1)` returns 400 with "Only HTTP/HTTPS URLs allowed"
7. Integration test: `/r?to=data:text/html,<script>...` returns 400
8. Security documentation updated with validation approach

**Prerequisites:** Story 6.1 (Zod schema foundation)

---

### Story 6.3: Optional Domain Allowlist Configuration

**As a** enterprise administrator,
**I want** to optionally restrict redirects to specific trusted domains,
**So that** I can enforce governance and prevent redirects to unauthorized destinations.

**Acceptance Criteria:**
1. Environment variable `ALLOWED_DOMAINS` added to `src/types/env.ts` bindings (optional string)
2. Domain validation logic in `lib/validation.ts` exports `validateDestinationDomain(url, allowedDomains)`
3. Function checks if destination hostname matches or is subdomain of allowed domains
4. Function logic:
   - If `ALLOWED_DOMAINS` undefined/empty: allow all domains (permissive mode)
   - If `ALLOWED_DOMAINS` set: parse comma-separated list, check destination hostname
   - Match exact domain OR subdomain (e.g., `example.com` allows `sub.example.com`)
5. `/r` endpoint calls domain validation after Zod validation, throws `RedirectError` 403 if forbidden
6. Unit tests cover: exact match, subdomain match, non-match, undefined allowlist (permissive)
7. Integration test with `ALLOWED_DOMAINS="example.com,trusted.org"`:
   - `/r?to=https://example.com` → 302 (allowed)
   - `/r?to=https://sub.example.com` → 302 (subdomain allowed)
   - `/r?to=https://evil.com` → 403 "Domain not allowed"
8. Integration test without `ALLOWED_DOMAINS` → all domains allowed
9. wrangler.toml example configuration documented in README

**Prerequisites:** Story 6.2 (URL validation), Story 1.4 (Error handling for 403)

---

## Story Summary

### Epic Breakdown by Priority

**P0 (MVP - Required): 14 stories**
- Epic 1: Core Redirect Engine (7 stories)
- Epic 2: Pre-Redirect Tracking (4 stories)
- Epic 6: Security & Validation (3 stories)

**P1 (Important): 4 stories**
- Epic 3: Legacy Client Bootstrap (2 stories)
- Epic 5: Debugging & Monitoring (2 stories)

**P2 (Future): 0 stories**
- Epic 4: URL Management API (deferred)

**Total: 18 stories** (1 project init + 17 feature stories)

### Story Dependencies Flow

```
Story 1.1 (Project Init)
├─> Story 1.2 (KV Operations)
│   └─> Story 1.5 (Redirect Type Support)
├─> Story 1.3 (Basic Redirect)
│   └─> Story 1.4 (Error Handling)
│       ├─> Story 1.5 (Redirect Type Support)
│       └─> Story 1.6 (Environment Configuration)
│           └─> Story 1.7 (Test Environment Configuration)
├─> Story 2.1 (Tracking Extraction)
│   └─> Story 2.2 (GA4 Payload)
│       └─> Story 2.3 (GA4 HTTP)
│           └─> Story 2.4 (Integrated Tracking)
├─> Story 3.1 (Bootstrap Endpoint)
│   └─> Story 3.2 (Legacy Tests)
├─> Story 5.1 (Debug Mode)
├─> Story 5.2 (Structured Logging)
└─> Story 6.1 (Zod Validation)
    └─> Story 6.2 (Protocol Validation)
        └─> Story 6.3 (Domain Allowlist)
```

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the Scrum Master (SM) agent workflows to manage story implementation:
- `sprint-planning` - Initialize Phase 4 implementation tracking
- `create-story` - Generate detailed story implementation plans
- `story-context` - Prepare story for development with technical context

**Architecture Reference:** See [architecture.md](./architecture.md) for technical decisions, implementation patterns, and component mappings.

**PRD Reference:** See [prd.md](./prd.md) for functional requirements, non-functional requirements, and business context.

## Epic 7: Analytics Abstraction (Multi-Service)

**Priority:** P1 (Important)

**Expanded Goal:**
Provide a vendor‑neutral analytics layer: extract tracking data, define a neutral event model and provider interface, route events to one or more providers with isolation, and ensure non‑blocking behavior and observability.

**Architecture Components:** `src/lib/analytics/*`, `src/lib/tracking.ts`, `src/routes/redirect.ts`

**Covers PRD Requirements:** FR2 (Pre‑redirect tracking)

**Story Count:** 7 stories

---

### Story 7.1: Tracking Parameter Extraction from Destination URLs

**As a** marketing analyst,
**I want** the system to extract UTM and platform-specific tracking parameters from destination URLs,
**So that** I can track campaign performance and user attribution in analytics.

**Acceptance Criteria:**
1. `lib/tracking.ts` exports `extractTrackingParams(destinationUrl)` function
2. Function extracts UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
3. Function extracts platform-specific params: `xptdk` (Shopee), `ref` (Facebook)
4. Function returns `TrackingParams` interface with all extracted parameters (undefined for missing ones)
5. Function handles URL parsing errors gracefully (returns empty object, logs error)
6. Unit tests cover: complete UTM set, partial UTM set, platform params, malformed URLs, URLs without tracking params
7. Function correctly parses URL-encoded parameter values
8. TypeScript `TrackingParams` interface defined in `src/types/env.ts`

**Prerequisites:** None (standalone utility function)

---


### Story 7.2: Analytics Provider Interface and Neutral Event Model

**As a** system architect,
**I want** a vendor‑neutral AnalyticsEvent model and AnalyticsProvider interface,
**So that** business events are decoupled from vendor payloads and easy to extend.

**Acceptance Criteria:**
1. Define AnalyticsEvent (event name + attributes map) and AnalyticsProvider interface (e.g., send(event: AnalyticsEvent): Promise<void>)
2. Document minimal taxonomy: 
edirect_click with mapped attributes (utm_source, utm_medium, utm_campaign, utm_content, utm_term, xptdk, ref)
3. TypeScript interfaces exported (e.g., src/lib/analytics/types.ts, src/lib/analytics/provider.ts)
4. Examples included showing how a provider adapts neutral event → vendor payload
5. Unit tests validate type contracts and basic mapping examples

**Prerequisites:** Story 7.1

---

### Story 7.3: Analytics Router (Multi‑Service Fan‑Out)

**As a** developer,
**I want** a router that dispatches a neutral AnalyticsEvent to multiple providers concurrently with isolation,
**So that** adding/removing providers is simple and failures don’t affect each other.

**Acceptance Criteria:**
1. Implement 
outeAnalyticsEvent(event, providers) that fans‑out concurrently
2. Provider errors are caught and logged; other providers continue (isolation)
3. Supports zero, one, or many providers without special casing
4. Unit tests cover single/multiple providers, failure of one provider, and no‑provider case

**Prerequisites:** Stories 7.1, 7.2

---

### Story 7.4: Provider Registry + Feature Flags (Env Config)

**As a** platform engineer,
**I want** a registry reading ANALYTICS_PROVIDERS env to enable/disable providers,
**So that** we can configure providers per environment without code changes.

**Acceptance Criteria:**
1. Parse ANALYTICS_PROVIDERS (comma‑separated); unknown tokens → warn and ignore
2. Registry instantiates known providers (e.g., ga4) behind interfaces
3. Misconfiguration never breaks redirect path; falls back to empty provider set
4. Unit tests cover empty/multi/unknown providers and warnings

**Prerequisites:** Stories 7.2, 7.3

---

### Story 7.5: Timeout + Reliability Policy (Non‑Blocking)

**As a** reliability engineer,
**I want** per‑provider timeouts and non‑blocking guarantees,
**So that** analytics never delays or blocks the redirect response.

**Acceptance Criteria:**
1. Apply default per‑provider timeout (e.g., 2s) via AbortSignal.timeout() or equivalent
2. Router enforces overall return within budget regardless of provider hangs
3. Failures/Timeouts logged with structured logs; no throws to request path
4. Tests: timeout fired; hung provider isolated; router returns promptly

**Prerequisites:** Stories 7.3, 5.2 (logging), 1.4 (error handling pattern)

---

### Story 7.6: Observability (Structured Logs + Basic Counters)

**As a** DevOps engineer,
**I want** structured logs and lightweight counters for analytics routing,
**So that** we can monitor success/failure rates and timing without PII.

**Acceptance Criteria:**
1. Emit JSON logs for dispatch attempt, success, failure, and duration per provider
2. Ensure no PII; redact/omit sensitive fields; consistent schema across providers
3. Optional counters/metrics placeholders for future integration
4. Tests assert log schema and presence of timing fields

**Prerequisites:** Story 5.2 (Structured logging)

---

### Story 7.7: Test Harness + Provider Mocks

**As a** developer,
**I want** provider mocks and an end‑to‑end test harness for the router,
**So that** we can verify behavior across success/failure/timeout paths.

**Acceptance Criteria:**
1. Mocks for providers implementing AnalyticsProvider
2. E2E tests covering: no providers, single provider, multi‑provider, fail, timeout
3. Developer guide: how to add a new provider (steps + example)

**Prerequisites:** Stories 7.2, 7.3, 7.5

---## Epic 8: Google Analytics 4 Integration

**Priority:** P1 (Important)

**Expanded Goal:**
Deliver GA4-specific analytics integration behind the generalized tracking abstraction. Build payloads, integrate HTTP send with timeout/error isolation, and wire into the redirect flow without impacting performance or stability.

**Architecture Components:** `lib/tracking.ts`, `routes/redirect.ts`

**Covers PRD Requirements:** FR3 (GA4 integration), NFR5 (Tracking reliability)

**Story Count:** 3 stories

---

### Story 8.1: GA4 Measurement Protocol Payload Builder

**As a** developer,
**I want** to construct valid GA4 Measurement Protocol payloads from tracking parameters,
**So that** analytics events can be sent to Google Analytics 4 with correct data structure.

**Acceptance Criteria:**
1. `lib/tracking.ts` exports `buildGA4Payload(params, measurementId)` function
2. Function constructs GA4 Measurement Protocol v2 payload structure with:
   - `client_id` generated using hash of timestamp + random value
   - `events` array with single event: `redirect_click`
   - Event parameters mapped from `TrackingParams` (campaign, source, medium, content, term)
3. Function includes custom parameters for platform-specific tracking (xptdk, ref)
4. Function handles missing/undefined parameters gracefully (omits from payload)
5. Unit tests verify payload structure matches GA4 spec
6. Unit tests cover: full parameters, minimal parameters, custom parameters
7. Generated `client_id` is consistent format (not sensitive data)

**Prerequisites:** Story 7.1 (TrackingParams interface and extraction)

---

### Story 8.2: GA4 Measurement Protocol HTTP Integration

**As a** system,
**I want** to send tracking events to GA4 Measurement Protocol endpoint via HTTP POST,
**So that** analytics data is recorded before users are redirected.

**Acceptance Criteria:**
1. `lib/tracking.ts` exports async `sendGA4Event(payload, apiSecret, measurementId)` function
2. Function sends POST request to `https://www.google-analytics.com/mp/collect` with query params: `measurement_id` and `api_secret`
3. Request headers include `Content-Type: application/json`
4. Request body is JSON stringified GA4 payload
5. Function includes 2-second timeout using `AbortSignal.timeout(2000)`
6. Function catches timeout and fetch errors, logs them without throwing
7. Integration test with Miniflare verifies fetch call is made with correct URL and payload
8. Unit test verifies timeout is properly configured
9. Environment variables `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` used from `c.env`

**Prerequisites:** Story 8.1 (Payload builder), Story 1.1 (Env bindings for GA4 config)

---

### Story 8.3: Integrated GA4 in Redirect Flow

**As a** end user,
**I want** my analytics to be tracked before I'm redirected,
**So that** no tracking data is lost even if I close the browser quickly.

**Acceptance Criteria:**
1. `routes/redirect.ts` updated to extract tracking params from destination URL using `extractTrackingParams()`
2. Route builds GA4 payload using `buildGA4Payload()` with extracted params
3. Route calls `await sendGA4Event()` BEFORE returning redirect response
4. Tracking errors are logged but do NOT prevent redirect from executing
5. Integration test verifies: tracking function called before redirect response sent
6. Integration test verifies: redirect still works even if tracking fails/times out
7. Structured log entry created for tracking attempt (success/failure)
8. Performance: tracking adds <100ms latency in happy path (within sub-5ms total budget)

**Prerequisites:** Story 7.1 (extraction), Story 8.1 (payload builder), Story 8.2 (GA4 send), Story 1.5 (redirect flow to integrate into)

---
## Epic 4: Short URL Management API

**Priority:** P2 

**Rationale:**
Core KV operations implemented in Epic 1 (Story 1.2) provide programmatic interface for future admin UI integration.

**Future Scope:**
- REST API endpoints for Short URL CRUD operations
- Simple api acess token for rest endpoints.

**Story Count:** 0 stories (not included in current MVP)

---

## Epic 9: Analytics Retry Queue (Deferred)

**Priority:** P2 (Future - Deferred)

**Status:** Deferred - To be implemented in future iteration

**Rationale:**
Current analytics implementation uses fire-and-forget approach without persistence. While this meets MVP requirements for real-time analytics tracking, it lacks resilience for handling temporary analytics service outages. Epic 9 will add a retry buffer using KV storage and Worker Cron to replay failed analytics events.

**Expanded Goal:**
Implement a resilient analytics pipeline with KV-based retry queue and scheduled replay mechanism. When analytics providers (GA4, Mixpanel, etc.) are temporarily unavailable, failed events will be stored in KV with TTL and replayed by a Worker Cron job. This ensures analytics data completeness without impacting redirect performance.

**Architecture Components:**
- `ANALYTICS_KV` namespace - Retry queue storage (schema: `retry:${timestamp}:${uuid}`)
- `src/lib/analytics/retry-queue.ts` - Enqueue/dequeue operations
- `src/cron/analytics-replay.ts` - Worker Cron job for replay
- TTL-based cleanup - Automatic expiry of old retry entries

**Requirements:**

1. **Storage Schema**
   - Key pattern: `retry:${timestamp}:${uuid}` for chronological ordering
   - Value: JSON payload with event data, provider name, attempt count, TTL metadata
   - TTL: 7 days default (configurable via `ANALYTICS_RETRY_TTL_DAYS`)

2. **Enqueue Logic**
   - When provider send() fails with network/timeout error, enqueue to KV
   - Use `ctx.waitUntil()` to ensure KV write completes without blocking redirect
   - Log enqueue operations with structured logging

3. **Worker Cron Replay**
   - Schedule: Every 5 minutes (configurable via `ANALYTICS_RETRY_CRON`)
   - Batch size: 100 events per execution (configurable via `ANALYTICS_RETRY_BATCH_SIZE`)
   - Read oldest entries from KV, attempt resend to providers
   - On success: Delete from KV
   - On failure: Increment attempt count, re-enqueue with backoff (max 3 attempts)
   - Handle idempotency to prevent duplicate events

4. **Error Handling & Observability**
   - Structured logs for enqueue, replay, success, failure
   - Metrics: retry queue size, replay success rate, retry exhaustion count
   - Alert on high retry queue growth (indicates persistent provider issues)

5. **Testing Requirements**
   - Unit: Enqueue with KV mock, TTL validation
   - Integration: Simulate GA4 downtime → verify event queued → cron replays successfully
   - E2E: Validate idempotency and max retry limits

**Covers PRD Requirements:** NFR5 (Analytics reliability enhancement)

**Dependencies:**
- Cloudflare Workers Cron (Free tier: 3 cron schedules)
- KV namespace: ANALYTICS_KV (requires creation and wrangler.toml binding)
- Existing analytics abstraction from Epic 7 (AnalyticsProvider interface, router)

**Story Count:** TBD (estimated 4-6 stories)

**Deferred Until:**
- MVP deployed and stabilized
- Analytics volume and failure rate metrics collected
- Business case validated for retry implementation cost vs data completeness benefit

---

## Epic 10: Admin UI

**Priority:** P2 (Future - Deferred)

**Status:** Deferred to separate project phase

**Rationale:**
Admin UI and web-based CRUD interface explicitly deferred to separate project per architectural decision (ADR and readiness report).

**Future Scope:**
- Admin authentication and authorization
- Web-based admin dashboard
- URL statistics and analytics

**Story Count:** 0 stories (not included in current MVP)

---
