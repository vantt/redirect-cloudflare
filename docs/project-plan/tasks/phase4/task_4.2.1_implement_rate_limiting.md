# docs/project-plan/tasks/phase4/task_4.2.1_implement_rate_limiting.md

## Task: 4.2.1 Implement Rate Limiting

**Description:**
Configure Cloudflare Rate Limiting rules to protect the worker endpoint from abuse, excessive requests, or denial-of-service attempts.

**Source Task:**
docs/project-plan/implementation.md -> Phase 4 -> 4.2 Security Hardening -> Implement rate limiting

**Detailed Specifications:**
- Define reasonable rate limits based on expected traffic patterns (e.g., max requests per IP per minute).
- Use Cloudflare dashboard (Security -> WAF -> Rate Limiting Rules) to configure rules.
- Rule criteria: Match requests to the worker's hostname or specific paths (e.g., `*your-worker-domain/*`).
- Rate: Define threshold (e.g., 100 requests) and period (e.g., 1 minute).
- Action: Typically "Block" or "Log" (initially log, then block). Define block duration.
- Consider characteristics for limiting: IP address is common. Could also use Session/Cookie, JA3 Fingerprint, etc., if more sophisticated limiting is needed. **Decision: Start with IP-based limiting.**

**TDD Approach:**
- Not applicable (Infrastructure configuration). Manual testing needed.
*   **Manual Testing:**
    *   Use a load testing tool (or simple script like `while true; do curl ...; done`) to exceed the configured rate limit from a single IP address.
    *   Verify that requests eventually receive a 429 Too Many Requests status code.
    *   Check Cloudflare logs/dashboard for rate limiting events.

**Implementation Steps:**
1.  Determine appropriate rate limit thresholds (e.g., 100 requests/IP/minute).
2.  In Cloudflare Dashboard:
    *   Go to Security -> WAF -> Rate Limiting Rules -> Create rule.
    *   Name the rule (e.g., "Worker Base Limit").
    *   Field: "URI Path", Operator: "contains", Value: `/` (or more specific path if needed). Optionally add Hostname match.
    *   Characteristics to match: "IP Address".
    *   Rate: 100 requests, Period: 1 minute.
    *   Action: Choose "Log" initially to monitor. Later change to "Block". Set duration (e.g., 10 minutes).
    *   Save and deploy the rule.
3.  Monitor logs for rate limiting events triggered by the "Log" action.
4.  Once confident, change the action to "Block".
5.  Perform manual testing (as described above) to verify blocking occurs.

**Technical References:**
- Cloudflare Rate Limiting: [https://developers.cloudflare.com/waf/rate-limiting-rules/](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- HTTP 429 Status Code: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Infrastructure](../../../technical-design/infrastructure.md): Platform rate limiting capabilities.
- [Security Design](../../../technical-design/security_design.md): Defines rate limiting strategy and thresholds.

**Dependencies:**
- Deployed worker on Cloudflare.
- Understanding of expected traffic patterns.
- Access to configure Cloudflare WAF/Rate Limiting.

**Acceptance Criteria:**
- Cloudflare Rate Limiting rule is configured for the worker endpoint.
- Rule uses IP address limiting with defined thresholds.
- Rule action is set (initially Log, then Block).
- Manual testing confirms that exceeding the rate limit results in 429 responses. 