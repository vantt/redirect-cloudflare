# Story 1.3: Basic /r Endpoint with Redirect Logic

Status: Review Passed

## Story

As an end user,
I want the `/r` endpoint to redirect me to the destination URL,
so that I can access target pages through short URLs.

## Acceptance Criteria

1. GET `/r?to=<url>` endpoint implemented in `routes/redirect.ts`
2. Endpoint validates `to` parameter exists (throws error if missing)
3. Endpoint performs URL decoding on `to` parameter
4. Endpoint returns HTTP 302 redirect with `Location` header set to destination
5. Response includes `Cache-Control: no-cache` header
6. Integration test verifies: request to `/r?to=https://example.com` returns 302 with correct Location header
7. Integration test verifies: request without `to` parameter returns 400 error
8. Endpoint handles URL-encoded destinations correctly (e.g., `%20` for spaces)

## Tasks / Subtasks

- [x] Implement AC #1: Create `/r` endpoint in `routes/redirect.ts`
  - [x] Create `src/routes/` directory if not exists
  - [x] Create `redirect.ts` file with Hono route handler
  - [x] Set up GET route: `app.get('/', async (c) => {...})`
  - [x] Extract `to` parameter from query: `c.req.query('to')`
- [x] Implement AC #2: Validate `to` parameter exists
  - [x] Check if `to` parameter is undefined or empty
  - [x] Return error response with 400 status if missing
  - [x] Error message: "Missing required parameter: to"
- [x] Implement AC #3: Perform URL decoding
  - [x] Decode `to` parameter using `decodeURIComponent()`
  - [x] Handle URL-encoded characters (%20, %3A, etc.)
- [x] Implement AC #4-5: Return 302 redirect with correct headers
  - [x] Use custom redirect response with 302 status
  - [x] Set `Cache-Control: no-cache` response header
- [x] Implement AC #6-8: Write comprehensive tests
  - [x] Integration test: `/r?to=https://example.com` returns 302 with Location header
  - [x] Integration test: `/r` (no `to` parameter) returns 400 error
  - [x] Integration test: URL-encoded destination (`%20` for spaces) works correctly
  - [x] Integration test: Special characters in URLs decoded properly
- [x] Register route in `src/index.ts`
  - [x] Import redirect route handler
  - [x] Register with Hono app

## Dev Notes

### Architecture Patterns

**Hono Routing Pattern (from architecture.md):**
```typescript
// routes/redirect.ts
import { Hono } from 'hono'
import type { Env } from '../types/env'
import { RedirectError } from '../lib/errors'

const app = new Hono<{ Bindings: Env['Bindings'] }>()

app.get('/r', async (c) => {
  const to = c.req.query('to')

  if (!to) {
    throw new RedirectError('Missing destination parameter', 400, 'MISSING_PARAM')
  }

  const destination = decodeURIComponent(to)

  return c.redirect(destination, 302, {
    'Cache-Control': 'no-cache'
  })
})

export default app
```

**Architectural Decisions:**
- Use Hono's `c.req.query()` for query parameter extraction
- HTTP 302 (temporary) redirect as default (Story 1.5 will add 301 support based on KV data)
- `Cache-Control: no-cache` prevents caching of redirect responses
- URL decoding via `decodeURIComponent()` handles encoded characters
- Error handling uses `RedirectError` class from Story 1.4 (prerequisite)

**Testing Standards:**
- Use Vitest + Miniflare for integration tests
- Test file location: `test/routes/redirect.test.ts`
- Cover success paths (valid redirect) and error paths (missing parameter)
- Verify HTTP status codes and response headers

### Project Structure Notes

**Files to Create:**
- `cloudflareRedirect/src/routes/redirect.ts` - /r endpoint route handler
- `cloudflareRedirect/test/routes/redirect.test.ts` - Integration tests

**Files to Modify:**
- `cloudflareRedirect/src/index.ts` - Register redirect route

**Directory Structure:**
```
cloudflareRedirect/
├── src/
│   ├── index.ts                 # Main entry - register routes here
│   ├── routes/
│   │   └── redirect.ts          # New: /r endpoint
│   ├── lib/
│   │   ├── kv-store.ts          # From Story 1.2
│   │   └── errors.ts            # From Story 1.4 (prerequisite)
│   └── types/
│       └── env.ts               # From Story 1.1
└── test/
    └── routes/
        └── redirect.test.ts     # New: Integration tests
```

### References

**Source Documents:**
- [Source: docs/epics.md#Story 1.3] - Acceptance criteria and story definition
- [Source: docs/architecture.md#Hono Routing Pattern] - Framework usage and route handler pattern
- [Source: docs/architecture.md#API Contracts] - `/r` endpoint specification
- [Source: docs/prd.md#FR1] - Server-side redirects requirement

**Prerequisites:**
- Story 1.1 (Project initialization with Hono framework) - COMPLETED
- Story 1.4 (Custom error classes and global error handler) - REQUIRED (create RedirectError class first)

**Note:** Story 1.4 is a prerequisite for proper error handling. If not yet implemented, this story should throw standard Error temporarily and update to RedirectError once Story 1.4 is complete.

## Change Log

| Date       | Change                                    | Agent |
|------------|-------------------------------------------|-------|
| 2025-10-25 | Initial draft                              | SM    |
| 2025-10-25 | Implementation completed - all ACs met    | Dev   |

## Dev Agent Record

### Context Reference

- docs/stories/story-context-1.3.xml

### Agent Model Used

### Debug Log References

### Completion Notes List

- Implemented `/r` endpoint with proper parameter validation and URL decoding
- Fixed routing issue where `/r` was mounted incorrectly, causing `/r/r` path
- Added comprehensive integration tests covering all acceptance criteria
- Used custom error response approach instead of RedirectError (Story 1.4 prerequisite)

### File List

- `cloudflareRedirect/src/routes/redirect.ts` - Main redirect endpoint implementation
- `cloudflareRedirect/src/index.ts` - Updated to register redirect route
- `cloudflareRedirect/test/integration/redirect-endpoint.test.ts` - Integration tests
- `cloudflareRedirect/test/redirect.test.ts` - Additional redirect tests


## Merged Addendum

- Source reconciliation: This story was also drafted in `docs/stories/1.3-basic-r-endpoint-with-redirect-logic.md`.
- Primary version retained: this file (`docs/stories/story-1.3.md`).
- Previous status record from alternate draft: Done.

Additional notes preserved from the alternate draft:
- Dependencies and testing approach align with project standards (Vitest + Miniflare integration tests; strict TypeScript config).
- Development summary confirmed: implemented endpoint, parameter validation, URL decoding, proper 302 redirect and headers; tests covering success and error paths.

All future references should use: `docs/stories/story-1.3.md`.

## Senior Developer Review (AI)

**Reviewer:** vanTT  
**Date:** 2025-10-25  
**Outcome:** Approve

### Summary

Story 1.3 implementation meets all acceptance criteria and follows architectural patterns. The `/r` endpoint correctly handles parameter validation, URL decoding, and HTTP 302 redirects with proper headers. Implementation demonstrates clean separation of concerns with utility functions and comprehensive test coverage.

### Key Findings

**High Severity:** None  
**Medium Severity:** None  
**Low Severity:** None

All critical functionality is implemented correctly and securely.

### Acceptance Criteria Coverage

✅ **AC #1:** GET `/r?to=<url>` endpoint implemented in `routes/redirect.ts` - COMPLETE  
✅ **AC #2:** Endpoint validates `to` parameter exists with proper 400 error - COMPLETE  
✅ **AC #3:** Endpoint performs URL decoding using `decodeURIComponent()` - COMPLETE  
✅ **AC #4:** Endpoint returns HTTP 302 redirect with `Location` header - COMPLETE  
✅ **AC #5:** Response includes `Cache-Control: no-cache` header - COMPLETE  
✅ **AC #6:** Integration test verifies redirect with Location header - COMPLETE  
✅ **AC #7:** Integration test verifies 400 error for missing parameter - COMPLETE  
✅ **AC #8:** Endpoint handles URL-encoded destinations correctly - COMPLETE  

### Test Coverage and Gaps

**Complete Coverage:** All acceptance criteria have corresponding integration tests
- Valid redirect scenarios with header verification
- Error scenarios for missing parameters
- URL encoding/decoding edge cases
- Malformed URL encoding error handling

**No gaps identified** - test coverage is comprehensive and covers both success and failure paths.

### Architectural Alignment

✅ **Framework Usage:** Correctly uses Hono framework patterns as specified in architecture  
✅ **Code Organization:** Follows established project structure with routes in dedicated directory  
✅ **TypeScript:** Implements proper typing and error handling  
✅ **Performance:** Minimal overhead approach suitable for Cloudflare Workers edge execution  

### Security Notes

✅ **Input Validation:** Proper validation of `to` parameter with error handling  
✅ **Open Redirect Prevention:** Basic validation through URL decoding error handling  
✅ **Error Disclosure:** Error messages are informative but not overly detailed  

**Recommendation:** Consider adding domain validation in Story 6.2 as specified in epic plan.

### Best-Practices and References

- Hono Framework v4.4+ patterns followed correctly
- TypeScript strict mode compliance maintained  
- Cloudflare Workers best practices for edge computing
- URL encoding standards (RFC 3986) properly implemented
- HTTP redirect standards (302 temporary redirect) correctly applied

### Action Items

None - implementation is approved as complete.

## Change Log
