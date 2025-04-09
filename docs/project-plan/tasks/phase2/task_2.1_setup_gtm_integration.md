# docs/project-plan/tasks/phase2/task_2.1_setup_gtm_integration.md

## Task: 2.1 Set up GTM Integration (Basic Structure)

**Description:**
Integrate Google Tag Manager (GTM) by embedding the necessary GTM container script into the response, likely for non-redirect scenarios (`isNoRedirect=1`) initially, or potentially by firing server-side events. **Decision: Start with client-side GTM script injection for `isNoRedirect=1` responses.**

**Source Task:**
docs/project-plan/implementation.md -> Phase 2: Tracking Integration -> Set up GTM integration

**Detailed Specifications:**
- Obtain the GTM Container ID (should be configurable via environment variable `GTM_CONTAINER_ID`).
- Modify the response generation for the `isNoRedirect=1` case (currently returning plain text in Task 1.3.1/1.3.2).
- Instead of plain text, return a minimal HTML document.
- This HTML document must include the standard GTM container script snippet (both `<head>` and `<body>` parts) with the `GTM_CONTAINER_ID` injected.
- Ensure the response has `Content-Type: text/html`.
- The `Cache-Control` headers should remain strict (`no-cache, no-store...`) for this response.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Test the response generation logic specifically for `isNoRedirect=1`.
    *   Input: Request with `#https://dest.com?isNoRedirect=1`, `GTM_CONTAINER_ID = "GTM-TEST123"`
    *   Expected Response:
        *   Status: 200 OK.
        *   `Content-Type`: `text/html`.
        *   Cache headers present (`no-cache...`).
        *   Body: Contains the standard GTM `<script>` and `<noscript>` snippets, with "GTM-TEST123" correctly inserted.
    *   Need to handle the case where `GTM_CONTAINER_ID` is not configured (e.g., return a simpler HTML response without GTM script, log a warning).
*   **Implementation Steps:**
    1.  Define `GTM_CONTAINER_ID` in `wrangler.toml -> [vars]`.
    2.  Update `Env` interface (`src/index.ts` or types file) to include `GTM_CONTAINER_ID?: string`.
    3.  Create an HTML template string or file (`static/no-redirect-page.html`) for the no-redirect response, including placeholders for GTM ID.
        ```html
        <!-- static/no-redirect-page.html -->
        <!DOCTYPE html><html><head><title>Redirect Paused</title>
        <!-- GTM Head Placeholder -->
        {{GTM_HEAD}}
        </head><body>
        <!-- GTM Body Placeholder -->
        {{GTM_BODY_NOSCRIPT}}
        <h1>Redirect Paused</h1>
        <p>Redirect was paused via isNoRedirect=1.</p>
        <p>Destination: {{DESTINATION_URL}}</p>
        </body></html>
        ```
    4.  Create a function `generateGtmSnippets(gtmId: string)` that returns `{ headSnippet: string, bodySnippet: string }`.
    5.  Create a function `createNoRedirectResponse(destinationUrl: string, gtmId?: string): Response` in `src/redirector.ts` (or a new `src/responses.ts`). This function reads/imports the template, generates GTM snippets if `gtmId` is present, replaces placeholders, and returns the HTML Response.
    6.  Refactor the logic in `src/redirector.ts` (or `index.ts`) that handles `shouldRedirect = false`. Instead of returning the simple text response, call `createNoRedirectResponse`, passing the destination URL and `env.GTM_CONTAINER_ID`.
    7.  Add/update tests in `src/redirector.test.ts` (or `responses.test.ts`) to verify the HTML structure, GTM ID injection, Content-Type, and status for the no-redirect case, including when GTM ID is missing.
    8.  Run `npm test`.
    9.  Ensure build process handles the new HTML template import.
    10. Manually test with `wrangler dev` and a browser, check the source code of the no-redirect page for the GTM snippets.

**Technical References:**
- GTM Quick Start Guide: [https://developers.google.com/tag-manager/quickstart](https://developers.google.com/tag-manager/quickstart) (Shows the standard snippets)
- Content Security Policy (CSP) Considerations: Injecting scripts requires careful CSP setup if implemented later. [https://developers.google.com/tag-manager/web/csp](https://developers.google.com/tag-manager/web/csp) (*Defer CSP setup for now*).

**Dependencies:**
- Task 1.1.2 (Configure Dev Env - for env var)
- Task 1.2.3 (Parameter Extraction - identifies `isNoRedirect=1`)
- Task 1.3.1 (Redirect Logic - handles the `shouldRedirect=false` path)
- Build setup for HTML template import (from Task 1.4.3)

**Acceptance Criteria:**
- `GTM_CONTAINER_ID` environment variable is configured.
- Responses for `isNoRedirect=1` requests return HTML.
- The HTML response correctly includes the GTM container snippets with the configured ID.
- Appropriate headers (`Content-Type`, `Cache-Control`) are set.
- Unit tests verify the response generation for the no-redirect case with and without GTM ID.
- Manual testing confirms GTM script presence in browser. 