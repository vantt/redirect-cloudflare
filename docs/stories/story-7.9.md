# Story 7.9: Test Infrastructure Fixes Post-Story 7.8

Status: ContextReadyDraft

## Story

As a developer,
I want all test suites to pass with the new Story 7.8 architecture,
so that we have confidence in test coverage and can proceed with Epic 8 implementation.

## Acceptance Criteria

1. Fix KV binding setup in test environment - 10 failing tests across bootstrap.test.ts and redirect.test.ts should pass
2. Update error handler tests to properly recognize NotFoundError type - 2 failing tests in error-handler.test.ts should pass
3. Fix domain allowlist edge case validation logic - 2 failing tests in domain-allowlist.test.ts should pass
4. Update structured logging format expectations in router observability tests - 5 failing tests in router.observe.test.ts should pass
5. All 303 tests pass (100% pass rate, up from 93.7%)
6. No regression in existing functionality - all previously passing tests remain green
7. Test setup documented for future reference (KV binding mock pattern)
8. Story 7.8 architecture remains unchanged - fixes are test-only

## Tasks / Subtasks

### Group 1: KV Binding Test Setup (Priority HIGH - 10 failures)
- [ ] Analyze current KV binding mock approach in test files
- [ ] Create or update centralized test helper for KV namespace mocking
- [ ] Update `test/unit/bootstrap.test.ts`:
  - [ ] Add proper `env.SHORT_LINKS` KV binding mock in test setup
  - [ ] Fix 7 failures: fallback routes, middleware registration, error handlers
- [ ] Update `test/unit/handlers/redirect.test.ts`:
  - [ ] Add KV binding mock to redirect handler tests
  - [ ] Fix 3 failures: domain allowlist validation, invalid short code handling
- [ ] Verify all KV-related tests pass

### Group 2: Error Handler Type Recognition (Priority MEDIUM - 2 failures)
- [ ] Review `src/handlers/error-handler.ts` type checking logic
- [ ] Update `test/unit/handlers/error-handler.test.ts`:
  - [ ] Fix NotFoundError recognition test (expected 404, got 500)
  - [ ] Fix generic Error handling test (response format mismatch)
- [ ] Verify error handler response format matches test expectations
- [ ] Document error type checking pattern for future tests

### Group 3: Domain Allowlist Edge Cases (Priority MEDIUM - 2 failures)
- [ ] Review `src/middlewares/domain-allowlist.ts` validation logic
- [ ] Update `test/unit/middlewares/domain-allowlist.test.ts`:
  - [ ] Fix non-allowlisted domain rejection test (validation incorrectly passed)
  - [ ] Fix feature disabled test (validation failed when should pass)
- [ ] Check feature flag evaluation order
- [ ] Verify domain validation edge cases

### Group 4: Structured Logging Format (Priority LOW - 5 failures)
- [ ] Review Story 7.3 router observability implementation
- [ ] Update `test/unit/lib/analytics/router.observe.test.ts`:
  - [ ] Add missing `name` property to mock provider objects
  - [ ] Fix log format checking patterns (use correct assertion approach)
  - [ ] Adjust performance timing assertion (less strict threshold)
  - [ ] Fix 5 failures: provider dispatch logging, timeout handling
- [ ] Verify all observability tests align with Story 5.2 structured logging spec

### Group 5: Validation & Documentation
- [ ] Run full test suite: `npm test`
- [ ] Verify 303/303 tests passing (100%)
- [ ] Document test setup patterns in project:
  - [ ] KV binding mock helper usage
  - [ ] Error handler test patterns
  - [ ] Provider mock patterns for analytics tests
- [ ] Update test failure analysis report with "RESOLVED" status

## Dev Notes

### Root Cause Analysis Summary

**KV Binding Issues (10 failures)**
- Test environment not properly mocking Cloudflare Workers KV namespace
- `env.SHORT_LINKS` undefined in multiple test files
- Solution: Centralized test helper for KV mocking, consistent setup pattern

**Error Handler Issues (2 failures)**
- NotFoundError type not recognized properly in error handler
- Response format mismatch between handler and test expectations
- Solution: Review type checking instanceof logic, verify response schema

**Domain Allowlist Issues (2 failures)**
- Edge case validation logic has gaps
- Feature flag checking may have order issues
- Solution: Review validation flow, test both enabled/disabled states thoroughly

**Structured Logging Issues (5 failures)**
- Mock provider objects missing `name` property in some tests
- Log format assertions using incorrect patterns
- Performance timing too strict
- Solution: Update mocks, fix assertion patterns, relax timing threshold

### Story 7.8 Architecture Alignment

This story does NOT change Story 7.8 implementation. All fixes are test-only:
- TrackingService abstraction remains unchanged
- Parameter extraction merge strategy unchanged
- Provider routing and timeout handling unchanged
- Only test setup and assertions are updated

### Why This Story Matters

1. **Quality Assurance**: 100% test pass rate critical for CI/CD confidence
2. **Epic 8 Readiness**: Clean test suite before GA4 provider implementation
3. **Technical Debt**: Prevents compounding test issues in future stories
4. **Team Velocity**: Faster development with reliable test feedback
5. **Best Practices**: Establishes proper test setup patterns

### Estimated Effort

- KV binding fixes: 1-2 hours
- Error handler fixes: 30 minutes
- Domain allowlist fixes: 30 minutes
- Structured logging fixes: 1 hour
- **Total**: 2.5-4 hours (MEDIUM effort)

### References

- Source: docs/test-failure-analysis-2025-10-30.md (failure report)
- Source: docs/tech-spec-epic-7.md (Epic 7 architecture)
- Source: docs/stories/story-7.8.md (TrackingService design)
- Source: docs/stories/story-5.2.md (Structured logging spec)
- Related: docs/stories/story-1.10.md, story-1.11.md (KV client)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.9.xml (Generated 2025-10-30: Comprehensive test infrastructure fix context with KV binding, error handling, domain validation, and logging test patterns)

### Debug Log

(To be filled during implementation)

### Completion Notes

(To be filled upon completion)

### File List

(To be filled during implementation)

### Change Log

(To be filled during implementation)

## Senior Developer Review (AI)

(To be filled after implementation)
