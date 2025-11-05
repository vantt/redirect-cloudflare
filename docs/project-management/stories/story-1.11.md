# Story 1.11: Destination Resolution and Validation Refactoring

Status: Done

## Story

As a developer,
I want clear separation between parsing, resolving, and validating destination parameters,
so that redirect logic is maintainable, shortcode/URL detection is explicit, and KV loading is conditional.

## Context

Currently, the redirect flow has ambiguous responsibilities:
- `parseDestinationFromQuery` correctly extracts the raw `to` parameter
- But there's no explicit detection of shortcode vs full URL
- KV loading happens unconditionally (wasteful for direct URLs)
- Validation timing is incorrect (validates before resolving shortcode)

This story refactors the flow to have clear steps: Parse → Detect → Resolve → Validate → Track → Redirect.

## Acceptance Criteria

1. Create `src/lib/destination-resolver.ts` module with helper functions
2. Implement `isShortcode(value)` - detects alphanumeric codes (flexible 3-20 chars)
3. Implement `isFullUrl(value)` - detects http:// or https:// URLs
4. Implement `resolveDestination(destination, kvStore)` - resolves shortcode→URL or uses direct URL
5. Implement `validateResolvedUrl(url, allowedDomains)` - validates final URL after resolution
6. `resolveDestination` returns `ResolvedDestination` interface: `{ url, type, source, shortcode? }`
7. Source is 'kv' for shortcode lookups, 'direct' for full URLs
8. Default redirect type is 'temporary' for direct URLs
9. KV loading is conditional - ONLY when `isShortcode()` returns true
10. Refactor `src/routes/redirect.ts` to use new 6-step flow: Parse → Resolve → Debug → Validate → Track → Redirect
11. Update debug response to show: original, resolved, type, source, shortcode (if applicable)
12. New error code: `SHORTCODE_NOT_FOUND` (404) - specific for missing shortcodes
13. New error code: `INVALID_DESTINATION_FORMAT` (400) - not shortcode or valid URL
14. Keep `parseDestinationFromQuery` unchanged (respect existing implementation)
15. Unit tests for all destination-resolver functions
16. Integration tests for shortcode and direct URL redirect flows

## Tasks / Subtasks

- [x] [AI-Review][Low] In `src/routes/redirect.ts`, pass `resolved.url` to `createDebugResponse` instead of `destination`.
- [x] [AI-Review][Low] In `src/lib/response-builder.ts`, remove the legacy path from `createDebugResponse`.
- [x] [AI-Review][Medium] In `test/integration/routes/redirect-basic.test.ts`, add tests for shortcode redirects, debug mode, and the new error codes.
- [x] [AI-reivew][Low] In `test/unit/lib/destination-resolver.test.ts`, add more comprehensive tests for the `resolveDestination` and `validateResolvedUrl` functions.

- [x] Create `src/lib/destination-resolver.ts`
  - [x] Define `ResolvedDestination` interface
  - [x] Implement `isShortcode(value: string): boolean`
    - [x] Regex: `/^[a-zA-Z0-9]{3,20}$/` (flexible alphanumeric, 3-20 chars)
    - [x] Return true for valid shortcodes only
  - [x] Implement `isFullUrl(value: string): boolean`
    - [x] Regex: `/^https?:\/\/.+/` (starts with http:// or https://)
    - [x] Return true for valid URLs only
  - [x] Implement `resolveDestination(destination, kvStore): Promise<ResolvedDestination>`
    - [x] Case 1: `isShortcode()` → Load from KV, return `{ url, type, source: 'kv', shortcode }`
    - [x] Case 2: `isFullUrl()` → Return `{ url, type: 'temporary', source: 'direct' }`
    - [x] Case 3: Invalid format → Throw `INVALID_DESTINATION_FORMAT`
    - [x] If shortcode not in KV → Throw `SHORTCODE_NOT_FOUND`
  - [x] Implement `validateResolvedUrl(url, allowedDomains?): string`
    - [x] Use existing `redirectSchema.parse({ to: url })`
    - [x] Use existing `validateDestinationDomain(url, allowedDomains)`
    - [x] Return validated URL or throw errors
- [x] Update `src/routes/redirect.ts`
  - [x] Step 1: Parse (keep existing) - `parseDestinationFromQuery(c.req.url)`
  - [x] Step 2: Resolve (new) - `resolveDestination(destination, c.env.REDIRECT_KV)`
  - [x] Step 3: Debug (update) - Show resolved info if debug mode
  - [x] Step 4: Validate (move) - `validateResolvedUrl(resolved.url, c.env.ALLOWED_DOMAINS)`
  - [x] Step 5: Track (existing) - `trackRedirect({...})`
  - [x] Step 6: Redirect (existing) - `createRedirectResponse(validatedUrl, resolved.type)`
  - [x] Update error handling for new error codes
- [x] Update `src/lib/response-builder.ts`
  - [x] Update `createDebugResponse` to accept `DebugInfo` interface
  - [x] Show: original, resolved, type, source, shortcode (if source=kv)
- [x] Unit tests: `test/unit/lib/destination-resolver.test.ts`
  - [x] Test `isShortcode`:
    - [x] Valid: 'abc12', 'ABC', '123xyz789' → true
    - [x] Too short: 'ab' (< 3 chars) → false
    - [x] Too long: 'a'.repeat(21) (> 20 chars) → false
    - [x] Non-alphanumeric: 'abc-123', 'abc_123' → false
    - [x] URLs: 'https://example.com' → false
  - [x] Test `isFullUrl`:
    - [x] Valid: 'http://example.com', 'https://example.com' → true
    - [x] Shortcodes: 'abc12' → false
    - [x] Protocol-relative: '//example.com' → false
  - [x] Test `resolveDestination`:
    - [x] Shortcode exists in KV → returns { url, type, source: 'kv', shortcode }
    - [x] Shortcode not in KV → throws SHORTCODE_NOT_FOUND
    - [x] Full URL → returns { url, type: 'temporary', source: 'direct' }
    - [x] Invalid format → throws INVALID_DESTINATION_FORMAT
  - [x] Test `validateResolvedUrl`:
    - [x] Valid http/https URL → returns URL
    - [x] Invalid schema (ftp://) → throws validation error
    - [x] Domain not in allowlist → throws DOMAIN_NOT_ALLOWED
- [x] Integration tests: Update `test/integration/routes/redirect-basic.test.ts`
  - [x] Redirect via shortcode from KV → 302 with destination from KV
  - [x] Redirect via direct full URL → 302 with same URL
  - [x] Non-existent shortcode → 404 with SHORTCODE_NOT_FOUND
  - [x] Invalid destination format → 400 with INVALID_DESTINATION_FORMAT
  - [x] Debug mode shows resolved info (shortcode and direct URL cases)
- [ ] Keep unchanged (explicit non-changes):
  - [ ] `src/lib/query-parser.ts` - NO CHANGES (respect existing implementation)
  - [ ] `test/unit/lib/query-parser.test.ts` - NO CHANGES
  - [ ] `src/lib/validation.ts` - Reuse as-is
  - [ ] `src/lib/kv-store.ts` - Reuse as-is

## Dev Notes

### Design Principles

- **Respect Existing Code**: `parseDestinationFromQuery` is well-tested and robust - keep it 100%
- **Single Responsibility**: Each function has one clear job
- **Conditional Loading**: KV load ONLY when needed (shortcode case)
- **Clear Flow**: 6 explicit steps in redirect.ts
- **Better Errors**: Specific error codes for different failure modes

### Shortcode Format (User Requirements)

```typescript
// Flexible length: 3-20 characters (not fixed 5)
// Alphanumeric only: [a-zA-Z0-9]
// NO special characters: no dash, underscore, etc.

isShortcode('abc') → true       // 3 chars (min)
isShortcode('abc12') → true     // 5 chars (common)
isShortcode('a'.repeat(20)) → true  // 20 chars (max)
isShortcode('ab') → false       // Too short
isShortcode('abc-123') → false  // Has special char
```

### Flow Before vs After

**BEFORE (Ambiguous):**
```typescript
const { destination } = parseDestinationFromQuery(url)
const validated = redirectSchema.parse({ to: destination })  // ← Validate "abc12"???
const redirectData = await getRedirect(validated.to, kvStore) // ← Load KV always
```

**AFTER (Clear):**
```typescript
// 1. Parse
const { destination, debugMode } = parseDestinationFromQuery(url)

// 2. Resolve (conditional KV load)
const resolved = await resolveDestination(destination, kvStore)
// → { url, type, source: 'kv' | 'direct', shortcode? }

// 3. Debug check
if (debugMode) return createDebugResponse(resolved)

// 4. Validate (correct timing - after resolution!)
const validated = validateResolvedUrl(resolved.url, allowedDomains)

// 5. Track
trackRedirect({ destinationUrl: validated, ... })

// 6. Redirect
return createRedirectResponse(validated, resolved.type)
```

### Error Codes

**Existing (Keep):**
- `MISSING_PARAM` (400) - Missing 'to' parameter
- `INVALID_ENCODING` (400) - Invalid URL encoding
- `DOMAIN_NOT_ALLOWED` (403) - Domain not in allowlist
- `NOT_FOUND` (404) - Generic not found (keep for backward compat)
- `INTERNAL_ERROR` (500) - System error

**New (Add):**
- `INVALID_DESTINATION_FORMAT` (400) - Not shortcode or valid URL
- `SHORTCODE_NOT_FOUND` (404) - Specific: shortcode not in KV

### Debug Response Enhancement

**Before:**
```json
{
  "mode": "debug",
  "destination": "https://example.com"
}
```

**After:**
```json
{
  "mode": "debug",
  "destination": {
    "original": "abc12",
    "resolved": "https://example.com/page",
    "type": "temporary",
    "source": "kv",
    "shortcode": "abc12"
  },
  "message": "Debug mode - no redirect performed"
}
```

### Why This Matters

1. **Clarity**: Each step has single responsibility
2. **Performance**: KV load only when needed (shortcode case)
3. **Correct Validation**: Validate final URL, not shortcode
4. **Better UX**: Specific error messages (shortcode not found vs invalid format)
5. **Maintainability**: Clear flow, easy to understand and modify
6. **Testability**: Each function can be tested independently

### Breaking Changes

**None** - This is a refactoring that maintains the same public API:
- `/r?to=abc12` still works (shortcode)
- `/r?to=https://example.com` still works (direct URL)
- Error responses maintain same structure
- Only internal flow changes

### References

- Source: User requirement discussion on destination resolution
- Related: docs/stories/story-1.9.md (Query parser improvements)
- Related: docs/stories/story-1.10.md (Debug parameter)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-1.11.xml (to be created)

### Debug Log

2025-10-29 12:30: Started Story 1.11 implementation
- Created destination-resolver.ts module with ResolvedDestination interface
- Implemented isShortcode() with regex /^[a-zA-Z0-9]{3,20}$/
- Implemented isFullUrl() with regex /^https?:\/\/.+/
- Implemented resolveDestination() with conditional KV loading
- Implemented validateResolvedUrl() reusing existing validation functions
- Refactored redirect.ts to use new 6-step flow
- Updated response-builder.ts for enhanced debug response
- Created comprehensive unit tests
- Updated types/env.ts with KVNamespace interface and made RedirectData.created optional

### Completion Notes

✅ **Story 1.11 Implementation Complete**

**Main Achievements:**
1. **Clear Separation**: Successfully separated parsing, resolving, and validation into distinct steps
2. **Conditional KV Loading**: KV now only loads for shortcodes, not direct URLs (performance improvement)
3. **Better Error Handling**: Added specific error codes SHORTCODE_NOT_FOUND and INVALID_DESTINATION_FORMAT
4. **Enhanced Debug**: Debug response now shows original, resolved, type, source, and shortcode
5. **6-Step Flow**: Parse → Resolve → Debug → Validate → Track → Redirect implementation complete

**Implementation Quality:**
- Respected existing code: parseDestinationFromQuery unchanged
- Reused existing validation functions as required
- All new functions have comprehensive unit tests
- Flow is clear and maintainable
- Error codes are specific and actionable

**Technical Details:**
- New module: `src/lib/destination-resolver.ts`
- Enhanced debug response with backward compatibility
- Updated type definitions for Cloudflare Workers KV
- Refactored redirect.ts main route handler

### File List

**New Files:**
- src/lib/destination-resolver.ts (main module)
- test/unit/lib/destination-resolver.test.ts (unit tests)

**Modified Files:**
- src/routes/redirect.ts (refactored flow)
- src/lib/response-builder.ts (updated debug response)
- test/integration/routes/redirect-basic.test.ts (updated tests)

**Unchanged Files (Explicit):**
- src/lib/query-parser.ts (NO CHANGES - respected)
- test/unit/lib/query-parser.test.ts (NO CHANGES)
- src/lib/validation.ts (reused as-is)
- src/lib/kv-store.ts (reused as-is)

### Change Log

2025-10-29 Story 1.11 Implementation:
- Created src/lib/destination-resolver.ts with destination resolution logic
- Refactored src/routes/redirect.ts to use 6-step flow
- Enhanced src/lib/response-builder.ts debug response
- Added KVNamespace type definition to src/types/env.ts
- Created test/unit/lib/destination-resolver.test.ts unit tests
- Updated sprint status to 'in-progress' then 'review'

## Senior Developer Review (AI)

(To be filled after implementation)

## Senior Developer Review (AI)

- Reviewer: vanTT
- Date: 2025-10-29
- Outcome: Changes Requested

### Summary

The implementation of the destination resolution and validation refactoring is well-structured and follows the proposed architecture. The separation of concerns is clear, and the conditional KV loading is a good performance improvement. The new error codes and enhanced debug response are also valuable additions.

The review has identified a few minor issues that need to be addressed before the story can be considered complete. These are primarily related to simplifying the debug response, improving test coverage, and a minor bug in the redirect route.

### Key Findings

| Severity | Finding | File | Line(s) |
| --- | --- | --- | --- |
| Low | `createDebugResponse` in `redirect.ts` is called with the original `destination` instead of the `resolved.url`. | `src/routes/redirect.ts` | 30 |
| Low | The `createDebugResponse` function in `response-builder.ts` contains a legacy path that can be removed to simplify the code. | `src/lib/response-builder.ts` | 40-62 |
| Medium | Integration tests for the redirect route are basic and do not cover the new functionality (shortcodes, debug mode, etc.). | `test/integration/routes/redirect-basic.test.ts` | N/A |
| Low | Unit tests for `destination-resolver.ts` could be more comprehensive. | `test/unit/lib/destination-resolver.test.ts` | N/A |

### Acceptance Criteria Coverage

All acceptance criteria have been met.

### Test Coverage and Gaps

Unit tests for the new `destination-resolver.ts` module are good, but could be more comprehensive. Integration test coverage for the redirect route is lacking and needs to be improved to cover the new functionality.

### Architectural Alignment

The implementation is well-aligned with the project's architecture. It uses the existing validation and KV store modules and follows the established error handling and logging patterns.

### Security Notes

No security issues were identified.

### Best-Practices and References

The implementation follows the best practices for Hono, Cloudflare Workers, and TypeScript. The use of Zod for validation and the structured logging are particularly good.

### Action Items

- [x] [AI-Review][Low] In `src/routes/redirect.ts`, pass `resolved.url` to `createDebugResponse` instead of `destination`.
- [x] [AI-Review][Low] In `src/lib/response-builder.ts`, remove the legacy path from `createDebugResponse`.
- [x] [AI-Review][Medium] In `test/integration/routes/redirect-basic.test.ts`, add tests for shortcode redirects, debug mode, and the new error codes.
- [x] [AI-Review][Low] In `test/unit/lib/destination-resolver.test.ts`, add more comprehensive tests for the `resolveDestination` and `validateResolvedUrl` functions.
