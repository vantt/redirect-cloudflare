# docs/project-plan/tasks/phase1/task_1.3.2_add_status_code_management.md

## Task: 1.3.2 Add Status Code Management

**Description:**
Refine status code usage, potentially allowing configuration (e.g., via KV or environment variables) to switch between 301 and 302 redirects if needed in the future, and solidify non-redirect status codes (e.g., 200 OK for `isNoRedirect=1`, specific error codes for invalid inputs).

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.3 Redirect Handling -> Add status code management

**Detailed Specifications:**
- Review current status code usage (302 for redirect, 200 for `isNoRedirect=1`, placeholder for errors).
- Introduce constants for common status codes (e.g., `HTTP_STATUS_OK = 200`, `HTTP_STATUS_FOUND = 302`, `HTTP_STATUS_BAD_REQUEST = 400`).
- Modify the redirect logic (Task 1.3.1) to use these constants.
- Add basic handling for invalid input detected during parsing (Task 1.2.1) or validation (Task 1.2.2) to return a `400 Bad Request` response.
- (Future consideration/Low Priority Now): Design how redirect type (301/302) could be configured if needed later. For now, stick to 302.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Refactor existing redirect tests (from 1.3.1) to check against status code constants (e.g., `expect(response.status).toBe(HTTP_STATUS_FOUND)`).
    *   Test case for invalid input URL (no hash): Request `https://base.com/path` -> Expected Response: Status 400.
    *   Test case for invalid destination URL (bad protocol): Request `https://base.com#ftp://dest.com` -> Expected Response: Status 400.
    *   Test case for `isNoRedirect=1`: Request `https://base.com#https://dest.com?isNoRedirect=1` -> Expected Response: Status 200.
*   **Implementation Steps:**
    1.  Create a constants file (e.g., `src/constants.ts`) or add status code constants to an existing relevant file.
        ```typescript
        // src/constants.ts
        export const HTTP_STATUS_OK = 200;
        export const HTTP_STATUS_FOUND = 302; // Temporary Redirect
        export const HTTP_STATUS_MOVED_PERMANENTLY = 301; // Permanent Redirect (Future use?)
        export const HTTP_STATUS_BAD_REQUEST = 400;
        export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
        // ... other codes as needed
        ```
    2.  Refactor `src/redirector.ts` (`createRedirectResponse`) and the main handler in `src/index.ts` to use these constants instead of magic numbers (e.g., `status: HTTP_STATUS_FOUND`).
    3.  Modify the main `fetch` handler in `src/index.ts` to explicitly return a `400 Bad Request` response if URL parsing or validation fails.
        ```typescript
        // src/index.ts (Simplified fetch handler structure)
        import { parseDestinationUrlFromHash } from './url-parser';
        import { isValidDestinationUrl } from './url-validator';
        import { extractControlParameters } from './parameter-extractor';
        import { createRedirectResponse } from './redirector';
        import { HTTP_STATUS_BAD_REQUEST } from './constants';

        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                const requestUrl = request.url;
                const destinationUrlString = parseDestinationUrlFromHash(requestUrl);

                if (!destinationUrlString || !isValidDestinationUrl(destinationUrlString)) {
                    console.error(`Invalid request URL or destination: ${requestUrl}`);
                    return new Response("Bad Request: Invalid URL format or destination.", { status: HTTP_STATUS_BAD_REQUEST });
                }

                const { shouldRedirect } = extractControlParameters(destinationUrlString);
                // ... (Tracking logic will go here later) ...
                return createRedirectResponse(destinationUrlString, shouldRedirect);
            },
        };
        ```
    4.  Add/update tests in `src/index.test.ts` (or specific module tests) to cover the new 400 error cases and verify usage of constants.
    5.  Run `npm test` and verify tests pass.
    6.  Run linters/formatters.

**Technical References:**
- HTTP Status Codes: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

**Dependencies:**
- Task 1.2.1 (URL Parsing)
- Task 1.2.2 (URL Validation)
- Task 1.3.1 (Redirect Logic)

**Acceptance Criteria:**
- Magic numbers for status codes replaced with constants.
- Invalid URL parsing/validation results in a 400 Bad Request response.
- Unit tests verify correct status codes for success, no-redirect, and error cases.
- Code meets quality standards. 