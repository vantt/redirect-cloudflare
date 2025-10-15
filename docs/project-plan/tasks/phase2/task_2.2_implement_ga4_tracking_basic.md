# docs/project-plan/tasks/phase2/task_2.2_implement_ga4_tracking_basic.md

## Task: 2.2 Implement GA4 Tracking (Basic - via GTM)

**Description:**
Configure the GTM container (created/referenced in Task 2.1) to include basic Google Analytics 4 (GA4) page view tracking. This task involves configuration within the GTM interface itself, not direct code changes in the Worker (yet).

**Source Task:**
docs/project-plan/implementation.md -> Phase 2: Tracking Integration -> Implement GA4 tracking

**Detailed Specifications:**
- Access the Google Tag Manager interface for the specified `GTM_CONTAINER_ID`.
- Add a GA4 Configuration tag.
- Configure the tag with the GA4 Measurement ID (obtain this from GA4 property settings - make it configurable via worker env var `GA4_MEASUREMENT_ID` for potential future server-side use, though GTM config uses it directly now).
- Set the trigger for the GA4 Configuration tag to fire on "All Pages" (or a more specific trigger like "Container Loaded").
- Publish the changes in the GTM container.

**TDD Approach:**
- Not applicable for GTM UI configuration. Testing involves manual verification.
*   **Manual Verification Steps:**
    *   Use `wrangler dev`.
    *   Access a URL with `isNoRedirect=1`.
    *   Use browser developer tools (Network tab) to verify that requests are made to `google-analytics.com/collect` with the correct GA4 Measurement ID (`tid`).
    *   Use the GA4 Realtime report to verify that a `page_view` event is received for the accessed page.
    *   Use GTM's Preview mode to debug tag firing.

**Implementation Steps (GTM UI):**
1.  Log in to Google Tag Manager: [https://tagmanager.google.com/](https://tagmanager.google.com/)
2.  Select the correct Account and Container (`GTM_CONTAINER_ID`).
3.  Go to "Tags" -> "New".
4.  Choose Tag Type: "Google Analytics: GA4 Configuration".
5.  Enter the GA4 Measurement ID (e.g., `G-XXXXXXXXXX`) obtained from your GA4 property.
6.  Configure Triggering: Choose "Initialization - All Pages" or "Container Loaded - All Pages". "Initialization" is generally preferred for GA4 config.
7.  Name the tag (e.g., "GA4 Configuration - Base").
8.  Save the tag.
9.  Go to "Submit" -> "Publish" -> "Continue". Add version notes if desired.

**Technical References:**
- GA4 GTM Tag Setup: [https://support.google.com/tagmanager/answer/9442095](https://support.google.com/tagmanager/answer/9442095)
- GA4 Measurement ID: [https://support.google.com/analytics/answer/9539598](https://support.google.com/analytics/answer/9539598)
- GTM Preview Mode: [https://support.google.com/tagmanager/answer/6107056](https://support.google.com/tagmanager/answer/6107056)
- GA4 Measurement Protocol: [https://developers.google.com/analytics/devguides/collection/protocol/ga4](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Integration Designs](../../../technical-design/integration_designs.md): Details the GA4 integration strategy.
- [Component Designs](../../../technical-design/component_designs.md): Details the Tracking System component.
- [Component Interactions](../../../technical-design/component_interactions.md): Shows data flow for GA4 events.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines GA4 event structure.
- [Security Design](../../../technical-design/security_design.md): Covers secure data transmission.

**Dependencies:**
- Task 2.1 completed (GTM setup, if sending via GTM).
- Task 1.2.3 completed (parameter extraction).
- Task 1.1.2 completed (dev env for API keys/IDs).
- Access to a GA4 Property (Measurement ID, API Secret).

**Acceptance Criteria:**
- GA4 Configuration tag is correctly set up and published in the GTM container.
- When accessing a `isNoRedirect=1` page served by the worker:
    - GA4 network requests (`/collect`) are observed in browser dev tools.
    - `page_view` events appear in the GA4 Realtime report. 