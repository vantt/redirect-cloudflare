# Story 7.1: Tracking Parameter Extraction from Destination URLs

Status: Done

## Story

As a marketing analyst,
I want the system to extract UTM and platform-specific tracking parameters from destination URLs,
so that I can track campaign performance and user attribution in analytics.

## Acceptance Criteria

1. `lib/parameter-extractor.ts` exports `extractTrackingParams(destinationUrl)` function
2. Function extracts UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
3. Function extracts platform-specific params: `xptdk` (Shopee), `ref` (Facebook)
4. Function returns `TrackingParams` interface with all extracted parameters (undefined for missing ones)
5. Function handles URL parsing errors gracefully (returns empty object, logs error)
6. Unit tests cover: complete UTM set, partial UTM set, platform params, malformed URLs, URLs without tracking params
7. Function correctly parses URL-encoded parameter values
8. TypeScript `TrackingParams` interface defined in `src/types/env.ts`

## Tasks / Subtasks

- [x] Define `TrackingParams` in `src/types/env.ts`
- [x] Implement `extractTrackingParams(destinationUrl: string)` in `src/lib/parameter-extractor.ts`
- [x] Parse UTM + platform params; URL-decode values safely
- [x] Handle errors gracefully and return `{}` when parsing fails
- [x] Unit tests: full UTM, partial UTM, platform params, malformed, none

## Dev Notes

- Keep function pure and side-effect free
- No network or GA4 dependencies in this story
- Align with placeholder stubs introduced by Story 2.1 (ENABLE_TRACKING gating added later by integration)

### References

- Source: docs/epics.md: Story 7.1
- Source: docs/epics.md: Epic 7 overview

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.1.xml

### Debug Log

- **2025-10-29**: Refactored story 7.1 to align with new tracking service abstraction.
  - Moved `extractTrackingParams` to `src/lib/parameter-extractor.ts`.
  - Removed GA4-specific functions and tests.
  - Updated all related tests.

### Completion Notes

**Completed:** 2025-10-29
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

(To be filled upon completion)

### File List

- Modified: src/lib/parameter-extractor.ts (created from tracking.ts)
- Modified: test/unit/lib/parameter-extractor.test.ts (created from tracking.test.ts)
- Deleted: src/lib/tracking.ts
- Deleted: test/unit/lib/tracking.test.ts

### Change Log

- 2025-10-29: Refactored story 7.1 to align with new tracking service abstraction.

## Senior Developer Review (AI)

- Reviewer: vanTT
- Date: 2025-10-29
- Outcome: Approved

### Summary

The implementation of story 7.1 is now complete and aligned with the new tracking service abstraction. The `extractTrackingParams` function has been moved to its own file and the tests have been updated and are now passing.

### Action Items

None.


