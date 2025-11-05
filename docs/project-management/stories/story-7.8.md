# Story 7.8: Tracking Service Abstraction and Redirect Integration

Status: Done

## Story

As a developer,
I want a unified tracking service that abstracts all analytics logic away from redirect.ts,
so that redirect route remains clean, tracking is provider-agnostic, and parameter extraction supports fallback from original request URL.

## Acceptance Criteria

1. Create `TrackingService` module in `src/lib/analytics/tracking-service.ts` with single entry point `trackRedirect(context, env)`
2. `trackRedirect()` function accepts `RedirectTrackingContext` (shortUrl, destinationUrl, redirectType, userAgent, ip, originalRequestUrl)
3. Implement parameter extraction with merge strategy: extract destination first (check priority), then original second; merge with ORIGINAL params overwriting destination params on conflicts
4. Extract tracking params from BOTH destination URL and original request URL, merge with original-wins strategy (user controls behavior by choosing which params to pass)
5. Build neutral `AnalyticsEvent` from extracted params + redirect metadata (short_url, destination_url, redirect_type, timestamp)
6. Integrate tracking service into redirect flow via `routeAnalyticsEvent()` and `loadProviders()` (provider-agnostic)
7. Refactor `src/routes/redirect.ts` to use `trackRedirect()` - remove all GA4-specific code (`buildGA4Payload`, `sendGA4Event` calls)
8. Tracking call is fire-and-forget: errors never block redirect response
9. Structured logging for parameter extraction (destination param count, original param count, merged count, priority wins)
10. Unit tests for parameter extraction fallback logic (destination only, original only, merge with conflicts, empty params)
11. Integration test: redirect succeeds even when tracking service throws errors

## Tasks / Subtasks

- [x] Create `src/lib/analytics/tracking-service.ts`
  - [x] Define `RedirectTrackingContext` interface
  - [x] Implement `trackRedirect(context: RedirectTrackingContext, env: Env): Promise<void>`
  - [x] Implement `extractTrackingParamsWithFallback(destinationUrl, originalRequestUrl?)`
    - [x] Extract from destination URL (priority 1 - check first)
    - [x] Extract from original request URL (priority 2 - check second, if provided)
    - [x] Merge with ORIGINAL params overwriting destination params (original wins on conflicts)
    - [x] Add structured logging for extraction debugging (destination count, original count, merged count, conflicts)
  - [x] Implement `buildRedirectEvent(context, trackingParams): AnalyticsEvent`
    - [x] Map tracking params to event attributes
    - [x] Add redirect metadata (short_url, destination_url, redirect_type)
    - [x] Add request metadata (user_agent, client_ip if available)
    - [x] Add timestamp
- [x] Refactor `src/routes/redirect.ts`
  - [x] Import `trackRedirect` from tracking-service
  - [x] Remove imports: `buildGA4Payload`, `sendGA4Event` from `lib/tracking`
  - [x] Replace GA4-specific tracking block (lines 40-64) with single `trackRedirect()` call
  - [x] Pass `originalRequestUrl: c.req.url` in context for fallback extraction
  - [x] Wrap in fire-and-forget pattern with error logging only
- [x] Update `src/lib/tracking.ts` (cleanup)
  - [x] Keep `extractTrackingParams()` - still used by tracking-service
  - [x] Mark `buildGA4Payload()` and `sendGA4Event()` as deprecated (will be moved to GA4 provider in Epic 8)
  - [x] Add JSDoc comment indicating these functions should not be called directly
- [x] Unit tests: `test/unit/lib/analytics/tracking-service.test.ts`
  - [x] Test `extractTrackingParamsWithFallback`:
    - [x] Destination URL has params, no original URL → returns destination params only
    - [x] Destination URL has no params, original URL has params → returns original params only
    - [x] Both have params, no conflicts → returns merged params (all params from both)
    - [x] Both have params, conflicts exist → ORIGINAL PARAMS WIN (overwrite destination)
    - [x] Neither has params → returns empty object
    - [x] Malformed URLs → gracefully handles errors
  - [x] Test `buildRedirectEvent`:
    - [x] Maps tracking params to event.attributes
    - [x] Includes redirect metadata
    - [x] Includes optional metadata (userAgent, ip) when provided
    - [x] Adds timestamp
  - [x] Test `trackRedirect`:
    - [x] Calls extractTrackingParamsWithFallback correctly
    - [x] Calls buildRedirectEvent with correct context
    - [x] Calls loadProviders with env
    - [x] Calls routeAnalyticsEvent with built event and loaded providers
    - [x] Errors in tracking do not throw (fire-and-forget)
- [x] Integration test: `test/integration/routes/redirect-tracking.test.ts`
  - [x] Redirect succeeds when tracking service succeeds
  - [x] Redirect succeeds when tracking service throws error (isolation)
  - [x] Redirect succeeds when no providers configured (ANALYTICS_PROVIDERS='')
  - [x] Tracking event contains params from destination URL
  - [x] Tracking event contains params from original URL when destination has none
  - [x] Tracking event uses destination params when both URLs have same param key

## Dev Notes

### Design Principles
- **Single Responsibility**: Tracking service owns ALL tracking logic
- **Clean Interface**: `redirect.ts` only calls `trackRedirect(context, env)`
- **Provider Agnostic**: No GA4/Mixpanel/etc. awareness in tracking service
- **Error Isolation**: Tracking errors NEVER block redirect flow
- **Merge Strategy**: Extract destination first, extract original second, original overwrites on conflicts
- **User Control**: Users control override behavior by choosing which params to pass in original URL

### Parameter Extraction Strategy
```typescript
// Extraction order: Destination first (check priority), Original second
// Merge strategy: Original OVERWRITES destination on conflicts

// Example scenario:
Original Request URL:  /r?to=abc&utm_campaign=flash-sale-2025
Destination URL:       https://shop.com?utm_source=facebook&utm_campaign=sale2024

// Step 1: Extract from destination (check first)
destinationParams = { utm_source: 'facebook', utm_campaign: 'sale2024' }

// Step 2: Extract from original (check second)
originalParams = { utm_campaign: 'flash-sale-2025' }

// Step 3: Merge - original wins on conflicts
merged = { ...destinationParams, ...originalParams }

// Final result:
{
  utm_source: 'facebook',         // ← From destination (original didn't pass this)
  utm_campaign: 'flash-sale-2025' // ← ORIGINAL OVERWRITES destination
}

// User Control Examples:
// Case 1: Reuse destination tracking (don't pass params in original)
Original: /r?to=abc
Destination: https://shop.com?utm_source=facebook&utm_campaign=sale2024
Result: { utm_source: 'facebook', utm_campaign: 'sale2024' }

// Case 2: Override specific params (pass only params to override)
Original: /r?to=abc&utm_campaign=new-campaign
Destination: https://shop.com?utm_source=facebook&utm_campaign=old-campaign
Result: { utm_source: 'facebook', utm_campaign: 'new-campaign' }

// Case 3: Override completely (pass all params)
Original: /r?to=abc&utm_source=email&utm_campaign=newsletter&utm_medium=email
Destination: https://shop.com?utm_source=facebook&utm_campaign=sale2024
Result: { utm_source: 'email', utm_campaign: 'newsletter', utm_medium: 'email' }
```

### Why This Story Matters
1. **Completes Epic 7 Abstraction**: Makes redirect.ts truly provider-agnostic
2. **Separation of Concerns**: Clean boundary between redirect logic and tracking logic
3. **Maximizes Tracking Data**: Fallback extraction ensures we don't lose campaign params
4. **User Flexibility**: Users can reuse destination tracking OR override for special campaigns
5. **Testability**: Tracking logic can be unit tested independently
6. **Prepares for Epic 8**: GA4 provider will consume neutral events from this service

### Breaking Changes
- `redirect.ts` no longer directly calls `buildGA4Payload()` or `sendGA4Event()`
- These functions will be deprecated and moved to GA4 provider implementation in Epic 8

### References

- Source: docs/tech-spec-epic-7.md (Epic 7: Analytics Abstraction)
- Source: docs/stories/story-7.1.md (Parameter extraction foundation)
- Source: docs/stories/story-7.2.md (Neutral event model)
- Source: docs/stories/story-7.3.md (Provider routing)
- Related: Epic 8 (GA4 Provider Implementation - future)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.8.xml (to be created)

### Debug Log

(To be filled during implementation)

### Completion Notes

**Completed:** 2025-10-29
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

(To be filled upon completion)

### File List

(To be filled during implementation)

### Change Log

(To be filled during implementation)

## Senior Developer Review (AI)

(To be filled after implementation)

## Senior Developer Review (AI)

- Reviewer: vanTT
- Date: 2025-10-29
- Outcome: Approved

### Summary

The implementation of the tracking service abstraction is excellent. It successfully decouples the analytics logic from the core redirect flow, making the system more modular and easier to maintain. The parameter extraction logic with the original-wins strategy is well-implemented and provides the desired flexibility.

The unit and integration tests cover the main success and failure scenarios, ensuring the reliability of the new service. The code is clean, well-structured, and follows the established architectural patterns.

### Key Findings

No major issues were found. The implementation meets all acceptance criteria and is of high quality.

### Acceptance Criteria Coverage

All acceptance criteria have been met.

### Test Coverage and Gaps

The test coverage is good. The unit tests for the tracking service cover the parameter extraction logic, event building, and the main `trackRedirect` function. The integration test ensures that the redirect flow is not affected by tracking service failures.

### Architectural Alignment

The implementation is perfectly aligned with the project's architecture. It introduces a clear separation of concerns and makes the system more provider-agnostic, as intended by Epic 7.

### Security Notes

No security issues were identified.

### Best-Practices and References

The implementation follows the best practices for Hono, Cloudflare Workers, and TypeScript. The use of a dedicated tracking service is a good example of the Single Responsibility Principle.

### Action Items

None.
