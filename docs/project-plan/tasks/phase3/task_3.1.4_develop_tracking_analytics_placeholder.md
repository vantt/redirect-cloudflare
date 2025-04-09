# docs/project-plan/tasks/phase3/task_3.1.4_develop_tracking_analytics_placeholder.md

## Task: 3.1.4 Develop Tracking Analytics (Placeholder/Design)

**Description:**
Design the approach for storing and analyzing processed tracking data. This might involve pushing structured logs to a dedicated logging service or using Cloudflare Analytics Engine.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.1 Advanced Tracking -> Develop tracking analytics

**Detailed Specifications:**
- Goal: Enable analysis of redirect events, parameters used, success/failure rates, etc., beyond what standard GA4/GTM offers.
- **Option A: Logpush + External System:**
    - Configure Cloudflare Logpush to send Worker logs (including `[TRACKING]` and `[ERROR]` logs) to an external storage/analysis system (e.g., Datadog Logs, Google Cloud Logging, Splunk, S3).
    - Pros: Leverages powerful external tools for analysis and dashboarding.
    - Cons: Introduces external dependency and potential cost. Log format needs to be parseable.
- **Option B: Cloudflare Analytics Engine:**
    - Use the Workers Analytics Engine API to write structured event data directly from the Worker.
    - Define a schema for the analytics data (e.g., `redirectEvent` with columns for timestamp, requestUrl, destinationUrl, statusCode, isValid, utm_source, utm_medium, etc.).
    - Query data using SQL API or view in Cloudflare dashboard.
    - Pros: Integrated within Cloudflare, potentially lower latency for writes. SQL querying.
    - Cons: Still relatively new, querying/dashboarding capabilities might be less mature than dedicated external systems. Potential cost based on data points written.
- **Decision:** **Design for Option B (Analytics Engine)** as it's more integrated, but keep Logpush as a fallback/alternative.
- Define the desired schema for the Analytics Engine dataset.
- Create placeholder function(s) (e.g., `writeAnalyticsEvent(data, env)`) in the worker.
- Integrate calls to this function (within `ctx.waitUntil`) at relevant points (e.g., end of successful request, on error) to log the structured event.

**TDD Approach:**
- Test the integration points using mocks/spies.
*   **Test Cases (Vitest):**
    *   Mock the Analytics Engine binding (`env.ANALYTICS_DATASET.writeDataPoint(...)`).
    *   Spy on `ctx.waitUntil`.
    *   Test scenario: Successful redirect request. Verify `writeDataPoint` is called within `waitUntil` with the correct structured data (URLs, params, status code).
    *   Test scenario: `isNoRedirect=1` request. Verify `writeDataPoint` is called with appropriate data.
    *   Test scenario: Error request (e.g., 400). Verify `writeDataPoint` is called with error code and status.
*   **Implementation Steps:**
    1.  Define Analytics Engine binding in `wrangler.toml`.
        ```toml
        [analytics_engine_datasets]
        binding = "REDIRECT_ANALYTICS"
        # dataset = "your_dataset_name" # Optional: specify dataset name here or create via UI/API
        ```
    2.  Create the dataset via Cloudflare dashboard or `wrangler analytics-engine create <name>`.
    3.  Update `Env` interface to include `REDIRECT_ANALYTICS: AnalyticsEngineDataset`.
    4.  Create `src/analytics.ts` (and `.test.ts`). Define the event structure/interface. Implement a placeholder `writeRedirectEvent(data, analyticsBinding)` function.
        ```typescript
        // src/analytics.ts (Placeholder)
        import { TrackingParameters } from './tracking-parser';

        interface RedirectEventData {
           timestamp: number;
           requestUrl: string;
           destinationUrl?: string | null;
           statusCode: number;
           errorCode?: string | null; // From Task 1.4.1
           wasRedirected: boolean;
           trackingParams?: TrackingParameters | null;
           // Add other relevant fields: country, userAgent (handle privacy)
        }

        // Placeholder - Actual implementation uses binding.writeDataPoint
        export async function writeRedirectEvent(
            data: RedirectEventData,
            analyticsBinding?: AnalyticsEngineDataset // Make optional for easier mocking?
        ) {
            if (!analyticsBinding) {
                 console.log("[ANALYTICS] Skipping write: Binding not configured.");
                 return;
            }
            console.log(`[ANALYTICS] Would write event:`, JSON.stringify(data));
            // Actual implementation:
            // analyticsBinding.writeDataPoint({
            //   blobs: [ /* data fields as blobs */ data.requestUrl, data.destinationUrl ?? "" , ... ],
            //   doubles: [ /* data fields as doubles */ data.statusCode, data.timestamp ],
            //   indexes: [ /* indexed fields like errorCode? */ data.errorCode ?? "" ],
            // });
        }
        ```
    5.  Integrate calls to `writeRedirectEvent` into `src/index.ts` within `ctx.waitUntil` at the end of processing (both success and error paths), passing the collected data and `env.REDIRECT_ANALYTICS`.
    6.  Write tests in `src/index.test.ts` using mocks/spies to verify integration and data structure passed to the (mocked) `writeDataPoint`.
    7.  Run `npm test`.
    8.  Run linters/formatters.

**Technical References:**
- Workers Analytics Engine: [https://developers.cloudflare.com/analytics/analytics-engine/](https://developers.cloudflare.com/analytics/analytics-engine/)
- `writeDataPoint` API: [https://developers.cloudflare.com/analytics/analytics-engine/reference/workers-api/#writedatapoint](https://developers.cloudflare.com/analytics/analytics-engine/reference/workers-api/#writedatapoint)
- Logpush: [https://developers.cloudflare.com/logs/logpush/](https://developers.cloudflare.com/logs/logpush/)

**Dependencies:**
- Most preceding tasks (for data points like URLs, params, status codes, error codes).
- Task 1.1.2 (for `wrangler.toml` binding config).

**Acceptance Criteria:**
- Design choice (Analytics Engine vs. Logpush) is documented.
- Analytics Engine dataset schema is defined.
- Placeholder function for writing analytics events exists.
- Integration points in main handler call the placeholder via `ctx.waitUntil`.
- Unit tests verify the integration logic and data structure passed to the analytics function mock.
- Code meets quality standards. 