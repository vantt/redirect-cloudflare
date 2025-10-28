# Story 2.1: Tracking Placeholder Stubs and Flags

Status: Done

## Story

As a developer,
I want to add no-op tracking stubs and configuration flags,
so that the system can integrate full tracking later without refactoring MVP code.

## Acceptance Criteria

1. Create `lib/tracking.ts` with exported no-op functions: `extractTrackingParams()`, `buildGA4Payload()`, `sendGA4Event()` returning placeholder values
2. Add env flag `ENABLE_TRACKING=false` (documented) and short-circuit all tracking functions when disabled
3. Add TODO comments referencing Epic 7 stories (7.1–7.4) for future implementation
4. No network calls nor GA4 dependencies in P0
5. Unit tests assert stubs execute without side effects

## Tasks / Subtasks

- [x] Create `src/lib/tracking.ts` with no-op exports
  - [x] `extractTrackingParams(destinationUrl: string): Record<string, string>` → returns `{}`
  - [x] `buildGA4Payload(params: Record<string,string>, measurementId: string): any` → returns `{ type: 'noop' }`
  - [x] `sendGA4Event(payload: any, apiSecret: string, measurementId: string): Promise<void>` → resolves immediately
- [x] Add env flag plumbing
  - [x] Introduce `ENABLE_TRACKING` in `src/types/env.ts` (optional string, default "false")
  - [x] Document in README how to enable later
- [x] Wire safe imports (no usage yet) and TODOs referencing Epic 7
- [x] Unit tests: ensure functions return placeholder values and have no side effects

## Dev Notes

- This is a placeholder only. No GA4 HTTP calls or dependencies; keeps MVP scope tight.
- Provides stable interfaces for Epic 7 to replace implementations later.

### References

- Source: docs/epics.md#Epic 2: Tracking Placeholder (Defer Full GA4 Integration)
- Source: docs/epics.md#Epic 7: Full Tracking (GA4 Integration)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-2.1.xml

### Debug Log References

### Completion Notes List

### File List

- src/lib/tracking.ts (new)
- src/types/env.ts (modified)
- test/unit/lib/tracking.test.ts (new)