# docs/project-plan/tasks/phase3/task_3.4.3_create_usage_analytics.md

## Task: 3.4.3 Create Usage Analytics

**Description:**
Leverage the collected data (from Analytics Engine or logs) and the dashboard to analyze usage patterns, such as request volume, popular tracking parameters, and redirect destinations.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.4 Monitoring Tools -> Create usage analytics

**Detailed Specifications:**
- This task primarily involves utilizing the tools and data set up in previous tasks (Analytics Engine, Dashboards).
- Focus on analyzing usage via the created dashboard (Task 3.2.x).
- Key usage metrics/dimensions already included in dashboard design (Task 3.2.1):
    - Total requests/redirects over time.
    - Breakdowns by UTM parameters.
    - Top destination URLs.
    - Usage of `isNoRedirect=1`.
    - Usage by platform-specific parameters (`xptdk`, `ref`).
- If more specific usage analysis is needed, refine dashboard queries or perform ad-hoc queries using the Analytics Engine SQL API.

**TDD Approach:**
- Not applicable (Analysis/Utilization task).

**Implementation Steps:**
1.  Access the created analytics dashboard (Task 3.2.x).
2.  Analyze the displayed charts and tables related to usage patterns (request volume, UTMs, destinations).
3.  Identify any trends, anomalies, or interesting patterns.
4.  If necessary, use the Analytics Engine SQL API or dashboard query editor to perform more specific ad-hoc analysis (e.g., filter by a specific campaign and look at destination URLs).
5.  Document any key findings or necessary refinements to the dashboard based on usage analysis.

**Technical References:**
- Cloudflare Analytics Engine SQL API: [https://developers.cloudflare.com/analytics/analytics-engine/sql-api/](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/)
- Dashboard created in Task 3.2.x.

**Dependencies:**
- Task 3.1.4 (Analytics data collection)
- Task 3.2.x (Dashboard creation)

**Acceptance Criteria:**
- The created dashboard provides visibility into key usage patterns.
- Usage data can be analyzed effectively using the dashboard and/or direct queries. 