# docs/project-plan/tasks/phase3/task_3.4.4_add_system_health_checks.md

## Task: 3.4.4 Add System Health Checks

**Description:**
Implement basic health checks to verify the worker is responsive and core functionality (like basic redirection) is working.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.4 Monitoring Tools -> Add system health checks

**Detailed Specifications:**
- **Option A (Simple Endpoint):**
    - Create a specific path (e.g., `/health`) within the worker that doesn't perform complex logic but returns a simple 200 OK response (e.g., `new Response("OK")`).
    - Use Cloudflare Health Checks (or an external monitoring tool like UptimeRobot) to periodically ping this `/health` endpoint.
    - Configure the health check to expect a 200 status code.
    - Set up alerts within the health check tool if the endpoint fails (non-200 response or timeout).
- **Option B (Basic Redirect Test):**
    - Use Cloudflare Health Checks to monitor the main redirect URL itself.
    - Configure a check that sends a request to `https://redirect.example.com#https://example.com` (a simple, known-good destination).
    - Configure the health check to expect a 302 status code and potentially check if the `Location` header contains `https://example.com`.
    - This provides a more end-to-end check but might be slightly less reliable if the target `example.com` has issues.
- **Decision:** Implement **Option A (Simple Endpoint)** first for basic worker responsiveness. Consider adding Option B as a secondary, more comprehensive check.

**TDD Approach:**
- Not applicable for external health check setup. Test the endpoint itself.
*   **Test Cases (Vitest):**
    *   Write a test for the main `fetch` handler (`src/index.ts`).
    *   Input: Request to `/health`.
    *   Expected Response: Status 200, Body "OK".
*   **Manual Testing:**
    *   Configure Cloudflare Health Check (or external tool) pointing to `https://your-worker-url/health`.
    *   Verify the health check reports success.
    *   Temporarily modify the worker to return non-200 for `/health`. Verify the health check fails and sends an alert.

**Implementation Steps:**
1.  Modify the main `fetch` handler (`src/index.ts`) to add routing for the `/health` path.
    ```typescript
    // src/index.ts (Add routing for /health)
    export default {
        async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
            const url = new URL(request.url); // Parse URL for pathname

            // Health check endpoint
            if (url.pathname === '/health') {
                return new Response("OK", { status: 200 });
            }

            // --- Existing redirect logic ---
            try {
                // ... (parse hash, validate, track, redirect/respond) ...
            } catch (error) {
                // ... (error handling) ...
            }
        }
    };
    ```
2.  Add a unit test in `src/index.test.ts` to verify the `/health` endpoint returns 200 OK.
3.  Run `npm test`.
4.  Deploy the worker.
5.  In Cloudflare Dashboard:
    *   Go to Traffic -> Health Checks -> Create.
    *   Configure Name, Check Region, Endpoint Path (`/health`), Expected Code (200). Set interval/timeouts.
    *   Link to a Notification destination (created in Task 3.4.2) for failure alerts.
    *   Save the Health Check.
6.  Monitor the Health Check status in the Cloudflare dashboard.

**Technical References:**
- Cloudflare Health Checks: [https://developers.cloudflare.com/health-checks/](https://developers.cloudflare.com/health-checks/)
- URL API (`pathname`): [https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname)

**Dependencies:**
- Task 3.4.2 (Notification Destinations configured)
- Worker deployed.

**Acceptance Criteria:**
- Worker responds with 200 OK on the `/health` endpoint.
- Unit test verifies the `/health` endpoint.
- Cloudflare Health Check is configured to monitor the `/health` endpoint.
- Health check reports success for a healthy worker.
- Health check failure triggers a notification. 