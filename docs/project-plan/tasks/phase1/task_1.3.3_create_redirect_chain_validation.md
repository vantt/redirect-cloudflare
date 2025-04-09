# docs/project-plan/tasks/phase1/task_1.3.3_create_redirect_chain_validation.md

## Task: 1.3.3 Create Redirect Chain Validation (Basic)

**Description:**
Implement a basic mechanism to prevent potential redirect loops where the destination URL might inadvertently point back to the redirect service itself.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.3 Redirect Handling -> Create redirect chain validation

**Detailed Specifications:**
- Before issuing a redirect, compare the hostname of the *destination* URL against the hostname(s) of the redirect service itself.
- The redirect service hostname(s) should be configurable (e.g., via environment variable `REDIRECT_SERVICE_HOSTNAME`).
- If the destination URL's hostname matches the redirect service's hostname, treat it as an invalid request (potential loop) and return an error response (e.g., 400 Bad Request or perhaps 508 Loop Detected). **Decision: Use 400 for simplicity.**
- This is a basic check; more advanced chain validation (following multiple hops) is out of scope for this initial task.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Input: `destinationUrl = "https://othersite.com"`, `serviceHostname = "redirect.example.com"` -> Expected: Pass (no error/loop detected).
    *   Input: `destinationUrl = "https://redirect.example.com/some/path"` , `serviceHostname = "redirect.example.com"` -> Expected: Fail (loop detected).
    *   Input: `destinationUrl = "http://redirect.example.com?param=1"` , `serviceHostname = "redirect.example.com"` -> Expected: Fail (loop detected).
    *   Input: `destinationUrl = "https://sub.redirect.example.com"` , `serviceHostname = "redirect.example.com"` -> Expected: Pass (different hostname). Consider if subdomains should also be blocked. **Decision: Only block exact hostname match for now.**
    *   Test with service hostname defined with `www.`: `destinationUrl = "https://redirect.example.com"`, `serviceHostname = "www.redirect.example.com"` -> Expected: Pass.
*   **Implementation Steps:**
    1.  Define the `REDIRECT_SERVICE_HOSTNAME` variable in `wrangler.toml` -> `[vars]`.
    2.  Update the `Env` interface in `src/index.ts` (or a types file) to include `REDIRECT_SERVICE_HOSTNAME: string`.
    3.  Create a function `isRedirectLoop(destinationUrlString: string, serviceHostname: string): boolean` in `src/url-validator.ts` (or similar).
        ```typescript
        // src/url-validator.ts (Additions)
        export function isRedirectLoop(destinationUrlString: string, serviceHostname: string): boolean {
            if (!serviceHostname) {
                console.warn("REDIRECT_SERVICE_HOSTNAME not configured. Cannot check for redirect loops.");
                return false; // Fail open if not configured
            }
            try {
                const destUrl = new URL(destinationUrlString);
                // Simple exact hostname match
                return destUrl.hostname.toLowerCase() === serviceHostname.toLowerCase();
            } catch (e) {
                // Invalid URL already caught by isValidDestinationUrl, but handle defensively
                console.error("Error parsing destination URL for loop check:", e);
                return true; // Treat parsing errors here as potential risk/loop
            }
        }
        ```
    4.  Add tests for `isRedirectLoop` covering the scenarios above in the validator test file.
    5.  Integrate the `isRedirectLoop` check into the main `fetch` handler in `src/index.ts` *before* creating the redirect response. Pass `env.REDIRECT_SERVICE_HOSTNAME`. If it returns `true`, return a `400 Bad Request` response indicating a loop.
        ```typescript
         // src/index.ts (Inside fetch, after validation)
         if (isRedirectLoop(destinationUrlString, env.REDIRECT_SERVICE_HOSTNAME)) {
             console.error(`Potential redirect loop detected: ${requestUrl} -> ${destinationUrlString}`);
             return new Response("Bad Request: Potential redirect loop detected.", { status: HTTP_STATUS_BAD_REQUEST });
         }
         // ... proceed to createRedirectResponse ...
        ```
    6.  Run `npm test` and verify tests pass.
    7.  Run linters/formatters.
    8.  Manually test with `wrangler dev` using URLs that point back to the local dev hostname/port.

**Technical References:**
- `URL.hostname`: [https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname](https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname)
- HTTP Status 508 Loop Detected (Informational): [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508) - *Note: We're using 400 for simplicity.*

**Dependencies:**
- Task 1.1.2 (Configure Dev Env - for env var)
- Task 1.2.2 (URL Validation - uses URL parsing)
- Task 1.3.2 (Status Code Management)

**Acceptance Criteria:**
- `isRedirectLoop` function correctly identifies destination URLs pointing to the redirect service hostname.
- Environment variable used to configure the service hostname.
- Main fetch handler returns a 400 error if a loop is detected.
- Unit tests verify loop detection logic.
- Code meets quality standards. 