# Story 8.3: Integrated GA4 in Redirect Flow

Status: Ready

## Story

As a end user,
I want my analytics to be tracked before I'm redirected,
so that no tracking data is lost even if I close the browser quickly.

## Acceptance Criteria

1. `routes/redirect.ts` updated to extract tracking params from destination URL using `extractTrackingParams()`
2. Route builds GA4 payload using `buildGA4Payload()` with extracted params
3. Route calls `await sendGA4Event()` BEFORE returning redirect response
4. Tracking errors are logged but do NOT prevent redirect from executing
5. Integration test verifies: tracking function called before redirect response sent
6. Integration test verifies: redirect still works even if tracking fails/times out
7. Structured log entry created for tracking attempt (success/failure)
8. Performance: tracking adds <100ms latency in happy path (within sub-5ms total budget)

## Tasks / Subtasks

- [ ] Integrate GA4 call in routes/redirect.ts (AC:2)
  - [ ] Extract TrackingParams; build payload via buildGA4Payload (AC:1)
- [ ] Await sendGA4Event(payload, GA4 secrets) with 2s timeout; catch/log errors (AC:2)
- [ ] Integration tests: GA4 called before redirect; failure still redirects (AC:3)

## Dev Notes

- Wire GA4 call before 301/302; maintain non-blocking semantics
- Use AbortSignal.timeout(2000); log error paths
- Reference: docs/tech-spec-epic-8.md (Integrated GA4), docs/architecture.md (Epic 7 wiring)

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

