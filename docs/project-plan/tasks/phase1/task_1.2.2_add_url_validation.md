# docs/project-plan/tasks/phase1/task_1.2.2_add_url_validation.md

## Task: 1.2.2 Add URL Validation

**Description:**
Validate the extracted destination URL string to ensure it is a structurally valid URL and meets basic criteria (e.g., starts with http/https).

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.2 URL Processing -> Add URL validation

**Detailed Specifications:**
- Takes the destination URL string (potentially still encoded) extracted in Task 1.2.1.
- Attempts to parse the string using the standard `URL` constructor.
- Checks if the resulting URL object has a valid protocol (e.g., `http:` or `https:`).
- Optionally, check against a list of allowed protocols if more restrictions are needed.
- Returns `true` if valid, `false` otherwise.
- Handles potential errors during `URL` construction (invalid URL structure).

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Valid HTTP URL: `http://example.com` -> `true`.
    *   Valid HTTPS URL: `https://example.com/path?q=v` -> `true`.
    *   Valid encoded URL: `https%3A%2F%2Fexample.com` -> `true` (The `URL` constructor handles this).
    *   Invalid protocol: `ftp://example.com` -> `false`.
    *   Invalid protocol: `javascript:alert('xss')` -> `false`.
    *   Malformed URL: `not a url` -> `false`.
    *   URL without protocol: `example.com` -> `false` (unless logic is added to prepend `https://`).
    *   Empty string: `` -> `false`.
    *   Null input: `null` -> `false`.
*   **Implementation Steps:**
    1.  Add tests to `src/url-parser.test.ts` (or a new `src/url-validator.test.ts`) for a function `isValidDestinationUrl(urlString: string | null): boolean`.
    2.  Implement the `isValidDestinationUrl` function in `src/url-parser.ts` (or `src/url-validator.ts`).
        ```typescript
        // src/url-validator.ts (Example)
        export function isValidDestinationUrl(urlString: string | null): boolean {
            if (!urlString) {
                return false;
            }
            try {
                // URL constructor automatically decodes percent-encoded sequences
                const parsedUrl = new URL(urlString);
                // Allow only http and https protocols
                return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ;
            } catch (e) {
                // Invalid URL structure (TypeError)
                return false;
            }
        }
        ```
    3.  Integrate this validation check into the main `fetch` handler in `src/index.ts` after parsing the destination URL. If invalid, handle appropriately (log error, return error response).
    4.  Run `npm test` and verify tests pass.
    5.  Run linters/formatters.

**Technical References:**
- `URL` constructor: [https://developer.mozilla.org/en-US/docs/Web/API/URL/URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
- `URL.protocol`: [https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol](https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol)
- Security considerations (`javascript:` protocol): OWASP guidelines.
- OWASP Input Validation Cheat Sheet: [https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

**Related Design & Specifications:**
- [URL Structure](../../../specs/url_structure.md): Specifies constraints on URL components.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Component Designs](../../../technical-design/component_designs.md): Details the component handling validation.
- [Security Design](../../../technical-design/security_design.md): Defines security-related validation rules.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): May define error structures.

**Dependencies:**
- Task 1.2.1 completed (URL parsing logic exists).
- Task 1.1.3 completed (testing framework setup).

**Acceptance Criteria:**
- `isValidDestinationUrl` function correctly validates URL strings.
- Unit tests cover valid, invalid, and malicious URL patterns.
- The main fetch handler uses the validation logic.
- Code meets quality standards. 