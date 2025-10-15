## Component Interaction and Contracts

The primary workflow involves the Request Handler coordinating calls to the Tracking System and then the Redirect Engine.

1.  **Request Arrival:** User request hits the Cloudflare Worker endpoint.
2.  **Request Handler:**
    *   **Input:** Cloudflare `Request` object.
    *   **Processing:** Parses URL fragment (`#`), extracts/decodes `destination_url`, parses control and tracking parameters from `destination_url`'s query string, performs validation.
    *   **Contract (to Tracking System):** Passes `{ destinationUrl: string, trackingParams: object, controlParams: object }`.
    *   **Contract (to Redirect Engine):** Passes `{ destinationUrl: string, isNoRedirect: boolean }`.
    *   **Action:** Calls Tracking System, then Redirect Engine if valid. Prepares error `Response` if validation fails.
3.  **Tracking System:**
    *   **Input:** Data object from Request Handler.
    *   **Processing:** Validates parameters, formats data, sends tracking events (likely async fire-and-forget), logs activity.
    *   **Output:** Returns control quickly.
4.  **Redirect Engine:**
    *   **Input:** Data object from Request Handler (`destinationUrl`, `isNoRedirect`).
    *   **Processing:** Checks `isNoRedirect`. Prepares 302 Redirect `Response` or a non-redirect `Response` (e.g., 200 OK, 400 Bad Request) based on the flag and URL validity.
    *   **Output:** Cloudflare `Response` object.
5.  **Response:** Request Handler returns the final `Response` to the client.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant RequestHandler as Request Handler (Worker)
    participant TrackingSystem as Tracking System
    participant RedirectEngine as Redirect Engine

    Client->>RequestHandler: GET /#destinationUrl?params...
    RequestHandler->>RequestHandler: Parse URL fragment, extract/decode destinationUrl, parse params (isNoRedirect, tracking)
    RequestHandler->>RequestHandler: Validate input
    alt Validation OK
        RequestHandler->>TrackingSystem: ProcessTracking(destinationUrl, trackingParams, controlParams)
        TrackingSystem->>TrackingSystem: Send events (async/fire-and-forget)
        TrackingSystem-->>RequestHandler: Ack/Continue
        RequestHandler->>RedirectEngine: PrepareResponse(destinationUrl, isNoRedirect)
        RedirectEngine->>RedirectEngine: Check isNoRedirect
        alt isNoRedirect = true or invalid URL
            RedirectEngine-->>RequestHandler: Non-Redirect Response (e.g., 200 OK / 400 Bad Request)
        else isNoRedirect = false
            RedirectEngine-->>RequestHandler: Redirect Response (302 Found, Location: destinationUrl)
        end
        RequestHandler->>Client: Return Response
    else Validation Failed
        RequestHandler->>RequestHandler: Prepare Error Response (e.g. 400)
        RequestHandler->>Client: Return Error Response
    end
``` 