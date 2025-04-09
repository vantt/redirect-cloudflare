# docs/project-plan/tasks/phase1/task_1.4.2_implement_error_logging.md

## Task: 1.4.2 Implement Error Logging

**Description:**
Implement basic server-side logging for errors encountered during request processing (e.g., invalid URLs, redirect loops, unexpected exceptions) using `console.error`.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.4 Error Handling -> Implement error logging

**Detailed Specifications:**
- Identify key points where errors are detected or generated:
    - URL parsing failure (Task 1.2.1)
    - URL validation failure (Task 1.2.2)
    - Redirect loop detection (Task 1.3.3)
    - Inside `createErrorResponse` (Task 1.4.1 - maybe log the error details here?)
    - Add a top-level try-catch block in the main `fetch` handler to catch unexpected errors.
- Use `console.error` to log meaningful error messages.
- Include relevant context in the log message, such as:
    - The type of error (e.g., "Invalid destination URL", "Redirect loop detected", "Caught unexpected exception").
    - The requested URL (`request.url`).
    - The problematic destination URL (if applicable).
    - The generated error code (e.g., `INVALID_URL`).
    - (Optional) Request ID if generated.
- For the top-level try-catch, log the caught exception object/stack trace.

**TDD Approach:**

*   **Test Cases (Vitest - using spies):**
    *   Spy on `console.error` using `vi.spyOn(console, 'error')`.
    *   Test scenario: Invalid request URL (no hash). Verify `console.error` was called with a message containing relevant details (e.g., "Invalid request URL", the URL itself).
    *   Test scenario: Invalid destination URL (bad protocol). Verify `console.error` was called.
    *   Test scenario: Redirect loop detected. Verify `console.error` was called.
    *   Test scenario: Force an unexpected error within the fetch handler (e.g., mock a function to throw). Verify the top-level catch block logs the error using `console.error`.
*   **Implementation Steps:**
    1.  Ensure `console.error` calls are present at the points identified above (URL parsing, validation, loop detection) within the main `fetch` handler (`src/index.ts`). Refine the log messages to be informative.
    2.  Add a top-level try-catch block around the main logic within the `fetch` handler.
        ```typescript
        // src/index.ts (Fetch handler structure with try-catch)
        import { createErrorResponse } from './errors';
        import { HTTP_STATUS_INTERNAL_SERVER_ERROR, ERROR_CODE_INTERNAL_ERROR } from './constants';
        // ... other imports

        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                try { // Top-level try
                    const requestUrl = request.url;
                    // --- PARSING ---
                    const destinationUrlString = parseDestinationUrlFromHash(requestUrl);
                    if (!destinationUrlString) {
                        console.error(`[${ERROR_CODE_INVALID_URL}] Invalid hash structure: ${requestUrl}`);
                        return createErrorResponse(HTTP_STATUS_BAD_REQUEST, ERROR_CODE_INVALID_URL, "Invalid request URL structure.");
                    }

                    // --- VALIDATION ---
                    if (!isValidDestinationUrl(destinationUrlString)) {
                        console.error(`[${ERROR_CODE_INVALID_URL}] Invalid destination URL: ${destinationUrlString} (from ${requestUrl})`);
                        return createErrorResponse(HTTP_STATUS_BAD_REQUEST, ERROR_CODE_INVALID_URL, "Invalid destination URL format or protocol.");
                    }

                    // --- LOOP CHECK ---
                    if (isRedirectLoop(destinationUrlString, env.REDIRECT_SERVICE_HOSTNAME)) {
                         console.error(`[${ERROR_CODE_REDIRECT_LOOP}] Redirect loop detected: ${requestUrl} -> ${destinationUrlString}`);
                         return createErrorResponse(HTTP_STATUS_BAD_REQUEST, ERROR_CODE_REDIRECT_LOOP, "Potential redirect loop detected.");
                    }

                    // --- PARAM EXTRACTION & REDIRECT ---
                    const { shouldRedirect } = extractControlParameters(destinationUrlString);
                    // ... (Tracking logic will go here later) ...
                    return createRedirectResponse(destinationUrlString, shouldRedirect);

                } catch (error) { // Top-level catch
                    console.error(`[${ERROR_CODE_INTERNAL_ERROR}] Unhandled exception for ${request.url}:`, error);
                    // Optionally capture stack trace: error instanceof Error ? error.stack : String(error)
                    return createErrorResponse(HTTP_STATUS_INTERNAL_SERVER_ERROR, ERROR_CODE_INTERNAL_ERROR, "An internal server error occurred.");
                }
            },
        };
        ```
    3.  Write/update tests in `src/index.test.ts` using `vi.spyOn(console, 'error')` to assert that logging occurs correctly for different error scenarios.
    4.  Run `npm test` and verify tests pass.
    5.  Run linters/formatters.
    6.  Manually test error cases with `wrangler dev` and observe the logs printed to the console.

**Technical References:**
- `console.error`: [https://developer.mozilla.org/en-US/docs/Web/API/console/error](https://developer.mozilla.org/en-US/docs/Web/API/console/error)
- Logging in Workers: [https://developers.cloudflare.com/workers/observability/logging/](https://developers.cloudflare.com/workers/observability/logging/)
- Vitest Spies: [https://vitest.dev/guide/mocking.html#spies](https://vitest.dev/guide/mocking.html#spies)

**Dependencies:**
- Previous error handling tasks (1.4.1) and error detection points (1.2.1, 1.2.2, 1.3.3).

**Acceptance Criteria:**
- `console.error` is used to log details for detected errors (invalid URL, loop) and unexpected exceptions.
- Log messages include relevant contextual information.
- Unit tests verify that `console.error` is called appropriately in error scenarios.
- Code meets quality standards. 