# docs/project-plan/tasks/phase4/task_4.2.3_implement_waf_rules.md

## Task: 4.2.3 Implement WAF Rules (Cloudflare)

**Description:**
Configure and enable Cloudflare's Web Application Firewall (WAF) to protect the worker from common web vulnerabilities (e.g., SQL injection, XSS, specific framework vulnerabilities).

**Source Task:**
docs/project-plan/implementation.md -> Phase 4 -> 4.2 Security Hardening -> Implement WAF rules

**Detailed Specifications:**
- Enable the Cloudflare Managed Ruleset within the WAF settings (Security -> WAF -> Managed rules).
- Start with the default sensitivity level ("High") and action ("Managed Challenge" or "Block" depending on risk tolerance and initial testing).
- Review the OWASP Core Ruleset provided by Cloudflare. Understand the types of attacks it protects against.
- Monitor WAF activity (Security -> Overview and Security -> Events) for blocked/challenged requests.
- Investigate any legitimate traffic being blocked (false positives) and create custom WAF rules or adjust managed ruleset settings (e.g., disabling specific rules or lowering sensitivity for certain rules) if necessary.
- Consider enabling specific Cloudflare Package Rulesets if applicable (e.g., if using a specific known frontend framework that interacts with the worker, although unlikely for a simple redirector).

**TDD Approach:**
- Not directly applicable, but involves testing/monitoring.
- Simulate common attacks (e.g., using `curl` with malicious payloads in query strings) *after* deployment to ensure WAF rules trigger as expected (observe Security Events in Cloudflare).
- Example (conceptual, requires actual payload): `curl "https://your-worker-domain.com/?param=<script>alert('xss')</script>"` should be blocked/challenged.

**Implementation Steps:**
1.  Navigate to Cloudflare Dashboard -> Security -> WAF -> Managed rules.
2.  Ensure the "Cloudflare Managed Ruleset" is toggled ON.
3.  Review the default action and sensitivity. Adjust if needed based on initial monitoring.
4.  Review the "OWASP ModSecurity Core Rule Set" package (usually enabled by default within the Managed Ruleset).
5.  Deploy the worker (if not already).
6.  Monitor the Security Events log for WAF triggers.
7.  Perform basic simulated attacks (like the XSS example) to verify rules are active.
8.  Establish a process for reviewing WAF events periodically and handling false positives.

**Technical References:**
- Cloudflare WAF: [https://developers.cloudflare.com/waf/](https://developers.cloudflare.com/waf/)
- Cloudflare Managed Ruleset: [https://developers.cloudflare.com/waf/managed-rulesets/cloudflare-managed-ruleset/](https://developers.cloudflare.com/waf/managed-rulesets/cloudflare-managed-ruleset/)
- OWASP Core Rule Set: [https://owasp.org/www-project-modsecurity-core-rule-set/](https://owasp.org/www-project-modsecurity-core-rule-set/)

**Related Design & Specifications:**
- [Main Technical Design](../../../technical-design/DESIGN.md): Entry point for overall technical design.
- [Infrastructure](../../../technical-design/infrastructure.md): Platform WAF capabilities.
- [Security Design](../../../technical-design/security_design.md): Defines required WAF rulesets (OWASP, custom rules).

**Dependencies:**
- Deployed worker on Cloudflare.
- Access to configure Cloudflare WAF.
- Understanding of common web vulnerabilities (XSS, SQLi, etc.).

**Acceptance Criteria:**
- Cloudflare Managed Ruleset (including OWASP rules) is enabled and active for the worker's domain.
- WAF events are monitored, and simulated attacks trigger appropriate WAF actions.
- A process for handling potential false positives is understood. 