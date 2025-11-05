# Decision Architecture

## Executive Summary

The **cloudflareRedirect** service is a high-performance, serverless URL redirect solution built on Cloudflare Workers with the Hono framework. The architecture prioritizes edge-level performance (sub-5ms processing), pre-redirect analytics tracking, and backward compatibility with legacy client-side redirects. Key architectural decisions favor proven technologies (Hono v4, TypeScript v5.9, Zod v4) with strong type safety, comprehensive testing via Vitest + Miniflare, and structured logging for observability. The system uses Cloudflare KV for URL mapping storage with JSON-based data structures, enabling future extensibility while maintaining edge performance.

## Project Initialization

**First Implementation Story: Initialize Project with Hono Starter**

```bash
npm create hono@latest cloudflareRedirect -- --template cloudflare-workers
cd cloudflareRedirect
npm install
```

This establishes the base architecture with (provided by starter):
- TypeScript configuration and build pipeline
- Wrangler CLI setup with dev/staging/production environments
- Hono framework v4.10+ with routing and middleware
- Basic project structure (src/index.ts entry point)
- Local development environment with Miniflare emulation

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Framework | Hono Web Framework | v4.10+ | All | Ultra-fast routing, TypeScript-first, KV binding support, minimal bundle (~14KB), perfect for multi-endpoint service |
| Language | TypeScript | v5.9+ | All | Type safety, excellent IDE support, Cloudflare Workers native support, reduces runtime errors |
| Runtime | Cloudflare Workers | compatibility_date: 2025-10-24 | All | Edge-level execution, global distribution, sub-5ms latency, serverless scaling, KV integration |
| Data Store | Cloudflare KV (JSON objects) | N/A | URL Storage, Admin API | Flexible JSON structure allows metadata (redirect type, creation date), extensible for future features, KV `.get(key, "json")` auto-parses efficiently |
| Validation | Zod + Hono Validator | Zod v4.1+, @hono/zod-validator v0.7+ | Request Validation | Security-critical URL validation, type-safe schemas, automatic HTTP error responses, 14x faster parsing in v4 |
| Testing | Vitest + Miniflare | Vitest v4.0+ | All | Accurate Cloudflare Workers runtime emulation, fast parallel execution, ESM-native, official Cloudflare recommendation for Workers testing |
| Error Handling | Custom Error Classes | N/A | All | Type-safe error handling, clear HTTP status codes (400/404/500), structured error responses with codes for debugging |
| Logging | Hono Logger + Custom Structured | Hono built-in | All | Request/response auto-logging for performance monitoring, structured JSON logs for Cloudflare dashboard, zero extra dependencies |
| Analytics | GA4 Measurement Protocol (Direct) | GA4 API v2 | Tracking | Direct control, reliable await pattern before redirect, 2-second timeout protection, no GTM server-side container needed |
| Environment Config | Type-Safe Wrangler Bindings | N/A | All | TypeScript type safety for env vars, clear public/secret separation, multi-environment support (dev/staging/prod) |

### Version Verification

- Hono v4.10+ — Verified on 2025-10-25
- TypeScript v5.9+ — Verified on 2025-10-25
- Zod v4.1+ and @hono/zod-validator v0.7+ — Verified on 2025-10-25
- Vitest v4.0+ — Verified on 2025-10-25
- Cloudflare Workers compatibility_date 2025-10-24 — Set in repo


## Project Structure

```
src/
├── lib/
│   ├── analytics/          # Analytics system (Epic 7)
│   │   ├── ga4/            # GA4 provider (Epic 8)
│   │   ├── providers/      # Provider factories
│   │   ├── router.ts       # Event routing
│   │   └── types.ts        # Analytics types
│   ├── destination-resolver.ts # Destination URL resolution
│   ├── errors.ts           # Custom error classes
│   ├── kv-store.ts         # KV store abstraction
│   ├── query-parser.ts     # Query string parsing
│   └── validation.ts       # URL and domain validation
├── routes/
│   ├── bootstrap.ts        # Legacy URL bootstrap
│   └── redirect.ts         # Main redirect endpoint
├── types/
│   └── env.ts              # Environment variable types
└── utils/
    └── logger.ts           # Structured logger

test/
├── unit/
│   └── lib/
│       ├── analytics/
│       │   ├── providers/
│       │   └── ga4/
│       └── ...
├── integration/
└── fixtures/
```

## Epic to Architecture Mapping

Based on PRD functional requirements, epics map to architectural components:

| Epic | Description | Architecture Components | Key Technologies |
| ---- | ----------- | ----------------------- | ---------------- |
| **Epic 1: Core Redirect Engine** | Server-side 301/302 redirects from short URLs | `routes/redirect.ts`, `lib/kv-store.ts`, `lib/validation.ts`, `lib/destination-resolver.ts` | Hono routing, Cloudflare KV, Zod validation |
| **Epic 2: Pre-Redirect Tracking (Foundation)** | Extract tracking params (UTM/xptdk), prepare neutral event | `lib/parameter-extractor.ts` | URL parsing, typed TrackingParams |
| **Epic 3: Legacy Client Bootstrap** | Upgrade legacy `/#...` URLs to `/r?to=...` | `routes/bootstrap.ts` (minimal HTML + JS) | Hono static responses, client-side redirect |
| **Epic 4: URL Management API** | CRUD operations for URL mappings (future/optional) | `routes/admin.ts` (future), `lib/kv-store.ts` | Hono REST endpoints, KV bindings |
| **Epic 5: Debugging & Monitoring** | Debug mode (isNoRedirect=1), structured logging | `lib/logger.ts`, `lib/query-parser.ts`, `lib/response-builder.ts`, error handling in all routes | Hono logger middleware, custom structured logs |
| **Epic 6: Security & Validation** | URL sanitization, open redirect prevention, optional domain allowlist | `lib/validation.ts`, `lib/errors.ts` | Zod schemas, URL parsing, domain checks |
| **Epic 7: Analytics Abstraction (Multi-Service)** | Neutral event model, provider interface, router fan-out, registry, timeouts, observability | `src/lib/analytics/*`, `lib/analytics/tracking-service.ts`, `routes/redirect.ts` | Provider registry (env), concurrent dispatch with isolation, AbortSignal timeout, structured logs |
| **Epic 8: GA4 Integration** | GA4 payload builder, HTTP integration with timeout, wiring into redirect flow | `lib/analytics/ga4/*`, `lib/analytics/providers/ga4.ts`, `lib/analytics/tracking-service.ts` | GA4 Measurement Protocol v2, Fetch API with timeout |


## Analytics Abstraction (Epic 7)

Goal: Vendor-neutral analytics layer that extracts tracking data (FR2), models neutral events, and routes to one or more providers without blocking redirects.

Key Decisions:
- Neutral Model: AnalyticsEvent { name: string; attributes: Record<string,string|number|boolean> }
- Provider Interface: AnalyticsProvider.send(event: AnalyticsEvent): Promise<void>
- Router: 
outeAnalyticsEvent(event, providers) fans out concurrently; per-provider isolation (try/catch) with structured logging
- Registry: ANALYTICS_PROVIDERS env (e.g., ga4,mixpanel) selects providers at runtime; unknown providers ignored with warning
- Reliability: Per-provider timeout default 2s via AbortSignal.timeout(2000); router always returns within budget
- Observability: JSON logs for attempt/success/failure/duration; no PII; log schema consistent

Implementation Patterns:
- Files: src/lib/analytics/types.ts, src/lib/analytics/provider.ts, src/lib/analytics/router.ts, src/lib/analytics/registry.ts
- Redirect Wiring: /r builds AnalyticsEvent from TrackingParams then calls router; redirect response not blocked by analytics
- Testing: Provider mocks and e2e harness for multi-provider, fail, timeout cases

Rationale:
- Decouples business events from vendor payloads; simplifies adding/removing providers
- Protects redirect latency with timeouts and isolation; improves reliability and observability

### Skeleton Code Paths (no code)

- `src/lib/analytics/types.ts`
  - `export type AnalyticsAttributes = Record<string, string | number | boolean>`
  - `export interface AnalyticsEvent { name: string; attributes: AnalyticsAttributes }`

- `src/lib/analytics/provider.ts`
  - `export interface AnalyticsProvider { send(event: AnalyticsEvent): Promise<void> }`

- `src/lib/analytics/router.ts`
  - `export async function routeAnalyticsEvent(event: AnalyticsEvent, providers: AnalyticsProvider[]): Promise<void>`
  - Concurrency + isolation (try/catch) + structured logging hook

- `src/lib/analytics/registry.ts`
  - `export function loadProviders(env: Env): AnalyticsProvider[]`
  - Parse `ANALYTICS_PROVIDERS` (comma-separated), ignore unknown with warning

- `src/routes/redirect.ts`
  - Build `AnalyticsEvent` from `TrackingParams`
  - `const providers = loadProviders(c.env)` ? `await routeAnalyticsEvent(event, providers)` (non-blocking vs redirect path)

- `src/lib/analytics/tracking-service.ts`
    - `export async function trackRedirect(context: RedirectTrackingContext, env: Env): Promise<void>`

- Tests (structure only)
  - `test/unit/lib/analytics/router.test.ts`
  - `test/unit/lib/analytics/registry.test.ts`
  - `test/integration/ga4-http-integration.test.ts`
  - `test/e2e/analytics-router.e2e.test.ts`
  - Mocks for `AnalyticsProvider` in `test/utils/mock-analytics.ts`

### Developer TODOs (Epic 7)

1. Define neutral models (types.ts) and provider interface (provider.ts)
2. Implement router fan-out with per-provider timeout policy (router.ts)
3. Implement registry driven by `ANALYTICS_PROVIDERS` env (registry.ts)
4. Wire `/r` to produce `AnalyticsEvent` from `TrackingParams` and call router (non-blocking)
5. Add structured logs (attempt/success/failure/duration) without PII
6. Create provider mocks + tests for single/multi/none providers; failure/timeout paths
7. Document how to add a new provider (developer guide in `docs/`)

## Technology Stack Details

### Core Technologies

**Runtime Environment:**
- **Cloudflare Workers** (compatibility_date: 2025-10-24)
  - Edge-level execution across 300+ global locations
  - V8 isolate-based (faster cold starts than containers)
  - 100,000 requests/day free tier (PRD cost requirement)
  - Sub-5ms CPU time target (PRD performance requirement)

**Framework & Language:**
- **Hono v4.10+** - Ultra-fast web framework
  - RegExpRouter for high-performance routing
  - Built-in middleware (logger, CORS, error handling)
  - Type-safe context (c.env, c.req, c.json)
  - ~14KB bundle size (minimal overhead)
- **TypeScript v5.9+** - Type-safe development
  - Strict mode enabled
  - ES2022 target (Workers native support)
  - Full type definitions for Workers APIs

**Data & Storage:**
- **Cloudflare KV** - Distributed key-value store
  - Eventually consistent (10-60s propagation)
  - Optimized for reads (99.9% <5ms at p50)
  - JSON storage format: `{ url: string, type: 'permanent' | 'temporary', created: ISO8601 }`

**Validation & Type Safety:**
- **Zod v4.1+** - Schema validation
  - 14x faster parsing than v3
  - Type inference for TypeScript
  - `@hono/zod-validator v0.7+` for middleware integration

**Testing:**
- **Vitest v4.0** - Fast unit testing
  - Browser Mode for visual regression (future)
  - Parallel test execution
  - ESM-native (no transpilation needed)
- **Miniflare** - Workers runtime emulation
  - Accurate KV namespace simulation
  - Local development environment
  - Integration test support
- **Test Organization:** Follow Testing Pyramid structure (Unit → Integration → E2E)
  - See [Test Suite Structure Documentation](./test-suite-structure.md) for complete test organization, file locations, naming conventions, and best practices

### Integration Points

**1. Cloudflare KV Binding (REDIRECT_KV)**
```typescript
// Type-safe KV access
const data = await c.env.REDIRECT_KV.get<RedirectData>('shortPath', 'json')
await c.env.REDIRECT_KV.put('shortPath', JSON.stringify(redirectData))
```

**2. Google Analytics 4 Measurement Protocol**
```typescript
// Direct HTTP POST to GA4
await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${c.env.GA4_MEASUREMENT_ID}&api_secret=${c.env.GA4_API_SECRET}`, {
  method: 'POST',
  body: JSON.stringify(ga4Payload),
  signal: AbortSignal.timeout(2000) // 2s timeout protection
})
```

**3. Environment Bindings (Type-Safe)**
```typescript
// src/types/env.ts
export type Env = {
  Bindings: {
    REDIRECT_KV: KVNamespace
    DEFAULT_REDIRECT_URL: string
    GA4_MEASUREMENT_ID: string
    GA4_API_SECRET: string
    ALLOWED_DOMAINS?: string
    ENVIRONMENT: 'dev' | 'staging' | 'production'
  }
}
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### 1. Request Validation Pattern
```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// Define schema
const redirectSchema = z.object({
  to: z.string()
    .url()
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'Only HTTP/HTTPS URLs allowed'
    }),
  n: z.enum(['0', '1']).optional() // isNoRedirect flag
})

// Apply as middleware
app.get('/r',
  zValidator('query', redirectSchema),
  async (c) => {
    const { to, n } = c.req.valid('query') // Type-safe validated data
    // ... handler logic
  }
)
```

### 2. Error Handling Pattern
```typescript
// lib/errors.ts
export class RedirectError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'ERROR'
  ) {
    super(message)
    this.name = 'RedirectError'
  }
}

// Global error handler in index.ts
app.onError((err, c) => {
  if (err instanceof RedirectError) {
    return c.json({
      error: err.message,
      code: err.code
    }, err.statusCode)
  }

  // Unknown error - log and return generic
  appLogger.error('Unexpected error', {
    error: err.message,
    stack: err.stack
  })
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }, 500)
})

// Usage in routes
if (!destination) {
  throw new RedirectError('Missing destination parameter', 400, 'MISSING_PARAM')
}
```

### 3. Tracking Before Redirect Pattern
```typescript
// lib/tracking.ts
export async function trackRedirect(
  params: TrackingParams,
  env: Env['Bindings']
): Promise<void> {
  try {
    const payload = buildGA4Payload(params, env.GA4_MEASUREMENT_ID)

    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000) // Protect from GA4 slowness
      }
    )
  } catch (err) {
    // Log failure but don't block redirect (PRD NFR5 interpretation)
    appLogger.error('GA4 tracking failed', {
      error: err instanceof Error ? err.message : 'Unknown',
      params
    })
  }
}

// Usage in routes/redirect.ts
const trackingParams = extractTrackingParams(destination)
await trackRedirect(trackingParams, c.env) // MUST await
return c.redirect(destination, 302)
```

### 4. KV Storage Pattern
```typescript
// lib/kv-store.ts
export interface RedirectData {
  url: string
  type: 'permanent' | 'temporary'
  created: string // ISO 8601
}

export async function getRedirect(
  path: string,
  kv: KVNamespace
): Promise<RedirectData | null> {
  return await kv.get<RedirectData>(path, 'json')
}

export async function putRedirect(
  path: string,
  data: RedirectData,
  kv: KVNamespace
): Promise<void> {
  await kv.put(path, JSON.stringify(data))
}
```

### 5. Logging Pattern
```typescript
// utils/logger.ts
export const appLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },

  error: (message: string, meta?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}

// Usage
appLogger.info('Redirect processed', {
  path: 'abc123',
  destination: 'https://example.com',
  trackingParams: { utm_source: 'fb' }
})
```

## Consistency Rules

### Naming Conventions

**Files & Folders:**
- Files: `kebab-case.ts` (lowercase with dashes)
  - `redirect.ts`, `kv-store.ts`, `tracking.ts`
  - `Redirect.ts`, `KVStore.ts`, `Tracking.ts`
- Folders: `lowercase` single word or `kebab-case`
  - `routes/`, `lib/`, `utils/`
  - `Routes/`, `Lib/`, `Utils/`
- Test files: Co-located with source, `.test.ts` suffix
  - `src/lib/validation.test.ts` (next to `validation.ts`)

**Code:**
- Classes: `PascalCase`
  - `RedirectError`, `TrackingParams`
- Functions/Variables: `camelCase`
  - `getRedirect()`, `trackingParams`, `destinationUrl`
- Constants: `UPPER_SNAKE_CASE`
  - `GA4_ENDPOINT`, `DEFAULT_REDIRECT_URL`, `MAX_TIMEOUT`
- Types/Interfaces: `PascalCase`
  - `type Env = {...}`, `interface RedirectData {...}`

### Code Organization

**Module Exports:**
```typescript
// ? Named exports (easier to tree-shake)
export function getRedirect() { ... }
export class RedirectError extends Error { ... }

// ? Default exports (avoid)
export default function() { ... }
```

**Import Order:**
```typescript
// 1. External dependencies
import { Hono } from 'hono'
import { z } from 'zod'

// 2. Internal types
import type { Env } from './types/env'

// 3. Internal modules
import { getRedirect } from './lib/kv-store'
import { trackRedirect } from './lib/tracking'
```

**Async/Await Convention:**
```typescript
// ? ALWAYS use async/await
const data = await kv.get('key', 'json')

// ? NEVER use .then() chains
kv.get('key', 'json').then(data => { ... })
```

### Error Handling

**Pattern: Custom Error Classes + Global Handler**

All errors thrown in route handlers are caught by the global `app.onError()` handler. Use `RedirectError` for expected errors with specific HTTP codes:

```typescript
// Expected errors (validation, not found, etc.)
throw new RedirectError('Invalid URL format', 400, 'INVALID_URL')
throw new RedirectError('Short URL not found', 404, 'NOT_FOUND')
throw new RedirectError('Domain not in allowlist', 403, 'FORBIDDEN_DOMAIN')

// Unexpected errors - let them throw naturally
// Global handler will log and return 500
```

### Logging Strategy

**Pattern: Hono Logger + Custom Structured**

1. **Request/Response Logging (Automatic):**
```typescript
import { logger } from 'hono/logger'

app.use('*', logger()) // Logs: GET /r?to=... 302 3ms
```

2. **Business Logic Logging (Manual):**
```typescript
import { appLogger } from './utils/logger'

appLogger.info('Redirect processed', { path, destination })
appLogger.error('KV lookup failed', { error: err.message, path })
```

**Log Format (JSON):**
```json
{
  "level": "info",
  "message": "Redirect processed",
  "timestamp": "2025-10-24T12:34:56.789Z",
  "path": "abc123",
  "destination": "https://example.com"
}
```

## Data Architecture

### KV Data Model

**Key Structure:**
```
shortPath -> RedirectData (JSON)
```

**RedirectData Schema:**
```typescript
interface RedirectData {
  url: string              // Full destination URL
  type: 'permanent' | 'temporary'  // 301 vs 302
  created: string          // ISO 8601 timestamp
  // Future extensibility:
  // hits?: number
  // lastAccessed?: string
  // expiresAt?: string
}
```

**Example:**
```json
// Key: "abc123"
// Value:
{
  "url": "https://example.com/page?utm_source=fb&utm_campaign=summer",
  "type": "temporary",
  "created": "2025-10-24T12:00:00.000Z"
}
```

### Data Flow

1. **Read Flow (Redirect):**
   ```
   User Request ? Validate URL ? KV.get(shortPath, 'json') ? Extract Tracking ? Send GA4 ? Redirect
   ```

2. **Write Flow (Admin API - Future):**
   ```
   Admin Request ? Validate + Auth ? KV.put(shortPath, JSON) ? Success Response
   ```

## API Contracts

### 1. GET `/r` - Canonical Server-Side Redirect

**Purpose:** Server-side redirect with pre-redirect tracking

**Query Parameters:**
- `to` (required): URL-encoded destination URL
- `n` (optional): `'0'` (default, redirect) or `'1'` (debug mode, no redirect)

**Success Response (Redirect):**
```http
HTTP/1.1 302 Found
Location: https://example.com/page?utm_source=fb
Cache-Control: no-cache
```

**Success Response (Debug Mode, debug=1):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "destination": "https://example.com/page?utm_source=fb",
  "tracking_params": {
    "utm_source": "fb",
    "utm_campaign": "summer"
  },
  "redirect_type": "302",
  "note": "Debug mode - redirect suppressed"
}
```

**Error Responses:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Missing destination parameter",
  "code": "MISSING_PARAM"
}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Only HTTP/HTTPS URLs allowed",
  "code": "INVALID_URL"
}
```

### 2. GET `/` - Legacy Client Bootstrap

**Purpose:** Upgrade legacy `/#destination` URLs to `/r?to=...`

**Response:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="robots" content="noindex, nofollow">
  <title>Redirecting...</title>
</head>
<body>
  <script>
    const hash = window.location.hash.slice(1); // Remove #
    if (hash) {
      const search = window.location.search;
      const upgradeUrl = '/r?to=' + encodeURIComponent(hash) + search;
      window.location.replace(upgradeUrl);
    } else {
      window.location.replace('https://example.com'); // DEFAULT_REDIRECT_URL
    }
  </script>
  <noscript>Please enable JavaScript to continue.</noscript>
</body>
</html>
```

## Security Architecture

### 1. URL Validation (Input Sanitization)

**Zod Schema Enforcement:**
```typescript
const redirectSchema = z.object({
  to: z.string()
    .url()
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'Only HTTP/HTTPS URLs allowed'
    })
})
```

**Prevents:**
- Non-URL strings (rejected by `.url()`)
- Protocol-relative URLs (rejected by `startsWith` check)
- JavaScript URLs (`javascript:alert(1)`)
- Data URLs (`data:text/html,...`)
- File URLs (`file:///etc/passwd`)

### 2. Open Redirect Prevention

**Optional Domain Allowlist:**
```typescript
// If ALLOWED_DOMAINS env var is set
if (c.env.ALLOWED_DOMAINS) {
  const allowedDomains = c.env.ALLOWED_DOMAINS.split(',')
  const destHost = new URL(destination).hostname

  const isAllowed = allowedDomains.some(domain =>
    destHost === domain || destHost.endsWith('.' + domain)
  )

  if (!isAllowed) {
    throw new RedirectError(
      'Destination domain not allowed',
      403,
      'FORBIDDEN_DOMAIN'
    )
  }
}
```

**Example Config:**
```toml
# wrangler.toml
[env.production.vars]
ALLOWED_DOMAINS = "example.com,partner.com,trusted.org"
```

### 3. Secrets Management

**Public Variables (wrangler.toml):**
```toml
[env.production.vars]
DEFAULT_REDIRECT_URL = "https://example.com"
GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"
ENVIRONMENT = "production"
```

**Secrets (CLI only, never in repo):**
```bash
# Set secrets via Wrangler CLI
wrangler secret put GA4_API_SECRET --env production
wrangler secret put ALLOWED_DOMAINS --env production
```

### 4. Rate Limiting & Abuse Protection

**Built-in Cloudflare Protection:**
- Cloudflare's edge firewall automatically blocks DDoS attacks
- Rate limiting rules can be configured in Cloudflare dashboard
- Free tier: 100,000 requests/day (PRD requirement)

**Future Enhancement (if needed):**
- Implement per-IP rate limiting using Durable Objects
- Add CAPTCHA for suspicious traffic patterns

## Performance Considerations

### 1. Sub-5ms Processing Target (PRD NFR1)

**Optimization Strategies:**
- **Edge execution:** Code runs on Cloudflare's 300+ locations (closest to user)
- **Minimal bundle size:** Hono (~14KB) + Zod (~10KB) + app code (~5KB) = ~30KB total
- **KV read optimization:** 99.9% of reads complete in <5ms at p50
- **No cold starts:** V8 isolates start in <1ms (vs 100ms+ for containers)

**Performance Budget Breakdown:**
```
Request validation (Zod):     ~0.5ms
KV lookup (.get):             ~2-3ms
GA4 tracking (async):         ~50-200ms (doesn't block redirect)
Response generation:          ~0.5ms
-------------------------------------------
Total (excluding tracking):   ~3-4ms ? Within sub-5ms target
```

**Tracking Timeout Protection:**
```typescript
// 2-second timeout prevents GA4 slowness from blocking redirect
await fetch(GA4_ENDPOINT, {
  signal: AbortSignal.timeout(2000)
})
```

### 2. Caching Strategy

**KV Caching:**
- Eventually consistent (10-60s global propagation)
- Edge caching: Popular keys cached at edge locations
- No explicit cache headers needed for redirects (stateless)

**HTTP Response Headers:**
```typescript
// Redirect responses - no cache (URLs may change)
return c.redirect(destination, 302, {
  'Cache-Control': 'no-cache, no-store, must-revalidate'
})
```

### 3. Scalability

**Cloudflare Workers Auto-Scaling:**
- No capacity planning needed
- Automatically scales to millions of requests
- Free tier: 100,000 requests/day (PRD cost requirement)
- Paid tier: 10M requests/month included

## Deployment Architecture

### Environments

**Three-tier deployment:**

1. **Development (Local):**
   ```bash
   npm run dev
   # Runs Miniflare on http://localhost:8787
   # Uses local KV simulation
   ```

2. **Staging (Cloudflare):**
   ```bash
   wrangler deploy --env staging
   # URL: https://cloudflare-redirect-staging.workers.dev
   # Uses staging KV namespace
   # GA4 test property
   ```

3. **Production (Cloudflare):**
   ```bash
   wrangler deploy --env production
   # URL: https://redirect.yourdomain.com (custom domain)
   # Uses production KV namespace
   # GA4 production property
   ```

### wrangler.toml Configuration

```toml
name = "cloudflare-redirect"
main = "src/index.ts"
compatibility_date = "2025-10-24"

# Development (local)
[[kv_namespaces]]
binding = "REDIRECT_KV"
id = "local-kv-preview-id"
preview_id = "local-kv-preview-id"

[env.staging]
name = "cloudflare-redirect-staging"
vars = {
  DEFAULT_REDIRECT_URL = "https://staging.example.com",
  GA4_MEASUREMENT_ID = "G-STAGING123",
  ENVIRONMENT = "staging"
}
[[env.staging.kv_namespaces]]
binding = "REDIRECT_KV"
id = "staging-kv-namespace-id"

[env.production]
name = "cloudflare-redirect-production"
vars = {
  DEFAULT_REDIRECT_URL = "https://example.com",
  GA4_MEASUREMENT_ID = "G-PROD456",
  ENVIRONMENT = "production"
}
[[env.production.kv_namespaces]]
binding = "REDIRECT_KV"
id = "production-kv-namespace-id"
```

### CI/CD Pipeline (GitHub Actions - Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main        # Production
      - staging     # Staging

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: npx wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Development Environment

### Prerequisites

**Required:**
- **Node.js** v20+ (LTS)
- **npm** v10+ (included with Node.js)
- **Wrangler CLI** v3+ (installed via npm)
- **Cloudflare Account** (free tier)

**Optional (Recommended):**
- **Git** for version control
- **VS Code** with TypeScript extension
- **Prettier** extension for code formatting

### Setup Commands

```bash
# 1. Initialize project with Hono starter
npm create hono@latest cloudflareRedirect -- --template cloudflare-workers
cd cloudflareRedirect

# 2. Install dependencies
npm install

# 3. Install additional dependencies
npm install zod @hono/zod-validator
npm install -D vitest @cloudflare/workers-types

# 4. Configure Wrangler (first time only)
npx wrangler login

# 5. Create KV namespace (development)
npx wrangler kv:namespace create REDIRECT_KV
npx wrangler kv:namespace create REDIRECT_KV --preview

# 6. Update wrangler.toml with KV namespace IDs (output from step 5)

# 7. Set secrets (for staging/production)
npx wrangler secret put GA4_API_SECRET --env staging
npx wrangler secret put GA4_API_SECRET --env production

# 8. Start local development server
npm run dev
# Server runs at http://localhost:8787

# 9. Run tests
npm run test

# 10. Deploy to staging
npx wrangler deploy --env staging

# 11. Deploy to production
npx wrangler deploy --env production
```

### Testing Locally

```bash
# Unit + Integration tests
npm run test

# Test with coverage
npm run test -- --coverage

# Test specific file
npm run test src/lib/validation.test.ts

# Watch mode (re-run on file changes)
npm run test -- --watch
```

### Local Development Testing

```bash
# Start dev server
npm run dev

# Test redirect endpoint
curl "http://localhost:8787/r?to=https://example.com"
# Should return: 302 redirect

# Test debug mode
curl "http://localhost:8787/r?to=https://example.com&debug=1"
# Should return: JSON with destination and tracking params

# Test legacy bootstrap
curl "http://localhost:8787/#https://example.com"
# Should return: HTML that upgrades to /r?to=...
```

## Architecture Decision Records (ADRs)

### ADR-001: Use Hono Framework over Plain Workers

**Status:** Accepted
**Date:** 2025-10-24
**Decision Maker:** vanTT (with architect recommendation)

**Context:**
- Service needs multiple endpoints (/r, /, future admin API)
- TypeScript type safety is critical for team consistency
- Performance must meet sub-5ms requirement

**Decision:**
Use Hono v4.10+ as the web framework instead of plain Cloudflare Workers.

**Rationale:**
- Ultra-fast RegExpRouter (~14KB bundle overhead acceptable)
- Built-in middleware (logger, error handling, CORS)
- Type-safe context (c.env, c.req, c.json)
- Excellent TypeScript support with type inference
- Official Cloudflare partnership and documentation
- Simplifies multi-endpoint routing vs manual URL parsing

**Consequences:**
- Cleaner code structure with route handlers
- Built-in request/response logging
- Type-safe environment bindings
- +14KB bundle size (acceptable for DX benefits)
- Team needs to learn Hono API (minimal learning curve)

---

### ADR-002: JSON Objects in KV (not simple strings)

**Status:** Accepted
**Date:** 2025-10-24
**Decision Maker:** vanTT (with architect recommendation)

**Context:**
- PRD mentions future admin UI (separate project)
- Need to store 301 vs 302 redirect type (FR1)
- May need metadata like creation date, hit tracking, expiry

**Decision:**
Store RedirectData as JSON objects in KV, not simple string values.

**Rationale:**
- KV's `.get(key, 'json')` auto-parses efficiently
- ~1ms JSON parse overhead still within sub-5ms budget
- Extensible for future features (hits, expiry, tags)
- 301/302 redirect type needs to be stored per-link
- Admin UI will need metadata for management features

**Consequences:**
- Future-proof data structure
- Can add fields without migration
- Structured data easier to debug
- ~1ms parse overhead (acceptable)
- Larger storage size (~100 bytes vs ~50 bytes)

---

### ADR-003: Direct GA4 Measurement Protocol (not GTM Server-Side)

**Status:** Accepted
**Date:** 2025-10-24
**Decision Maker:** vanTT (with architect recommendation)

**Context:**
- PRD requires tracking BEFORE redirect (NFR5)
- PRD mentions "GTM/GA4 data layer" but doesn't specify implementation
- Need reliable tracking with timeout protection

**Decision:**
Use GA4 Measurement Protocol directly with 2-second timeout, not GTM server-side container.

**Rationale:**
- Simpler implementation (no GTM server-side infrastructure)
- Direct control over payload structure
- Easier to test and validate tracking
- 2-second timeout protects performance (PRD sub-5ms goal)
- Failed tracking logs to Cloudflare dashboard for monitoring
- Can migrate to GTM later if business needs change

**Consequences:**
- Zero extra infrastructure costs
- Direct control over tracking payload
- Easier debugging and testing
- Must maintain GA4 payload structure in code
- No GTM tag management flexibility (acceptable for redirect service)

---

### ADR-004: Vitest + Miniflare over Jest

**Status:** Accepted
**Date:** 2025-10-24
**Decision Maker:** vanTT (with architect recommendation)

**Context:**
- PRD requires unit AND integration tests
- Testing KV interactions is critical
- Need accurate Cloudflare Workers runtime emulation

**Decision:**
Use Vitest v4.0 + Miniflare for all testing (unit + integration).

**Rationale:**
- Miniflare provides accurate Workers runtime (official Cloudflare tool)
- Vitest is ESM-native (works seamlessly with Wrangler)
- Fast parallel execution (4x faster than Jest in benchmarks)
- Can test KV bindings with real behavior
- Cloudflare officially recommends Vitest + Miniflare
- Hono documentation uses Vitest in examples

**Consequences:**
- Accurate integration tests with KV/bindings
- Fast test execution (parallel)
- No ESM transpilation issues (Jest problem)
- Team needs to learn Vitest API (similar to Jest)
- Smaller ecosystem than Jest (acceptable trade-off)

---

### ADR-005: Type-Safe Environment Bindings

**Status:** Accepted
**Date:** 2025-10-24
**Decision Maker:** vanTT (with architect recommendation)

**Context:**
- Need to manage GA4 secrets, KV bindings, config vars
- Multi-environment deployment (dev/staging/prod)
- Type safety critical for preventing runtime errors

**Decision:**
Define TypeScript type for all environment bindings, use Wrangler's official env var system.

**Rationale:**
- Type safety prevents typos in env var access (e.g., `c.env.GA4_SECRE` ? compile error)
- Clear separation: public vars in wrangler.toml, secrets via CLI
- Multi-environment support built into Wrangler
- Hono's generic type system works perfectly with this pattern
- Official Cloudflare Workers TypeScript convention

**Consequences:**
- Compile-time errors for missing env vars
- IDE autocomplete for environment variables
- Clear documentation of all required config
- Must update types when adding new env vars (acceptable)
- Secrets must be set via CLI (can't be in git - security benefit)

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2025-10-24_
_For: vanTT_
_Project: cloudflareRedirect (Level 2 Greenfield Software)_




