# docs/project-plan/tasks/phase1/task_1.3.4_develop_redirect_caching_strategy.md

## Task: 1.3.4 Develop Redirect Caching Strategy (Headers)

**Description:**
Implement basic HTTP caching headers (`Cache-Control`) for redirect responses to instruct browsers and intermediate caches how long they can cache the redirect.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.3 Redirect Handling -> Develop redirect caching strategy

**Detailed Specifications:**
- For redirect responses (301/302), add a `Cache-Control` header.
- The caching duration should be relatively short initially, especially for 302 redirects, to allow for changes in campaign destinations. **Decision: Use `no-cache, no-store, must-revalidate` for now** to prevent caching during initial development and for maximum flexibility with tracking. Caching can be relaxed later if performance requires it.
- For non-redirect responses (e.g., 200 for `isNoRedirect=1` or 400 errors), apply appropriate caching headers (likely also `no-cache, no-store, must-revalidate` or similar to prevent caching of potentially transient states or errors).
- Consider adding `Pragma: no-cache` and `Expires: 0` for broader compatibility with older caches, although `Cache-Control` is the standard.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Refactor tests for `createRedirectResponse` (from 1.3.1) and error responses (from 1.3.2).
    *   Assert that the `Cache-Control` header is present in the response headers.
    *   Assert that the value of `Cache-Control` matches the expected directive (e.g., `no-cache, no-store, must-revalidate`).
    *   Optionally, assert presence and values of `Pragma` and `Expires` headers.
*   **Implementation Steps:**
    1.  Add/update tests in `src/redirector.test.ts` and `src/index.test.ts` (where error responses are generated) to verify the presence and content of caching headers.
    2.  Modify the `createRedirectResponse` function in `src/redirector.ts` to include caching headers for both redirect and no-redirect cases.
        ```typescript
        // src/redirector.ts (Updated createRedirectResponse)
        import { HTTP_STATUS_OK, HTTP_STATUS_FOUND } from './constants'; // Assuming constants exist

        const CACHE_HEADERS = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache', // Compatibility
            'Expires': '0', // Compatibility
        };

        export function createRedirectResponse(destinationUrl: string, shouldRedirect: boolean): Response {
            if (shouldRedirect) {
                return new Response(null, {
                    status: HTTP_STATUS_FOUND, // Use constant
                    headers: {
                        'Location': destinationUrl,
                        ...CACHE_HEADERS, // Add cache headers
                    },
                });
            } else {
                return new Response("Redirect prevented by isNoRedirect=1 parameter.", {
                    status: HTTP_STATUS_OK, // Use constant
                    headers: {
                        'Content-Type': 'text/plain',
                        ...CACHE_HEADERS, // Add cache headers
                    },
                });
            }
        }
        ```
    3.  Modify the error response generation in `src/index.ts` (e.g., for 400 Bad Request) to also include these `CACHE_HEADERS`.
        ```typescript
         // src/index.ts (Error response example)
         // ... inside fetch ...
         if (!destinationUrlString || !isValidDestinationUrl(destinationUrlString) || isRedirectLoop(...)) {
             // ... console.error ...
             return new Response("Bad Request: ...", {
                 status: HTTP_STATUS_BAD_REQUEST,
                 headers: {
                     'Content-Type': 'text/plain',
                     ...CACHE_HEADERS, // Add cache headers to error responses too
                 }
             });
         }
         // ...
        ```
    4.  Run `npm test` and verify tests pass, checking header assertions.
    5.  Run linters/formatters.
    6.  Manually inspect headers using `curl -v` or browser dev tools for various request types.

**Technical References:**
- `Cache-Control` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- `Pragma` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma)
- `Expires` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires)
- Caching strategies: [https://web.dev/http-cache/](https://web.dev/http-cache/)
- Cache API (Workers): [https://developers.cloudflare.com/workers/runtime-apis/cache/](https://developers.cloudflare.com/workers/runtime-apis/cache/)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Infrastructure](../../../technical-design/infrastructure.md): Mentions CDN capabilities.
- [Component Designs](../../../technical-design/component_designs.md): Details how caching interacts with redirect logic.
- [Future Considerations](../../../technical-design/future_considerations.md): May mention advanced caching plans.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Could define cache control mechanisms.

**Dependencies:**
- Task 1.3.1 completed (redirect logic implemented).
- Task 1.3.2 completed (status code management).
- Understanding of HTTP caching headers.

**Acceptance Criteria:**
- Appropriate `Cache-Control` (and potentially `Pragma`, `Expires`) headers are added to all redirect, no-redirect, and error responses.
- Unit tests verify the presence and correctness of these headers.
- Code meets quality standards. 