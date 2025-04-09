# docs/project-plan/tasks/phase3/task_3.3.1_generate_periodic_reports.md

## Task: 3.3.1 Generate Daily/Weekly/Monthly Reports (Placeholder/Design)

**Description:**
Design the process or investigate tool capabilities for generating periodic summary reports (daily, weekly, monthly) based on the collected analytics data.

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.3 Reporting Features -> Generate daily/weekly/monthly reports

**Detailed Specifications:**
- Define the content of periodic reports:
    - Summary statistics (Total requests, redirects, errors).
    - Top N UTM sources/mediums/campaigns.
    - Top N destination URLs.
    - Error summary (counts by type).
    - Comparison to previous period (WoW, MoM change).
- Investigate options for automated reporting:
    - **Option A (Dashboard Snapshots/Exports):** Manually or via tool features (e.g., Grafana reporting) export dashboard views periodically.
    - **Option B (Scheduled Queries):** If using an external database fed by Logpush, schedule SQL queries to generate report data.
    - **Option C (Custom Script/Worker Cron):** Write a separate script or scheduled Worker (Cron Trigger) to query Analytics Engine SQL API periodically and format/send a report (e.g., via email).
- **Decision:** Assume Option A (manual/tool-based dashboard export) is sufficient initially. Defer Option C unless specifically required later.

**TDD Approach:**
- Not applicable (Design/Planning task).

**Implementation Steps:**
1.  Define the required content and KPIs for periodic reports.
2.  Investigate the reporting/export features of the chosen dashboarding tool (e.g., Cloudflare Dashboards, Grafana).
3.  Document the chosen approach (e.g., "Manual export from Cloudflare Dashboard weekly") and the defined report content.
4.  (If pursuing Option C later): Design the scheduled query/script logic and reporting format/delivery method.

**Technical References:**
- Cloudflare Cron Triggers: [https://developers.cloudflare.com/workers/configuration/cron-triggers/](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- (Tool-specific documentation for reporting/exports)

**Dependencies:**
- Task 3.2.2 (Dashboard components exist, implies data source exists)

**Acceptance Criteria:**
- Content for periodic reports is defined.
- Approach for generating reports (manual export, scheduled query, etc.) is chosen and documented. 