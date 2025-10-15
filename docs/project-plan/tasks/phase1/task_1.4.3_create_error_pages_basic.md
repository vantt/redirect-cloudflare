# docs/project-plan/tasks/phase1/task_1.4.3_create_error_pages_basic.md

## Task: 1.4.3 Create Error Pages (Basic)

**Description:**
Create very basic, static HTML error pages for common errors (like 400 Bad Request, 500 Internal Server Error) to be returned instead of plain text or JSON when appropriate (e.g., if the request `Accept` header indicates HTML preference).

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.4 Error Handling -> Create error pages

**Detailed Specifications:**
- Create simple HTML files (e.g., `error-400.html`, `error-500.html`) with user-friendly messages.
- Include placeholders in the HTML for dynamic content like error code or request ID (e.g., `{{ERROR_MESSAGE}}`, `{{REQUEST_ID}}`).
- Modify the `createErrorResponse` function (or create a wrapper) to:
    - Check the `Accept` header of the incoming request (`request.headers.get('Accept')`).
    - If the header indicates a preference for `text/html` (e.g., contains `text/html` with a higher q-factor than `application/json`), attempt to return the HTML error page.
    - If returning HTML, read the corresponding static HTML file content.
    - Replace placeholders in the HTML content with actual error details (message, code, request ID).
    - Return a `Response` with the HTML content, the correct status code, and `Content-Type: text/html`.
    - Fall back to the JSON response if HTML is not preferred, or if reading/parsing the HTML file fails.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Test `createErrorResponse` (or wrapper):
        *   Request with `Accept: application/json` -> Expected: JSON response (verify using existing tests).
        *   Request with `Accept: text/html` -> Expected: HTML response. Verify status code, `Content-Type: text/html`, and body containing substituted error message/code.
        *   Request with `Accept: text/html, application/json;q=0.9` -> Expected: HTML response.
        *   Request with `Accept: application/json, text/html;q=0.9` -> Expected: JSON response.
        *   Request with no `Accept` header -> Expected: JSON response (default).
    *   Need to mock file reading for HTML templates within tests, or structure code so template rendering is testable separately. **Decision: Focus tests on the Accept header logic and response Content-Type/status, assuming template rendering works.**
*   **Implementation Steps:**
    1.  Create basic HTML files `static/error-400.html` and `static/error-500.html`.
        ```html
        <!-- static/error-400.html -->
        <!DOCTYPE html><html><head><title>Bad Request</title></head>
        <body><h1>Bad Request</h1><p>{{ERROR_MESSAGE}}</p>
        <p><small>Error Code: {{ERROR_CODE}}</small></p>
        <!-- <p><small>Request ID: {{REQUEST_ID}}</small></p> -->
        </body></html>
        ```
    2.  Refactor `src/errors.ts`. Extract JSON body creation and Response generation. Add logic to check `Accept` header.
    3.  Use simple string replacement for placeholders initially. (Consider using a proper templating engine later if complexity increases).
    4.  *Challenge:* Directly reading files inside Worker code is not standard. Options:
        *   **Option A (Bundling):** Import HTML as strings using bundler features (e.g., esbuild text loader, Webpack raw-loader). This is often the simplest for Workers.
        *   **Option B (KV Store):** Store HTML templates in KV. Read from KV when needed. Requires KV setup (Task 1.1.4).
        *   **Option C (External Fetch):** Host HTML externally and fetch it (adds latency).
        *   **Decision: Assume Option A (Bundling)**. Modify build setup if needed to support importing HTML as strings.
        ```typescript
        // src/errors.ts (Conceptual Refactor)
        import { CACHE_HEADERS } from './constants'; // Assuming moved
        import error400HtmlTemplate from '../static/error-400.html'; // Requires build setup
        import error500HtmlTemplate from '../static/error-500.html'; // Requires build setup

        // ... (ErrorResponseBody interface) ...

        function renderHtmlError(template: string, code: string, message: string): string {
            // Basic placeholder replacement
            return template.replace('{{ERROR_CODE}}', code).replace('{{ERROR_MESSAGE}}', message);
        }

        export function createErrorResponse(
            request: Request, // Need request object for Accept header
            status: number,
            errorCode: string,
            message: string,
            requestId?: string
        ): Response {
            const acceptHeader = request.headers.get('Accept') || '';
            const prefersHtml = acceptHeader.includes('text/html') && (!acceptHeader.includes('application/json') || acceptHeader.indexOf('text/html') < acceptHeader.indexOf('application/json')); // Simplified check

            if (prefersHtml) {
                let htmlContent = '';
                if (status === 400 || status === 404 /* etc */) {
                    htmlContent = renderHtmlError(error400HtmlTemplate, errorCode, message);
                } else { // Default to 500 for others
                    htmlContent = renderHtmlError(error500HtmlTemplate, errorCode, message);
                }
                return new Response(htmlContent, {
                    status: status,
                    headers: { 'Content-Type': 'text/html', ...CACHE_HEADERS },
                });
            } else {
                // Fallback to JSON
                const body: ErrorResponseBody = { /* ... create JSON body ... */ };
                 if (requestId) body.error.requestId = requestId;
                return new Response(JSON.stringify(body), {
                    status: status,
                    headers: { 'Content-Type': 'application/json', ...CACHE_HEADERS },
                });
            }
        }

        // Update calls in src/index.ts to pass the 'request' object
        // e.g., return createErrorResponse(request, HTTP_STATUS_BAD_REQUEST, ...);
        ```
    5.  Update tests in `src/errors.test.ts` to pass the mocked `Request` object with different `Accept` headers and verify `Content-Type` and status.
    6.  Run `npm test`.
    7.  Configure build tool (e.g., Wrangler/esbuild) to handle `.html` imports as text/strings if needed.
    8.  Manually test with `wrangler dev` using `curl` with different `Accept` headers (`-H "Accept: text/html"` vs `-H "Accept: application/json"`) for error-triggering URLs.

**Technical References:**
- `Accept` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)
- Content negotiation: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation)
- Wrangler `[rules]` for including assets: [https://developers.cloudflare.com/workers/wrangler/configuration/#bundling](https://developers.cloudflare.com/workers/wrangler/configuration/#bundling) (May need adjustment for direct import)
- Esbuild Text Loader: [https://esbuild.github.io/content-types/#text](https://esbuild.github.io/content-types/#text)
- Response object (HTML): [https://developers.cloudflare.com/workers/runtime-apis/response/#html](https://developers.cloudflare.com/workers/runtime-apis/response/#html)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines how error responses trigger these pages.
- [Infrastructure](../../../technical-design/infrastructure.md): May mention hosting/CDN for error pages.
- [Component Designs](../../../technical-design/component_designs.md): Details component logic for serving error pages.

**Dependencies:**
- Task 1.4.1 completed (error response structure designed).
- Task 1.1.5 completed (request handler to serve responses).
- Basic HTML/CSS knowledge.

**Acceptance Criteria:**
- Basic static HTML error pages exist.
- Error response generation logic checks `Accept` header.
- HTML response with substituted content is returned when HTML is preferred.
- JSON response is returned otherwise or as fallback.
- Unit tests verify content negotiation logic based on `Accept` header.
- Code meets quality standards. 