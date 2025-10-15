# docs/project-plan/tasks/phase1/task_1.1.5_implement_basic_request_handling.md

## Task: 1.1.5 Implement Basic Request Handling

**Description:**
Modify the default worker fetch handler to perform the most basic function: retrieve the requested URL, log it, and return a simple placeholder response or handle basic routing.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.1 Basic Worker Setup -> Implement basic request handling

**Detailed Specifications:**
- The `fetch` handler in `src/index.ts` should receive the `Request` object.
- Extract the requested URL from `request.url`.
- Implement basic logging (using `console.log`) to output the requested URL.
- Return a simple `Response` object (e.g., `new Response("Request received for: " + url)`).
- Ensure the code adheres to linting and formatting rules.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Write a test that sends a request to a specific path (e.g., `/testpath`).
    *   Verify that the handler correctly extracts the full URL.
    *   Use `vi.spyOn(console, 'log')` to assert that `console.log` was called with the expected URL.
    *   Assert that the response body contains the expected placeholder text including the requested URL.
    *   Assert that the response status code is 200.
*   **Implementation Steps:**
    1.  Open `src/index.test.ts`. Write the failing tests described above.
    2.  Run `npm test` and verify the tests fail.
    3.  Open `src/index.ts`.
    4.  Modify the `fetch` handler:
        ```typescript
        export interface Env {
            // Define environment variables/bindings if needed (e.g., from KV task)
            // SETTINGS_KV: KVNamespace;
        }

        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                const url = request.url;
                console.log(`Received request for: ${url}`);

                // Basic routing/response logic placeholder
                // In the future, this will parse the hash, etc.
                return new Response(`Request received for: ${url}`, { status: 200 });
            },
        };
        ```
    5.  Run `npm test` again and verify the tests now pass.
    6.  Run `npm run lint` and `npm run format` to ensure code quality.
    7.  Optionally, run `wrangler dev` and manually send a request (e.g., using `curl` or browser) to `http://localhost:<port>/testpath` to see the logged output and response.

**Technical References:**
- Request object: [https://developers.cloudflare.com/workers/runtime-apis/request/](https://developers.cloudflare.com/workers/runtime-apis/request/)
- Response object: [https://developers.cloudflare.com/workers/runtime-apis/response/](https://developers.cloudflare.com/workers/runtime-apis/response/)
- Fetch handler: [https://developers.cloudflare.com/workers/learning/fetch-event-lifecycle/](https://developers.cloudflare.com/workers/learning/fetch-event-lifecycle/)
- Vitest mocking/spying: [https://vitest.dev/guide/mocking.html](https://vitest.dev/guide/mocking.html)
- FetchEvent: [https://developers.cloudflare.com/workers/runtime-apis/fetch-event/](https://developers.cloudflare.com/workers/runtime-apis/fetch-event/)

**Related Design & Specifications:**
- [URL Structure](../../../specs/url_structure.md): Defines the incoming URL format to be handled.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Architecture Overview](../../../technical-design/architecture_overview.md): Shows the Request Handler component.
- [Component Designs](../../../technical-design/component_designs.md): Details the Request Handler's expected logic.
- [Component Interactions](../../../technical-design/component_interactions.md): Shows how the Request Handler interacts.
- [URL Processing Mechanism](../../../technical-design/url_processing.md): Explains how the fragment-based URL is handled.

**Dependencies:**
- Task 1.1.1 completed (project initialized with `src/index.ts`).
- Task 1.1.3 completed (testing framework setup).

**Acceptance Criteria:**
- The worker correctly logs the incoming request URL.
- The worker returns a basic 200 response containing the requested URL.
- Unit tests for this basic handling pass.
- Code meets linting and formatting standards. 