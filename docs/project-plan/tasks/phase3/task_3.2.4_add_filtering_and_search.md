# docs/project-plan/tasks/phase3/task_3.2.4_add_filtering_and_search.md

## Task: 3.2.4 Add Filtering and Search Capabilities (Placeholder)

**Description:**
Add dashboard-level filtering capabilities (e.g., by time range, UTM source, status code) if supported by the dashboarding tool.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.2 Dashboard Development -> Add filtering and search capabilities

**Detailed Specifications:**
- Identify key filterable dimensions:
    - Time range (absolute or relative).
    - UTM Source / Medium / Campaign.
    - Status Code.
    - Error Code.
    - Destination URL (maybe wildcard search).
- Investigate how the chosen dashboarding tool (e.g., Cloudflare Dashboards) supports template variables or filters.
- Configure dashboard variables/filters for the identified dimensions.
- Update dashboard widget queries to use these variables (e.g., `WHERE timestamp > {{__from}} AND timestamp < {{__to}} AND statusCode = {{statusCodeVar}}`).

**TDD Approach:**
- Not applicable (UI Configuration task).

**Implementation Steps:**
1.  Navigate to the dashboard created in Task 3.2.2.
2.  Explore dashboard settings for variables or filters (e.g., Cloudflare Dashboard "variables").
3.  Create variables for Time Range (usually built-in).
4.  Create variables for other dimensions (e.g., `utm_source_var`). Configure them to query distinct values from the Analytics Engine dataset (e.g., `SELECT DISTINCT utm_source FROM REDIRECT_ANALYTICS`). Allow multi-select or "All".
5.  Modify the SQL queries in the dashboard widgets (Task 3.2.2) to incorporate these variables in their `WHERE` clauses (using the tool's specific variable syntax).
6.  Save the dashboard.
7.  Test the filters by selecting different values and verifying that the dashboard visualizations update accordingly.

**Technical References:**
- (Tool-specific documentation for dashboard variables/filtering)
- Cloudflare Analytics Engine SQL API (for query syntax): [https://developers.cloudflare.com/analytics/analytics-engine/sql-api/](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/)
- SQL `WHERE` clause: Standard SQL documentation.

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Future Considerations](../../../technical-design/future_considerations.md): May detail desired dashboard filtering.
- [Infrastructure](../../../technical-design/infrastructure.md): Underlying data platform's query capabilities.

**Dependencies:**
- Tasks 3.2.1 & 3.2.2 completed (dashboard exists).
- Data source supports filtering (e.g., SQL API).

**Acceptance Criteria:**
- Dashboard includes filters for key dimensions like time range and UTM parameters.
- Dashboard visualizations update correctly when filters are applied. 