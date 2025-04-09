# docs/project-plan/tasks/phase1/task_1.3.1_implement_redirect_logic.md

## Task: 1.3.1 Implement Redirect Logic

**Description:**
Implement the core server-side redirection mechanism using the appropriate HTTP status code and `Location` header, based on the parsed and validated destination URL and control parameters.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.3 Redirect Handling -> Implement redirect logic

**Detailed Specifications:**
- Takes the validated destination URL string and the `shouldRedirect` flag (from Task 1.2.3) as input.
- If `shouldRedirect` is `false`, the function/handler should return a non-redirect response (e.g., a simple 200 OK with a message, or perhaps the tracking pixel/script later).
- If `shouldRedirect` is `true`, it should construct a `Response` object specifically for redirection.
- The redirect response MUST use an appropriate status code (typically 301 Moved Permanently or 302 Found - **Decision: Use 302 for now**, as the destination might change based on campaigns, unless explicitly defined as permanent).
- The redirect response MUST include a `Location` header set to the validated destination URL string.
- Ensure the destination URL set in the `Location` header is the fully decoded, valid URL.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Input: `destinationUrl = "https://example.com"`, `shouldRedirect = true` -> Expected Response: Status 302, `Location` header "https://example.com".
    *   Input: `destinationUrl = "http://test.com?p=v"` , `shouldRedirect = true` -> Expected Response: Status 302, `Location` header "http://test.com?p=v".
    *   Input: `destinationUrl = "https://example.com"`, `shouldRedirect = false` -> Expected Response: Status 200 (or other non-redirect status), NO `Location` header, specific body content (e.g., "Redirect prevented").
    *   Test potentially encoded destination URL input (though validation should handle decoding): `destinationUrl = "https%3A%2F%2Fexample.com"`, `shouldRedirect = true` -> Expected Response: Status 302, `Location` header "https://example.com".
*   **Implementation Steps:**
    1.  Create `src/redirector.ts` and `src/redirector.test.ts`.
    2.  Write failing tests for a function `createRedirectResponse(destinationUrl: string, shouldRedirect: boolean): Response`. Test status codes, headers, and body for both redirect and no-redirect cases.
    3.  Implement the `createRedirectResponse` function.
        ```typescript
        // src/redirector.ts (Example)
        export function createRedirectResponse(destinationUrl: string, shouldRedirect: boolean): Response {
            if (shouldRedirect) {
                // Use 302 Found for temporary redirects
                return new Response(null, { // Body is often null/empty for redirects
                    status: 302,
                    headers: {
                        'Location': destinationUrl,
                        // Add caching headers later if needed
                    },
                });
            } else {
                // Return a non-redirect response if isNoRedirect=1
                return new Response("Redirect prevented by isNoRedirect=1 parameter.", {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
            }
        }
        ```
    4.  Integrate this function into the main `fetch` handler in `src/index.ts`. It should be called after parsing, validation, and parameter extraction.
    5.  Run `npm test` and verify tests pass.
    6.  Run linters/formatters.
    7.  Manually test with `wrangler dev` and `curl -v` (or browser dev tools) to observe the 302 status and `Location` header for redirecting URLs, and the 200 status for `isNoRedirect=1` URLs.

**Technical References:**
- `Response` object: [https://developers.cloudflare.com/workers/runtime-apis/response/](https://developers.cloudflare.com/workers/runtime-apis/response/)
- HTTP Redirects (301 vs 302): [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages)
- `Location` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)

**Dependencies:**
- Task 1.2.1 (URL Parsing)
- Task 1.2.2 (URL Validation)
- Task 1.2.3 (Parameter Extraction)

**Acceptance Criteria:**
- `createRedirectResponse` function generates correct `Response` objects for both redirect (302 status, `Location` header) and no-redirect (200 status, specific body) scenarios.
- Unit tests verify status codes and headers.
- Main fetch handler uses this logic to return the final response.
- Manual testing confirms browser redirection behavior.
- Code meets quality standards. 