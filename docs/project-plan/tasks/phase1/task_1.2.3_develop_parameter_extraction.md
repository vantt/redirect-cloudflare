# docs/project-plan/tasks/phase1/task_1.2.3_develop_parameter_extraction.md

## Task: 1.2.3 Develop Parameter Extraction

**Description:**
Extract relevant query parameters (specifically `isNoRedirect` and potentially others later) from the validated destination URL.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.2 URL Processing -> Develop parameter extraction

**Detailed Specifications:**
- Takes the validated destination URL string.
- Parses the URL string using the `URL` constructor to easily access query parameters via `url.searchParams`.
- Specifically looks for the `isNoRedirect` parameter.
- Interprets the value of `isNoRedirect`:
    - `"1"` means no redirect should occur.
    - `"0"` or parameter not present means redirection is allowed.
    - Any other value might be treated as default (redirect allowed) or logged as a potential issue.
- The function/logic should return an object or structure containing the extracted parameter values (e.g., `{ shouldRedirect: boolean }`).
- Handles cases where the destination URL has no query parameters.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   URL with `isNoRedirect=1`: `https://dest.com?isNoRedirect=1` -> `{ shouldRedirect: false }`.
    *   URL with `isNoRedirect=0`: `https://dest.com?p=v&isNoRedirect=0` -> `{ shouldRedirect: true }`.
    *   URL with `isNoRedirect` but invalid value: `https://dest.com?isNoRedirect=true` -> `{ shouldRedirect: true }` (assuming default).
    *   URL without `isNoRedirect`: `https://dest.com?p=v` -> `{ shouldRedirect: true }`.
    *   URL without any parameters: `https://dest.com` -> `{ shouldRedirect: true }`.
    *   URL with case variation: `https://dest.com?isNoRedirect=1` -> `{ shouldRedirect: false }`. (Confirm case sensitivity of `searchParams.get`).
*   **Implementation Steps:**
    1.  Add tests to `src/url-parser.test.ts` (or a new `src/parameter-extractor.test.ts`) for a function `extractControlParameters(destinationUrlString: string): { shouldRedirect: boolean }`.
    2.  Implement the `extractControlParameters` function.
        ```typescript
        // src/parameter-extractor.ts (Example)
        export interface ControlParameters {
            shouldRedirect: boolean;
            // Add other control params later if needed
        }

        export function extractControlParameters(destinationUrlString: string): ControlParameters {
            const defaultParams: ControlParameters = { shouldRedirect: true };
            try {
                const url = new URL(destinationUrlString);
                const noRedirectParam = url.searchParams.get('isNoRedirect'); // Case-sensitive get

                if (noRedirectParam === '1') {
                    return { ...defaultParams, shouldRedirect: false };
                }
                // For '0', missing, or other values, default is true
                return defaultParams;

            } catch (e) {
                // Should not happen if URL is pre-validated, but handle defensively
                console.error("Error parsing validated URL for params:", e);
                return defaultParams;
            }
        }
        ```
    3.  Integrate this extraction logic into the main `fetch` handler after URL validation. Store the result (e.g., the `shouldRedirect` flag) for later use in redirect handling.
    4.  Run `npm test` and verify tests pass.
    5.  Run linters/formatters.

**Technical References:**
- `URL.searchParams`: [https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams)
- `URLSearchParams`: [https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- `url_structure.md`: `docs/specs/url_structure.md`

**Related Design & Specifications:**
- [URL Structure](../../../specs/url_structure.md): Defines parameter location and format.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Component Designs](../../../technical-design/component_designs.md): Details the component handling extraction.
- [URL Processing Mechanism](../../../technical-design/url_processing.md): Explains fragment handling.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines structure for extracted parameters.
- [Integration Designs](../../../technical-design/integration_designs.md): May list parameters needed for integrations.

**Dependencies:**
- Task 1.2.1 completed (URL parsing logic exists).
- Task 1.1.3 completed (testing framework setup).

**Acceptance Criteria:**
- `extractControlParameters` correctly identifies the `isNoRedirect` parameter and returns the appropriate boolean flag.
- Unit tests cover various scenarios including missing, `1`, `0`, and other values for the parameter.
- The main fetch handler integrates the parameter extraction logic.
- Code meets quality standards. 