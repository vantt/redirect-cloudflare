# docs/project-plan/tasks/phase1/task_1.1.1_init_workers_project.md

## Task: 1.1.1 Initialize Cloudflare Workers Project

**Description:**
Set up the basic file structure and configuration for a new Cloudflare Workers project using the Wrangler CLI.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.1 Basic Worker Setup -> Initialize Cloudflare Workers project

**Detailed Specifications:**
- A new directory should be created for the Worker source code (e.g., `src/`).
- A `wrangler.toml` configuration file should be generated at the project root.
- A basic `package.json` should exist for managing dependencies.
- A simple entry point file (e.g., `src/index.js` or `src/index.ts`) should be created with a basic fetch handler.

**TDD Approach:**

*   **Test Cases (Manual/Setup Verification):**
    *   Verify that running `wrangler init .` creates the expected directory structure (`src/`, `wrangler.toml`, `package.json`).
    *   Verify that the initial `src/index.js` (or `.ts`) contains a basic `fetch` event listener.
    *   Verify that `npm install` installs necessary basic dependencies (like `@cloudflare/workers-types`).
*   **Implementation Steps:**
    1.  Choose a project name (e.g., `url-redirect-worker`).
    2.  Navigate to the desired parent directory in the terminal.
    3.  Run `npx wrangler init .`. Follow the prompts (e.g., choose starter template).
    4.  Run `npm install`.

**Technical References:**
- Wrangler CLI `init`: [https://developers.cloudflare.com/workers/wrangler/commands/#init](https://developers.cloudflare.com/workers/wrangler/commands/#init)
- Worker Templates: [https://github.com/cloudflare/workers-sdk/tree/main/templates](https://github.com/cloudflare/workers-sdk/tree/main/templates)
- Fetch handler: [https://developers.cloudflare.com/workers/learning/fetch-event-lifecycle/](https://developers.cloudflare.com/workers/learning/fetch-event-lifecycle/)

**Related Design & Specifications:**
- [Infrastructure](../../../technical-design/infrastructure.md): Confirms the use of Cloudflare Workers.
- [Architecture Overview](../../../technical-design/architecture_overview.md): Shows the single-worker architecture context.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.

**Dependencies:**
- Node.js and npm/npx installed.

**Acceptance Criteria:**
- A new directory exists containing `src/index.js` (or `.ts`), `wrangler.toml`, and `package.json`.
- `npm install` runs without errors.
- The basic project structure is ready for further configuration and coding. 