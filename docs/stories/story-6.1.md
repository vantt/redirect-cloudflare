# Story 6.1: Zod Schema Validation with Hono Validator Middleware

Status: Ready

## Story

As a security-conscious developer,
I want all incoming URL parameters validated using Zod schemas before processing,
so that malformed or malicious inputs are rejected early with clear error messages.

## Acceptance Criteria

1. Install dependencies: `zod@^4.1.0` and `@hono/zod-validator@^0.7.0`
2. `lib/validation.ts` exports `redirectSchema` using Zod:
   ```typescript
   z.object({
     to: z.string().url(),
     n: z.enum(['0', '1']).optional()
   })
   ```
3. `/r` endpoint uses `zValidator('query', redirectSchema)` middleware from `@hono/zod-validator`
4. Invalid inputs automatically return 400 with validation error message
5. Validated data accessible via `c.req.valid('query')` with full TypeScript type safety
6. Unit tests verify schema validates: valid URLs, invalid URLs, missing `to`, optional `n` parameter
7. Integration test: `/r?to=invalid-url` returns 400 with Zod validation error
8. Integration test: `/r` (no params) returns 400 with "to is required" message
9. TypeScript compilation enforces correct types from validated data

## Tasks / Subtasks

- [ ] Add dependencies to `package.json` (documented for local install)
- [ ] Create `cloudflareRedirect/src/lib/validation.ts` with `redirectSchema`
- [ ] Update `/r` handler to apply `zValidator('query', redirectSchema)`
- [ ] Use `c.req.valid('query')` in handler for typed access
- [ ] Unit tests for schema cases (valid/invalid/missing/optional)
- [ ] Integration tests for 400 responses with error messages

## Dev Notes

### Patterns
- Use `@hono/zod-validator` for minimal boilerplate and TS inference
- Keep error formatting consistent with Story 1.4 (RedirectError/global handler)

### References
- Source: docs/epics.md#Story 6.1
- Source: docs/architecture.md#Error Handling, #Validation

## Dev Agent Record

### Context Reference

- docs/stories/story-context-6.1.xml
