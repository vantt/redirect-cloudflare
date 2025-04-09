# docs/project-plan/tasks/phase3/task_3.2.2_create_data_visualization_components.md

## Task: 3.2.2 Create Data Visualization Components (Placeholder)

**Description:**
Set up the actual data visualization components (charts, tables) in the chosen dashboarding tool based on the design from Task 3.2.1.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.2 Dashboard Development -> Create data visualization components

**Detailed Specifications:**
- Based on the chosen tool (e.g., Cloudflare Dashboards) and design (Task 3.2.1).
- Configure queries (likely SQL for Analytics Engine) to aggregate data for each visualization:
    - `SELECT count(*) FROM REDIRECT_ANALYTICS WHERE timestamp > now() - INTERVAL '1 hour' TIMESERIES(1 minute)`
    - `SELECT utm_source, count(*) FROM REDIRECT_ANALYTICS WHERE timestamp > ... GROUP BY utm_source ORDER BY count(*) DESC LIMIT 10`
    - `SELECT requestUrl, destinationUrl, errorCode FROM REDIRECT_ANALYTICS WHERE statusCode >= 400 ORDER BY timestamp DESC LIMIT 50`
- Configure chart types (line, bar, pie, table) and map query results to axes/values.
- Arrange components on the dashboard according to the layout design.

**TDD Approach:**
- Not applicable (UI Configuration task). Manual verification needed.
*   **Manual Verification:**
    *   Check if dashboard loads.
    *   Verify each chart/table displays data.
    *   Compare displayed data against expected values based on test requests or Analytics Engine queries.
    *   Verify chart types and labels match the design.

**Implementation Steps:**
1.  Navigate to the dashboarding tool (e.g., Cloudflare dashboard -> Analytics -> Analytics Engine -> Select Dataset -> Dashboards).
2.  Create a new dashboard or edit an existing one.
3.  Add widgets/panels for each visualization defined in Task 3.2.1.
4.  For each widget:
    *   Select the data source (the Analytics Engine dataset).
    *   Write the SQL query to retrieve and aggregate the required data.
    *   Choose the appropriate visualization type (time series, bar, table, etc.).
    *   Configure axes, labels, colors, etc.
5.  Arrange the widgets on the dashboard.
6.  Save the dashboard.
7.  Generate some test traffic to populate data and verify visualizations.

**Technical References:**
- Cloudflare Analytics Engine SQL API: [https://developers.cloudflare.com/analytics/analytics-engine/sql-api/](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/)
- (If using Grafana): [https://grafana.com/docs/grafana/latest/datasources/cloudflare/](https://grafana.com/docs/grafana/latest/datasources/cloudflare/)

**Dependencies:**
- Task 3.1.4 (Tracking Analytics Implementation/Data Collection)
- Task 3.2.1 (Dashboard Design)
- Data must be flowing into Analytics Engine.

**Acceptance Criteria:**
- Dashboard exists in the chosen tool.
- Visualizations for key metrics (redirect counts, errors, top sources) are implemented.
- Charts display data aggregated from the Analytics Engine dataset.
- Dashboard layout matches the design. 