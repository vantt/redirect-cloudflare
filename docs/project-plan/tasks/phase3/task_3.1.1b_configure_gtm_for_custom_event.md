# docs/project-plan/tasks/phase3/task_3.1.1b_configure_gtm_for_custom_event.md

## Task: 3.1.1b Configure GTM for Custom Event

**Description:**
Configure Google Tag Manager (UI Task) to utilize the `redirectInfo` event and associated data pushed to the Data Layer in Task 3.1.1.

**Source Task:**
Corresponds to Task 3.1.1 (Implementation detail)

**Detailed Specifications:**
- **Create Data Layer Variables:** In GTM, create Data Layer Variables to capture:
    - `destinationUrl`
    - `trackingParams.utm_source`
    - `trackingParams.utm_medium`
    - `trackingParams.utm_campaign`
    - `trackingParams.utm_content`
    - `trackingParams.utm_term`
    - `trackingParams.xptdk`
    - `trackingParams.ref`
    - *(Name variables clearly, e.g., `dlv_destinationUrl`, `dlv_utm_source`)*
- **Create Custom Event Trigger:** Create a Trigger of type "Custom Event" that fires when the event name is exactly `redirectInfo`.
- **Configure GA4 Event Tag:** Create a new "Google Analytics: GA4 Event" tag.
    - Select the existing GA4 Configuration tag (from Task 2.2).
    - Set the "Event Name" (e.g., `redirect_info_view`).
    - Under "Event Parameters", add parameters mapping the created Data Layer Variables to desired GA4 event parameter names (e.g., `destination_url`, `utm_source`, `utm_medium`, `campaign_name`, etc.). Use GA4 recommended parameter names where available.
    - Set the firing trigger to the `redirectInfo` Custom Event trigger created above.
- Publish the GTM container changes.

**TDD Approach:**
- Not applicable (GTM UI configuration). Testing involves manual verification.
*   **Manual Verification Steps:**
    *   Use `wrangler dev`.
    *   Access a URL with `isNoRedirect=1` and tracking parameters.
    *   Use GTM Preview mode:
        *   Verify the `redirectInfo` event appears in the event stream.
        *   Verify the Data Layer tab shows the correct `destinationUrl` and `trackingParams`.
        *   Verify the new GA4 Event tag fired on the `redirectInfo` event.
        *   Verify the tag sent the correct event name (`redirect_info_view`) and parameters to GA4 (check network request in Preview mode or browser tools).
    *   Check GA4 Realtime report (or DebugView) for the incoming `redirect_info_view` event and its associated parameters.

**Implementation Steps (GTM UI):**
1.  Log in to Google Tag Manager. Select Container.
2.  **Variables:**
    *   Go to "Variables" -> "User-Defined Variables" -> "New".
    *   Choose Variable Type: "Data Layer Variable".
    *   Enter "Data Layer Variable Name": e.g., `destinationUrl`.
    *   Name the variable: e.g., `dlv_destinationUrl`. Save.
    *   Repeat for `trackingParams.utm_source` (name `dlv_utm_source`), `trackingParams.utm_medium` (name `dlv_utm_medium`), etc., for all needed parameters.
3.  **Triggers:**
    *   Go to "Triggers" -> "New".
    *   Choose Trigger Type: "Custom Event".
    *   Enter "Event name": `redirectInfo`.
    *   Set trigger fires on: "All Custom Events".
    *   Name the trigger: e.g., "CE - redirectInfo". Save.
4.  **Tags:**
    *   Go to "Tags" -> "New".
    *   Choose Tag Type: "Google Analytics: GA4 Event".
    *   Select Configuration Tag: Choose your existing GA4 Config tag.
    *   Enter "Event Name": `redirect_info_view`.
    *   Expand "Event Parameters":
        *   Add Row: Parameter Name = `destination_url`, Value = `{{dlv_destinationUrl}}`.
        *   Add Row: Parameter Name = `utm_source`, Value = `{{dlv_utm_source}}`.
        *   Add Row: Parameter Name = `utm_medium`, Value = `{{dlv_utm_medium}}`.
        *   Add Row: Parameter Name = `campaign_name`, Value = `{{dlv_utm_campaign}}`. *(Using recommended name)*
        *   Add Row: Parameter Name = `utm_content`, Value = `{{dlv_utm_content}}`.
        *   Add Row: Parameter Name = `utm_term`, Value = `{{dlv_utm_term}}`.
        *   Add Row: Parameter Name = `shopee_xptdk`, Value = `{{dlv_xptdk}}`. *(Custom param)*
        *   Add Row: Parameter Name = `fb_ref`, Value = `{{dlv_ref}}`. *(Custom param)*
    *   Configure Triggering: Select the "CE - redirectInfo" trigger.
    *   Name the tag: e.g., "GA4 Event - Redirect Info View". Save.
5.  **Submit & Publish:** Submit the changes and publish the container version.

**Technical References:**
- GTM Data Layer Variables: [https://support.google.com/tagmanager/answer/6164391](https://support.google.com/tagmanager/answer/6164391)
- GTM Custom Event Trigger: [https://support.google.com/tagmanager/answer/6106961](https://support.google.com/tagmanager/answer/6106961)
- GA4 Event Tag in GTM: [https://support.google.com/tagmanager/answer/9442095](https://support.google.com/tagmanager/answer/9442095)
- GA4 Recommended Event Parameters: [https://support.google.com/analytics/answer/9267735](https://support.google.com/analytics/answer/9267735)
- GTM Variables: [https://support.google.com/tagmanager/answer/6107162](https://support.google.com/tagmanager/answer/6107162)

**Related Design & Specifications:**
- [Integration Designs](../../../technical-design/integration_designs.md): Details expected GTM configuration for custom events.
- [API Specifications (Internal)](../../../technical-design/api_specifications.md): Defines the dataLayer structure GTM will consume.

**Dependencies:**
- Task 3.1.1 completed (Worker pushing events to dataLayer).
- Access to the GTM container.
- Understanding of GTM tags, triggers, and variables.

**Acceptance Criteria:**
- GTM Data Layer variables for destination URL and tracking parameters are created.
- GTM Custom Event trigger for `redirectInfo` event is created.
- GTM GA4 Event tag is created, configured with parameters mapped from Data Layer variables, and triggered by the custom event.
- GTM container is published.
- Manual testing using GTM Preview Mode confirms tag firing and data capture.
- GA4 DebugView/Realtime reports show the `redirect_info_view` event with correct parameters. 