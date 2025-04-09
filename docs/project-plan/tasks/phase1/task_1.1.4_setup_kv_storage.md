# docs/project-plan/tasks/phase1/task_1.1.4_setup_kv_storage.md

## Task: 1.1.4 Set Up Cloudflare KV Storage

**Description:**
Create and configure Cloudflare KV namespaces required for the application (if any) and bind them to the worker for both local development/testing and deployment environments.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.1 Basic Worker Setup -> Set up Cloudflare KV storage (...)

**Detailed Specifications:**
- Identify the need for KV storage (e.g., storing configuration, short URL mappings, etc.). *Decision: Initially, we might not need KV, but setting up the binding structure is good practice if future needs arise (like dynamic config).* 
- Create a KV namespace using Wrangler CLI for production/preview.
- Create a preview KV namespace using Wrangler CLI for local development simulation.
- Update `wrangler.toml` to include the `kv_namespaces` bindings for both production and preview environments.
- Ensure the binding name is accessible via the `env` object in the worker code.

**TDD Approach:**

*   **Test Cases (using Vitest/Miniflare):**
    *   Write a test that attempts to access the KV namespace binding via the `env` object (e.g., `env.SETTINGS_KV`). Verify it's defined.
    *   Write a test that attempts a `put` operation to the KV namespace binding locally.
    *   Write a test that performs a `put` and then a `get` operation to verify data persistence within the test run (Miniflare simulates this).
*   **Implementation Steps:**
    1.  Decide on a binding name (e.g., `SETTINGS_KV`).
    2.  Create the preview namespace: `npx wrangler kv:namespace create "SETTINGS_KV" --preview`
    3.  Note the returned `preview_id`.
    4.  Create the production namespace: `npx wrangler kv:namespace create "SETTINGS_KV"`
    5.  Note the returned `id`.
    6.  Open `wrangler.toml`.
    7.  Add the `kv_namespaces` array if it doesn't exist.
    8.  Add the binding configuration:
        ```toml
        kv_namespaces = [
          { binding = "SETTINGS_KV", id = "<production_id>", preview_id = "<preview_id>" }
        ]
        ```
        (Replace `<production_id>` and `<preview_id>` with the actual IDs).
    9.  Write the tests described above in a relevant test file (e.g., `src/kv.test.ts` or add to `src/index.test.ts`).
    10. Update the worker code (`src/index.ts`) minimally to accept the `SETTINGS_KV` binding in its environment type definition if using TypeScript.
        ```typescript
        export interface Env {
            SETTINGS_KV: KVNamespace;
            // Other bindings...
        }
        
        export default {
            async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
                // Access env.SETTINGS_KV here
                // ...
                return new Response('Hello Worker!');
            },
        };
        ```
    11. Run `npm test` to ensure tests related to KV access pass locally.
    12. Run `wrangler dev` and verify no errors related to KV binding occur.

**Technical References:**
- KV Namespaces: [https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces](https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces)
- Using KV in Workers: [https://developers.cloudflare.com/workers/runtime-apis/kv/](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- Wrangler KV Commands: [https://developers.cloudflare.com/workers/wrangler/commands/#kvnamespace](https://developers.cloudflare.com/workers/wrangler/commands/#kvnamespace)
- Testing KV with Miniflare: [https://miniflare.dev/testing/kv](https://miniflare.dev/testing/kv) (or via `vitest-environment-miniflare` which uses Miniflare)

**Dependencies:**
- Task 1.1.1 completed.
- Task 1.1.2 completed (`wrangler.toml` exists).
- Task 1.1.3 completed (testing framework setup).
- Wrangler CLI authenticated with Cloudflare account.

**Acceptance Criteria:**
- KV namespaces created in Cloudflare (production and preview).
- `wrangler.toml` updated with correct KV bindings.
- Worker code can access the KV namespace via the `env` object.
- Unit tests verifying basic KV access (`put`/`get`) pass locally.
- `wrangler dev` runs without KV binding errors. 