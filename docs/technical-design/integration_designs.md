## Integration Designs

This section outlines the integration with external analytics platforms, primarily handled by the `Tracking System` component.

**Goal:** Send captured tracking parameters (UTM, platform-specific) from the `destinationUrl` to analytics platforms before user redirection, with minimal latency impact.

**Mechanism:** Utilize `ctx.waitUntil()` in the Cloudflare Worker's `fetch` handler to perform asynchronous HTTP requests to analytics endpoints after the redirect response has been initiated.

**1. Google Tag Manager (GTM) - Server-Side Tagging (Recommended)**
*   **Method:** HTTP POST request from the Worker's `Tracking System` to the GTM Server-Side Container endpoint URL.
*   **Endpoint:** Configured via `env.GTM_SERVER_SIDE_URL`.
*   **Data Format:** JSON payload mimicking a Data Layer push.
    ```json
    {
      "event": "redirect_tracking",
      "destination_url": "DECODED_DESTINATION_URL",
      "utm_source": "CAPTURED_UTM_SOURCE",
      "utm_medium": "CAPTURED_UTM_MEDIUM",
      // ... other UTM params ...
      "platform_xptdk": "CAPTURED_XPTDK",
      "platform_ref": "CAPTURED_REF"
      // ... other platform params ...
    }
    ```
*   **Triggering:** Wrap the `fetch` call to GTM within `ctx.waitUntil()`.
*   **Error Handling:** Log network errors or non-2xx responses from GTM.

**2. Google Analytics 4 (GA4) - Measurement Protocol (Alternative/Direct)**
*   **Method:** Direct HTTP POST request from the Worker's `Tracking System` to the GA4 Measurement Protocol endpoint.
*   **Endpoint:** `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`.
*   **Configuration:** Requires `env.GA4_MEASUREMENT_ID` and `env.GA4_API_SECRET`.
*   **Data Format:** JSON payload.
    ```json
    {
      "client_id": "GENERATED_OR_RETRIEVED_CLIENT_ID",
      "events": [{
        "name": "redirect_tracking",
        "params": {
          "destination_url": "DECODED_DESTINATION_URL",
          "utm_source": "CAPTURED_UTM_SOURCE",
          // ... other UTM & platform params ...
          "session_id": "GENERATED_OR_RETRIEVED_SESSION_ID",
          "engagement_time_msec": "1"
        }
      }]
    }
    ```
*   **Challenges:** Requires robust `client_id` and `session_id` handling, which can be complex in stateless workers. Often better managed via GTM.
*   **Triggering:** Wrap the `fetch` call within `ctx.waitUntil()`.
*   **Error Handling:** Log network errors or non-2xx responses from GA4.

**Configuration Summary:**
- Use Cloudflare Worker environment variables (`env`) for:
    - `GTM_SERVER_SIDE_URL` (if using GTM)
    - `GA4_MEASUREMENT_ID` (if using direct GA4)
    - `GA4_API_SECRET` (if using direct GA4)
    - Feature flags like `ENABLE_GTM_TRACKING`, `ENABLE_GA4_TRACKING`. 