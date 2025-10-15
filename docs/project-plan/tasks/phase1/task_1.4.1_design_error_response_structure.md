# docs/project-plan/tasks/phase1/task_1.4.1_design_error_response_structure.md

## Task: 1.4.1 Design Error Response Structure

**Description:**
Define a consistent structure for error responses returned by the worker, potentially using JSON for machine-readable errors, while still providing a user-friendly message for simple text/plain responses.

**Source Task:**
docs/project-plan/implementation.md -> Phase 1 -> 1.4 Error Handling -> Design error response structure

**Detailed Specifications:**
- Errors currently return plain text messages with status codes (e.g., 400, potentially 500 later).
- Define a standard JSON error object structure. Example:
  ```json
  {
    "error": {
      "code": "INVALID_URL", // Machine-readable error code
      "message": "Bad Request: Invalid URL format or destination.", // User-friendly message
      "requestId": "<unique-request-id>" // Optional, for correlation
    }
  }
  ```
- Create a utility function `createErrorResponse(status: number, errorCode: string, message: string, requestId?: string): Response`.
- This function should:
    - Set the appropriate HTTP status code (e.g., 400, 500).
    - Set the `Content-Type` header to `application/json`.
    - Add standard cache-preventing headers (from Task 1.3.4).
    - Construct the JSON body according to the defined structure.
- Define initial error codes (e.g., `INVALID_URL`, `REDIRECT_LOOP_DETECTED`, `INTERNAL_ERROR`).

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Test `createErrorResponse` for a 400 error (`INVALID_URL`). Verify status code, `Content-Type` header, cache headers, and the structure/content of the JSON body.
    *   Test `createErrorResponse` for a 500 error (`INTERNAL_ERROR`). Verify similar aspects.
    *   Test with and without a `requestId`.
*   **Implementation Steps:**
    1.  Define error codes as constants (e.g., in `src/constants.ts`).
        ```typescript
        // src/constants.ts (Additions)
        export const ERROR_CODE_INVALID_URL = "INVALID_URL";
        export const ERROR_CODE_REDIRECT_LOOP = "REDIRECT_LOOP_DETECTED";
        export const ERROR_CODE_INTERNAL_ERROR = "INTERNAL_ERROR";
        // ... add more as needed
        ```
    2.  Create `src/errors.ts` and `src/errors.test.ts`.
    3.  Write failing tests for the `createErrorResponse` function in `src/errors.test.ts`.
    4.  Implement the `createErrorResponse` function in `src/errors.ts`.
        ```typescript
        // src/errors.ts
        import { CACHE_HEADERS } from './redirector'; // Assuming CACHE_HEADERS is exported or moved

        interface ErrorResponseBody {
            error: {
                code: string;
                message: string;
                requestId?: string;
            };
        }

        export function createErrorResponse(
            status: number,
            errorCode: string,
            message: string,
            requestId?: string
        ): Response {
            const body: ErrorResponseBody = {
                error: {
                    code: errorCode,
                    message: message,
                },
            };
            if (requestId) {
                body.error.requestId = requestId;
            }

            return new Response(JSON.stringify(body), {
                status: status,
                headers: {
                    'Content-Type': 'application/json',
                    ...CACHE_HEADERS, // Reuse cache headers
                },
            });
        }
        ```
        *Self-correction: Ensure `CACHE_HEADERS` are accessible, perhaps move them to `constants.ts`.*
    5.  Refactor the main `fetch` handler (`src/index.ts`) and potentially other modules to use `createErrorResponse` instead of manually creating `new Response(...)` for errors. Pass appropriate status codes and error codes.
        ```typescript
        // src/index.ts (Example usage)
        import { createErrorResponse } from './errors';
        import { HTTP_STATUS_BAD_REQUEST, ERROR_CODE_INVALID_URL, ERROR_CODE_REDIRECT_LOOP } from './constants';
        // ...
        if (!destinationUrlString || !isValidDestinationUrl(destinationUrlString)) {
            // Generate request ID if needed here
            return createErrorResponse(HTTP_STATUS_BAD_REQUEST, ERROR_CODE_INVALID_URL, "Invalid URL format or destination.");
        }
        if (isRedirectLoop(destinationUrlString, env.REDIRECT_SERVICE_HOSTNAME)) {
             return createErrorResponse(HTTP_STATUS_BAD_REQUEST, ERROR_CODE_REDIRECT_LOOP, "Potential redirect loop detected.");
        }
        ```
    6.  Run `npm test` and verify tests pass.
    7.  Run linters/formatters.

**Technical References:**
- JSON standard: [https://www.json.org/](https://www.json.org/)
- `Content-Type` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
- RFC 7807 (Problem Details for HTTP APIs): [https://datatracker.ietf.org/doc/html/rfc7807](https://datatracker.ietf.org/doc/html/rfc7807)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines the structure of error responses.
- [Component Designs](../../../technical-design/component_designs.md): Shows components generating errors.
- [Component Interactions](../../../technical-design/component_interactions.md): Illustrates error handling flows.

**Dependencies:**
- Task 1.3.2 (Status Code Management)
- Task 1.3.4 (Caching Strategy - for headers)
- Understanding of HTTP status codes for errors (4xx, 5xx).
- Previous tasks defining potential error sources (e.g., validation, parsing).

**Acceptance Criteria:**
- Standard JSON error response structure is defined and implemented in `createErrorResponse`.
- Function correctly sets status, headers (`Content-Type`, caching), and JSON body.
- Error handling points in the code are refactored to use the new error response function.
- Unit tests verify the error response generation.
- Code meets quality standards. 