# Story 3.1: Client-Side Bootstrap HTML at Root Endpoint

Status: Done

## Story

As a user with a legacy `/#destination` URL,
I want the root endpoint to detect my fragment-based URL and upgrade me to the server-side redirect,
so that my existing bookmarks and links continue to work without manual updates.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Task 1: Create bootstrap route file structure (AC: 1)
  - [x] Create `routes/bootstrap.ts` file
  - [x] Export GET `/` endpoint handler
  - [x] Import and register route in main `src/index.ts`
- [x] Task 2: Implement HTML response for hash detection (AC: 2, 3, 4)
  - [x] Create minimal HTML template with meta robots tag
  - [x] Add inline JavaScript (<2KB) for hash extraction
  - [x] Implement query parameter reading logic
  - [x] Add noscript fallback message
- [x] Task 3: Implement upgrade logic (AC: 3, 5)
  - [x] Parse destination URL from `window.location.hash`
  - [x] Construct `/r?to=...` URL with proper encoding
  - [x] Handle `isNoRedirect` parameter mapping to `n` parameter
  - [x] Add fallback to `DEFAULT_REDIRECT_URL` when no hash present
  - [x] Execute `window.location.replace()` for upgrade
- [x] Task 4: Add response headers and error handling (AC: 8)
  - [x] Set `Cache-Control: no-cache` headers
  - [x] Add basic error handling for malformed URLs
- [x] Task 5: Create integration tests (AC: 6, 7)
  - [x] Test hash URL upgrade: `GET /#https://example.com`
  - [x] Test default redirect: `GET /` (no hash)
  - [x] Test query parameter preservation
  - [x] Test special characters in destination URLs
- [x] Task 6: Update project configuration
  - [x] Add `DEFAULT_REDIRECT_URL` to environment bindings
  - [x] Update TypeScript types in `src/types/env.ts`

## Dev Notes

### Architecture Constraints
- Must integrate with existing Hono routing structure [Source: architecture.md#Project Structure]
- HTML response should be minimal (<2KB) for performance [Source: epics.md#Story 3.1]
- JavaScript must be inline to avoid additional requests [Source: epics.md#Story 3.1]
- Bootstrap endpoint maps to `routes/bootstrap.ts` component [Source: architecture.md#Epic to Architecture Mapping]

### Project Structure Notes
- Create `routes/bootstrap.ts` following existing pattern from `routes/redirect.ts`
- Register route in main `src/index.ts` Hono app
- Add `DEFAULT_REDIRECT_URL` environment variable to `src/types/env.ts`
- Tests should go in `test/routes/bootstrap.test.ts` following existing pattern

### Technical Requirements
- Use Hono `c.html()` method for HTML response
- Implement proper URL encoding with `encodeURIComponent()`
- Handle edge cases: empty hash, malformed URLs, special characters
- Follow existing error handling patterns using `RedirectError` class

### Testing Standards
- Integration tests using Vitest + Miniflare framework [Source: architecture.md#Testing Strategy]
- Test coverage for both happy path and edge cases
- Tests should verify HTML content structure and JavaScript logic
- Performance tests to ensure <2KB HTML size

### References
- [Source: epics.md#Story 3.1] - Complete story requirements and acceptance criteria
- [Source: architecture.md#Project Structure] - File structure and component locations
- [Source: architecture.md#Epic to Architecture Mapping] - Component mapping for Epic 3
- [Source: architecture.md#Technology Stack Details] - Hono framework usage patterns

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->
- story-context-3.1.xml

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- cloudflareRedirect/src/routes/bootstrap.ts (new)
- cloudflareRedirect/src/index.ts (modified)
- cloudflareRedirect/src/types/env.ts (modified)
- cloudflareRedirect/test/bootstrap.test.ts (new)