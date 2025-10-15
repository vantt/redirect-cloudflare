# docs/project-plan/tasks/phase3/task_3.2.1_design_dashboard_layout.md

## Task: 3.2.1 Design Dashboard Layout (Placeholder)

**Description:**
Design the layout and key components/visualizations for an analytics dashboard to display data collected by the redirect service (likely using data from Analytics Engine or Logpush).

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.2 Dashboard Development -> Design dashboard layout

**Detailed Specifications:**
- Identify key metrics and dimensions to display:
    - Total redirects over time.
    - Redirects by UTM source/medium/campaign.
    - Top destination URLs.
    - Error rates (4xx, 5xx) over time.
    - Count of specific error codes (INVALID_URL, REDIRECT_LOOP).
    - Requests per platform parameter (Shopee xptdk, FB ref).
    - Request counts by country/region (if GeoIP data is added later).
- Sketch a layout showing potential charts/tables:
    - Time series graph for total requests/redirects/errors.
    - Bar charts or tables for top sources/mediums/campaigns.
    - Table for recent errors with details.
    - Pie chart for status code distribution (200, 302, 400, 500).
- Choose a potential dashboarding tool:
    - Cloudflare Dashboards (if using Analytics Engine).
    - External tool (Grafana, Datadog Dashboards, Looker Studio) fed by Logpush data.
- **Decision:** Assume Cloudflare Dashboards connected to Analytics Engine initially.

**TDD Approach:**
- Not applicable (Design task).

**Implementation Steps:**
1.  Review the Analytics Engine schema defined in Task 3.1.4.
2.  List the desired metrics and dimensions based on the schema and requirements.
3.  Sketch wireframes or mockups for the dashboard layout.
4.  Document the chosen metrics, dimensions, chart types, and layout.
5.  Briefly explore Cloudflare Dashboard capabilities for Analytics Engine data: [https://developers.cloudflare.com/analytics/analytics-engine/sql-api/](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) (Querying via SQL) & Cloudflare dashboard UI.

**Technical References:**
- Cloudflare Analytics Engine: [https://developers.cloudflare.com/analytics/analytics-engine/](https://developers.cloudflare.com/analytics/analytics-engine/)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Future Considerations](../../../technical-design/future_considerations.md): May mention dashboard requirements or ideas.
- [Infrastructure](../../../technical-design/infrastructure.md): Potential platform for hosting/displaying the dashboard.

**Dependencies:**
- Task 3.1.4 completed (data points for dashboard defined).
- Understanding of user requirements for the dashboard.

**Acceptance Criteria:**
- Key metrics and dimensions for the dashboard are identified.
- A conceptual layout/wireframe for the dashboard exists.
- The chosen dashboarding approach (e.g., Cloudflare Dashboards) is documented. 