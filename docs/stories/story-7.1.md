# Story 7.1: Tracking Parameter Extraction from Destination URLs

Status: Draft

## Story

As a marketing analyst,
I want the system to extract UTM and platform-specific tracking parameters from destination URLs,
so that I can track campaign performance and user attribution in analytics.

## Acceptance Criteria

1. `lib/tracking.ts` exports `extractTrackingParams(destinationUrl)` function
2. Function extracts UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
3. Function extracts platform-specific params: `xptdk` (Shopee), `ref` (Facebook)
4. Function returns `TrackingParams` interface with all extracted parameters (undefined for missing ones)
5. Function handles URL parsing errors gracefully (returns empty object, logs error)
6. Unit tests cover: complete UTM set, partial UTM set, platform params, malformed URLs, URLs without tracking params
7. Function correctly parses URL-encoded parameter values
8. TypeScript `TrackingParams` interface defined in `src/types/env.ts`

## Tasks / Subtasks

- [ ] Define `TrackingParams` in `cloudflareRedirect/src/types/env.ts`
- [ ] Implement `extractTrackingParams(destinationUrl: string)` in `cloudflareRedirect/src/lib/tracking.ts`
- [ ] Parse UTM + platform params; URL-decode values safely
- [ ] Handle errors gracefully and return `{}` when parsing fails
- [ ] Unit tests: full UTM, partial UTM, platform params, malformed, none

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

