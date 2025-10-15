# docs/project-plan/tasks/phase1/task_1.2.1_implement_url_parsing.md

## Task: 1.2.1 Implement URL Parsing Logic (Hash Fragment)

**Description:**
Implement the core logic to parse the incoming request URL, specifically extracting the destination URL and its parameters from the hash fragment (`#`) as defined in the `url_structure.md` specification.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.2 URL Processing -> Implement URL parsing logic (specifically handling destination URLs from hash fragments)

**Detailed Specifications:**
- The parser should handle URLs of the format `https://redirect.example.com#[destination-url]?param=value`.
- It must correctly identify and isolate the part of the URL string *after* the `#`.
- The isolated part (destination URL with its query string) should be treated as the target for further processing (validation, parameter extraction, redirection).
- If no `#` is present, or if the part after `#` is empty, it should be treated as an invalid request scenario (to be handled by error handling later).
- The function should handle potential encoding in the hash fragment (though decoding might be a separate step/utility).

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Test case with a valid URL containing a hash and destination URL: `https://base.com#https://dest.com?p1=v1` -> Expected output: `https://dest.com?p1=v1`.
    *   Test case with a valid URL containing a hash, destination URL, and hash fragments within the destination: `https://base.com#https://dest.com?p1=v1#frag` -> Expected output: `https://dest.com?p1=v1#frag`.
    *   Test case with URL encoding in the hash: `https://base.com#https%3A%2F%2Fdest.com%3Fp1%3Dv1` -> Expected output: `https%3A%2F%2Fdest.com%3Fp1%3Dv1`.
    *   Test case with a URL containing `#` but no destination: `https://base.com#` -> Expected output: `null` or empty string (indicating invalid).
    *   Test case with a URL containing no `#`: `https://base.com/path` -> Expected output: `null` or empty string.
    *   Test case with only the base URL: `https://base.com` -> Expected output: `null` or empty string.
*   **Implementation Steps:**
    1.  Create a new file `src/url-parser.ts` (or similar) and `src/url-parser.test.ts`.
    2.  Write the failing tests in `url-parser.test.ts` covering the scenarios above for a function, e.g., `parseDestinationUrlFromHash`.
    3.  Implement the `parseDestinationUrlFromHash(requestUrl: string): string | null` function in `src/url-parser.ts`. Use `URL` object or string manipulation (`indexOf('#')`, `substring`) to find and extract the fragment.
        ```typescript
        // src/url-parser.ts
        export function parseDestinationUrlFromHash(requestUrl: string): string | null {
            try {
                const hashIndex = requestUrl.indexOf('#');
                if (hashIndex === -1 || hashIndex === requestUrl.length - 1) {
                    return null; // No hash or empty hash
                }
                return requestUrl.substring(hashIndex + 1);
            } catch (e) {
                console.error("Error parsing URL hash:", e);
                return null;
            }
        }
        ```
    4.  Refactor the main `fetch` handler in `src/index.ts` to use this new parsing function. Handle the `null` case (log an error, return a placeholder error response for now).
    5.  Run `npm test` and verify all tests pass.
    6.  Run linters/formatters.

**Technical References:**
- URL Standard: [https://url.spec.whatwg.org/](https://url.spec.whatwg.org/)
- `URL` API (useful for parsing the *destination* URL later): [https://developer.mozilla.org/en-US/docs/Web/API/URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- String manipulation (`indexOf`, `substring`): Standard JS docs.
- `url_structure.md`: `docs/specs/url_structure.md`

**Related Design & Specifications:**
- [URL Structure](../../../specs/url_structure.md): Defines the exact structure to be parsed.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Component Designs](../../../technical-design/component_designs.md): Details the component handling URL parsing.
- [URL Processing Mechanism](../../../technical-design/url_processing.md): Explains how the fragment-based URL is handled.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines internal data structures for parsed URLs.
- [Security Design](../../../technical-design/security_design.md): Covers safe handling of URL data.

**Dependencies:**
- Task 1.1.5 completed (basic request handler exists).
- Task 1.1.3 completed (testing framework setup).

**Acceptance Criteria:**
- `parseDestinationUrlFromHash` function correctly extracts the destination URL string from the hash fragment.
- Unit tests covering various valid and invalid hash scenarios pass.
- The main fetch handler integrates the parser.
- Code meets quality standards. 