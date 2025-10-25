# Story 1.4: Custom Error Classes and Global Error Handler

Status: Ready

## Story

As a developer,
I want centralized error handling with custom error classes,
so that system returns consistent, meaningful error responses with appropriate HTTP status codes.

## Acceptance Criteria

1. `RedirectError` class created in `lib/errors.ts` extending Error with properties: `statusCode`, `code`
2. Global error handler registered in `src/index.ts` using `app.onError()`
3. `RedirectError` instances return JSON: `{error: message, code: errorCode}` with correct status code
4. Unknown errors return 500 with generic message and log full error details
5. Unit tests cover: 400 validation error, 404 not found, 500 internal error
6. Integration test: invalid URL returns 400 with proper error JSON
7. Error responses use consistent format across all endpoints
8. Console logging includes error details for debugging

## Tasks / Subtasks

- [ ] Create RedirectError class in lib/errors.ts (AC: #1)
  - [ ] Define class extending Error with statusCode and code properties
  - [ ] Export class for use in other modules
- [ ] Implement global error handler in src/index.ts (AC: #2)
  - [ ] Register app.onError() middleware
  - [ ] Handle RedirectError instances with proper status codes
  - [ ] Handle unknown errors with 500 status
- [ ] Create error response format (AC: #3, #4, #7)
  - [ ] Ensure JSON response format: {error: message, code: errorCode}
  - [ ] Apply consistent format across all endpoints
- [ ] Add logging to error handler (AC: #8)
  - [ ] Log error details for debugging
  - [ ] Use structured logging format
- [ ] Write unit tests for error handling (AC: #5)
  - [ ] Test 400 validation error
  - [ ] Test 404 not found error
  - [ ] Test 500 internal error
- [ ] Write integration tests (AC: #6)
  - [ ] Test invalid URL returns 400 with proper error JSON

## Dev Notes

### Architecture Patterns
- Use Hono's built-in error handling middleware (`app.onError()`)
- Custom error classes for type-safe error handling [Source: docs/architecture.md#Error Handling]
- Structured logging for Cloudflare dashboard visibility [Source: docs/architecture.md#Logging]

### Project Structure Notes
- File: `src/lib/errors.ts` - Custom error class location
- File: `src/index.ts` - Global error handler registration
- Follow TypeScript v5.9+ strict mode configuration [Source: docs/architecture.md#Language]

### Testing Standards
- Use Vitest v4.0+ with Miniflare for accurate Workers runtime emulation [Source: docs/architecture.md#Testing]
- Test error scenarios with proper assertions on status codes and response format

### References
- [Source: docs/architecture.md#Error Handling] - Custom error classes and global handler pattern
- [Source: docs/epics.md#Story 1.4] - Complete acceptance criteria and prerequisites
- [Source: docs/architecture.md#Project Structure] - File locations and organization

## Dev Agent Record

### Context Reference

**Context File:** [story-context-1.4.xml](./story-context-1.4.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
