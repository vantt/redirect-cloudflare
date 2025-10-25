# Story 5.1: Debug Mode Implementation for Redirect Endpoint

Status: Draft

## Story

As a developer or QA tester,
I want to use debug mode (`n=1`) to see tracking data without being redirected,
so that I can verify tracking parameters and payload structure before deployment.

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] Update `/r` handler to read `n` and branch behavior
- [ ] Build debug JSON response with destination, tracking_params, redirect_type, note
- [ ] Ensure Zod schema (Story 6.1) includes optional `n`
- [ ] Integration tests for `n=1`, `n=0`, missing `n`
- [ ] Keep GA4 calls disabled in debug (no side effects)

## Dev Notes

- Preserve normal redirect flow when `n=0` or not present
- Use structured logging (Story 5.2) when available

### References

- Source: docs/epics.md#Story 5.1
- Source: docs/epics.md#Epic 5

## Dev Agent Record

### Context Reference

- docs/stories/story-context-5.1.xml

