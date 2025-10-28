# Story 8.2: GA4 Measurement Protocol HTTP Integration

Status: Draft

## Story

As a system,
I want to send GA4 Measurement Protocol events via HTTP POST before redirect,
so that analytics data is recorded reliably without blocking redirect.

## Acceptance Criteria

1. `lib/tracking.ts` exports async `sendGA4Event(payload, apiSecret, measurementId)` function
2. Function sends POST request to `https://www.google-analytics.com/mp/collect` with query params: `measurement_id` and `api_secret`
3. Request headers include `Content-Type: application/json`
4. Request body is JSON stringified GA4 payload
5. Function includes 2-second timeout using `AbortSignal.timeout(2000)`
6. Function catches timeout and fetch errors, logs them without throwing
7. Integration test with Miniflare verifies fetch call is made with correct URL and payload
8. Unit test verifies timeout is properly configured
9. Environment variables `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` used from `c.env`

## Tasks / Subtasks

- [x] Implement sendGA4Event(payload, apiSecret, measurementId) (AC:1-3)
  - [x] Build URL with measurement_id/api_secret; set headers; JSON body
  - [x] Apply AbortSignal.timeout(2000); catch and log errors
- [x] Integration test with Miniflare (AC:4)
  - [x] Verify fetch URL and payload sent
- [x] Unit test for timeout configuration (AC:5)
- [x] Wire env bindings GA4_MEASUREMENT_ID/GA4_API_SECRET (AC:6)

## Dev Notes

- Endpoint: https://www.google-analytics.com/mp/collect?measurement_id=...&api_secret=...
- Headers: Content-Type: application/json; Body: JSON.stringify(payload)
- Timeout: AbortSignal.timeout(2000); log errors; do not throw upstream
- Cite: docs/tech-spec-epic-8.md (HTTP Integration), docs/architecture.md

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

