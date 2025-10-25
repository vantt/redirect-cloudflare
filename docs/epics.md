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

**Story Count:** 5 stories

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

## Epic 2: Pre-Redirect Tracking

**Priority:** P0 (MVP - Required)

**Expanded Goal:**
Implement robust analytics tracking that captures UTM parameters and platform-specific tracking codes (xptdk, ref) from destination URLs and sends them to Google Analytics 4 BEFORE executing the redirect. This ensures no tracking data is lost and maintains consistency with the legacy system while adding timeout protection to prevent GA4 slowness from blocking redirects.

**Architecture Components:** `lib/tracking.ts`, `routes/redirect.ts` (integration)

**Covers PRD Requirements:** FR2 (Pre-redirect tracking), FR3 (GA4 integration), NFR5 (Tracking reliability)

**Story Count:** 4 stories

---

### Story 2.1: Tracking Parameter Extraction from Destination URLs

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

### Story 2.2: GA4 Measurement Protocol Payload Builder

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

**Prerequisites:** Story 2.1 (TrackingParams interface and extraction)

---

### Story 2.3: GA4 Measurement Protocol HTTP Integration

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

**Prerequisites:** Story 2.2 (Payload builder), Story 1.1 (Env bindings for GA4 config)

---

### Story 2.4: Integrated Tracking in Redirect Flow

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

**Prerequisites:** Story 2.1 (extraction), Story 2.2 (payload builder), Story 2.3 (GA4 send), Story 1.5 (redirect flow to integrate into)

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

## Epic 4: URL Management API

**Priority:** P2 (Future - Deferred)

**Status:** Deferred to separate project phase

**Rationale:**
Admin UI and web-based CRUD interface explicitly deferred to separate project per architectural decision (ADR and readiness report). Core KV operations implemented in Epic 1 (Story 1.2) provide programmatic interface for future admin UI integration.

**Future Scope:**
- REST API endpoints for URL CRUD operations
- Admin authentication and authorization
- Web-based admin dashboard
- URL statistics and analytics

**Story Count:** 0 stories (not included in current MVP)

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

**P0 (MVP - Required): 12 stories**
- Epic 1: Core Redirect Engine (5 stories)
- Epic 2: Pre-Redirect Tracking (4 stories)
- Epic 6: Security & Validation (3 stories)

**P1 (Important): 4 stories**
- Epic 3: Legacy Client Bootstrap (2 stories)
- Epic 5: Debugging & Monitoring (2 stories)

**P2 (Future): 0 stories**
- Epic 4: URL Management API (deferred)

**Total: 16 stories** (1 project init + 15 feature stories)

### Story Dependencies Flow

```
Story 1.1 (Project Init)
├─> Story 1.2 (KV Operations)
│   └─> Story 1.5 (Redirect Type Support)
├─> Story 1.3 (Basic Redirect)
│   └─> Story 1.4 (Error Handling)
│       └─> Story 1.5 (Redirect Type Support)
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
