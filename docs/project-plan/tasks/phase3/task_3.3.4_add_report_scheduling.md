# docs/project-plan/tasks/phase3/task_3.3.4_add_report_scheduling.md

## Task: 3.3.4 Add Report Scheduling (Placeholder/Design)

**Description:**
Design or investigate options for scheduling the automatic generation and delivery of periodic reports (defined in Task 3.3.1).

**Source Task:**
docs/project-plan/implementation.md -> Phase 3 -> 3.3 Reporting Features -> Add report scheduling

**Detailed Specifications:**
- Based on the chosen reporting approach (Task 3.3.1):
    - **If using Dashboard Exports (Option A):** Some tools (like Grafana Enterprise, or using external automation) might support scheduled PDF/CSV exports and email delivery. Investigate capabilities of the specific tool. Cloudflare Dashboards likely lack this built-in.
    - **If using Scheduled Queries (Option B):** The scheduling is handled by the external system running the queries. Delivery depends on that system's capabilities.
    - **If using Custom Script/Worker Cron (Option C):** Scheduling is done via Cloudflare Cron Triggers. Delivery (e.g., email via Mailgun/SendGrid, posting to Slack) needs to be implemented in the Worker script.
- **Decision:** Since Option A (manual export) was the initial choice, automated scheduling is deferred. If Option C is pursued later, Cron Triggers are the way to schedule the Worker.

**TDD Approach:**
- Not applicable (Design/Planning task).

**Implementation Steps:**
1.  Revisit the chosen reporting approach from Task 3.3.1.
2.  Investigate scheduling features of the dashboarding tool, if applicable.
3.  If automation is required and not provided by the tool, document the need to implement Option C (Custom Worker with Cron Trigger and delivery mechanism) as a future enhancement.

**Technical References:**
- Cloudflare Cron Triggers: [https://developers.cloudflare.com/workers/configuration/cron-triggers/](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- (Email API docs like SendGrid, Mailgun if implementing custom delivery)

**Dependencies:**
- Task 3.3.1 (Periodic Report Design)

**Acceptance Criteria:**
- Options for scheduling reports are investigated based on the chosen reporting method.
- The approach for scheduling (or decision to defer automation) is documented.

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Future Considerations](../../../technical-design/future_considerations.md): May detail report scheduling needs.
- [Infrastructure](../../../technical-design/infrastructure.md): Platform scheduling capabilities (Cron Triggers).

**Dependencies:**
- Task 3.3.1 or 3.3.3 completed (report/export generation exists).
- Choice of delivery method (email, storage bucket, etc.). 