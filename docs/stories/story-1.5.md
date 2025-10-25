# Story 1.5: Redirect Type Support (301 vs 302)

Status: Ready

## Story

As a system administrator,
I want the system to support both permanent (301) and temporary (302) redirects based on configuration,
so that I can optimize SEO for permanent links while maintaining flexibility for temporary campaigns.

## Acceptance Criteria

1. `routes/redirect.ts` modified to check KV for redirect data (uses `getRedirect()` from Story 1.2)
2. If URL found in KV: redirect using type from `RedirectData.type` ('permanent' + 301, 'temporary' + 302)
3. If URL not in KV: fallback to 302 redirect (temporary) for direct `/r?to=...` usage
4. Integration test: KV entry with `type: 'permanent'` returns 301 redirect
5. Integration test: KV entry with `type: 'temporary'` returns 302 redirect
6. Integration test: Direct `/r?to=...` (not in KV) returns 302 redirect
7. Error handling: malformed KV data falls back to 302 and logs warning

## Tasks / Subtasks

- [ ] Update redirect logic to check KV for redirect data (AC: #1)
  - [ ] Import and use getRedirect() from lib/kv-store.ts
  - [ ] Check if redirect exists in KV before handling
- [ ] Implement redirect type mapping (AC: #2)
  - [ ] Map 'permanent' → HTTP 301 redirect
  - [ ] Map 'temporary' → HTTP 302 redirect
  - [ ] Apply correct redirect status code based on RedirectData.type
- [ ] Add fallback for direct redirects (AC: #3)
  - [ ] Handle case where URL not found in KV
  - [ ] Default to 302 redirect for direct /r?to=... usage
- [ ] Write integration tests (AC: #4, #5, #6)
  - [ ] Test KV entry with type 'permanent' returns 301
  - [ ] Test KV entry with type 'temporary' returns 302
  - [ ] Test direct redirect (not in KV) returns 302
- [ ] Add error handling for malformed data (AC: #7)
  - [ ] Catch malformed KV data errors
  - [ ] Fallback to 302 redirect with warning log
  - [ ] Use structured logging for warning

## Dev Notes

### Architecture Patterns
- Use KV storage with JSON-based redirect data structure [Source: docs/architecture.md#Data Store]
- Flexible JSON structure allows metadata (redirect type, creation date) [Source: docs/architecture.md#Data Store]
- Use KV `.get(key, "json")` for auto-parsing [Source: docs/architecture.md#Data Store]

### Project Structure Notes
- File: `routes/redirect.ts` - Main redirect endpoint logic
- File: `lib/kv-store.ts` - KV operations from Story 1.2
- File: `lib/errors.ts` - Error handling from Story 1.4

### Dependencies
- Story 1.2: KV data structure and operations
- Story 1.3: Basic redirect endpoint functionality
- Story 1.4: Error handling for malformed data

### Testing Standards
- Use Vitest v4.0+ with Miniflare for accurate Workers runtime emulation [Source: docs/architecture.md#Testing]
- Integration tests should cover all redirect type scenarios

### References
- [Source: docs/architecture.md#Data Store] - KV storage with JSON metadata
- [Source: docs/epics.md#Story 1.5] - Complete acceptance criteria and prerequisites
- [Source: docs/architecture.md#Testing] - Testing framework and standards

## Dev Agent Record

### Context Reference

**Context File:** [story-context-1.5.xml](./story-context-1.5.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
