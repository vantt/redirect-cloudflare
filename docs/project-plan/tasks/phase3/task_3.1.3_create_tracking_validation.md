# docs/project-plan/tasks/phase3/task_3.1.3_create_tracking_validation.md

## Task: 3.1.3 Create Tracking Validation

**Description:**
Implement validation checks for extracted tracking parameters to ensure data quality (e.g., check for expected formats, non-empty required fields). Log warnings for invalid or missing parameters.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.1 Advanced Tracking -> Create tracking validation

**Detailed Specifications:**
- Input: The `TrackingParameters` object extracted in Task 2.3.
- Define validation rules:
    - Required parameters (e.g., `utm_source`, `utm_medium`, `utm_campaign` might be considered required for standard campaigns). Define which are strictly required.
    - Format validation (e.g., check if certain parameters conform to expected patterns, although this might be overly complex initially). **Decision: Focus on presence check for required params.**
- Create a function `validateTrackingParameters(params: TrackingParameters): { isValid: boolean; warnings: string[] }`.
- This function checks if required parameters are present and non-empty.
- It returns a boolean indicating overall validity (for potential future use, like blocking if critical params are missing) and an array of warning strings for logging.
- Log warnings using `console.warn` for missing or invalid required parameters identified by the validation function.

**TDD Approach:**

*   **Test Cases (Vitest):**
    *   Input: Valid params `{ utm_source: 'a', utm_medium: 'b', utm_campaign: 'c', ... }` -> Expected Output: `{ isValid: true, warnings: [] }`.
    *   Input: Missing required `utm_source` `{ utm_source: null, utm_medium: 'b', utm_campaign: 'c', ... }` -> Expected Output: `{ isValid: false, warnings: ["Missing required tracking parameter: utm_source"] }`.
    *   Input: Empty required `utm_campaign` `{ utm_source: 'a', utm_medium: 'b', utm_campaign: '', ... }` -> Expected Output: `{ isValid: false, warnings: ["Missing required tracking parameter: utm_campaign"] }`.
    *   Input: Missing multiple required params -> Expected Output: `{ isValid: false, warnings: ["Missing...: utm_source", "Missing...: utm_medium"] }`.
    *   Input: Only non-required params present `{ utm_content: 'd', xptdk: 'e', ...}` -> Expected Output: `{ isValid: false, warnings: ["Missing...: utm_source", "Missing...: utm_medium", "Missing...: utm_campaign"] }`.
*   **Implementation Steps:**
    1.  Define required tracking parameters (e.g., in `src/constants.ts`).
        ```typescript
        // src/constants.ts (Additions)
        export const REQUIRED_UTM_PARAMETERS = ['utm_source', 'utm_medium', 'utm_campaign'];
        ```
    2.  Create `src/tracking-validator.ts` and `src/tracking-validator.test.ts`.
    3.  Write failing tests for `validateTrackingParameters` covering the scenarios above.
    4.  Implement the `validateTrackingParameters` function.
        ```typescript
        // src/tracking-validator.ts
        import { TrackingParameters } from './tracking-parser';
        import { REQUIRED_UTM_PARAMETERS } from './constants';

        export interface ValidationResult {
            isValid: boolean;
            warnings: string[];
        }

        export function validateTrackingParameters(params: TrackingParameters): ValidationResult {
            const warnings: string[] = [];
            let isValid = true;

            REQUIRED_UTM_PARAMETERS.forEach(key => {
                // Check for null, undefined, or empty string
                if (params[key] === null || params[key] === undefined || params[key] === '') {
                    warnings.push(`Missing or empty required tracking parameter: ${key}`);
                    isValid = false;
                }
            });

            // Add other validation rules here if needed

            return { isValid, warnings };
        }
        ```
    5.  Integrate this validation into the main `fetch` handler (`src/index.ts`) *after* extracting parameters (Task 2.3).
    6.  Use `console.warn` to log any warnings returned by the validation function. **Decision:** Do not block requests based on `isValid` flag for now, just log warnings.
        ```typescript
        // src/index.ts (After tracking param extraction)
        const trackingParameters = extractTrackingParameters(destinationUrlString);
        console.log(`[TRACKING] Extracted params...`); // Existing log

        const validation = validateTrackingParameters(trackingParameters);
        if (!validation.isValid) {
            validation.warnings.forEach(warning => console.warn(`[TRACKING_VALIDATION] ${warning} for ${requestUrl}`));
        }
        // Continue processing regardless of validation outcome for now...
        ```
    7.  Add tests using `vi.spyOn(console, 'warn')` in `src/index.test.ts` to verify warnings are logged correctly based on input parameters.
    8.  Run `npm test`.
    9.  Run linters/formatters.

**Technical References:**
- `console.warn`: [https://developer.mozilla.org/en-US/docs/Web/API/console/warn](https://developer.mozilla.org/en-US/docs/Web/API/console/warn)

**Dependencies:**
- Task 2.3 (Tracking Parameter Processing)

**Acceptance Criteria:**
- `validateTrackingParameters` function correctly identifies missing/empty required parameters.
- Validation warnings are logged using `console.warn`.
- Unit tests verify validation logic and logging behavior.
- Code meets quality standards. 