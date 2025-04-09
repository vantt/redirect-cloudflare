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

**Dependencies:**
- Task 1.1.1, 1.1.2, 1.1.3 completed.
- Potentially Task 1.1.4 if Env bindings are used.

**Acceptance Criteria:**
- The worker correctly logs the incoming request URL.
- The worker returns a basic 200 response containing the requested URL.
- Unit tests for this basic handling pass.
- Code meets linting and formatting standards. 