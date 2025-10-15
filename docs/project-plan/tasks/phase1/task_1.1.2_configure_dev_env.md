# docs/project-plan/tasks/phase1/task_1.1.2_configure_dev_env.md

## Task: 1.1.2 Configure Development Environment

**Description:**
Configure the `wrangler.toml` file for local development, including environment variables, secrets (if any planned early), and potential KV namespace bindings. Set up recommended VS Code extensions and linters/formatters.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.1 Basic Worker Setup -> Configure development environment

**Detailed Specifications:**
- Review and update `wrangler.toml` for basic settings: `name`, `main`, `compatibility_date`.
- Define a `[dev]` section for local development specifics.
- Add necessary `[vars]` for environment variables needed during local development (e.g., base redirect URL, GTM ID placeholder).
- If KV will be used, configure `kv_namespaces` for local simulation (binding name and preview ID).
- Set up ESLint and Prettier for code linting and formatting (add `.eslintrc.js`, `.prettierrc.js`, relevant scripts to `package.json`).

**TDD Approach:**

*   **Test Cases (Manual/Verification):**
    *   Verify `wrangler dev` command starts the local server without errors after configuration.
    *   Verify environment variables defined in `[vars]` are accessible within the worker during local development (e.g., via `console.log(env.MY_VAR)`).
    *   Verify KV namespace binding works locally (if configured).
    *   Verify linting (`npm run lint`) and formatting (`npm run format`) commands run correctly.
*   **Implementation Steps:**
    1.  Open `wrangler.toml`. Update `name`, `main` (e.g., `src/index.ts`), `compatibility_date`.
    2.  Add `[dev]` section if not present, configure `port` or other local settings if needed.
    3.  Add `[vars]` section with initial development variables.
    4.  (If using KV) Add `kv_namespaces` section. Create a preview namespace via `wrangler kv:namespace create "MY_KV_NAMESPACE" --preview` and add the binding (`binding = "MY_KV_NAMESPACE"`, `preview_id = "..."`) to `wrangler.toml`.
    5.  Install dev dependencies: `npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`.
    6.  Create configuration files: `.eslintrc.js`, `.prettierrc.js`. Configure basic rules.
    7.  Add scripts to `package.json`: `"lint": "eslint src/**/*.ts"`, `"format": "prettier --write src/**/*.ts"`.
    8.  Run `npm run lint` and `npm run format` to ensure setup is correct.

**Technical References:**
- `wrangler.toml` configuration: [https://developers.cloudflare.com/workers/wrangler/configuration/](https://developers.cloudflare.com/workers/wrangler/configuration/)
- Environment variables (`vars`): [https://developers.cloudflare.com/workers/wrangler/configuration/#vars](https://developers.cloudflare.com/workers/wrangler/configuration/#vars)
- KV Namespaces: [https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces](https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces)
- Wrangler `dev`: [https://developers.cloudflare.com/workers/wrangler/commands/#dev](https://developers.cloudflare.com/workers/wrangler/commands/#dev)
- ESLint: [https://eslint.org/](https://eslint.org/)
- Prettier: [https://prettier.io/](https://prettier.io/)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Infrastructure](../../../technical-design/infrastructure.md): Details platform components like KV.

**Dependencies:**
- Task 1.1.1 completed (project initialized).
- Wrangler CLI.

**Acceptance Criteria:**
- `wrangler.toml` is updated with core configuration and development settings.
- `wrangler dev` runs successfully.
- Environment variables are accessible locally.
- KV namespaces are bound and accessible locally (if configured).
- Linting and formatting tools are set up and functional. 