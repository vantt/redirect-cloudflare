## Component Design Documents

### 1. Request Handler
*   **Purpose:** Entry point for all requests. Responsible for parsing, initial validation, and orchestrating calls to other components.
*   **Input:** Cloudflare `Request` object.
*   **Core Logic:**
    1.  Retrieve the full request URL.
    2.  Find the hash character (`#`). If not present, return a 400 Bad Request response.
    3.  Extract the substring after `#` as the raw `destination_url`.
    4.  Attempt to decode the `destination_url` (e.g., using `decodeURIComponent`). Handle potential decoding errors (e.g., malformed URI sequences) by returning a 400 Bad Request response.
    5.  Parse the query string of the *decoded* `destination_url` to extract parameters (e.g., using `URLSearchParams`).
    6.  Identify control parameters (specifically `isNoRedirect`). Default `isNoRedirect` to `false` if absent or invalid.
    7.  Identify and extract known tracking parameters (UTM, platform-specific like `xptdk`, `ref`) into a structured `trackingParams` object.
    8.  Perform basic validation on the `destination_url` (e.g., check if it resembles a valid URL structure after decoding). Return 400 if invalid.
    9.  Call `Tracking System` with `destinationUrl`, `trackingParams`, `controlParams`.
    10. Call `Redirect Engine` with `destinationUrl`, `isNoRedirect` flag.
    11. Return the `Response` object received from the `Redirect Engine`.
*   **Error Handling:** Primarily returns HTTP 400 Bad Request for parsing/validation errors. Logs errors.
*   **Outputs:** Calls to Tracking/Redirect Engines, or a final Cloudflare `Response` object (usually 400 on error).

### 2. Tracking System
*   **Purpose:** Handles the extraction and dispatching of tracking information to external analytics platforms.
*   **Input:** `{ destinationUrl: string, trackingParams: object, controlParams: object }`
*   **Core Logic:**
    1.  Receive tracking parameters.
    2.  Validate/sanitize parameter values (e.g., trim whitespace, check for expected formats if necessary).
    3.  Map/format parameters according to the requirements of the target analytics platform(s) (e.g., GTM data layer format, GA4 event parameters).
    4.  **Asynchronously** trigger events to be sent to analytics platforms (e.g., using `event.waitUntil` in Cloudflare Workers for background tasks, or potentially calling a separate logging endpoint).
    5.  Log the tracking attempt (success or failure with parameters) internally.
*   **Error Handling:** Logs errors during parameter processing or event dispatching. Should not block the main redirection flow.
*   **Outputs:** Asynchronous calls to analytics platforms/logging endpoints.

### 3. Redirect Engine
*   **Purpose:** Determines whether to redirect the user and constructs the appropriate HTTP response.
*   **Input:** `{ destinationUrl: string, isNoRedirect: boolean }`
*   **Core Logic:**
    1.  Check the `isNoRedirect` flag.
    2.  If `isNoRedirect` is `true`: Create a 200 OK response. Consider adding a simple HTML body indicating tracking was processed but redirection was disabled, or just return an empty body.
    3.  If `isNoRedirect` is `false`:
        a.  Perform final validation on `destinationUrl` (e.g., ensure it's not empty and looks like a valid HTTP/HTTPS URL).
        b.  If valid: Create a 302 Found redirect response with the `Location` header set to the `destinationUrl`.
        c.  If invalid: Create a 400 Bad Request response (or potentially a custom error page response).
*   **Error Handling:** Returns 400 Bad Request for invalid destination URLs when redirection is expected. Logs errors.
*   **Outputs:** Cloudflare `Response` object (200 OK, 302 Found, or 400 Bad Request). 