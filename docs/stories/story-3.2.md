# Story 3.2: Legacy URL Backward Compatibility Testing

Status: Draft

## Story

As a QA engineer,
I want comprehensive tests proving legacy URLs work correctly,
so that we can confidently deploy without breaking existing user links.

## Acceptance Criteria

1. Integration test suite covers legacy URL scenarios:
   - `/#https://example.com` â†’ upgrades to `/r?to=https://example.com`
   - `/#https://example.com?utm_source=fb` â†’ preserves tracking params
   - `/?isNoRedirect=1#https://example.com` â†’ upgrades with `n=1` parameter
   - `/` (no hash) â†’ redirects to `DEFAULT_REDIRECT_URL`
2. E2E test verifies complete flow: legacy URL â†’ bootstrap â†’ upgrade â†’ final redirect
3. Tests verify URL encoding is handled correctly in upgrade process
4. Tests verify special characters in destination URLs work (spaces, UTF-8)
5. Tests verify fragment with malformed URLs fail gracefully
6. Performance test: bootstrap upgrade adds <50ms overhead vs direct `/r` call
7. All tests pass consistently in CI/CD pipeline

## Tasks / Subtasks

- [ ] Add legacy bootstrap tests under `cloudflareRedirect/test/routes/bootstrap-legacy.test.ts`
- [ ] Cover upgrade mapping to `/r?to=...` and preserve `utm_*`
- [ ] Cover `isNoRedirect=1` â†’ `n=1` behavior
- [ ] Cover root `/` fallback to `DEFAULT_REDIRECT_URL`
- [ ] Encoding and special characters cases (spaces, UTF-8)
- [ ] Malformed fragment handling (graceful)
- [ ] Performance assertion (<50ms overhead) with timing hooks

## Dev Notes

- Requires Story 3.1 bootstrap implementation and Story 1.3 `/r` endpoint.
- Use Miniflare for realistic URL handling and redirects.

### References

- Source: docs/epics.md#Story 3.2
- Source: docs/epics.md#Story 3.1 (Bootstrap)
- Source: docs/architecture.md (Redirect patterns, performance goals)

## Dev Agent Record

### Context Reference

- docs/stories/story-context-3.2.xml


