# Story 7.2: Analytics Provider Interface and Neutral Event Model

Status: Done

## Story

As a system architect,
I want a vendor-neutral AnalyticsEvent model and AnalyticsProvider interface,
so that business events are decoupled from vendor payloads and easy to extend.

## Acceptance Criteria

1. Define AnalyticsEvent (event name + attributes map) and AnalyticsProvider interface (e.g., send(event: AnalyticsEvent): Promise<void>)
2. Document minimal taxonomy: edirect_click with mapped attributes (utm_source, utm_medium, utm_campaign, utm_content, utm_term, xptdk, ref)
3. TypeScript interfaces exported (e.g., src/lib/analytics/types.ts, src/lib/analytics/provider.ts)
4. Examples included showing how a provider adapts neutral event to vendor payload
5. Unit tests validate type contracts and basic mapping examples

## Tasks / Subtasks

- [x] Create src/lib/analytics/types.ts
  - [x] Define export type AnalyticsAttributes = Record<string, string | number | boolean>
  - [x] Define export interface AnalyticsEvent { name: string; attributes: AnalyticsAttributes }
- [x] Create src/lib/analytics/provider.ts
  - [x] Define export interface AnalyticsProvider { send(event: AnalyticsEvent): Promise<void> }
  - [x] Provide example adapter sketch (comment) mapping AnalyticsEvent -> vendor payload
- [x] Define neutral taxonomy doc (in-code comments + README section): redirect_click and attribute mapping
- [x] Unit tests: type contracts and example mapping (no network)

## Dev Notes

- Keep abstractions minimal and stable; avoid vendor-specific leakage
- Names and attribute keys must be consistent and lower_snake_case for cross-provider mapping
- No network calls in this story; providers and router are handled by later stories
- Align with Architecture: Analytics Abstraction (Epic 7) section for naming and file paths

### References

- Source: docs/epics.md:531 (Story 7.2)
- Source: docs/architecture.md: Analytics Abstraction (Epic 7), Skeleton Code Paths

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.2.xml

### Debug Log

- **2025-10-26**: Implemented analytics provider interface and neutral event model
  - Created src/lib/analytics/types.ts with AnalyticsEvent, AnalyticsAttributes, and enums
  - Created src/lib/analytics/provider.ts with AnalyticsProvider interface and example adapters
  - Implemented comprehensive unit tests for type contracts and example mappings
  - Added proper TypeScript documentation and JSDoc comments

### Completion Notes

**Completed:** 2025-10-26
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

**Final Implementation Summary:**
- ✅ Vendor-neutral AnalyticsEvent model with flexible attribute types
- ✅ AnalyticsProvider interface with async send() contract
- ✅ Comprehensive taxonomy: redirect_click + standard tracking attributes
- ✅ Example adapters for GA4 and Mixpanel (illustration only)
- ✅ Complete unit test coverage for type contracts and examples
- ✅ Code review passed with no action items required
- ✅ Epic 7 architectural foundation established for multi-service analytics

### File List

- Added: src/lib/analytics/types.ts (neutral event model)
- Added: src/lib/analytics/provider.ts (provider interface and examples)
- Added: test/unit/lib/analytics/types.test.ts (type contracts tests)
- Added: test/unit/lib/analytics/provider-adapter.example.test.ts (adapter examples tests)

### Change Log

- 2025-10-26: Implemented vendor-neutral analytics abstraction with comprehensive test coverage

## Senior Developer Review (AI)

- Reviewer: vanTT
- Date: 2025-10-29
- Outcome: Changes Requested

### Summary

The original implementation of story 7.2 was a good first step, but it is now outdated due to the new tracking service abstraction introduced in story 7.8. The existing tests are failing and need to be updated to reflect the new implementation. The story needs to be reworked to align with the new standard.

### Action Items

- [x] Refactor the analytics provider interface and neutral event model to be compatible with the new `tracking-service`.
- [x] Update all related tests to use the new `tracking-service` and fix all the failing tests.
- [x] GA4-specific code isolated in separate file for Epic 8 implementation.
- [x] Update the documentation to reflect the new implementation.

### Post-Refactor Update (2025-10-30)

Story 7.2 has been successfully refactored to align with the new tracking service abstraction introduced in Story 7.8.

**Key Changes:**
1. **Import Path Fixes**: Fixed import paths for `AnalyticsProvider` interface
   - `src/lib/analytics/providers/ga4.ts`: Split imports between `types.ts` and `provider.ts`
   - `test/utils/mock-providers.ts`: Updated to correct import paths

2. **Router Error Handling**: Fixed `dispatchToProviderWithTimeout` to properly re-throw errors
   - Ensures `Promise.allSettled` can correctly track success/failure counts
   - Maintains error isolation while enabling proper failure tracking

3. **Test Updates**:
   - Updated router timeout tests to reflect new logging behavior
   - Fixed test expectations to match actual provider behavior (timeouts are failures)
   - E2E test helper updated to read from mocked `appLogger` instead of console

4. **GA4 Isolation**: GA4 provider code remains in `src/lib/analytics/providers/ga4.ts` for Epic 8
   - Marked as example implementation
   - Does not interfere with core provider interface tests

**Test Results:**
All Story 7.2 tests passing:
- ✅ `test/unit/lib/analytics/types.test.ts`
- ✅ `test/unit/lib/analytics/provider-adapter.example.test.ts`
- ✅ `test/unit/lib/analytics/registry.test.ts`
- ✅ `test/unit/lib/analytics/providers/provider-mocks.test.ts`

**Status**: Story 7.2 is complete and aligned with Story 7.8 design.
