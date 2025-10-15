# docs/project-plan/tasks/phase4/task_4.1.2_implement_caching_strategies.md

## Task: 4.1.2 Implement Caching Strategies

**Description:**
Review and implement appropriate caching strategies, both at the CDN level (Cache API) and potentially within the worker (e.g., for configuration fetched from KV), to reduce load and improve response times.

**Source Task:**
docs/project-plan/implementation.md -> Phase 4 -> 4.1 Performance Tuning -> Implement caching strategies

**Detailed Specifications:**
- **Review Response Caching (Task 1.3.4):** Currently set to `no-cache`. Re-evaluate if redirects (302) can be cached by browsers/CDNs for a short period (e.g., `Cache-Control: public, max-age=60`). Consider implications for tracking accuracy if redirects are cached aggressively. **Decision: Keep `no-cache` for redirects initially to prioritize tracking accuracy.** Revisit if performance dictates.
- **Cloudflare Cache API:**
    - Identify responses that *can* be cached (e.g., the `/health` check endpoint response, potentially static error pages if not bundled).
    - Use the Cache API (`caches.default`) within the worker to store and retrieve cacheable responses based on the request URL or a custom cache key.
    - Check the cache *before* generating a response; return the cached response if found and valid.
    - Put responses into the cache *after* generating them.
    - Define appropriate `Cache-Control` headers for responses put into the Cache API to control their TTL.
- **Internal Worker Caching (Less Common):**
    - If fetching configuration or mappings from KV frequently, consider caching this data in a global variable within the worker instance for its lifespan to reduce KV reads. Be mindful of stale data. *Decision: Defer unless KV read performance becomes an issue.*

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Test Cache API integration for cacheable endpoints (e.g., `/health`).
    *   Mock `caches.default.match()` and `caches.default.put()`.
    *   Mock `ctx.waitUntil` (as `put` is often done in `waitUntil`).
    *   Scenario 1 (Cache Miss): Request `/health`. Verify `match()` is called, returns `undefined`. Verify response is generated. Verify `put()` is called within `waitUntil` with the generated response.
    *   Scenario 2 (Cache Hit): Request `/health`. Verify `match()` is called, returns a mocked `Response`. Verify the handler returns this mocked response directly. Verify `put()` is *not* called.
    *   Verify appropriate `Cache-Control` headers are set on responses being `put` into the cache.
*   **Implementation Steps:**
    1.  Identify cacheable endpoints (e.g., `/health`).
    2.  Refactor the main `fetch` handler (`src/index.ts`) for these endpoints:
        ```typescript
        // src/index.ts (Cache API for /health)
        import { CACHE_HEADERS } from './constants'; // Assuming CACHE_HEADERS exists

        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                const url = new URL(request.url);
                const cache = caches.default; // Default cache API

                // --- Try Cache First for specific paths ---
                if (url.pathname === '/health') {
                    let response = await cache.match(request);
                    if (response) {
                        console.log("[CACHE] HIT for /health");
                        return response; // Return cached response
                    }
                    console.log("[CACHE] MISS for /health");
                    // Generate response if not in cache
                    response = new Response("OK", {
                         status: 200,
                         headers: { // Define cache duration for this response
                             'Cache-Control': 'public, max-age=60' // Cache health check for 60s
                         }
                    });
                    // Cache asynchronously
                    ctx.waitUntil(cache.put(request, response.clone()));
                    return response;
                }

                // --- Existing redirect logic (currently no caching) ---
                try {
                    // ... parse, validate, track, redirect ...
                    // Responses generated here still use no-cache headers (Task 1.3.4 / 1.4.1)
                } catch (error) {
                    // ... error handling (also uses no-cache headers) ...
                }
            }
        };
        ```
    3.  Write/update tests in `src/index.test.ts` using mocks for `caches.default` and `ctx.waitUntil` to verify cache hit/miss logic and `put` calls.
    4.  Run `npm test`.
    5.  Run linters/formatters.
    6.  Manually test cache behavior using `curl -v` multiple times for `/health`. Observe `cf-cache-status` header (HIT/MISS/EXPIRED) in responses after deployment. Check `Cache-Control` header.

**Technical References:**
- Cloudflare Cache API (Workers): [https://developers.cloudflare.com/workers/runtime-apis/cache/](https://developers.cloudflare.com/workers/runtime-apis/cache/)
- HTTP Caching (`Cache-Control`): [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- `cf-cache-status` header: [https://developers.cloudflare.com/cache/about/cdn-cache-status/](https://developers.cloudflare.com/cache/about/cdn-cache-status/)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Infrastructure](../../../technical-design/infrastructure.md): Platform caching features (Cache API, CDN tiers).
- [Component Designs](../../../technical-design/component_designs.md): Logic interacting with the cache.
- [Future Considerations](../../../technical-design/future_considerations.md): May detail advanced caching strategies.

**Dependencies:**
- Task 1.3.4 completed (basic caching strategy).
- Task 3.4.1 completed (performance monitoring to measure impact).

**Acceptance Criteria:**
- Cache API is used for cacheable endpoints (like `/health`).
- Cache hits return the cached response; cache misses generate and store the response.
- Appropriate `Cache-Control` headers are set for cached responses.
- Unit tests verify cache interaction logic using mocks.
- Manual testing confirms `cf-cache-status` HIT/MISS behavior. 