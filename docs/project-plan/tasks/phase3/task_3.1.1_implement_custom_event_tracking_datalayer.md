# docs/project-plan/tasks/phase3/task_3.1.1_implement_custom_event_tracking_datalayer.md

## Task: 3.1.1 Implement Custom Event Tracking (Data Layer)

**Description:**
Enhance the `isNoRedirect=1` HTML response to include a GTM Data Layer push containing the extracted tracking parameters and potentially other relevant information (like the destination URL).

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.1 Advanced Tracking -> Implement custom event tracking

**Detailed Specifications:**
- Modify the `isNoRedirect=1` HTML response to include a GTM Data Layer push containing the extracted tracking parameters and potentially other relevant information (like the destination URL).
- Before the GTM head snippet, inject a `<script>` block that initializes `dataLayer` (if not already present) and pushes an event (e.g., `redirectInfo`) along with the `trackingParameters` object (from Task 2.3) and the `destinationUrl`.
- The structure pushed to the `dataLayer` should be well-defined, e.g.:
  ```javascript
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'redirectInfo',
    'destinationUrl': 'https://example.com?p=v',
    'trackingParams': {
      'utm_source': 'google',
      'utm_medium': 'cpc',
      // ... other extracted params
    }
  });
  ```
- Ensure the pushed data (especially parameter values) is properly escaped/encoded if necessary for inclusion within a JavaScript string inside HTML. **Decision: Use `JSON.stringify` for the parameters object.**
- Configure GTM (UI Task) to pick up this data layer information (see Task 3.1.1b).

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Refactor tests for `createNoRedirectResponse` (from Task 2.1).
    *   Input: Request with `#https://dest.com?utm_source=test&isNoRedirect=1`, `GTM_CONTAINER_ID = "GTM-TEST123"`
    *   Expected Response Body:
        *   Contains the GTM snippets.
        *   Contains a `<script>` block *before* the GTM head snippet.
        *   This script block contains `window.dataLayer = window.dataLayer || [];`.
        *   It contains `window.dataLayer.push({...});` where the pushed object has `event: 'redirectInfo'`, the correct `destinationUrl`, and a `trackingParams` object mirroring the extracted parameters (e.g., `{ utm_source: 'test', ... }`).
    *   Verify that `JSON.stringify` is used for the `trackingParams` within the push.
    *   Test edge case: No tracking parameters found in URL -> `trackingParams` object should contain all nulls.
*   **Implementation Steps:**
    1.  Modify the `createNoRedirectResponse` function signature in `src/redirector.ts` (or `responses.ts`) to accept the `trackingParameters` object.
        ```typescript
        // Signature change
        export function createNoRedirectResponse(
            request: Request, // Keep request for potential future use
            destinationUrl: string,
            trackingParams: TrackingParameters, // Add this
            gtmId?: string
        ): Response
        ```
    2.  Update the call to `createNoRedirectResponse` in `src/index.ts` to pass the extracted `trackingParameters`.
    3.  Modify the implementation of `createNoRedirectResponse` to generate the `dataLayer` push script.
        ```typescript
        // src/redirector.ts or responses.ts (Inside createNoRedirectResponse)
        import noRedirectTemplate from '../static/no-redirect-page.html'; // Assumes import
        // ... other imports ...

        function generateDataLayerScript(destUrl: string, params: TrackingParameters): string {
           const dataLayerPush = {
               event: 'redirectInfo',
               destinationUrl: destUrl,
               trackingParams: params,
           };
           // Use JSON.stringify for safety, especially for param values
           return `<script>
               window.dataLayer = window.dataLayer || [];
               window.dataLayer.push(${JSON.stringify(dataLayerPush)});
           </script>`;
        }

        export function createNoRedirectResponse(/*...args...*/): Response {
             // ... (generate GTM snippets) ...
             const dataLayerScript = generateDataLayerScript(destinationUrl, trackingParams);
             const gtmSnippets = generateGtmSnippets(gtmId); // Assuming this exists

             let html = noRedirectTemplate
                 .replace('{{GTM_HEAD}}', gtmSnippets?.headSnippet || '')
                 .replace('{{GTM_BODY_NOSCRIPT}}', gtmSnippets?.bodySnippet || '')
                 .replace('{{DESTINATION_URL}}', destinationUrl); // Basic template replacement

             // Inject data layer BEFORE GTM head snippet
             html = html.replace('<head>', '<head>\n' + dataLayerScript);

             return new Response(html, { /* headers, status */ });
        }
        ```
    4.  Add/update tests in `src/redirector.test.ts` (or `responses.test.ts`) to verify the presence and structure of the `dataLayer` push in the HTML response body. Use string matching or potentially parse the HTML in tests if needed.
    5.  Run `npm test`.
    6.  Run linters/formatters.
    7.  Manually test with `wrangler dev` and browser dev tools. Inspect the source code of the no-redirect page for the `dataLayer.push` script. Use the browser console to inspect the `dataLayer` object after the page loads.

**Technical References:**
- GTM Data Layer: [https://developers.google.com/tag-manager/devguide](https://developers.google.com/tag-manager/devguide)
- `JSON.stringify()`: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- GTM Developer Guide - dataLayer: [https://developers.google.com/tag-manager/devguide#datalayer](https://developers.google.com/tag-manager/devguide#datalayer)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Integration Designs](../../../technical-design/integration_designs.md): Specifies GTM dataLayer usage and event types.
- [Component Designs](../../../technical-design/component_designs.md): Details Tracking System event generation.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines custom event and dataLayer structure.

**Dependencies:**
- Task 2.1 completed (GTM script injection).
- Task 2.3 completed (parameter processing).
- Task 1.1.3 completed (testing framework).

**Acceptance Criteria:**
- `isNoRedirect=1` response includes a `dataLayer.push` script before the GTM snippet.
- The pushed object contains the correct event name, destination URL, and tracking parameters object.
- Tracking parameters are safely included using `JSON.stringify`.
- Unit tests verify the structure and content of the data layer script in the response.
- Manual testing confirms `dataLayer` population in the browser. 