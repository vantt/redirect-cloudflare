# docs/project-plan/tasks/phase2/task_2.3_create_tracking_parameter_processing.md

## Task: 2.3 Create Tracking Parameter Processing

**Description:**
Implement logic to automatically extract standard UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) and known platform-specific parameters (Shopee `xptdk`, Facebook `ref`) from the *destination URL* query string.

**Source Task:**
docs/project-plan/implementation.md -> Phase 2: Tracking Integration -> Create tracking parameter processing (including automatic extraction of UTM/platform params from destination URL)

**Detailed Specifications:**
- Input: The validated destination URL string.
- Use the `URL` object and `searchParams` to access query parameters.
- Define lists of known UTM and platform parameters.
- Iterate through the known parameters and extract their values from the `searchParams`.
- Store the extracted parameters in a structured object (e.g., `TrackingParameters`). Handle cases where parameters are missing (value should be `null` or `undefined`).
- Ensure parameter names are handled case-sensitively or consistently (e.g., lowercase all keys). **Decision: Use exact case as defined.**

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Input URL: `https://dest.com?utm_campaign=summer&utm_source=fb&utm_medium=cpc` -> Expected Output: `{ utm_campaign: 'summer', utm_source: 'fb', utm_medium: 'cpc', utm_content: null, utm_term: null, xptdk: null, ref: null }`.
    *   Input URL: `https://shopee.vn/product?xptdk=abc123&utm_campaign=shopee_sale` -> Expected Output: `{ utm_campaign: 'shopee_sale', ..., xptdk: 'abc123', ... }`.
    *   Input URL: `https://m.me/page?ref=xyz` -> Expected Output: `{ ..., ref: 'xyz', ... }`.
    *   Input URL with mixed known and unknown params: `https://dest.com?utm_source=google&other=value` -> Expected Output: `{ utm_source: 'google', ..., other parameters ignored }`.
    *   Input URL with no relevant params: `https://dest.com?foo=bar` -> Expected Output: All known parameter values are `null`.
    *   Input URL with empty values: `https://dest.com?utm_source=` -> Expected Output: `{ utm_source: '', ... }`.
*   **Implementation Steps:**
    1.  Define constants for known parameter names (UTM, platform-specific).
        ```typescript
        // src/constants.ts (Additions)
        export const UTM_PARAMETERS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        export const PLATFORM_PARAMETERS = ['xptdk', 'ref']; // Add more as identified
        export const KNOWN_TRACKING_PARAMS = [...UTM_PARAMETERS, ...PLATFORM_PARAMETERS];
        ```
    2.  Create `src/tracking-parser.ts` and `src/tracking-parser.test.ts`.
    3.  Define an interface for the output structure.
        ```typescript
        // src/tracking-parser.ts
        export interface TrackingParameters {
            utm_source: string | null;
            utm_medium: string | null;
            utm_campaign: string | null;
            utm_content: string | null;
            utm_term: string | null;
            xptdk: string | null; // Shopee
            ref: string | null;   // Facebook Messenger
            // Add other platform params here
            [key: string]: string | null; // Allow index signature
        }
        ```
    4.  Write failing tests in `src/tracking-parser.test.ts` for a function `extractTrackingParameters(destinationUrlString: string): TrackingParameters`. Cover the scenarios listed above.
    5.  Implement the `extractTrackingParameters` function.
        ```typescript
        // src/tracking-parser.ts (Implementation)
        import { KNOWN_TRACKING_PARAMS } from './constants';

        export function extractTrackingParameters(destinationUrlString: string): TrackingParameters {
            const params: Partial<TrackingParameters> = {}; // Use Partial initially
            try {
                const url = new URL(destinationUrlString);
                KNOWN_TRACKING_PARAMS.forEach(key => {
                    // searchParams.get returns null if param not present
                    params[key] = url.searchParams.get(key);
                });
            } catch (e) {
                console.error("Error parsing destination URL for tracking params:", e);
                // Return empty object or defaults in case of error? Decide handling.
                // For now, return defaults (all null)
                 KNOWN_TRACKING_PARAMS.forEach(key => { params[key] = null; });
            }
            // Ensure all keys are present, even if null
            const finalParams: TrackingParameters = {} as TrackingParameters;
             KNOWN_TRACKING_PARAMS.forEach(key => { finalParams[key] = params[key] ?? null; });
            return finalParams;
        }
        ```
    6.  Integrate this function into the main `fetch` handler (`src/index.ts`). Call it after validating the destination URL. The resulting `trackingParameters` object will be used later for sending data to analytics platforms (GTM data layer, server-side events).
    7.  Run `npm test` and verify tests pass.
    8.  Run linters/formatters.

**Technical References:**
- `URL.searchParams`: [https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams)
- `URLSearchParams.get()`: [https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get)
- UTM Parameters overview: [https://support.google.com/analytics/answer/1033863](https://support.google.com/analytics/answer/1033863)
- `url_structure.md`: `docs/specs/url_structure.md`

**Related Design & Specifications:**
- [URL Structure](../../../specs/url_structure.md): Defines incoming parameter format.
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Integration Designs](../../../technical-design/integration_designs.md): Specifies target parameter formats for GTM/GA4.
- [Component Designs](../../../technical-design/component_designs.md): Details the Tracking System's processing logic.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines structures for raw and processed parameters.

**Dependencies:**
- Task 1.2.3 completed (parameter extraction).
- Task 2.1/2.2 completed (integration points defined).
- Task 1.1.3 completed (testing framework).

**Acceptance Criteria:**
- `extractTrackingParameters` function correctly extracts known UTM and platform parameters from the destination URL query string.
- Function handles missing parameters gracefully (returns null).
- Unit tests cover various combinations of parameters and edge cases.
- The main fetch handler integrates the parameter extraction.
- Code meets quality standards. 