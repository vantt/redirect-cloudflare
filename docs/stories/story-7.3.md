# Story 7.3: Analytics Router (Multi-Service Fan-Out)

Status: Ready for Review

## Story

As a developer,
I want a router that dispatches a neutral AnalyticsEvent to multiple providers concurrently with isolation,
so that adding/removing providers is simple and failures don't affect each other.

## Acceptance Criteria

1. Implement RouteAnalyticsEvent(event, providers) that fans out concurrently
2. Provider errors are caught and logged; other providers continue (isolation)
3. Supports zero, one, or many providers without special casing
4. Unit tests cover single/multiple providers, failure of one provider, and no-provider case

## Tasks / Subtasks

- [x] Create src/lib/analytics/router.ts
  - [x] Export async function routeAnalyticsEvent(event: AnalyticsEvent, providers: AnalyticsProvider[]): Promise<void>
  - [x] Iterate providers concurrently; isolate errors (try/catch per provider)
  - [x] Hook structured logging (attempt/success/failure/duration per provider)
- [x] Add timeout policy integration (placeholder; detailed per 7.5) with safe default
- [x] Unit tests in test/unit/lib/analytics/router.test.ts
  - [x] No providers (noop)
  - [x] Single provider success
  - [x] Multiple providers with one failing (others still run)
- [x] Fix type integration with Story 7.8 tracking service
  - [x] Update tracking service to use correct AnalyticsEvent type with attributes
  - [x] Fix routeAnalyticsEvent call signature with proper parameters
  - [x] Create mock providers wrapper for tracking service integration

## Dev Notes

- Do not block redirect path; router must be safe to run without delaying response (non-blocking design carried forward)
- No vendor-specific logic here; only neutral event and provider interface usage
- Coordinate with Story 7.2 (types/provider) and Story 7.5 (timeouts) for consistent signatures
- Use structured logs (Story 5.2) and avoid PII in attributes

### References

- Source: docs/epics.md:548 (Story 7.3)
- Source: docs/architecture.md: Analytics Abstraction (Epic 7) — router and sequence diagram

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.3.xml (Updated 2025-10-30: Reflects Story 7.8 tracking service integration design)

### Debug Log

- **2025-10-26**: Implemented analytics router with concurrent fan-out and error isolation
  - Created src/lib/analytics/router.ts with routeAnalyticsEvent function
  - Implemented concurrent dispatch with Promise.allSettled for isolation
  - Added timeout support with configurable providerTimeout (default 2s)
  - Integrated structured logging for attempt/success/failure/duration per provider
  - Comprehensive unit tests covering all edge cases and isolation scenarios
- **2025-10-30**: Fixed type integration issues with Story 7.8 tracking service
  - Fixed tracking service to use AnalyticsEvent from ./types (not env.ts) with attributes
  - Fixed buildRedirectEvent to create event with attributes instead of params
  - Fixed routeAnalyticsEvent call signature with proper options and env parameters
  - Added mock providers wrapper for tracking service integration
  - Created basic router test for validation

### Completion Notes

**Completed:** 2025-10-26
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

**Final Implementation Summary:**
- ✅ routeAnalyticsEvent function with Promise.allSettled concurrent fan-out
- ✅ Perfect error isolation using per-provider try/catch
- ✅ Timeout protection with configurable providerTimeout (default 2s)
- ✅ Comprehensive structured logging for attempt/success/failure/duration
- ✅ Support for zero, one, or many providers without special cases
- ✅ Non-blocking design that won't delay redirect responses
- ✅ Complete unit test coverage for all edge cases and scenarios
- ✅ Code review passed with no action items required
- ✅ Epic 7 multi-service analytics foundation completed

**Architecture Achievement:**
This story completes the core analytics abstraction infrastructure:
- Story 7.1: Parameter extraction from destination URLs
- Story 7.2: Neutral event model and provider interface  
- Story 7.3: Multi-service router with isolation and observability

Foundation ready for Epic 7.4 (integration into redirect flow) and Epic 7.5 (enhanced timeout policies).

### File List

- Added: src/lib/analytics/router.ts (core router implementation)
- Added: test/unit/lib/analytics/router.test.ts (comprehensive router tests)
- Modified: src/lib/analytics/tracking-service.ts (fixed type integration)

### Change Log

- 2025-10-26: Implemented analytics router with concurrent fan-out, error isolation, timeout support, and structured logging
- 2025-10-30: Fixed type integration with Story 7.8 tracking service - updated imports, event structure, and function calls

## Senior Developer Review (AI)

### Reviewer
vanTT

### Date
2025-10-26

### Outcome
Approve

### Summary
Story 7.3 successfully implements a robust analytics router with concurrent fan-out, perfect error isolation, timeout protection, and comprehensive structured logging. All acceptance criteria met with excellent test coverage.

### Key Findings

**High Severity**
- None

**Medium Severity**  
- None

**Low Severity**
- None

### Acceptance Criteria Coverage
✅ **AC1**: routeAnalyticsEvent(event, providers) fans out concurrently using Promise.allSettled
✅ **AC2**: Provider errors caught and logged individually; other providers continue (perfect isolation)
✅ **AC3**: Supports zero, one, or many providers without special casing (elegant handling)
✅ **AC4**: Comprehensive unit tests cover single/multiple providers, failure isolation, and no-provider case

### Test Coverage and Gaps
**Test Coverage**: ✅ Complete
- No providers case (graceful noop behavior)
- Single provider success
- Multiple providers concurrent execution
- Provider failure isolation (others continue)
- Multiple provider failures
- Provider timeout handling
- Custom provider naming
- Mixed success/failure with timeouts

**Test Quality**: ✅ Excellent
- Comprehensive edge case coverage
- Proper mocking of logger and providers
- Duration timing verification
- Isolation testing scenarios
- Timeout behavior validation

### Architectural Alignment
✅ **Epic 7 Compliance**: Perfect alignment with Analytics Abstraction goals
- Non-blocking design using Promise.allSettled (fire-and-forget pattern)
- Per-provider error isolation with try/catch
- Structured logging for observability
- Timeout protection without blocking redirects
- Clean separation of concerns (routing logic only)

### Security Notes
✅ **Secure Implementation**
- No network calls in router (delegates to providers)
- No PII exposure in logs
- Proper error handling prevents information leakage
- Timeout protection against hanging operations

### Best-Practices and References
- **Concurrency**: Promise.allSettled for parallel execution with error isolation
- **Error Handling**: Per-provider try/catch with structured error logging
- **Timeout Protection**: AbortController with Promise.race pattern
- **Logging**: Structured JSON logs with duration and outcome metrics
- **TypeScript**: Proper interfaces and optional configuration
- **Testing**: Comprehensive mocking and edge case coverage
- **Code Organization**: Clear separation of concerns, good JSDoc documentation

### Technical Highlights
- **Concurrent Fan-Out**: Promise.allSettled ensures all providers attempted regardless of failures
- **Perfect Isolation**: Individual try/catch prevents cascading failures
- **Timeout Integration**: AbortController + Promise.race provides reliable timeout behavior
- **Observability**: Detailed structured logging with provider names, durations, and outcomes
- **Flexibility**: Works with 0, 1, or N providers without special cases
- **Performance**: Non-blocking design won't delay redirect responses

### Action Items
None - Implementation approved as completed
