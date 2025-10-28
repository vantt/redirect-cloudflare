# Story 7.5: Timeout + Reliability Policy (Non-Blocking)

Status: Review Passed

## Story

As a reliability engineer,
I want per-provider timeouts and non-blocking guarantees,
so that analytics never delays or blocks the redirect response.

## Acceptance Criteria

1. Apply default per-provider timeout (e.g., 2s) via AbortSignal.timeout() or equivalent
2. Router enforces overall return within budget regardless of provider hangs
3. Failures/Timeouts logged with structured logs; no throws to request path
4. Tests: timeout fired; hung provider isolated; router returns promptly

## Tasks / Subtasks

- [ ] Integrate timeout policy into src/lib/analytics/router.ts
  - [ ] Apply per-provider timeout (default 2s) around provider.send(event)
  - [ ] Isolate errors/timeouts with try/catch; never throw to caller
  - [ ] Ensure router returns promptly even if a provider hangs
- [ ] Structured logging (Story 5.2):
  - [ ] Log attempt/success/failure/timeout with duration per provider
  - [ ] Avoid PII; use provider key and event name only
- [ ] Unit tests in test/unit/lib/analytics/router.timeout.test.ts
  - [ ] Timeout path triggers within expected window
  - [ ] Hung provider does not block others
  - [ ] Router completes under budget with mixed outcomes
- [ ] (Optional) Config hook: support env ANALYTICS_TIMEOUT_MS with safe default (2000)

## Dev Notes

- Non-blocking: router must not delay HTTP redirect; adhere to latency budget
- Isolation-first: one provider's failure/timeout must not affect others
- Align with:
  - Story 7.3 (router fan-out)
  - Story 5.2 (structured logging schema)
  - Story 1.4 (error handling pattern)
- Prefer AbortSignal.timeout(2000); if unavailable, implement minimal wrapper

### References

- Source: docs/epics.md:581 (Story 7.5)
- Source: docs/architecture.md: Analytics Abstraction (Epic 7) — sequence diagram & router

## Dev Agent Record

### Context Reference

- docs/stories/story-context-7.5.xml
