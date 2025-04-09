# docs/project-plan/tasks/phase3/task_3.1.2_add_platform_specific_tracking_server_side.md

## Task: 3.1.2 Add Platform-Specific Tracking (Server-Side - Placeholder/Design)

**Description:**
Design the mechanism for sending tracking events directly from the Worker to specific platforms (e.g., Facebook Conversion API, Shopee API) *before* issuing the redirect. Initial implementation focuses on design and placeholder logic.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.1 Advanced Tracking -> Add platform-specific tracking

**Detailed Specifications:**
- Identify which platforms require server-side tracking events (e.g., Facebook CAPI, TikTok Events API, Shopee?).
- For each platform, determine the required API endpoint, authentication method (e.g., access tokens stored as secrets), and payload structure.
- Design a modular structure (e.g., `src/tracking/facebook.ts`, `src/tracking/shopee.ts`) with functions like `sendFacebookConversionEvent(params, requestInfo)`.
- These functions would:
    - Construct the platform-specific payload using extracted `trackingParameters` (Task 2.3) and potentially request details (IP, User-Agent - *handle privacy implications carefully*).
    - Make an asynchronous `fetch` call to the platform's API endpoint with appropriate headers (Authorization, Content-Type).
    - Handle API responses (success/failure logging).
- Integrate calls to these platform-specific tracking functions into the main `fetch` handler (`src/index.ts`), likely just before the `createRedirectResponse` call for *redirecting* requests.
- Use `ctx.waitUntil()` to send these tracking events asynchronously without blocking the redirect response.
- **Important:** Store API keys/access tokens securely using Worker Secrets, accessible via `env`.

**TDD Approach:**

*   **Test Cases (Vitest - Focus on structure & integration):**
    *   Mock the platform-specific sending functions (e.g., `sendFacebookConversionEvent`).
    *   Spy on `ctx.waitUntil`.
    *   Test scenario: Valid redirect request with relevant platform parameters (e.g., `ref` for FB).
        *   Verify that the corresponding mocked platform function (e.g., `sendFacebookConversionEvent`) is called within `ctx.waitUntil`.
        *   Verify that the function is called with the correctly extracted parameters.
    *   Test scenario: Valid redirect request *without* relevant platform parameters. Verify the platform function is *not* called.
    *   Test scenario: `isNoRedirect=1` request. Verify platform functions are *not* called.
    *   *(Actual API interaction testing requires integration tests or careful mocking).*
*   **Implementation Steps:**
    1.  Define required secrets (e.g., `FB_ACCESS_TOKEN`, `SHOPEE_API_KEY`) in `wrangler.toml` for local testing (`.dev.vars`) and configure them in the Cloudflare dashboard for production. `npx wrangler secret put <SECRET_NAME>`
    2.  Update `Env` interface to include secrets (`FB_ACCESS_TOKEN?: string`, etc.).
    3.  Create placeholder functions/modules (e.g., `src/tracking/facebook.ts`) with the defined signatures. Initially, they can just log that they would send data.
        ```typescript
        // src/tracking/facebook.ts (Placeholder)
        import { TrackingParameters } from '../tracking-parser';
        export async function sendFacebookConversionEvent(params: TrackingParameters, request: Request, fbAccessToken?: string) {
            if (!fbAccessToken || !params.ref) { // Example condition
                 // console.log("[TRACKING-FB] Skipping FB event: No token or ref param.");
                 return;
            }
            console.log(`[TRACKING-FB] Would send FB CAPI event for ref: ${params.ref} (Token: ${fbAccessToken.substring(0,5)}...)`);
            // Actual fetch call to FB CAPI endpoint would go here
            // Use ctx.waitUntil() in the caller (index.ts)
        }
        ```
    4.  Integrate calls to these placeholder functions into `src/index.ts` within `ctx.waitUntil`, just before returning the redirect response. Pass necessary params and `env` secrets.
        ```typescript
        // src/index.ts (Inside fetch, before redirect response)
        import { sendFacebookConversionEvent } from './tracking/facebook';
        // ... other imports

        if (shouldRedirect) {
            // Asynchronously send tracking pings
            ctx.waitUntil(Promise.allSettled([
                 sendFacebookConversionEvent(trackingParameters, request, env.FB_ACCESS_TOKEN)
                 // Add other platform calls here
            ]));

            console.log(`[TRACKING] Redirecting to: ${destinationUrlString}`);
            return createRedirectResponse(destinationUrlString, true);
        } else { // ... no-redirect case ... }
        ```
    5.  Write tests in `src/index.test.ts` using mocks/spies to verify that `ctx.waitUntil` is called and that the placeholder tracking functions are called conditionally based on parameters/secrets.
    6.  Run `npm test`.
    7.  Run linters/formatters.

**Technical References:**
- Facebook Conversions API: [https://developers.facebook.com/docs/marketing-api/conversions-api/](https://developers.facebook.com/docs/marketing-api/conversions-api/)
- Worker Secrets: [https://developers.cloudflare.com/workers/configuration/secrets/](https://developers.cloudflare.com/workers/configuration/secrets/)
- `ctx.waitUntil()`: [https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil)
- `fetch()` API: [https://developers.cloudflare.com/workers/runtime-apis/fetch/](https://developers.cloudflare.com/workers/runtime-apis/fetch/)

**Dependencies:**
- Task 1.1.2 (for secrets config)
- Task 2.3 (Tracking Parameter Processing)
- Task 1.3.1 (Redirect Logic - to place calls before redirect)

**Acceptance Criteria:**
- Design for server-side platform tracking is documented.
- Placeholder functions for target platforms exist.
- Secrets for API keys/tokens are configured (locally and noted for production).
- Main handler calls placeholder functions asynchronously via `ctx.waitUntil` before redirecting.
- Unit tests verify the integration logic using mocks/spies.
- Code meets quality standards. 