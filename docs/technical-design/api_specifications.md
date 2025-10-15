## API Specifications (Internal Component Interfaces)

These define the function signatures and data structures used for communication *between* the logical components (`Request Handler`, `Tracking System`, `Redirect Engine`) implemented within the single Cloudflare Worker script.

**1. Worker Entry Point (`fetch` handler)**

*   **Signature:** `async function fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>`
*   **Description:** The main entry point for the Cloudflare Worker. Receives the incoming HTTP request.
*   **Parameters:**
    *   `request`: The standard Cloudflare `Request` object containing URL, headers, etc.
    *   `env`: Worker environment bindings (e.g., KV namespaces, secrets).
    *   `ctx`: The execution context, notably `ctx.waitUntil` for scheduling async tasks post-response.
*   **Returns:** A `Promise` that resolves to the final `Response` object to be sent to the client.

**2. Request Handler -> Tracking System**

*   **Function:** `processTracking`
*   **Signature:** `function processTracking(data: TrackingData, ctx: ExecutionContext): void`
*   **Description:** Initiates the tracking process. Designed to be non-blocking or use `ctx.waitUntil` for asynchronous operations.
*   **Parameters:**
    *   `data`: An object containing the necessary information for tracking.
        *   **Type `TrackingData`:**
            ```typescript
            interface TrackingData {
              destinationUrl: string; // Decoded destination URL
              trackingParams: {
                utm?: { [key: string]: string | undefined }; // e.g., { source: '...', medium: '...' }
                platform?: { [key: string]: string | undefined }; // e.g., { xptdk: '...', ref: '...' }
                // Potentially add other categories if needed
              };
              controlParams: {
                isNoRedirect: boolean;
                // Add other control params if identified
              };
              // Could add request details like IP, User-Agent if needed for tracking
            }
            ```
    *   `ctx`: The execution context, passed through for potential use of `waitUntil`.
*   **Returns:** `void`. The function should handle its own asynchronous logic.

**3. Request Handler -> Redirect Engine**

*   **Function:** `prepareResponse`
*   **Signature:** `function prepareResponse(data: RedirectData): Response`
*   **Description:** Determines the final HTTP response (redirect, OK, or error) based on the processed request.
*   **Parameters:**
    *   `data`: An object containing the information needed to decide on and construct the response.
        *   **Type `RedirectData`:**
            ```typescript
            interface RedirectData {
              destinationUrl: string; // Decoded destination URL
              isNoRedirect: boolean;
            }
            ```
*   **Returns:** A standard Cloudflare `Response` object. 