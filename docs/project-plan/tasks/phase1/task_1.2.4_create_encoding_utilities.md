# docs/project-plan/tasks/phase1/task_1.2.4_create_encoding_utilities.md

## Task: 1.2.4 Create URL Encoding/Decoding Utilities

**Description:**
Develop and test utility functions for URL encoding and decoding, specifically handling potential non-ASCII characters as mentioned in the specs (e.g., Vietnamese characters requiring UTF-8 encoding).

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.2 URL Processing -> Create URL encoding/decoding utilities

**Detailed Specifications:**
- Need functions for both encoding and decoding URL components.
- Encoding should use `encodeURIComponent` for robust encoding of parameters or path segments.
- Decoding should use `decodeURIComponent`.
- Pay special attention to UTF-8 character handling during testing.
- These utilities might be used when constructing redirect URLs or processing parameters if manual encoding/decoding is ever needed (though standard APIs like `URL` handle much of this automatically).

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   **Encoding:**
        *   Simple string: `test` -> `test`.
        *   String with spaces: `hello world` -> `hello%20world`.
        *   String with special chars: `?&=/` -> `%3F%26%3D%2F`.
        *   Vietnamese string: `nước` -> `n%C6%B0%E1%BB%9Bc`.
    *   **Decoding:**
        *   Simple encoded: `test` -> `test`.
        *   Encoded space: `hello%20world` -> `hello world`.
        *   Encoded special chars: `%3F%26%3D%2F` -> `?&=/`.
        *   Encoded Vietnamese: `n%C6%B0%E1%BB%9Bc` -> `nước`.
    *   **Round trip:** Encode then decode a complex string and verify it matches the original.
    *   Test decoding malformed sequences (e.g., `%E0%A4A`) - `decodeURIComponent` should throw an error.
*   **Implementation Steps:**
    1.  Create `src/encoding.ts` and `src/encoding.test.ts`.
    2.  Write failing tests for `encodeUrlComponent(str: string)` and `decodeUrlComponent(encodedStr: string)`. Include edge cases and UTF-8 examples.
    3.  Implement the functions using built-in `encodeURIComponent` and `decodeURIComponent`. Add try-catch blocks for decoding to handle potential errors gracefully.
        ```typescript
        // src/encoding.ts
        export function encodeUrlComponent(str: string): string {
            return encodeURIComponent(str);
        }

        export function decodeUrlComponent(encodedStr: string): string | null {
            try {
                return decodeURIComponent(encodedStr);
            } catch (e) {
                // URIError: malformed URI sequence
                console.error(`Failed to decode component: ${encodedStr}`, e);
                return null; // Or re-throw, depending on desired handling
            }
        }
        ```
    4.  Run `npm test` and verify tests pass.
    5.  Run linters/formatters.
    6.  (Self-correction): Note that the standard `URL` object handles most necessary decoding automatically when accessing properties like `pathname`, `searchParams`, etc. These utilities are primarily for cases where manual component encoding/decoding is required, perhaps before constructing a *new* URL or sending data to an external system.

**Technical References:**
- `encodeURIComponent()`: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- `decodeURIComponent()`: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
- `url_structure.md` (mentions encoding): `docs/specs/url_structure.md`

**Dependencies:**
- Task 1.1.3 (Testing Setup)

**Acceptance Criteria:**
- Encoding/decoding utility functions exist and pass unit tests.
- Tests cover standard cases, special characters, and UTF-8 characters.
- Error handling for malformed decoding sequences is implemented.
- Code meets quality standards. 