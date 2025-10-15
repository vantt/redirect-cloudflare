# docs/project-plan/tasks/phase2/task_2.4_develop_tracking_event_logging.md

## Task: 2.4 Develop Tracking Event Logging

**Description:**
Implement server-side logging specifically for tracking-related events and extracted parameters. This provides a server-side record separate from client-side analytics tools.

**Source Task:**
docs/project-plan/implementation.md -> Phase 2: Tracking Integration -> Develop tracking event logging

**Detailed Specifications:**
- Use `console.log` (or potentially `console.info`) for these tracking logs to differentiate them from error logs (`console.error`).
- Log events at key stages:
    - After successfully parsing the destination URL (Task 1.2.1): Log the original request URL and the extracted destination URL.
    - After successfully extracting tracking parameters (Task 2.3): Log the extracted `TrackingParameters` object.
    - Before performing a redirect (Task 1.3.1): Log the destination URL being redirected to.
    - When a redirect is *prevented* (`isNoRedirect=1`, Task 1.3.1): Log this action and the destination URL.
- Structure log messages consistently, perhaps prefixing with `[TRACKING]`.
- Include relevant context (e.g., request URL, destination URL, extracted params).

**TDD Approach:**

*   **Test Cases (Vitest - using spies):**
    *   Spy on `console.log` using `vi.spyOn(console, 'log')`.
    *   Test scenario: Valid redirect request.
        *   Verify `console.log` is called after parsing with request/destination URLs.
        *   Verify `console.log` is called after parameter extraction with the parameters object.
        *   Verify `console.log` is called before redirection with the destination URL.
    *   Test scenario: Valid `isNoRedirect=1` request.
        *   Verify `console.log` calls for parsing and parameter extraction.
        *   Verify `console.log` is called indicating redirect prevention.
    *   Test scenario: Invalid request (e.g., bad URL format). Verify *no* tracking-specific `console.log` calls are made (only `console.error` from error handling).
*   **Implementation Steps:**
    1.  Review the main `fetch` handler (`src/index.ts`) workflow.
    2.  Add `console.log` statements at the specified points (after parsing, after tracking param extraction, before redirect, on no-redirect). Use a clear prefix like `[TRACKING]`.
        ```typescript
        // src/index.ts (Illustrative Additions)
        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                try {
                    const requestUrl = request.url;
                    // ... (Parsing) ...
                    const destinationUrlString = parseDestinationUrlFromHash(requestUrl);
                    if (!destinationUrlString) { /* ... error handling ... */ }
                    console.log(`[TRACKING] Parsed destination: ${destinationUrlString} (from ${requestUrl})`);

                    // ... (Validation, Loop Check) ...
                    if (!isValidDestinationUrl(destinationUrlString) || isRedirectLoop(...)) { /* ... error handling ... */ }

                    // --- TRACKING PARAM EXTRACTION ---
                    const trackingParameters = extractTrackingParameters(destinationUrlString);
                    console.log(`[TRACKING] Extracted params for ${destinationUrlString}:`, JSON.stringify(trackingParameters)); // Log extracted params

                    // --- REDIRECT DECISION / RESPONSE ---
                    const { shouldRedirect } = extractControlParameters(destinationUrlString);

                    // --- EXECUTE TRACKING (Future: GTM data layer push or server-side event) ---
                    // Placeholder for where tracking execution would go
                    // ctx.waitUntil(sendTrackingData(trackingParameters, request));

                    if (shouldRedirect) {
                        console.log(`[TRACKING] Redirecting to: ${destinationUrlString}`);
                        return createRedirectResponse(destinationUrlString, true);
                    } else {
                        console.log(`[TRACKING] Redirect prevented for: ${destinationUrlString}`);
                        // Pass tracking params to the no-redirect response function if needed for data layer
                        return createNoRedirectResponse(request, destinationUrlString, trackingParameters, env.GTM_CONTAINER_ID); // Modified signature
                    }
                } catch (error) {
                    // ... (Error logging via console.error) ...
                    return createErrorResponse(request, ...);
                }
            },
        };
        ```
        *Self-correction: Need to potentially pass `trackingParameters` to `createNoRedirectResponse` if we plan to use them in a data layer push on that page later.*
    3.  Write/update tests in `src/index.test.ts` using `vi.spyOn(console, 'log')` to assert that tracking logs occur as expected for different request types (redirect, no-redirect, error).
    4.  Run `npm test` and verify tests pass.
    5.  Run linters/formatters.
    6.  Manually test with `wrangler dev` and observe the `[TRACKING]` logs in the console output.

**Technical References:**
- `console.log`: [https://developer.mozilla.org/en-US/docs/Web/API/console/log](https://developer.mozilla.org/en-US/docs/Web/API/console/log)
- Workers `ctx.waitUntil`: [https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil) (Useful for firing off async tasks like sending tracking data without blocking the response).

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Component Designs](../../../technical-design/component_designs.md): Details the Tracking System's logging logic.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines the structure of logged tracking events.
- [Infrastructure](../../../technical-design/infrastructure.md): Potential targets for logs (e.g., Analytics Engine, external store).
- [Future Considerations](../../../technical-design/future_considerations.md): Might mention data retention or advanced analytics.

**Dependencies:**
- Task 2.3 completed (processed tracking parameters available).
- Task 1.1.3 completed (testing framework setup).
- (Optional) Task 1.1.4 if logging to KV initially.
- (Optional) Cloudflare account access if using Analytics Engine.

**Acceptance Criteria:**
- Server-side logs (`